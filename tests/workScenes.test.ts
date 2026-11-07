import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import type { GameState, LifeEvent } from '../src/game/types';
import { NIGHT_WORK } from '../src/game/employment';

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
});
