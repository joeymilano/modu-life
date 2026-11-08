import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import type { GameState, LifeEvent } from '../src/game/types';
import { NIGHT_WORK, WORK_HANDOVER_PENDING, WORK_HANDOVER_PROOF } from '../src/game/employment';
import { CAREERS } from '../src/game/content';
import { jobOffer } from '../src/game/jobOffers';
import { workHandover } from '../src/game/workHandover';
import { draftFromEvent, ticketFromHash, validateTicket, walk } from '../src/game/timelines';

const employed = (jobId: string, age = 33): GameState =>
 ({ ...createGame('CHANGE','小申','free',drawOrigins('CHANGE')), age, jobId, cash: 70000, jobRank: 1 });

const offer = (job: string): LifeEvent => ({
 id: 'mini-new-job', category: 'career', title: '新工作', text: '',
 choices: [{ id: 'take', label: '接下工作', reply: '', effect: { job } }],
});

describe('工作变动和账本',()=>{
 it('调岗薪资与离岗空档会分岔，旧线、支线与旧档都能继续',()=>{
  const old = employed('tech');
  expect(validateSave(old).employment).toBeUndefined();
  const salary = monthlyBudget(old).salary;
  const event = selectEvent(old,'year');
  expect(event.id).toBe('work-year-reorg');
  const transfer = resolveChoice(old,event,'transfer').state;
  expect(transfer.jobRank).toBe(1);
  expect(monthlyBudget(transfer).salary).toBeCloseTo(salary*.88,0);
  expect(transfer.actions).toBe(3);
  const original = recordDecision(startBook(old),transfer,event,'transfer',event.speakerId);
  const branch = forkLife(original,0);
  const active = activeLine(decodeLife(encodeLife(branch)));
  expect(replayScene(active.state,active.replay!)).toEqual(event);
  expect(replayScene(old,{kind:'year',eventId:'year-33'})?.title).toBe('组织架构调整');

  const layoff = resolveChoice(active.state,event,'leave').state;
  expect(layoff.cash-old.cash).toBe(salary*2);
  expect(layoff.jobId).toBeNull();
  expect(layoff.employment).toMatchObject({closedMonths:9,earned:salary*3});
  const unemployed = nextYear(layoff);
  expect(unemployed.income).toBe(salary*3);
  expect(selectEvent(unemployed.state,'year').id).toBe('work-year-return');
  const newWork = resolveChoice(layoff,offer('public'),'take').state;
  expect(nextYear(newWork).income).toBe(salary*3+7200*3);
  expect(activeLine(original).state.jobId).toBe('tech');
 });

 it('在岗换工作只结算一份工资每月，留在原岗保留评审与工资档',()=>{
  const old = {...employed('tech'),pendingYearEvent:false};
  const salary = monthlyBudget(old).salary;
  expect(resolveChoice(old,offer('tech'),'take').state.jobRank).toBe(1);
  const moved = resolveChoice(old,offer('public'),'take').state;
  expect(moved.jobRank).toBe(0);
  expect(nextYear(moved).income).toBe(salary*3+7200*9);
  const third = resolveChoice(moved,offer('service'),'take').state;
  expect(nextYear(third).income).toBe(salary*3+7200*3+6500*6);
 });

 it('45 岁会随行业遇到不同变动，选择减班会降低工资',()=>{
  const office = employed('finance',45), shop = employed('service',45), freelance = employed('freelance',45);
  expect(selectEvent(office,'year').id).toBe('work-year-overtime');
  const shift = selectEvent(shop,'year');
  expect(shift.id).toBe('work-year-shift');
  const reduced = resolveChoice(shop,shift,'day').state;
  expect(monthlyBudget(reduced).salary).toBe(Math.round(monthlyBudget(shop).salary*.8));
  const late = resolveChoice(shop,shift,'late').state;
  const quieter = { ...late, flags: late.flags.filter(flag => flag !== NIGHT_WORK) };
  expect(nextYear(quieter).state.stats.health - nextYear(late).state.stats.health).toBe(4);
  expect(resolveChoice(late,offer('tech'),'take').state.flags).not.toContain(NIGHT_WORK);
  expect(selectEvent(freelance,'year').id).toBe('work-year-invoice');
 });

 it('opens a unique handover after signing in each of the eight careers', () => {
  const before = { ...employed('tech', 18), pendingYearEvent: false, jobId: null, jobRank: 0 };
  const images = new Set<string>();
  for (const career of CAREERS) {
   const event = jobOffer(before, career, { topic: 'hours', proof: true });
   const declined = resolveChoice(before, event, 'leave').state;
   expect(workHandover(declined)).toBeUndefined();
   const signed = resolveChoice(before, event, event.choices[0].id).state;
   expect(signed.flags).toContain(WORK_HANDOVER_PENDING);
   const handover = workHandover(signed)!;
   expect(handover.illustration).toBe('/art/work/start-' + career.id + '.webp');
   images.add(handover.illustration!);
   const written = resolveChoice(signed, handover, 'record');
   expect(written.state.flags).toContain(WORK_HANDOVER_PROOF);
   expect(written.state.flags).not.toContain(WORK_HANDOVER_PENDING);
   expect(workHandover(written.state)).toBeUndefined();
   expect(draftFromEvent(handover, 'record', written.text, signed.age, '上海').turns[0].shot).toBe(handover.illustration);
   const later = { ...nextYear(written.state).state, pendingYearEvent: false };
   const check = workHandover(later)!;
   const payoff = resolveChoice(later, check, 'claim').state;
   expect(payoff.cash - later.cash).toBe(career.id === 'freelance' || career.id === 'business' ? 600 : 380);
   expect(workHandover(payoff)).toBeUndefined();
   expect(payoff.flags).toContain(WORK_HANDOVER_PROOF);
  }
  expect(images.size).toBe(8);
 });

 it('keeps written evidence on a timeline and loses it only when leaving that job', () => {
  const before = { ...employed('tech', 30), pendingYearEvent: false, jobId: null, jobRank: 0 };
  const signed = resolveChoice(before, offer('tech'), 'take').state;
  const first = workHandover(signed)!;
  const kept = resolveChoice(signed, first, 'record').state;
  const original = recordDecision(startBook(signed), kept, first, 'record');
  const branch = activeLine(decodeLife(encodeLife(forkLife(original, 0))));
  expect(replayScene(branch.state, branch.replay!)).toEqual(first);
  const noProof = resolveChoice(branch.state, first, 'finish').state;
  expect(workHandover({ ...noProof, age: 31 })).toBeUndefined();
  const sameJob = resolveChoice(kept, offer('tech'), 'take').state;
  expect(sameJob.flags).toContain(WORK_HANDOVER_PROOF);
  const later = { ...kept, age: 33, pendingYearEvent: true };
  const reorg = selectEvent(later, 'year');
  expect(reorg.choices.find(choice => choice.id === 'argue')?.check).toBeUndefined();
  const protectedSalary = resolveChoice(later, reorg, 'argue').state;
  expect(monthlyBudget(protectedSalary).salary).toBe(monthlyBudget(later).salary);
  expect(selectEvent({ ...noProof, age: 33, pendingYearEvent: true }, 'year').choices[1].check).toBeDefined();
  const nextJob = resolveChoice(kept, offer('trade'), 'take').state;
  expect(nextJob.flags).not.toContain(WORK_HANDOVER_PROOF);
  expect(workHandover(nextJob)).toBeUndefined();
  expect(workHandover({ ...nextYear(nextJob).state, pendingYearEvent: false })?.illustration).toBe('/art/work/start-trade.webp');
 });

 it('plays the handover and its distinct later scenes in the independent guest mode', () => {
  const { timeline } = validateTicket(ticketFromHash('#story=handover-sheet'));
  expect(walk(timeline, [{ pick: 0 }]).next).toBe(1);
  expect(timeline.turns[1].shot).toBe('/art/work/payroll.webp');
  expect(walk(timeline, [{ pick: 0 }, { pick: 0 }]).next).toBe(2);
  expect(walk(timeline, [{ pick: 1 }]).next).toBe(3);
  expect(walk(timeline, [{ pick: 1 }, { pick: 1 }]).next).toBeNull();
 });
});
