import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { ALL_RENTAL_CLUES, RENTAL_CLUES, rentalNegotiation } from '../src/game/rental';
import { ticketFromHash, validateTicket, walk } from '../src/game/timelines';
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
});
