import { describe, expect, it } from 'vitest';
import { CHAPTER_AGES } from '../src/game/campaignScript';
import { advanceToStory, allOrigins, canAfford, createGame, drawOrigins, ending, nextYear, resolveChoice, selectEvent } from '../src/game/engine';
import { campaignLead, campaignProgress, campaignYear } from '../src/game/lifeCampaign';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS, type LifeStart } from '../src/game/lifeStarts';
import { streetLead } from '../src/game/streetLeads';
import { systemPoints, systemRedemption } from '../src/game/systemStory';

const fresh = (profile?: LifeStart) => {
 const seed = profile?.seed ?? 'NORMAL-CHAPTERS';
 const cards = profile?.cards.map(id=>allOrigins().find(card=>card.id===id)!) ?? drawOrigins(seed);
 return createGame(seed,'小申','free',cards);
};

describe('main story from Shanghai arrival to age 60',()=>{
 it.each([undefined,...LIFE_STARTS])('reaches every chapter and settles each year for %j', profile=>{
  let state = fresh(profile);
  const watched: number[] = [];
  while (!state.ended) {
   const event = selectEvent(state,'year');
   const choice = event.choices.find(item=>item.id==='walk') ?? event.choices.find(item=>canAfford(state,item.effect))!;
   if (event.id.startsWith('campaign-')) watched.push(state.age);
   state = resolveChoice(state,event,choice.id).state;
   state = advanceToStory(state).state;
  }
  expect(state.age).toBe(60);
  expect(watched).toEqual([...CHAPTER_AGES]);
  expect(state.journal.filter(entry=>entry.tag==='账本')).toHaveLength(42);
  expect(campaignProgress(state).chapters.every(chapter=>chapter.decision)).toBe(true);
  expect(ending(state).text).toContain('六十岁');
 });

 it('uses preparation as a real prerequisite and replays alternate decisions from their own saved state',()=>{
  const before = {...fresh(),age:21,pendingYearEvent:false,stats:{...fresh().stats,skill:25,network:20}};
  expect(campaignYear({...before,age:23})?.choices.map(choice=>choice.id)).toEqual(['bid','walk']);
  const prep = campaignLead(before)!.event;
  const result = resolveChoice(before,prep,'proof').state;
  const journal = recordDecision(startBook(before),result,prep,'proof');
  const fork = activeLine(forkLife(decodeLife(encodeLife(journal)),0));
  expect(replayScene(fork.state,fork.replay!)).toEqual(prep);
  const year = advanceToStory(result).state;
  expect(year.age).toBe(23);
  const showdown = selectEvent(year,'year');
  expect(showdown.choices.map(choice=>choice.id)).toEqual(['proof','bid','walk']);
  const proven = resolveChoice(year,showdown,'proof').state;
  expect(campaignProgress(proven).chapters[0].decision).toContain('预约单');
  const team = resolveChoice(fork.state,prep,'people').state;
  expect(selectEvent(advanceToStory(team).state,'year').choices.map(choice=>choice.id)).toEqual(['people','bid','walk']);
 });

 it('never fast-forwards through the second night or original 36-year warehouse story',()=>{
  const initial = fresh();
  const arrived = resolveChoice(initial,selectEvent(initial,'year'),'1').state;
  expect(advanceToStory(arrived).state.age).toBe(19);
  const worker = {...fresh(LIFE_STARTS[0]),age:35,pendingYearEvent:false};
  expect(selectEvent(advanceToStory(worker).state,'year').id).toBe('life-start-move-worker-opening');
 });
});

describe('system missions and redemption',()=>{
 it('rewards actual deliveries, spends each redemption only once and opens a main story decision',()=>{
  const initial = fresh(LIFE_STARTS[2]);
  expect(initial.cash).toBe(18000);
  expect(selectEvent(initial,'year').id).toBe('system-opening');
  let state = resolveChoice(initial,selectEvent(initial,'year'),'accept').state;
  for(const choice of ['proof','proof','file']){
   state = resolveChoice(state,streetLead(state)!.event,choice).state;
  }
  expect(state.cash).toBe(1206000);
  expect(systemPoints(state)).toBe(3);
  expect(systemRedemption(state)).toBeUndefined();
  const next = nextYear(state).state;
  state = resolveChoice(next,selectEvent(next,'year'),'keep').state;
  const before = state.cash;
  const terminal = systemRedemption(state)!;
  const redeemed = resolveChoice(state,terminal,'cash').state;
  expect(redeemed.cash-before).toBe(500000);
  expect(systemPoints(redeemed)).toBe(2);
  expect(systemRedemption(redeemed)?.choices.map(choice=>choice.id)).toEqual(['skill','proof']);
  const alternate = activeLine(forkLife(recordDecision(startBook(state),redeemed,terminal,'cash'),0));
  expect(replayScene(alternate.state,alternate.replay!)).toEqual(terminal);
  const withProof = resolveChoice(alternate.state,terminal,'proof').state;
  expect(campaignYear({...withProof,age:23,stats:{...withProof.stats,skill:25}})?.choices.map(choice=>choice.id)).toContain('proof');
 });
});
