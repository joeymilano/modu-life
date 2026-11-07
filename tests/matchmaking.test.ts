import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, nextYear, resolveChoice } from '../src/game/engine';
import { householdFlag } from '../src/game/household';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { longTableYear } from '../src/game/longTable';
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

 it('opens the return visit after a year and replays the exact lease offer', () => {
  const before = { ...start(), cash: 200000, leaseRent: 3600 };
  const first = resolveChoice(before, parkVisit(before)!.event, 'list').state;
  const second = resolveChoice(first, parkVisit(first)!.event, 'buy').state;
  expect(parkVisit(second)).toBeNull();
  const later = nextYear(second).state;
  expect(parkVisit(later)).toBeNull();
  const ready = { ...later, pendingYearEvent: false };
  const offer = streetLead(ready)!.event;
  expect(offer.id).toBe('matchmaking-lease');
  expect(offer.text).toContain('洇花');
  expect(offer.choices[0].hint).toContain('¥3,600 → ¥2,800');
  const signed = resolveChoice(ready, offer, 'sign').state;
  expect(signed.leaseRent).toBe(2800);
  expect(signed.cash).toBe(ready.cash - 2800);
  expect(nextYear(signed).rentExpense).toBe(33600);
  expect(parkVisit(signed)).toBeNull();
  const fork = activeLine(forkLife(decodeLife(encodeLife(recordDecision(startBook(ready), signed, offer, 'sign'))), 0));
  expect(replayScene(fork.state, fork.replay!)).toEqual(offer);

  const ownHome = { ...ready, housing: 3, leaseRent: undefined };
  const sharesHome = { ...ready, partnerId: 'lu', flags: [...ready.flags, householdFlag('lu', 'shared')] };
  for (const state of [ownHome, sharesHome]) {
   const visit = parkVisit(state)!.event;
   const result = resolveChoice(state, visit, 'sign').state;
   expect(result.housing).toBe(state.housing);
   expect(result.leaseRent).toBe(state.leaseRent);
  }
 });

 it('keeps a current job and remembers both ways the old folding table got used', () => {
  const before = start();
  for (const [firstPick, secondPick, finalPick, eventId, callback] of [
   ['edit', 'practice', 'job', 'matchmaking-work', '排过班'],
   ['fold', 'hang', 'table', 'matchmaking-market', '旧菜单'],
  ]) {
   const first = resolveChoice(before, parkVisit(before)!.event, firstPick).state;
   const second = resolveChoice(first, parkVisit(first)!.event, secondPick).state;
   const ready = { ...second, age: 19, actions: 3, jobId: null };
   const event = parkVisit(ready)!.event;
   expect(event.id).toBe(eventId);
   const result = resolveChoice(ready, event, finalPick);
   expect(longTableYear({ ...result.state, age: 32 })?.text).toContain(callback);
   expect(draftFromEvent(event, finalPick, result.text, 19, '人民广场').turns[0].shot).toBe(event.illustration);
   if (firstPick === 'edit') {
    expect(result.state.jobId).toBe('public');
    const employed = { ...ready, jobId: 'tech' };
    const other = parkVisit(employed)!.event;
    expect(resolveChoice(employed, other, 'job').state.jobId).toBe('tech');
    const olderSave = { ...ready, flags: ready.flags.filter(flag => flag !== 'match-edited-resume') };
    expect(parkVisit(olderSave)!.event.id).toBe(eventId);
   }
  }
 });

 it('opens three return routes independently in the other life mode', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=park-next-year'));
  expect(timeline.turns[0].shot).toBe('/art/shanghai-streets/people.webp');
  for (const [route, node, shot] of [
   [[0, 0], 2, 'lease'], [[0, 1], 3, 'work'], [[1], 4, 'market'],
  ] as const) {
   const moves = route.map(pick => ({ pick }));
   expect(walk(timeline, moves).next).toBe(node);
   expect(timeline.turns[node].shot).toBe('/art/matchmaking/' + shot + '.webp');
   expect(walk(timeline, [...moves, { pick: 0 }]).next).toBeNull();
  }
 });
});
