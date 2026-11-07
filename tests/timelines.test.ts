import { describe, expect, it } from 'vitest';
import { CITY_TIMELINES, ticketFromHash, validateTicket, walk, type Ticket } from '../src/game/timelines';

describe('parallel timelines', () => {
  const ticket = (): Ticket => structuredClone({ version: 1, timeline: CITY_TIMELINES[0] });

  it('takes the same opening to two distinct scenes and keeps the original outcome', () => {
    const { timeline } = validateTicket(ticket());
    const work = walk(timeline, [{ pick: 0 }]);
    const family = walk(timeline, [{ pick: 1 }]);
    expect(timeline.turns[work.next!].place).toBe('张江 · 工位 37');
    expect(timeline.turns[family.next!].place).toBe('愚园路 · 修鞋摊');
    expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBeNull();
    expect(timeline.original).toContain('末班车');
  });

  it('rejects backward links, unreachable scenes and choices after an ending', () => {
    const looping = ticket();
    looping.timeline.turns[1].options[0].next = 0;
    expect(() => validateTicket(looping)).toThrow();

    const detached = ticket();
    detached.timeline.turns[0].options[1].next = null;
    expect(() => validateTicket(detached)).toThrow();

    expect(() => validateTicket({ ...ticket(), route: [{ pick: 1 }, { pick: 1 }, { pick: 1 }] })).toThrow();
  });

  it('allows a reply to an open question with no preset routes', () => {
    const question = ticket();
    question.timeline.kind = 'question';
    question.timeline.turns = [{ ...question.timeline.turns[0], options: [] }];
    expect(() => validateTicket({ ...question, route: [{ pick: 0 }] })).toThrow();
    const result = validateTicket({ ...question, route: [{ pick: 2, note: '我先打个电话' }] });
    const trail = walk(result.timeline, result.route!);
    expect(trail.next).toBeNull();
    expect(trail.steps[0].option.after).toBe('我先打个电话');
  });

  it('opens Lin Jia’s shared story and shows different art on the two routes', () => {
    const { timeline } = validateTicket(ticketFromHash('#story=scallion-bill'));
    expect(timeline.turns.map(turn => turn.shot)).toEqual([
      '/art/dates/lin-meeting.webp', '/art/dates/lin-parting.webp', '/art/dates/lin-return.webp',
    ]);
    expect(walk(timeline, [{ pick: 0 }]).next).toBe(1);
    expect(walk(timeline, [{ pick: 1 }]).next).toBe(2);
    expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBeNull();
  });
});
