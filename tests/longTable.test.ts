import { describe, expect, it } from 'vitest';
import { LIFE_ALBUM_AGES, portraitArt } from '../src/game/art';
import { createGame, drawOrigins, nextYear, oldYearLetter, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { longTableBudget, longTableMemory } from '../src/game/longTable';
import { ticketFromHash, validateTicket, walk } from '../src/game/timelines';
import type { GameState } from '../src/game/types';

const life = (age: number): GameState => ({
 ...createGame('TABLE', '小申', 'free', drawOrigins('TABLE')),
 age, cash: 100_000, pendingYearEvent: true,
});
const nextLetter = (state: GameState, age: number): GameState => ({ ...state, age, pendingYearEvent: true });

describe('the long table across a life', () => {
 it('recalls different first decisions and restores the exact late scene on a fork', () => {
  const state = life(32);
  const event = selectEvent(state, 'year');
  expect(event.id).toBe('long-table-folded');
  const shared = resolveChoice(state, event, 'shared');
  const passed = resolveChoice(state, event, 'pass');
  expect(shared.state.actions).toBe(state.actions);
  expect(shared.state.cash).toBe(state.cash - 680);
  expect(selectEvent(nextLetter(shared.state, 46), 'year').text).toContain('借出去');
  expect(selectEvent(nextLetter(passed.state, 46), 'year').text).toContain('没扔那半块桌板');
  const later = nextLetter(shared.state, 46);
  const move = selectEvent(later, 'year');
  const result = resolveChoice(later, move, 'bench');
  const root = recordDecision(startBook(later), result.state, move, 'bench');
  const fork = decodeLife(encodeLife(forkLife(root, 0)));
  const branch = activeLine(fork);
  expect(replayScene(branch.state, branch.replay!)).toEqual(move);
  expect(longTableBudget(fork.lines[0].state).income).toBe(2400);
 });

 it('credits repairs separately from wages and changes future years after handing over the tools', () => {
  const state = life(46);
  const move = selectEvent(state, 'year');
  const bench = resolveChoice(state, move, 'bench').state;
  const leave = resolveChoice(state, move, 'leave').state;
  const annual = nextYear(bench);
  const sameYearWithoutBench = nextYear({ ...bench, flags: bench.flags.filter(flag => flag !== 'long-table-bench') });
  expect(annual.tableIncome).toBe(2400);
  expect(annual.income).toBe(nextYear(leave).income + 2400);
  expect(annual.state.yearsEmployed).toBe(state.yearsEmployed);
  expect(annual.state.totalEarned).toBe(state.totalEarned + 2400);
  expect(annual.state.stats.health).toBe(sameYearWithoutBench.state.stats.health - 2);
  const older = nextLetter(bench, 53);
  const chair = selectEvent(older, 'year');
  expect(chair.text).toContain('第一把伞的收条');
  const club = resolveChoice(older, chair, 'club').state;
  expect(longTableBudget(club)).toEqual({ income: 0, spirit: 4 });
  const clubAtSixtySpirit = { ...club, stats: { ...club.stats, spirit: 60 } };
  expect(nextYear(clubAtSixtySpirit).state.stats.spirit).toBe(62);
  const rest = resolveChoice(older, chair, 'off').state;
  expect(longTableBudget(rest)).toEqual({ income: 0, spirit: 0 });
  expect(longTableMemory(rest)).toMatchObject({ age: 53, illustration: '/art/long-table/empty-chair.webp' });
 });

 it('keeps the old yearly letter playable and gives priority to an outstanding work return', () => {
  const state = life(32);
  const old = oldYearLetter(state)!;
  expect(old.title).toBe('本事还在手上');
  const original = resolveChoice(state, old, old.choices[0].id);
  const saved = recordDecision(startBook(state), original.state, old, old.choices[0].id);
  const restored = activeLine(decodeLife(encodeLife(forkLife(saved, 0))));
  expect(replayScene(restored.state, restored.replay!)).toEqual(old);
  const looking = { ...state, flags: [...state.flags, 'work-break'] };
  const work = selectEvent(looking, 'year');
  expect(work.id).toBe('work-year-return');
  const after = resolveChoice(looking, work, 'practice');
  expect(selectEvent(nextLetter(after.state, 33), 'year').id).toBe('long-table-folded');
 });

 it('carries its own images in the standalone story and ages the album subjects', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=half-table'));
  expect(timeline.turns.map(turn => turn.shot)).toEqual([
   '/art/long-table/folded-table.webp', '/art/long-table/table-inside.webp',
   '/art/long-table/empty-chair.webp', '/art/long-table/empty-chair.webp',
  ]);
  expect(walk(timeline, [{ pick: 0 }, { pick: 1 }]).next).toBe(3);
  expect(walk(timeline, [{ pick: 1 }]).next).toBe(2);
  expect(LIFE_ALBUM_AGES).toEqual([18, 46, 60]);
  expect(portraitArt('tang', true, 46)).toBe('/art/portraits/tang-midlife.webp');
  expect(portraitArt('tang', false, 53)).toBe('/art/portraits/head/tang-senior.webp');
 });
});
