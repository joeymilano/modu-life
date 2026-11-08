import { describe, expect, it } from 'vitest';
import { allOrigins, canAfford, createGame, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { DAYWORK_TEMP, FAMILY_PAY, LIFE_STARTS, outstandingShiftPay } from '../src/game/lifeStarts';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { openingForecast } from '../src/game/openingForecast';
import { challengeUrl, readChallenge } from '../src/game/share';
import { lastDayMemory } from '../src/game/lastDay';
import { familyLoanOwed, lifeYearsAlbumPhoto } from '../src/game/lifeYears';
import { NIGHT_WORK } from '../src/game/workFlags';
import { draftFromEvent, validateTicket } from '../src/game/timelines';
import { streetLead } from '../src/game/streetLeads';
import type { GameState } from '../src/game/types';

const appearance = { gender: 'female', looks: 'stunning' } as const;
const cardsFor = (profile: typeof LIFE_STARTS[number]) => profile.cards.map(id => allOrigins().find(card => card.id === id)!);
const create = (profile: typeof LIFE_STARTS[number]) => createGame(profile.seed,'小申','wealth',cardsFor(profile),appearance);
const annual = (state: GameState, choice: string) => resolveChoice(state,selectEvent(state,'year'),choice).state;
const visit = (state: GameState, choice: string) => resolveChoice(state,streetLead(state)!.event,choice).state;

describe('two Shanghai starting lives', () => {
 it.each(LIFE_STARTS)('shares the exact $id hand and forecasts the actual first scene', profile => {
  const state = create(profile);
  const url = challengeUrl(state, true);
  const hand = readChallenge(new URL(url).searchParams);
  expect(hand?.cards.map(card => card.id)).toEqual(profile.cards);
  const forecast = openingForecast(profile.seed,cardsFor(profile),'wealth',appearance);
  expect(forecast.cash).toBe(state.cash);
  expect(forecast.story?.event).toEqual(selectEvent(state,'year'));
  expect(validateSave(state)).toEqual(state);
 });

 it('keeps unpaid shifts separate, replays the partial settlement and never grants the default cash rescue', () => {
  const start = create(LIFE_STARTS[0]);
  expect(start.cash).toBe(780);
  expect(monthlyBudget(start)).toMatchObject({rent:1050,net:-2850});
  const waiting = annual(start,'later');
  expect(waiting.cash).toBe(780);
  expect(outstandingShiftPay(waiting)).toBe(780);
  const event = streetLead(waiting)!.event;
  const partial = visit(waiting,'close');
  expect(partial.cash).toBe(1300);
  expect(partial.actions).toBe(2);
  expect(outstandingShiftPay(partial)).toBe(260);
  const original = recordDecision(startBook(waiting),partial,event,'close');
  const restored = activeLine(forkLife(decodeLife(encodeLife(original)),0));
  expect(replayScene(restored.state,restored.replay!)).toEqual(event);
  expect(visit(restored.state,'records').cash).toBe(1560);
  const paid = visit(partial,'collect');
  expect(paid.cash).toBe(1560);
  expect(outstandingShiftPay(paid)).toBe(0);
  const hardYear = nextYear(paid);
  expect(hardYear.state.cash).toBe(0);
  expect(hardYear.uncovered).toBe(32640);
  expect(hardYear.state.flags).toContain(DAYWORK_TEMP);
  const fixed = annual(hardYear.state,'position');
  expect(monthlyBudget(fixed).salary).toBe(6500);
  expect(nextYear(fixed).state.cash).toBeGreaterThan(0);
 });

 it('carries pending wages forward when the worker cannot spend a visit', () => {
  const waiting = annual(create(LIFE_STARTS[0]),'later');
  const after = nextYear(waiting).state;
  expect(after.cash).toBe(0);
  expect(selectEvent(after,'year').title).toBe('三天都在，表上只有两天');
  expect(annual(after,'records').cash).toBe(780);
 });

 it('covers eligible bills, keeps purchase money off the player balance and retains the rent on self-payment', () => {
  const start = create(LIFE_STARTS[1]);
  expect(start.cash).toBe(600000);
  expect(monthlyBudget(start)).toMatchObject({rent:12000,familyPaid:13800,net:0});
  const first = nextYear(annual(start,'keys'));
  expect(first.income).toBe(0);
  expect(first.familyPaid).toBe(165600);
  expect(first.expense).toBe(165600);
  expect(first.state.cash).toBe(600000);
  const approval = annual(first.state,'pilot');
  expect(approval.cash).toBe(600000);
  const reviewed = nextYear(approval).state;
  expect(selectEvent(reviewed,'year').text).toContain('留下两台');
  const own = annual(reviewed,'own');
  expect(own.flags).not.toContain(FAMILY_PAY);
  expect(monthlyBudget(own)).toMatchObject({rent:12000,familyPaid:0,net:-13800});
  expect(nextYear(own).state.cash).toBe(434400);
  const moved = annual(start,'leave');
  expect(moved.cash).toBe(593400);
  expect(monthlyBudget(moved)).toMatchObject({rent:3300,familyPaid:0,net:-5100});
 });

 it('makes the later salary change a consequence of taking the handover', () => {
  const start = create(LIFE_STARTS[1]);
  const second = nextYear(annual(start,'floor')).state;
  const third = nextYear(annual(second,'order')).state;
  const tracked = annual(third,'take');
  const later = { ...tracked, age: 25, pendingYearEvent: true };
  expect(selectEvent(later,'year').id).toBe('life-start-heir-role');
  const manager = annual(later,'manager');
  expect(monthlyBudget(manager).salary).toBe(10000);
  expect(activeLine(decodeLife(encodeLife(startBook(manager)))).state.employment?.rate).toBe(1.25);
  expect(annual(later,'salary').cash).toBe(later.cash + 60000);
  expect(selectEvent({...annual(third,'hand'),age:25,pendingYearEvent:true},'year').id).not.toBe('life-start-heir-role');
 });


 it('remembers the shift taken at 46 in the last warehouse visit', () => {
  const start=annual(create(LIFE_STARTS[0]),'kitchen');
  const mid={...start,age:46,pendingYearEvent:true};
  const white=annual(mid,'day'), night=annual(mid,'night');
  expect(monthlyBudget(white).salary).toBe(5525);
  expect(monthlyBudget(night).salary).toBe(7800);
  expect(night.flags).toContain(NIGHT_WORK);
  expect(white.flags).not.toContain(NIGHT_WORK);
  expect(nextYear(night).state.stats.health).toBeLessThan(nextYear(white).state.stats.health);
  const close={...white,age:59,pendingYearEvent:true};
  const event=selectEvent(close,'year');
  expect(event.text).toContain('带白班');
  expect(selectEvent({...night,age:59,pendingYearEvent:true},'year').text).toContain('夜班有个人认出你');
  const visit=resolveChoice(close,event,'teach');
  const ended=nextYear(visit.state).state;
  expect(ended.ended).toBe(true);
  expect(lastDayMemory(ended)?.title).toBe('门卡交给下一个');
  expect(lifeYearsAlbumPhoto(ended)).toBe(event.illustration);
  const ticket={...draftFromEvent(event,'teach',visit.text,59,'莘庄'),author:'小申'};
  expect(validateTicket({version:1,timeline:ticket}).timeline.turns[0].shot).toBe(event.illustration);
 });

 it('tracks the company loan separately and only credits money paid on the selected line', () => {
  const start=annual(create(LIFE_STARTS[1]),'keys');
  const mid={...start,age:46,cash:200000,pendingYearEvent:true};
  const lend=selectEvent(mid,'year').choices[0];
  expect(canAfford({...mid,cash:119999},lend.effect)).toBe(false);
  const advanced=annual(mid,'lend');
  expect(advanced.cash).toBe(80000);
  expect(familyLoanOwed(advanced)).toBe(120000);
  const due=nextYear(advanced).state;
  const paid=annual(due,'partial');
  expect(paid.cash).toBe(due.cash+80000);
  expect(familyLoanOwed(paid)).toBe(40000);
  const last={...paid,age:59,pendingYearEvent:true};
  const event=selectEvent(last,'year');
  const collect=resolveChoice(last,event,'collect');
  expect(collect.state.cash).toBe(paid.cash+40000);
  expect(familyLoanOwed(collect.state)).toBe(0);
  const book=recordDecision(startBook(last),collect.state,event,'collect');
  const alternative=activeLine(forkLife(decodeLife(encodeLife(book)),0));
  const replay=replayScene(alternative.state,alternative.replay!)!;
  const defer=resolveChoice(alternative.state,replay,'later').state;
  const waived=resolveChoice(alternative.state,replay,'waive').state;
  expect(defer.cash).toBe(paid.cash);
  expect(familyLoanOwed(defer)).toBe(40000);
  expect(waived.cash).toBe(paid.cash);
  expect(familyLoanOwed(waived)).toBe(0);
  expect(lifeYearsAlbumPhoto(nextYear(defer).state)).toBe(event.illustration);
 });

});
