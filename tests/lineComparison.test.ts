import { describe, expect, it } from 'vitest';
import { CAST } from '../src/game/content';
import { firstDateParting } from '../src/game/dates';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, startBook } from '../src/game/lifeLines';
import { describeDecision, lineDivergence, lineFacts } from '../src/game/lineComparison';
import { ALL_RENTAL_CLUES, rentalNegotiation } from '../src/game/rental';
import type { GameState, LifeEvent } from '../src/game/types';

const start = (): GameState => ({
 ...createGame('LINES', '小申', 'free', drawOrigins('LINES')),
 district: 'xinzhuang', cash: 100_000, pendingYearEvent: false,
});

function choose(state: GameState, event: LifeEvent, choice: string) {
 return resolveChoice(state, event, choice).state;
}

describe('timeline comparisons', () => {
 it('keeps a pending fork distinct and compares its choice after saving', () => {
  const startState = start();
  const rent = rentalNegotiation(ALL_RENTAL_CLUES);
  const original = recordDecision(startBook(startState), choose(startState, rent, 'amend'), rent, 'amend');
  const fork = forkLife(original, 0);
  expect(lineDivergence(fork.lines[0], activeLine(fork))).toBeUndefined();
  const later = recordDecision(fork, choose(activeLine(fork).state, rent, 'upstairs'), rent, 'upstairs');
  const saved = decodeLife(encodeLife(later));
  const [left, right] = saved.lines;
  const forkPoint = lineDivergence(left, right)!;
  expect(forkPoint.left.choice).toBe('划掉设备费，渗水也写进去');
  expect(forkPoint.right.choice).toBe('换楼上那间');
  const shot = describeDecision(left, forkPoint.left);
  expect(shot).toMatchObject({ art: '/art/rental/talk.webp', district: '莘庄', canReplay: true });
  expect(shot.result).toContain('签约费改成四千');
  expect(lineFacts(left).find(row => row.label === '月租')?.value).toBe('¥3,000');
  expect(lineFacts(right).find(row => row.label === '月租')?.value).toBe('¥3,600');
 });

 it('distinguishes romantic and friend outcomes even when both players are single', () => {
  const state = start();
  const lin = CAST.find(person => person.id === 'lin')!;
  const event = firstDateParting(state, lin, [2, 0])!;
  const original = recordDecision(startBook(state), choose(state, event, 'date'), event, 'date');
  const fork = forkLife(original, 0);
  const friend = recordDecision(fork, choose(activeLine(fork).state, event, 'friend'), event, 'friend');
  const [left, right] = friend.lines;
  const split = lineDivergence(left, right)!;
  const point = describeDecision(left, split.left);
  expect(point.speaker).toBe('lin');
  expect(lineFacts(left, point.speaker).at(-1)?.value).toBe('和林佳约了下次');
  expect(lineFacts(right, point.speaker).at(-1)?.value).toBe('和林佳做朋友');
 });

 it('does not describe separately reached rental decisions as the same fork', () => {
  const state = start();
  const event = rentalNegotiation(ALL_RENTAL_CLUES);
  const original = recordDecision(startBook(state), choose(state, event, 'amend'), event, 'amend');
  const anotherState = { ...state, rng: state.rng + 1 };
  const separate = recordDecision(startBook(anotherState), choose(anotherState, event, 'upstairs'), event, 'upstairs');
  expect(lineDivergence(activeLine(original), activeLine(separate))).toBeUndefined();
 });
});
