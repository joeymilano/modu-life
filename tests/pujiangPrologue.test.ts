import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PujiangStage from '../src/components/PujiangStage';
import { allOrigins, createGame, drawOrigins } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { beginPujiangLife, episodeCarry, episodeOffer, episodeView, advancePrologue, pujiangYear, startEpisode } from '../src/game/pujiang';
import { PROLOGUES, PROLOGUE_PENDING, openingScene } from '../src/game/pujiangPrologue';
import { cinemaRelationships } from '../src/game/pujiangCinema';
import type { PujiangRoute } from '../src/game/pujiangTypes';
import type { GameState } from '../src/game/types';

function start(route:PujiangRoute){
 const profile=LIFE_STARTS.find(s=>s.id===(route==='worker'?'daywork':route));
 const cards=profile?profile.cards.map(id=>allOrigins().find(c=>c.id===id)!):drawOrigins('first-meeting');
 return beginPujiangLife(createGame('first-meeting','阿黎','free',cards));
}

function reload(state:GameState){
 return activeLine(decodeLife(JSON.parse(JSON.stringify(encodeLife(startBook(state)))))).state;
}

function stage(state:GameState){
 const noop=()=>{};
 return renderToStaticMarkup(createElement(PujiangStage,{game:state,onStart:noop,onMove:noop,onDone:noop,onPause:noop,onChange:noop,onError:noop,audio:false,onAudio:noop}));
}

describe('四条出身的初识',()=>{
 it.each(['arrival','worker','heir','system'] as const)('%s introduces one person before the mission and recalls either meeting at nineteen',route=>{
  const state=reload(start(route)),prologue=PROLOGUES[route];
  const opening=episodeOffer(state)!;
  const firstPage=stage(state);
  for(const text of [prologue.title,prologue.speaker,prologue.role,'阿黎','十八岁'])expect(firstPage).toContain(text);
  expect(existsSync('public'+prologue.photo)).toBe(true);
  expect(firstPage).not.toContain('data-pj-start');
  expect(existsSync('public/art/prologue/'+route+'-actor.webp')).toBe(true);
  const question=reload(advancePrologue(state,'meet'));
  for(const choice of prologue.choices){
   const chosen=reload(advancePrologue(question,choice.id));
   expect(stage(chosen)).toContain(choice.reply);
   expect(chosen.actions).toBe(state.actions);
   expect(chosen.cash).toBe(state.cash);
   expect(chosen.relationships[prologue.personId].met).toBe(true);
   expect(chosen.relationships[prologue.personId].memories).toContain(choice.memory);
   expect(chosen.journal.at(-1)?.text).toBe(choice.reply);
   expect(advancePrologue(chosen,choice.id)).toBe(chosen);
   const offer=reload(advancePrologue(chosen,'ask'));
   for(const parting of prologue.partings){
    const departure=reload(advancePrologue(offer,parting.id));
    const contact=departure.relationships[prologue.personId];
    expect(contact.trust).toBe(chosen.relationships[prologue.personId].trust+(parting.id==='stay'?3:0));
    expect(advancePrologue(departure,parting.id)).toBe(departure);
    const scene=openingScene(route,departure.flags);
    expect(scene.history.map(beat=>beat.choice).filter(Boolean)).toEqual([choice.label,parting.label]);
    expect(scene.current.line).toBe(parting.line);
    const ready=reload(advancePrologue(departure,'leave'));
    expect(stage(ready)).toContain('data-pj-start');
    const inScene=reload(startEpisode(ready,opening.id));
    expect(stage(inScene)).toContain('data-pj-choice');
    expect(episodeView(inScene)!.budget).toBe(opening.budget+(parting.id==='prepare'?1:0));
    const nextYear={...ready,age:19};
    const text=route==='system'?episodeCarry(nextYear,episodeOffer(nextYear)!).join(' '):pujiangYear(nextYear)?.text;
    expect(text).toContain(choice.nextYear);
    expect(text).not.toContain(prologue.choices.find(c=>c!==choice)!.nextYear);
   }
  }
 });
 it('preserves partial choices on skip, ignores out-of-order actions and resumes old saves at the briefing',()=>{
  const state=start('arrival');
  expect(advancePrologue(state,'bowl')).toBe(state);
  const question=advancePrologue(state,'meet');
  expect(advancePrologue(question,'glove')).toBe(question);
  const skipped=advancePrologue(question,'skip');
  expect(stage(skipped)).toContain('data-pj-start');
  expect(skipped.relationships.mao).toEqual(state.relationships.mao);
  const chosen=advancePrologue(question,'bowl');
  expect(advancePrologue(chosen,'skip').relationships.mao.memories).toContain(PROLOGUES.arrival.choices[1].memory);
  const old=reload({...state,flags:state.flags.filter(f=>f!==PROLOGUE_PENDING)});
  expect(stage(old)).not.toContain('data-mode="prologue"');
  expect(advancePrologue(old,'meet')).toBe(old);
 });
 it('introduces the repairman when he steps into the second scene',()=>{
  const state=start('system'),opening=episodeOffer(state)!;
  expect(cinemaRelationships(state,opening,[],0).some(p=>p.name==='周闻')).toBe(false);
  expect(cinemaRelationships(state,opening,[],1).some(p=>p.name==='周闻')).toBe(true);
 });
});
