import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { DAYWORK_TEMP, FAMILY_PAY, LIFE_STARTS, outstandingShiftPay } from '../src/game/lifeStarts';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { openingForecast } from '../src/game/openingForecast';
import { challengeUrl, readChallenge } from '../src/game/share';
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
  expect(monthlyBudget(annual(later,'manager')).salary).toBe(10000);
  expect(annual(later,'salary').cash).toBe(later.cash + 60000);
  expect(selectEvent({...annual(third,'hand'),age:25,pendingYearEvent:true},'year').id).not.toBe('life-start-heir-role');
 });

});
