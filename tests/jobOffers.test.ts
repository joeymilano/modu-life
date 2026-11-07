import { describe, expect, it } from 'vitest';
import { CAREERS } from '../src/game/content';
import { createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice } from '../src/game/engine';
import { NIGHT_WORK } from '../src/game/employment';
import { jobOffer, replayJobOffer } from '../src/game/jobOffers';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { draftFromEvent } from '../src/game/timelines';

const role = (id: string) => CAREERS.find(career => career.id === id)!;
const ready = () => ({ ...createGame('TERMS', '小申', 'free', drawOrigins('TERMS')), pendingYearEvent: false });

describe('谈工作条件', () => {
 it('从同一场谈判分出普通班和轮值，换岗收入按月结算', () => {
  const before = { ...ready(), jobId: 'service' };
  const event = jobOffer(before, role('tech'), { topic: 'pay', proof: true });
  expect(before.employment).toBeUndefined();
  const late = resolveChoice(before, event, 'night').state;
  expect(late.actions).toBe(before.actions - 1);
  expect(late.flags).toContain(NIGHT_WORK);
  expect(monthlyBudget(late).salary).toBe(12600);
  expect(nextYear(late).payroll).toEqual({ previous: 19500, current: 113400, months: 9 });
  const book = recordDecision(startBook(before), late, event, 'night');
  const branch = activeLine(decodeLife(encodeLife(forkLife(book, 0))));
  const replay = replayScene(branch.state, branch.replay!)!;
  expect(replay).toEqual(event);
  const day = resolveChoice(branch.state, replay, 'day').state;
  expect(monthlyBudget(day).salary).toBe(10500);
  expect(nextYear(day).payroll).toEqual({ previous: 19500, current: 94500, months: 9 });
  expect(nextYear(day).state.stats.health).toBeGreaterThan(nextYear(late).state.stats.health);
  expect(activeLine(book).state.flags).toContain(NIGHT_WORK);
  expect(draftFromEvent(event, 'night', '签了轮值', 18, '张江').turns[0].shot).toBe('/art/job-offers/tech.webp');
 });

 it('排班问得清楚能谈高普通班，留在原岗保留职级，拒签保留原条件', () => {
  const before = { ...ready(), jobId: 'tech', jobRank: 1, flags: [NIGHT_WORK] };
  const event = jobOffer(before, role('tech'), { topic: 'hours', proof: true });
  const day = resolveChoice(before, event, 'day').state;
  expect(day.jobRank).toBe(1);
  expect(day.flags).not.toContain(NIGHT_WORK);
  expect(monthlyBudget(day).salary).toBe(Math.round(10500 * 1.22 * 1.05));
  const leave = resolveChoice(before, event, 'leave').state;
  expect(leave).toMatchObject({ jobId: 'tech', jobRank: 1, flags: [NIGHT_WORK], cash: before.cash, actions: 2 });
  expect(monthlyBudget(leave).salary).toBe(monthlyBudget(before).salary);
 });

 it('自由接单与小店的首款每年只发一次，同场可选更高结款价', () => {
  for (const id of ['freelance', 'business']) {
   const before = ready();
   const offer = { topic: 'pay', proof: true } as const;
   const event = jobOffer(before, role(id), offer);
   const deposit = resolveChoice(before, event, 'deposit').state;
   expect(deposit.cash - before.cash).toBe(id === 'freelance' ? 2100 : 2700);
   const again = resolveChoice(deposit, jobOffer(deposit, role(id), offer), 'deposit').state;
   expect(again.cash).toBe(deposit.cash);
   const invoice = resolveChoice(before, event, 'invoice').state;
   expect(invoice.cash).toBe(before.cash);
   expect(monthlyBudget(invoice).salary).toBeGreaterThan(monthlyBudget(deposit).salary);
  }
 });

 it('每个行业都有自己的一张谈判图，年度事件期间无法重开面试', () => {
  const before = ready();
  const offers = CAREERS.map(career => jobOffer(before, career, { topic: 'none', proof: false }));
  expect(new Set(offers.map(offer => offer.illustration)).size).toBe(CAREERS.length);
  for (const offer of offers) {
   expect(replayJobOffer(before, offer.id)).toEqual(offer);
   expect(replayJobOffer({ ...before, pendingYearEvent: true }, offer.id)).toBeNull();
  }
 });
});
