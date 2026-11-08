import { describe, expect, it, vi } from 'vitest';
import { CITY_TIMELINES, readTickets, removeTicket, saveTicket, ticketFromHash, validateTicket, walk, type Ticket } from '../src/game/timelines';

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
      '/art/dates/lin-middle.webp', '/art/dates/lin-parting.webp', '/art/dates/lin-return.webp',
    ]);
    expect(walk(timeline, [{ pick: 0 }]).next).toBe(1);
    expect(walk(timeline, [{ pick: 1 }]).next).toBe(2);
    expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBeNull();
  });

  it('keeps four distinct photo endings when the photo shop ticket is reopened', () => {
    const story = ticketFromHash('#story=last-photo');
    const photos = [0, 1].flatMap(first => [0, 1].map(second => {
      const restored = validateTicket({ ...story, route: [{ pick: first }, { pick: second }] });
      const { steps, next } = walk(restored.timeline, restored.route!);
      expect(next).toBeNull();
      return steps[1].option.shot;
    }));
    expect(photos).toEqual(['script', 'address', 'group', 'id'].map(name => `/art/photo-shop/${name}.webp`));

    const modified = structuredClone(story);
    modified.timeline.turns[1].options[0].shot = 'https://example.com/tracking.webp';
    expect(validateTicket(modified).timeline.turns[1].options[0].shot).toBeUndefined();
  });

  it('collapses old duplicate receipts and keeps only one copy on replay', () => {
    const receipt: Ticket = { ...ticketFromHash('#story=last-photo'), route: [{ pick: 0 }, { pick: 1 }] };
    let stored = JSON.stringify([receipt, validateTicket(receipt)]);
    vi.stubGlobal('localStorage', { getItem: () => stored, setItem: (_: string, data: string) => { stored = data; } });
    try {
      expect(readTickets()).toHaveLength(1);
      expect(saveTicket(receipt)).toHaveLength(1);
      expect(removeTicket(receipt)).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the warehouse and company decisions to select the correct 59-year-old scene', () => {
    const warehouse=validateTicket(ticketFromHash('#story=warehouse-card')).timeline;
    expect(warehouse.turns[0].options.map(choice=>choice.next)).toEqual([1,2]);
    expect(warehouse.turns[1].scene).toContain('带白班那阵');
    expect(warehouse.turns[2].scene).toContain('夜班有个人认出你');
    const company=validateTicket(ticketFromHash('#story=factory-handover')).timeline;
    expect(company.turns[1].options.map(choice=>choice.next)).toEqual([2,3]);
    expect(company.turns[2].scene).toContain('已经结清的周转单');
    expect(company.turns[3].scene).toContain('¥40,000');
    expect(company.turns[4].scene).toContain('晚一批下单');
    expect(company.turns[3].shot).toBe('/art/endings/life-heir-final.webp');
  });

});
