import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { relocationBudget, RELOCATION_CAP } from '../src/game/relocation';
import { ticketFromHash, validateTicket, walk } from '../src/game/timelines';
import { LONG_COMMUTE, NIGHT_WORK } from '../src/game/workFlags';

function life(id: 0|1) {
 const p=LIFE_STARTS[id];
 return {
  ...createGame(p.seed,'小申','free',p.cards.map(key=>allOrigins().find(card=>card.id===key)!)),
  age:36,cash:180000,
 };
}

describe('the same warehouse move from two livelihoods',()=>{
 it('gives the worker real salary and commute consequences without mixing company funds',()=>{
  const start=life(0);
  const letter=selectEvent(start,'year');
  expect(letter.id).toBe('life-start-move-worker-opening');
  const route=resolveChoice(start,letter,'transfer').state;
  const stay=resolveChoice(start,letter,'local').state;
  const temp=resolveChoice(start,letter,'inventory').state;
  expect(monthlyBudget(route).salary).toBe(7280);
  expect(monthlyBudget(stay).salary).toBe(6500);
  expect(temp.cash-start.cash).toBe(840);
  expect(temp.jobId).toBeNull();
  expect(route.flags).toContain(LONG_COMMUTE);
  expect(route.flags).not.toContain(NIGHT_WORK);
  expect(relocationBudget(route)).toBeUndefined();
  const late=nextYear(route).state;
  expect(late.stats.health).toBeLessThan(nextYear(stay).state.stats.health);
  const visit=selectEvent(late,'year');
  const bus=resolveChoice(late,visit,'express').state;
  const repay=resolveChoice(late,visit,'rebate').state;
  expect(bus.flags).not.toContain(LONG_COMMUTE);
  expect(repay.flags).toContain(LONG_COMMUTE);
  expect(repay.cash-late.cash).toBe(2400);
  expect(monthlyBudget(bus).salary).toBe(monthlyBudget(repay).salary);
  expect(selectEvent(nextYear(temp).state,'year').text).toContain('粉笔印');
  expect(selectEvent({...late,jobId:'tech'},'year').text).toContain('后来没再跟');
  expect(selectEvent({...late,age:46},'year').text).toContain('当年去松江那班车');
  validateSave(nextYear(repay).state);
 });
 it.each([
  ['shuttle',18000,0],
  ['local',54000,30000],
  ['close',72000,60000],
 ] as const)('keeps the %s company plan and extension off the personal account', (plan,left,final)=>{
  const start=life(1);
  expect(RELOCATION_CAP).toBe(90000);
  const letter=selectEvent(start,'year');
  expect(letter.id).toBe('life-start-move-heir-opening');
  const choice=resolveChoice(start,letter,plan).state;
  expect(choice.cash).toBe(start.cash);
  expect(relocationBudget(choice)).toMatchObject({remaining:left,closed:false});
  const year=nextYear(choice);
  expect(year.receipt.before).toBe(start.cash);
  expect(year.receipt.workIncome).toBe(0);
  const visit=selectEvent(year.state,'year');
  const next=resolveChoice(year.state,visit,'extend').state;
  expect(next.cash).toBe(year.state.cash);
  expect(relocationBudget(next)).toMatchObject({remaining:final,closed:true});
  const before=recordDecision(startBook(year.state),next,visit,'extend');
  const fork=activeLine(decodeLife(encodeLife(forkLife(before,0))));
  expect(replayScene(fork.state,fork.replay!)).toEqual(visit);
  const alternative=resolveChoice(fork.state,visit,'finish').state;
  expect(relocationBudget(alternative)).toMatchObject({remaining:left,closed:true});
  expect(selectEvent({...alternative,age:46,pendingYearEvent:true},'year').text).toContain('上回搬仓');
  validateSave(alternative);
 });
 it('keeps pre-update yearly bookmarks and leaves other origins on their current scenes',()=>{
  const start=life(1);
  expect(replayScene(start,{kind:'year',eventId:'year-36'})?.title).toContain('父母');
  expect(selectEvent({...start,flags:[]},'year').id).not.toContain('life-start-move');
  expect(selectEvent({...start,age:37},'year').id).not.toContain('life-start-move');
 });
 it('walks the same standalone story from either side and prints the correct closing shot',()=>{
  const {timeline}=validateTicket(ticketFromHash('#story=move-warehouse')!);
  const worker=walk(timeline,[{pick:0},{pick:0},{pick:1}]);
  const owner=walk(timeline,[{pick:1},{pick:0},{pick:0}]);
  expect(worker.steps.at(-1)?.option.shot).toBe('/art/relocation/worker-return.webp');
  expect(owner.steps.at(-1)?.option.shot).toBe('/art/relocation/heir-return.webp');
  expect(worker.next).toBeNull();
  expect(owner.next).toBeNull();
 });
});
