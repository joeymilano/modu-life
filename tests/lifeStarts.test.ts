import { describe, expect, it } from 'vitest';
import { allOrigins, canAfford, createGame, eligibleEvent, monthlyBudget, nextYear, relationshipLabel, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import { DAYWORK_TEMP, FAMILY_PAY, heirBoardVisit, LIFE_STARTS, outstandingShiftPay } from '../src/game/lifeStarts';
import { heirAssets, heirShopVisits, HEIR_WEST_BUND } from '../src/game/heirStory';
import { CAST, castForGame } from '../src/game/content';
import { EVENTS } from '../src/game/events';
import { holdsLogisticsShares, STAFF_BED } from '../src/game/classLives';
import { HEIR_CAPITAL_TIER } from '../src/game/heirCapital';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { openingForecast } from '../src/game/openingForecast';
import { challengeUrl, readChallenge } from '../src/game/share';
import { lastDayMemory } from '../src/game/lastDay';
import { familyLoanOwed, lifeYearsAlbumPhoto } from '../src/game/lifeYears';
import { NIGHT_WORK } from '../src/game/workFlags';
import { CITY_TIMELINES, draftFromEvent, validateTicket } from '../src/game/timelines';
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
  expect(start.cash).toBe(60_000_000);
  expect(monthlyBudget(start)).toMatchObject({rent:55_000,familyPaid:67_000,net:0});
  const first = nextYear(annual(start,'keys'));
  expect(first.income).toBe(0);
  expect(first.familyPaid).toBe(804_000);
  expect(first.expense).toBe(804_000);
  expect(first.state.cash).toBe(60_000_000);
  const firstVisit = annual(first.state,'call');
  const approval = resolveChoice(firstVisit,heirBoardVisit(firstVisit)!,'pilot').state;
  expect(approval.cash).toBe(60_000_000);
  const reviewed = nextYear(approval).state;
  const ready = annual(reviewed,'1');
  const review = heirBoardVisit(ready)!;
  expect(review.text).toContain('留下两台');
  const own = resolveChoice(ready,review,'own').state;
  expect(own.flags).not.toContain(FAMILY_PAY);
  expect(monthlyBudget(own)).toMatchObject({rent:55_000,familyPaid:0,net:-67_000});
  expect(nextYear(own).state.cash).toBe(59_196_000);
  const moved = annual(start,'leave');
  expect(moved.cash).toBe(59_993_400);
  expect(monthlyBudget(moved)).toMatchObject({rent:3300,familyPaid:0,net:-5100});
 });

 it('makes the later salary change a consequence of taking the handover', () => {
  const start = create(LIFE_STARTS[1]);
  const second = nextYear(annual(start,'floor')).state;
  const ready = annual(second,'call');
  const ordered = resolveChoice(ready,heirBoardVisit(ready)!,'order').state;
  const review = heirBoardVisit(ordered)!;
  const tracked = resolveChoice(ordered,review,'take').state;
  const later = { ...tracked, age: 25, pendingYearEvent: true };
  expect(selectEvent(later,'year').id).toBe('life-start-heir-role');
  const manager = annual(later,'manager');
  expect(monthlyBudget(manager).salary).toBe(10000);
  expect(activeLine(decodeLife(encodeLife(startBook(manager)))).state.employment?.rate).toBe(1.25);
  expect(annual(later,'salary').cash).toBe(later.cash + 60000);
  expect(selectEvent({...resolveChoice(ordered,review,'hand').state,age:25,pendingYearEvent:true},'year').id).not.toBe('life-start-heir-role');
 });

 it('pays for all four purchases once, remembers the party branch, and unlocks an owner scene', () => {
  const start = annual(create(LIFE_STARTS[1]),'keys');
  expect(heirAssets(start)).toEqual([]);
  const mall = streetLead(start)!.event;
  expect(mall.location).toBe('恒隆广场');
  expect(canAfford({...start,cash:219_999},mall.choices.find(choice=>choice.id==='lv-hermes')!.effect)).toBe(false);
  const bags = visit(start,'lv-hermes');
  const cars = visit(bags,'cullinan-revuelto');
  expect(cars.cash).toBe(44_100_000);
  expect(cars.actions).toBe(1);
  const party = streetLead(cars)!.event;
  expect(party.text).toContain('两辆新车');
  expect(party.text).toContain('Kelly');
  const hosted = visit(cars,'take-seat');
  expect(hosted.actions).toBe(0);
  expect(heirAssets(activeLine(decodeLife(encodeLife(startBook(hosted)))).state)).toHaveLength(4);
  const other = activeLine(forkLife(recordDecision(startBook(cars),hosted,party,'take-seat'),0));
  expect(replayScene(other.state,other.replay!)).toEqual(party);
  const ready = annual(nextYear(hosted).state,'call');
  expect(heirShopVisits(ready)).toEqual([]);
  const owner = visit(ready,'lounge');
  expect(owner.cash).toBe(34_300_000);
  expect(heirAssets(owner).map(asset=>asset.name)).toContain('西岸会客厅');
  expect(streetLead(annual(nextYear(owner).state,'1'))?.event.title).toBe('今晚关门，只请自己人');
 });

 it('lets the player host without buying and buy an outstanding item later', () => {
  const start = annual(create(LIFE_STARTS[1]),'keys');
  const party = visit(visit(start,'pass'),'pass');
  expect(streetLead(party)?.event.text).toContain('家里的车');
  const hosted = visit(party,'new-table');
  expect(hosted.cash).toBe(start.cash);
  expect(heirAssets(hosted)).toEqual([]);
  const ready = annual(nextYear(hosted).state,'call');
  const shop = heirShopVisits(ready)[0];
  const bought = resolveChoice(ready,shop,'lv').state;
  expect(heirShopVisits(bought)[0].choices.map(choice=>choice.id)).toEqual(['hermes','pass']);
  expect(heirAssets(bought).map(asset=>asset.id)).toEqual(['lv']);
  const alternate = activeLine(forkLife(recordDecision(startBook(ready),bought,shop,'lv','mother'),0));
  expect(replayScene(alternate.state,alternate.replay!)).toEqual(shop);
 });

 it('keeps parent identity and housing context consistent in both old and new saves', () => {
  const start = create(LIFE_STARTS[1]);
  const father = CAST.find(person=>person.id==='father')!;
  const mother = CAST.find(person=>person.id==='mother')!;
  const legacy = validateSave({...start,flags:start.flags.filter(flag=>flag!==HEIR_WEST_BUND),relationships:{
   ...start.relationships,father:{...start.relationships.father,met:false},
  }});
  expect(relationshipLabel(legacy,'father')).toBe('家人');
  expect(legacy.relationships.father.met).toBe(true);
  expect(castForGame(father,legacy)).toMatchObject({portraitId:'father-heir',district:'lujiazui'});
  expect(castForGame(mother,start).portraitId).toBe('mother-heir');
  expect(castForGame(father,create(LIFE_STARTS[0])).portraitId).toBeUndefined();
  expect(selectEvent({...legacy,age:19},'year').title).toBe('八十万签给谁');
  const room = EVENTS.find(event=>event.title==='室友的凌晨一点')!;
  const repairs = EVENTS.find(event=>event.title==='有房也有维修单')!;
  expect(eligibleEvent(room,start,'housing')).toBe(false);
  expect(eligibleEvent(repairs,start,'housing')).toBe(false);
  const older = {...start,age:28,pendingYearEvent:false,seenEvents:['heir-shopping','heir-showroom','heir-opening-night','heir-west-bund-venue']};
  expect(streetLead(older)?.event.id).not.toBe('street-lease');
  expect(replayScene(older,{kind:'lead',eventId:'street-lease'})?.id).toBe('street-lease');
 });

 it('only gets the discounted staff bed on the branch that signs up for it', () => {
  const before = {...create(LIFE_STARTS[0]),age:21};
  const scene = selectEvent(before,'year');
  const staff = annual(before,'staff');
  expect(staff.cash).toBe(before.cash);
  expect(monthlyBudget(staff)).toMatchObject({salary:6500,rent:800});
  expect(nextYear(staff).receipt.rent).toBe(9600);
  const book = recordDecision(startBook(before),staff,scene,'staff');
  const other = activeLine(forkLife(decodeLife(encodeLife(book)),0));
  expect(replayScene(other.state,other.replay!)).toEqual(scene);
  const independent = annual(other.state,'private');
  expect(monthlyBudget(independent).rent).toBe(1050);
  expect(selectEvent(nextYear(independent).state,'year').id).not.toContain('worker-notice');

  const renewal = nextYear(staff).state;
  expect(selectEvent(renewal,'year').id).toBe('life-start-class-worker-notice');
  const grant = annual(renewal,'grant');
  expect(grant.cash).toBe(renewal.cash+750);
  expect(grant.flags).not.toContain(STAFF_BED);
  expect(nextYear(grant).receipt.rent).toBe(12600);
  const night = annual(renewal,'night');
  expect(monthlyBudget(night)).toMatchObject({salary:7800,rent:1050});
  expect(night.flags).toContain(NIGHT_WORK);
  expect(nextYear(night).state.stats.health).toBeLessThan(nextYear(grant).state.stats.health);
 });

 it('pays personal dividends only on the branch that buys shares and approves them', () => {
  const before = {...create(LIFE_STARTS[1]),age:21};
  const equity = selectEvent(before,'year');
  expect(canAfford({...before,cash:23_999_999},equity.choices[0].effect)).toBe(false);
  const bought = annual(before,'buy');
  expect(bought.cash).toBe(before.cash-24_000_000);
  expect(holdsLogisticsShares(bought)).toBe(true);
  expect(monthlyBudget(bought).familyPaid).toBe(67_000);
  const ballot = nextYear(bought).state;
  const vote = selectEvent(ballot,'year');
  const paid = annual(ballot,'pay');
  expect(paid.cash).toBe(ballot.cash+576_000);
  const book = recordDecision(startBook(ballot),paid,vote,'pay');
  const other = activeLine(forkLife(decodeLife(encodeLife(book)),0));
  expect(replayScene(other.state,other.replay!)).toEqual(vote);
  expect(annual(other.state,'keep').cash).toBe(ballot.cash);
  const sold = annual(other.state,'sell');
  expect(sold.cash).toBe(ballot.cash+21_000_000);
  expect(holdsLogisticsShares(sold)).toBe(false);
  expect(holdsLogisticsShares(paid)).toBe(true);
  expect(nextYear(paid).receipt.workIncome).toBe(0);
  const visitor = nextYear(annual(before,'observe')).state;
  expect(selectEvent(visitor,'year').id).toBe('life-start-class-heir-observer');
  expect(annual(visitor,'ask').cash).toBe(visitor.cash);
 });

 it('keeps the original balance and signed prices on a saved legacy timeline', () => {
  const prior = create(LIFE_STARTS[1]);
  const before = validateSave({...prior,age:21,cash:600_000,flags:prior.flags.filter(flag=>flag!==HEIR_CAPITAL_TIER)});
  expect(monthlyBudget(before)).toMatchObject({rent:12_000,familyPaid:13_800});
  const scene = selectEvent(before,'year');
  const bought = annual(before,'buy');
  expect(bought.cash).toBe(360_000);
  const book = recordDecision(startBook(before),bought,scene,'buy');
  const alternate = activeLine(forkLife(decodeLife(encodeLife(book)),0));
  expect(replayScene(alternate.state,alternate.replay!)?.choices[0].effect.cash).toBe(-240_000);
  const vote = nextYear(bought).state;
  expect(annual(vote,'pay').cash).toBe(vote.cash+57_600);
 });

 it('lets guests see the same vote through both possible dorm notices', () => {
  const story = CITY_TIMELINES.find(timeline=>timeline.id==='staff-bed')!;
  expect(validateTicket({version:1,timeline:story}).timeline).toEqual(story);
  const vote = story.turns[2];
  expect(story.turns[vote.options[0].next!].scene).toContain('不续宿舍补贴');
  expect(story.turns[vote.options[1].next!].scene).toContain('补贴还在');
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
