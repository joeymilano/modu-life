import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, ending, nextYear, playStoryRound, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordShowdown, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { createShowdown, playShowdown, SHOWDOWN_AGES, SHOWDOWN_ROUTES, showdownView, validateShowdown, type Showdown } from '../src/game/showdowns';
import { legacyShowdownEvent, storyFollowup, storyShowdownOffer, storyShowdownScene, storyVerdict } from '../src/game/storyShowdown';
import { priorWeek, rankWeek, weeklyShowdown } from '../src/game/ranked';

const run = (state:Showdown,...moves:string[]) => moves.reduce(playShowdown,state);

describe.each(SHOWDOWN_ROUTES)('%s ensemble',route=>{
 it.each(SHOWDOWN_AGES)('has two distinct wins and a playable loss at %s',age=>{
  const first=createShowdown(route,age);
  const rival=showdownView(first).cast.rival;
  const proof=playShowdown(first,'proof');
  const promise=playShowdown(first,'promise');
  expect(showdownView(proof).recent[1]).toContain(rival);
  expect(showdownView(promise).recent[1]).not.toEqual(showdownView(proof).recent[1]);
  expect(showdownView(run(first,'proof','verify','expose'))).toMatchObject({verdict:'win',score:80,ally:false});
  expect(showdownView(run(first,'promise','recruit','rally'))).toMatchObject({verdict:'win',score:75,ally:true});
  expect(showdownView(run(first,'recruit','promise','rally'))).toMatchObject({verdict:'partial',ally:false});
  expect(showdownView(run(first,'proof','misread','expose')).verdict).toBe('partial');
  expect(showdownView(run(first,'proof','promise','walk')).verdict).toBe('loss');
  expect(showdownView(run(first,'backup','promise','walk'))).toMatchObject({verdict:'partial',reserve:true});
  expect(()=>playShowdown(first,'verify')).toThrow();
  expect(()=>playShowdown(run(first,'proof','verify','expose'),'expose')).toThrow();
 });

 it('continues after a loss, keeps old completions, and forks from the first round',()=>{
  const profile=LIFE_STARTS.find(item=>item.id===(route==='worker'?'daywork':route));
  const cards=profile?profile.cards.map(id=>allOrigins().find(card=>card.id===id)!):drawOrigins('ARRIVALQA');
  const fresh=createGame('ARRIVALQA','小申','free',cards);
  const state={...fresh,age:23,actions:2,pendingYearEvent:true};
  expect(storyShowdownOffer({...state,seenEvents:[legacyShowdownEvent(route,23)]})).toBeUndefined();
  const active=storyShowdownOffer(state)!;
  const afterFirst=playStoryRound({...state,showdown:active},'proof').state;
  const restored=activeLine(decodeLife(encodeLife(startBook(afterFirst)))).state;
  expect(restored.showdown?.moves).toEqual(['proof']);
  expect(()=>nextYear(restored)).toThrow('先打完眼前这场');
  const beforeFinal=playStoryRound(restored,'promise').state;
  const {state:lost,settled}=playStoryRound(beforeFinal,'walk');
  expect(lost.actions).toBe(2);
  expect(lost.showdown).toBeUndefined();
  expect(storyVerdict(lost,route,23)).toBe('loss');
  expect(storyShowdownOffer(lost)).toBeUndefined();
  expect(()=>playStoryRound(lost,'walk')).toThrow();
  const followup=storyFollowup({...lost,age:28},{id:'later',title:'后来',text:'这回见面。',category:'year',choices:[]});
  const deal=followup.choices[0];
  expect(deal.id).toBe('settle-with-cast');
  expect(storyShowdownOffer({...lost,age:38,flags:[...lost.flags,...deal.effect.setFlags!]} )?.backup).toBe(true);
  const fork=activeLine(forkLife(decodeLife(encodeLife(recordShowdown(startBook(beforeFinal),lost,settled!))),0));
  expect(fork.state.showdown).toBeUndefined();
  expect(fork.state.cash).toBe(state.cash);
  expect(fork.replay?.kind).toBe('showdown');
  expect(storyShowdownOffer(fork.state)?.moves).toEqual([]);
 });

 it('makes the finale change the actual ending',()=>{
  const profile=LIFE_STARTS.find(item=>item.id===(route==='worker'?'daywork':route));
  const cards=profile?profile.cards.map(id=>allOrigins().find(card=>card.id===id)!):drawOrigins('ARRIVALQA');
  const state={...createGame('ARRIVALQA','小申','free',cards),age:57};
  const fight=createShowdown(route,57);
  const win=playStoryRound({...state,showdown:run(fight,'proof','verify')},'expose').state;
  const loss=playStoryRound({...state,showdown:run(fight,'proof','promise')},'walk').state;
  expect(ending(win).text).toBe(showdownView(fight).scene.win);
  expect(ending(loss).text).toBe(showdownView(fight).scene.loss);
 });
});

it('uses ownership as a real venue reserve',()=>{
 const profile=LIFE_STARTS.find(item=>item.id==='heir')!;
 const state={...createGame(profile.seed,'小申','wealth',profile.cards.map(id=>allOrigins().find(card=>card.id===id)!)),age:38};
 expect(storyShowdownOffer(state)?.backup).toBe(false);
 const owner={...state,flags:[...state.flags,'heir-owned-lounge']};
 const fight=storyShowdownOffer(owner)!;
 expect(fight.backup).toBe(true);
 expect(showdownView(run(fight,'proof','promise','expose')).verdict).toBe('win');
});

it('keeps an unfinished ordinary opening intact on load',()=>{
 const start=createGame('ARRIVALQA','小申','free',drawOrigins('ARRIVALQA'));
 expect(storyShowdownOffer(start)).toBeUndefined();
 const event=selectEvent(start,'year');
 const next=resolveChoice(start,event,event.choices[0].id).state;
 expect(storyShowdownOffer(next)).toBeUndefined();
 expect(storyShowdownScene(next,storyShowdownOffer(next,true)!).title).toBe('开门前，票卖了两遍');
});

it('rolls over Monday at midnight in Shanghai and pins rules by week',()=>{
 expect(rankWeek(Date.parse('2026-11-15T15:59:59Z'))).toBe('2026-11-09');
 expect(rankWeek(Date.parse('2026-11-15T16:00:00Z'))).toBe('2026-11-16');
 expect(priorWeek('2026-11-16')).toBe('2026-11-09');
 const active=weeklyShowdown('2026-11-16','arrival');
 expect(weeklyShowdown('2026-11-16','arrival')).toEqual(active);
 expect(weeklyShowdown('2026-11-09','arrival').age).not.toBe(active.age);
 expect(()=>validateShowdown({...active,moves:['expose']})).toThrow();
 expect(validateShowdown(run(active,'proof','verify'))).toEqual(run(active,'proof','verify'));
});
