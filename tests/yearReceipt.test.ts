import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, updateLife } from '../src/game/lifeLines';
import { NIGHT_WORK } from '../src/game/workFlags';
import { validYearReceipt, yearMoment, yearTotals } from '../src/game/yearReceipt';
import type { GameState } from '../src/game/types';

const opening = (id: 0|1) => {
 const profile = LIFE_STARTS[id];
 return createGame(profile.seed,'小申','free',profile.cards.map(card=>allOrigins().find(item=>item.id===card)!));
};
const regular = (options: Partial<GameState> = {}) => ({
 ...createGame('YEAR','小申','free',drawOrigins('YEAR')),
 cash:70000, housing:0, flags:[], pendingYearEvent:false, ...options,
} as GameState);

describe('year-end ledger', () => {
 it('accounts for a day worker who cannot cover the bills and for a friend who fronts the cash', () => {
  const start = opening(0);
  const bed = nextYear(resolveChoice(start,selectEvent(start,'year'),'later').state);
  expect(bed.receipt).toMatchObject({before:780,after:0,friendAdvance:0,uncovered:33420,moment:'bed'});
  expect(yearTotals(bed.receipt)).toEqual({income:0,paid:780,delta:-780});
  const move = nextYear(regular({cash:0}));
  expect(move.receipt).toMatchObject({before:0,after:6000,uncovered:0,moment:'move'});
  expect(move.receipt.friendAdvance).toBe(move.expense+6000);
  expect(yearTotals(move.receipt).delta).toBe(6000);
 });
 it('splits paid family bills from cash receipts and captures health costs exactly', () => {
  const start = opening(1);
  const family = nextYear(resolveChoice(start,selectEvent(start,'year'),'keys').state);
  expect(family.receipt).toMatchObject({before:60_000_000,after:60_000_000,familyPaid:804_000,moment:'family'});
  expect(yearTotals(family.receipt)).toEqual({income:0,paid:0,delta:0});
  const older = regular({age:46});
  older.stats.health=14;
  const health = nextYear(older);
  expect(health.receipt).toMatchObject({care:3000,body:21,moment:'care',after:health.state.cash});
  expect(health.receipt.after).toBe(70000-health.expense-3000);
  expect(yearMoment(health.receipt.moment).photo).toBe('/art/yearbook/care.webp');
 });
 it('preserves the split payroll and records what working late cost in the same year', () => {
  const state = regular({age:48,jobId:'service',employment:{sinceAge:48,reviews:0,rate:1,closedMonths:3,earned:16500}});
  const day = nextYear(state).receipt;
  const late = nextYear({...state,flags:[NIGHT_WORK]}).receipt;
  expect(day.payroll).toEqual({previous:16500,current:58500,months:9});
  expect(late.workIncome).toBe(75000);
  expect(day.moment).toBe('saved');
  expect(late.moment).toBe('late');
  expect(late.body).toBeLessThan(day.body);
  expect(late.after).toBe(day.after);
  expect(validYearReceipt(late)).toBe(true);
 });
 it('saves both versions of the same year through a fork and reads old journal entries', () => {
  const state = opening(0);
  const event = selectEvent(state,'year');
  const original = resolveChoice(state,event,'later').state;
  let book = recordDecision(startBook(state),original,event,'later');
  book = updateLife(book,nextYear(original).state);
  book = forkLife(book,0);
  const branch = activeLine(book);
  const replay = replayScene(branch.state,branch.replay!)!;
  const working = resolveChoice(branch.state,replay,'kitchen').state;
  book = recordDecision(book,working,replay,'kitchen');
  book = updateLife(book,nextYear(working).state);
  const reopened = decodeLife(JSON.parse(JSON.stringify(encodeLife(book))));
  expect(reopened.lines.map(line=>line.state.journal.at(-1)?.receipt?.moment)).toEqual(['bed','saved']);
  const legacy = {...original,journal:original.journal.map(({receipt,...entry})=>entry)};
  expect(validateSave(legacy).journal).toEqual(legacy.journal);
  const corrupted = structuredClone(activeLine(reopened).state);
  corrupted.journal.at(-1)!.receipt!.after += 300;
  expect(()=>validateSave(corrupted)).toThrow('人生记录损坏');
 });
});
