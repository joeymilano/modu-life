import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { ALL_RENTAL_CLUES, RENTAL_CLUES, rentalNegotiation, rentalRenewal } from '../src/game/rental';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent, ticketFromHash, validateTicket, walk } from '../src/game/timelines';
import type { GameState, LifeEvent } from '../src/game/types';

const start = (): GameState => ({
 ...createGame('RENTAL', '小申', 'free', drawOrigins('RENTAL')),
 district: 'xinzhuang', cash: 100_000, pendingYearEvent: false, housing: 0,
});
const [wall, contract, window] = RENTAL_CLUES;

describe('莘庄看房', () => {
 it('unlocks separate negotiations for each clue', () => {
  const options = (mask: number) => rentalNegotiation(mask).choices.map(choice => choice.id);
  expect(options(0)).toEqual(['sign', 'leave']);
  expect(options(wall.bit)).toEqual(['repair', 'sign', 'leave']);
  expect(options(contract.bit)).toEqual(['amend', 'sign', 'leave']);
  expect(options(window.bit)).toEqual(['upstairs', 'sign', 'leave']);
  expect(options(ALL_RENTAL_CLUES)).toEqual(['amend', 'upstairs', 'sign', 'leave']);
 });

 it('carries the signed rent into the ledger and clears it on a move or bailout', () => {
  const initial = start();
  const event = rentalNegotiation(ALL_RENTAL_CLUES);
  const downstairs = resolveChoice(initial, event, 'amend').state;
  const upstairs = resolveChoice(initial, event, 'upstairs').state;
  expect(downstairs.cash).toBe(initial.cash - 4000);
  expect(upstairs.cash).toBe(initial.cash - 5200);
  expect(downstairs.actions).toBe(initial.actions - 1);
  expect(nextYear(downstairs).rentExpense).toBe(36_000);
  expect(nextYear(upstairs).rentExpense).toBe(43_200);
  expect(nextYear(upstairs).expense - nextYear(downstairs).expense).toBe(7200);
  const move: LifeEvent = { id: 'move-out', title: '搬走', text: '', category: 'housing',
   choices: [{ id: 'move', label: '签了', reply: '', effect: { housing: 1 } }] };
  expect(monthlyBudget(resolveChoice(downstairs, move, 'move').state).rent).toBe(3300);
  const broke = nextYear({ ...downstairs, cash: 0, jobId: null }).state;
  expect(broke.leaseRent).toBeUndefined();
  expect(monthlyBudget(broke).rent).toBe(1800);
  expect(validateSave(downstairs).leaseRent).toBe(3000);
  expect(validateSave(initial).leaseRent).toBeUndefined();
  expect(() => validateSave({ ...initial, leaseRent: 3000 })).toThrow();
 });

 it('restores the inspected evidence when a branch is exported and reopened', () => {
  const initial = start();
  const event = rentalNegotiation(wall.bit);
  const signed = resolveChoice(initial, event, 'repair').state;
  const book = recordDecision(startBook(initial), signed, event, 'repair');
  const fork = decodeLife(encodeLife(forkLife(book, 0)));
  const line = activeLine(fork);
  const restored = replayScene(line.state, line.replay!)!;
  expect(restored).toEqual(event);
  const walked = resolveChoice(line.state, restored, 'leave').state;
  expect(walked.cash).toBe(initial.cash);
  expect(walked.housing).toBe(0);
  expect(fork.lines[0].state.leaseRent).toBe(3300);
 });

 it('offers a separate three-scene ticket with two routes and location stills', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=rental-fine-print'));
  expect(timeline.turns.map(turn => turn.shot)).toEqual([
   '/art/rental/room.webp', '/art/rental/talk.webp', '/art/rental/upstairs.webp',
  ]);
  expect(walk(timeline, [{ pick: 0 }]).next).toBe(1);
  expect(walk(timeline, [{ pick: 1 }]).next).toBe(2);
 });

 it('opens the appropriate renewal after the first ledger and keeps original lease choices replayable', () => {
  const initial = start();
  const signing = rentalNegotiation(ALL_RENTAL_CLUES);
  for (const [choice, kind, renewalChoice, rent] of [
   ['amend', 'fee', 'copy', 3000],
   ['sign', 'fan', 'stop', 3000],
   ['upstairs', 'tree', 'upgrade', 3900],
  ] as const) {
   const signed = resolveChoice(initial, signing, choice).state;
   expect(rentalRenewal(signed)).toBeUndefined();
   const next = nextYear(signed).state;
   expect(rentalRenewal(next)).toBeUndefined();
   const ready = { ...next, pendingYearEvent: false };
   const event = streetLead(ready)!.event;
   expect(event.id).toBe('rental-renewal-' + kind);
   expect(event.illustration).toBe('/art/rental/renew-' + kind + '.webp');
   const renewed = resolveChoice(ready, event, renewalChoice);
   expect(renewed.state.cash).toBe(ready.cash + (kind === 'fan' ? 900 : 0));
   expect(renewed.state.leaseRent).toBe(rent);
   expect(nextYear(renewed.state).rentExpense).toBe(rent * 12);
   expect(rentalRenewal({ ...renewed.state, age: 20 })).toBeUndefined();
   const ticket = draftFromEvent(event, renewalChoice, renewed.text, ready.age, '莘庄');
   expect(ticket.turns[0].shot).toBe(event.illustration);
   const fork = activeLine(forkLife(decodeLife(encodeLife(recordDecision(startBook(ready), renewed.state, event, renewalChoice))), 0));
   expect(replayScene(fork.state, fork.replay!)).toEqual(event);
  }
 });

 it('honors saved paperwork, supports legacy rent, and stops renewing a replaced lease', () => {
  const initial = start();
  const signed = resolveChoice(initial, rentalNegotiation(0), 'sign').state;
  const next = { ...nextYear(signed).state, pendingYearEvent: false };
  const noPage = rentalRenewal(next)!;
  expect(noPage.choices[0].effect.cash).toBe(0);
  const legacy = { ...next, flags: next.flags.filter(flag => flag !== 'rental-xinzhuang-active') };
  expect(rentalRenewal(validateSave(legacy))).toEqual(noPage);
  const move: LifeEvent = { id: 'replacement-lease', title: '另签一间', text: '', category: 'housing',
   choices: [{ id: 'move', label: '搬家', reply: '', effect: { housing: 1, leaseRent: 3300 } }] };
  const moved = resolveChoice(legacy, move, 'move').state;
  expect(rentalRenewal(moved)).toBeUndefined();
  const broke = nextYear({ ...signed, cash: 0, jobId: null }).state;
  expect(rentalRenewal({ ...broke, pendingYearEvent: false })).toBeUndefined();
  expect(rentalRenewal({ ...next, district: 'people' })).toBeUndefined();
 });

 it('lets guests follow all three leases in a separate renewal story', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=rental-second-year'));
  for (const [picks, photo] of [[[0,0], 'renew-fee'], [[0,1], 'renew-fan'], [[1], 'renew-tree']] as const) {
   const route = picks.map(pick => ({ pick }));
   const index = walk(timeline, route).next!;
   expect(timeline.turns[index].shot).toBe('/art/rental/' + photo + '.webp');
   expect(walk(timeline, [...route, { pick: 0 }]).next).toBeNull();
  }
 });
});
