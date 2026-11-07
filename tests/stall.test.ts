import { expect, it } from 'vitest';
import { createGame, drawOrigins, nextYear, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { moveStall, settleStall, stallCommitment, stallScore, startStall, STALL_STEPS, waitingOrders, type StallMove } from '../src/game/stall';
import { draftFromEvent } from '../src/game/timelines';
import type { GameState } from '../src/game/types';

const wait: StallMove = { type: 'wait' };
const serve = (order: number): StallMove => ({ type: 'serve', order });
const sheng = (pan: 0 | 1): StallMove => ({ type: 'cook', pan, dish: 'sheng' });
const guo = (pan: 0 | 1): StallMove => ({ type: 'cook', pan, dish: 'guo' });

it.each([
 ['B', [sheng(0), guo(1), wait, serve(1), serve(2), serve(3), serve(4), sheng(0), guo(1), wait, serve(5), serve(6), serve(7), serve(8)]],
 ['A', [guo(0), sheng(1), serve(1), wait, serve(2), serve(3), serve(4), guo(0), sheng(1), serve(5), serve(7), serve(6), serve(8), wait]],
] as const)('lets a player serve every ticket on the %s schedule', (seed, moves) => {
 const shift = moves.reduce(moveStall, startStall(seed, 19, 3));
 expect(shift.step).toBe(STALL_STEPS);
 expect(stallScore(shift)).toEqual({ served: 8, waste: 0 });
 expect(moveStall(shift, wait)).toBe(shift);
});

it('keeps invalid moves free, gives the last promised step, and charges unsold portions', () => {
 const original = startStall('B', 19, 3);
 expect(moveStall(original, serve(1))).toBe(original);
 expect(moveStall(original, serve(8))).toBe(original);
 let shift = moveStall(original, sheng(0));
 expect(moveStall(shift, guo(0))).toBe(shift);
 for (let i = 0; i < 4; i++) shift = moveStall(shift, wait);
 expect(waitingOrders(shift).some(order => order.id === 1)).toBe(true);
 shift = moveStall(shift, serve(1));
 expect(stallScore(shift)).toEqual({ served: 1, waste: 0 });
 shift = moveStall(shift, wait);
 expect(stallScore(shift)).toEqual({ served: 1, waste: 1 });
 expect(shift.status[1]).toBe('left');
 while (shift.step < STALL_STEPS - 1) shift = moveStall(shift, wait);
 expect(stallScore(moveStall(shift, guo(0)))).toEqual({ served: 1, waste: 3 });
});

it('replays settlement after reloading and pays only three annual installments', () => {
 const state: GameState = {
  ...createGame('STALL', '小申', 'free', drawOrigins('STALL')),
  district: 'xinzhuang', pendingYearEvent: false,
 };
 const event = settleStall(state, { served: 8, waste: 0 });
 const paid = resolveChoice(state, event, 'paid').state;
 expect(paid.cash - state.cash).toBe(900);
 expect(paid.actions).toBe(state.actions - 1);
 const book = recordDecision(startBook(state), paid, event, 'paid', event.speakerId);
 const branch = activeLine(decodeLife(encodeLife(forkLife(book, 0))));
 const replay = replayScene(branch.state, branch.replay!)!;
 expect(replay).toEqual(event);
 const signed = resolveChoice(branch.state, replay, 'shift').state;
 expect(signed.cash - state.cash).toBe(450);
 expect(stallCommitment(signed)).toBe(3);
 expect(settleStall(signed, { served: 8, waste: 0 }).choices[1].id).toBe('learn');
 expect(settleStall(state, { served: 3, waste: 1 }).choices[1].id).toBe('learn');
 expect(draftFromEvent(event, 'paid', '结了工钱', 18, '莘庄').turns[0].shot).toBe('/art/stall/close.webp');
 let year = signed;
 for (const expected of [2400, 2400, 2400, 0]) {
  const report = nextYear({ ...year, pendingYearEvent: false });
  expect(report.stallIncome).toBe(expected);
  year = report.state;
 }
});
