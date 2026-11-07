import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { parkVisit } from '../src/game/matchmaking';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent, ticketFromHash, validateTicket, walk } from '../src/game/timelines';

const start = () => ({
 ...createGame('PARK', '小申', 'free', drawOrigins('PARK')),
 district: 'people' as const, pendingYearEvent: false, housing: 1,
});

describe("People's Park matchmaking corner", () => {
 it('respects ownership and keeps the posted information in later scenes', () => {
  const renter = start();
  const owner = { ...renter, housing: 3 };
  const openRenter = parkVisit(renter)!.event;
  const openOwner = parkVisit(owner)!.event;
  expect(openRenter.text).toContain('那是你租的房子');
  expect(openOwner.text).toContain('卷尺');
  expect(parkVisit({ ...renter, partnerId: 'lu' })).toBeNull();
  const listedRenter = resolveChoice(renter, openRenter, 'list').state;
  const listedOwner = resolveChoice(owner, openOwner, 'list').state;
  expect(parkVisit({ ...listedRenter, housing: 3 })!.event.choices[0].label).toContain('房本上没我名字');
  expect(parkVisit(listedOwner)!.event.choices[0].label).not.toContain('房本上没我名字');
  const coffee = parkVisit(listedRenter)!.event;
  expect(resolveChoice({ ...listedRenter, cash: 128 }, coffee, 'buy').state.cash).toBe(0);
  expect(() => resolveChoice({ ...listedRenter, cash: 127 }, coffee, 'buy')).toThrow('这笔钱现在拿不出来');
  expect(streetLead({ ...listedRenter, district: 'bund' })).toBeNull();
 });

 it('opens the short public link with all three ways through the park', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=park-umbrella'));
  expect(timeline.turns).toHaveLength(5);
  expect(walk(timeline, [{ pick: 0 }]).next).toBe(2);
  expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBe(3);
  expect(walk(timeline, [{ pick: 1 }, { pick: 1 }]).next).toBe(4);
  expect(() => ticketFromHash('#story=unknown')).toThrow();
 });

 it('replays both decisions after saving and shares each selected scene', () => {
  const before = start();
  const open = parkVisit(before)!.event;
  const branchCases = [
   ['list', 'matchmaking-coffee', 'coffee'],
   ['edit', 'matchmaking-bench', 'bench'],
   ['fold', 'matchmaking-portrait', 'own-umbrella'],
  ];
  let book = startBook(before);
  for (const [choice, eventId, photo] of branchCases) {
   if (book.lines.length > 1 || book.lines[0].points.length) {
    book = forkLife(switchLine(book, 0), 0);
    expect(replayScene(activeLine(book).state, activeLine(book).replay!)).toEqual(open);
   }
   const first = resolveChoice(activeLine(book).state, open, choice);
   expect(first.state.actions).toBe(2);
   book = recordDecision(book, first.state, open, choice, open.speakerId);
   const next = streetLead(first.state)!.event;
   expect(next.id).toBe(eventId);
   expect(next.illustration).toBe('/art/matchmaking/' + photo + '.webp');
   const follow = resolveChoice(first.state, next, next.choices[0].id);
   expect(follow.state.actions).toBe(1);
   expect(parkVisit(follow.state)).toBeNull();
   expect(draftFromEvent(next, next.choices[0].id, follow.text, 18, '人民广场').turns[0].shot).toBe(next.illustration);
   book = recordDecision(book, follow.state, next, next.choices[0].id, next.speakerId);
   const roundTrip = decodeLife(JSON.parse(JSON.stringify(encodeLife(book))));
   const replay = activeLine(forkLife(roundTrip, 1));
   expect(replayScene(replay.state, replay.replay!)).toEqual(next);
  }
  const original = activeLine(switchLine(book, 0)).state;
  expect(original.seenEvents).toContain('matchmaking-coffee');
  expect(original.flags).not.toContain('match-folded');
 });
});
