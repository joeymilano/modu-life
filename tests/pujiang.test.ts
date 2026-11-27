import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { ABILITIES, abilityPoints, beginPujiangLife, episodeOffer, episodeView, equipAbility, gambleChance, learnAbility, leaveEpisode, pujiangEnding, rollLuck, startEpisode, systemLevel, STALL } from '../src/game/pujiang';
import { COMMISSIONS, OPENING_EPISODES, PUJIANG_EPISODES, SYSTEM_EPISODES } from '../src/game/pujiangScript';
import { advanceToStory, allOrigins, createGame, drawOrigins, ending, nextYear, playPujiangMove, resolveChoice, routineEvent, selectEvent, validateSave } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordEpisodeDecision, startBook, updateLife } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { lineDivergence } from '../src/game/lineComparison';
import { openingForecast } from '../src/game/openingForecast';
import { storyShowdownOffer } from '../src/game/storyShowdown';
import { weeklyShowdown } from '../src/game/ranked';
import { playShowdown, showdownView } from '../src/game/showdowns';
import type { GameState } from '../src/game/types';
import type { EpisodeScript, PujiangEnding, PujiangRoute } from '../src/game/pujiangTypes';

function fresh(route:PujiangRoute='system'){
 const start=LIFE_STARTS.find(s=>s.id===(route==='worker'?'daywork':route));
 const cards=start?start.cards.map(id=>allOrigins().find(c=>c.id===id)!):drawOrigins('PJ-ARRIVAL');
 return beginPujiangLife(createGame('PJ-ACCEPT','小申','free',cards));
}
function paths(s:GameState):{state:GameState;choices:string[]}[]{
 if(s.episode?.receipt)return [{state:s,choices:[]}];
 return episodeView(s).choices.filter(c=>!c.disabled).flatMap(c=>paths(playPujiangMove(s,{kind:'choice',id:c.id})).map(p=>({...p,choices:[c.id,...p.choices]})));
}
function settle(s:GameState,win=true,final?:PujiangEnding){
 const all=paths(startEpisode(s,episodeOffer(s)!.id));
 const candidates=final?all.filter(p=>p.state.episode!.receipt!.ending===final):all;
 const chosen=win?candidates.find(p=>p.state.episode!.receipt!.verdict==='win')??candidates[0]:candidates.find(p=>p.state.episode!.receipt!.verdict==='loss')??candidates.at(-1)!;
 return leaveEpisode(chosen.state);
}
function clearAnnual(s:GameState){
 for(let i=0;s.pendingYearEvent&&i<10;i++){
  const e=selectEvent(s,'year'),c=e.choices.find(c=>(c.effect.cash??0)>=0)!;
  s=resolveChoice(s,e,c.id).state;
 }
 return s;
}
function toNext(s:GameState,train=true){
 s=clearAnnual(s);
 if(train)while(s.actions>0)s=resolveChoice(s,routineEvent(s,'learn'),'practice').state;
 return nextYear(s).state;
}
function through(final:PujiangEnding='together',win=true){
 let s=fresh();
 for(let age=18;age<=25;age++){
  expect(s.age).toBe(age);expect(episodeOffer(s)?.id).toBe('pj-system-'+age);
  s=settle(s,win,age===25?final:undefined);
  s=validateSave(JSON.parse(JSON.stringify(s)));
  if(age<25)s=toNext(s);
 }
 return s;
}

describe('浦江破局：四线与八章',()=>{
 it('offers two winning approaches per chapter and can earn all three successful finales',()=>{
  let s=fresh();
  for(let age=18;age<25;age++){
   const wins=paths(startEpisode(s,episodeOffer(s)!.id)).filter(p=>p.state.episode!.receipt!.verdict==='win');
   expect(new Set(wins.map(p=>p.choices.at(-1))).size,`age ${age}`).toBeGreaterThanOrEqual(2);
   wins.sort((a,b)=>b.state.relationships['pj-xu'].trust-a.state.relationships['pj-xu'].trust);
   s=toNext(leaveEpisode(wins[0].state));
  }
  const finals=paths(startEpisode(s,'pj-system-25')).filter(p=>p.state.episode!.receipt!.verdict==='win');
  expect(new Set(finals.map(p=>p.state.episode!.receipt!.ending))).toEqual(new Set(['independent','together','leave']));
 });
 it.each(['arrival','worker','heir','system'] as const)('%s opens with distinct wins and a playable loss',route=>{
  const initial=fresh(route),before=initial.actions;
  const all=paths(startEpisode(initial,episodeOffer(initial)!.id));
  expect(all.filter(p=>p.state.episode!.receipt!.verdict==='win').length).toBeGreaterThanOrEqual(2);
  expect(all.some(p=>p.state.episode!.receipt!.verdict==='loss')).toBe(true);
  for(const p of all){expect(p.state.actions).toBe(before);expect(validateSave(p.state).episode?.receipt).toBeDefined();}
  expect(storyShowdownOffer(initial,true)).toBeUndefined();
  if(route==='heir')expect(Math.min(...all.map(p=>p.state.cash))).toBeGreaterThan(59_000_000);
 });
 it.each(['independent','together','leave'] as const)('reaches %s and continues to age60',final=>{
  let s=through(final);expect(pujiangEnding(s)).toBe(final);expect(systemLevel(s)).toBe(5);expect(abilityPoints(s)).toBe(9);
  expect(s.systemProgress!.rewardCash).toBeLessThanOrEqual(3_000_000);
  while(s.age<60)s=toNext(s,false);
  expect(s.ended).toBe(true);expect(ending(s).title).toBe({independent:'独立掌舵',together:'合伙共营',leave:'带人退出'}[final]);
  expect(s.seenEvents).not.toContain('campaign-system-57');
  expect(s.seenEvents).toContain('pj-after-57');
 });
 it('continues after repeated losses, with no abilities and no cash',()=>{
  let s=fresh();s.cash=0;
  for(let age=18;age<=25;age++){
   s=settle(s,false,age===25?'leave':undefined);
   expect(abilityPoints(s)).toBe(age-16);
   if(age<25)s=toNext(s,false);
  }
  expect(s.age).toBe(25);expect(s.systemProgress?.learned).toEqual([]);
 });
 it('does not skip an unfinished episode with annual settlement or fast forward',()=>{
  let s=fresh();expect(()=>nextYear(s)).toThrow('章节');expect(()=>advanceToStory(s)).toThrow('章节');
  s=settle(s);s=clearAnnual(s);const next=advanceToStory(s).state;
  expect(next.age).toBe(19);expect(episodeOffer(next)?.id).toBe('pj-system-19');
 });
 it('preserves the 19-year promise as a real reserve in the 23-year showdown',()=>{
  let s=toNext(settle(fresh('worker')),false);const e=selectEvent(s,'year');
  expect(e.id).toBe('pj-return-worker');s=resolveChoice(s,e,'keep').state;
  expect(storyShowdownOffer({...s,age:23})?.backup).toBe(true);
  const failed=toNext(settle(fresh('worker'),false),false),retry=selectEvent(failed,'year');
  expect(retry.choices[0].effect.trust).toBeLessThan(e.choices[0].effect.trust!);
 });
 it('lets the heir win a trial order under their own name and fulfil it on the next visit',()=>{
  const initial=fresh('heir');
  let s=startEpisode(initial,'pj-heir-18');
  s=playPujiangMove(s,{kind:'choice',id:'carry'});
  s=validateSave(JSON.parse(JSON.stringify(s)));
  s=playPujiangMove(s,{kind:'choice',id:'test-switch'});
  s=playPujiangMove(s,{kind:'choice',id:'sign-sample'});
  expect(s.episode?.receipt?.verdict).toBe('win');
  expect(s.cash).toBe(initial.cash);
  expect(s.flags).toContain('pj-heir-blind-order');
  const next=toNext(leaveEpisode(s),false),event=selectEvent(next,'year');
  expect(event.title).toBe('三楼那十盏灯');
  const repaired=resolveChoice(next,event,'keep').state,paid=resolveChoice(next,event,'change').state;
  expect(storyShowdownOffer({...repaired,age:23})?.backup).toBe(true);
  expect(storyShowdownOffer({...paid,age:23})?.backup).toBe(false);
  expect(repaired.stats.skill).toBeGreaterThan(paid.stats.skill);
  expect(repaired.cash-paid.cash).toBe(12000);
 });
 it('keeps the sample-order finish gated and preserves the original public takeover route',()=>{
  let s=startEpisode(fresh('heir'),'pj-heir-18');
  s=playPujiangMove(s,{kind:'choice',id:'identity'});
  expect(episodeView(s).choices.find(c=>c.id==='test-switch')?.disabled).toBeTruthy();
  s=playPujiangMove(s,{kind:'choice',id:'demo'});
  expect(()=>playPujiangMove(s,{kind:'choice',id:'sign-sample'})).toThrow();
  s=playPujiangMove(s,{kind:'choice',id:'lead'});
  expect(s.episode?.receipt?.verdict).toBe('win');
  expect(s.flags).not.toContain('pj-heir-blind-order');
  expect(selectEvent(toNext(leaveEpisode(s),false),'year').title).toBe('酒桌之后，客户来了');
 });
 it('previews the same new opening that the hand actually launches',()=>{
  const s=fresh();const preview=openingForecast(s.seed,s.origins.map(id=>allOrigins().find(c=>c.id===id)!),s.goal,s.appearance,true);
  expect(preview.story?.event.id).toBe(episodeOffer(s)?.id);
 });
 it('uses complete, period-appropriate scenes and available art',()=>{
  expect(OPENING_EPISODES).toHaveLength(3);expect(SYSTEM_EPISODES).toHaveLength(8);expect(COMMISSIONS).toHaveLength(6);
  expect(new Set(PUJIANG_EPISODES.map(e=>e.id)).size).toBe(PUJIANG_EPISODES.length);
  for(const e of PUJIANG_EPISODES){
   expect(existsSync(new URL('../public'+e.photo,import.meta.url))).toBe(true);
   expect(e.scenes.length).toBe(e.commission?2:3);
   expect(new Set(e.scenes.map(s=>s.title)).size).toBe(e.scenes.length);
   expect(JSON.stringify(e)).not.toMatch(/微信|直播间|热搜|智能手机|扫码支付/);
  }
 });
});

describe('能力、关系与奖励',()=>{
 it('pays double for exclusive delivery compared with a successful shared contract',()=>{
  let s=toNext(settle(fresh()));s.relationships['pj-xu'].trust=40;
  const results=paths(startEpisode(s,'pj-system-19'));
  const solo=results.find(p=>p.choices.at(-1)==='own'&&p.state.episode!.receipt!.verdict==='win')!.state.episode!.receipt!;
  const team=results.find(p=>p.choices.at(-1)==='partners'&&p.state.episode!.receipt!.verdict==='win')!.state;
  expect(solo.cash).toBe(team.episode!.receipt!.cash*2);
  const next=toNext(leaveEpisode(team));
  expect(episodeView(startEpisode(next,'pj-system-20')).choices.find(c=>c.id==='team')?.disabled).toBeUndefined();
 });
 it('uses insight, forecast, borrowed expertise, fusion, assistance and resonance as different operations',()=>{
  let s=through();
  for(const a of ABILITIES)s=learnAbility(s,a.id);
  for(const id of [...s.systemProgress!.equipped])s=equipAbility(s,id);
  s=equipAbility(equipAbility(s,'insight'),'forecast');s=clearAnnual(s);
  let run=startEpisode(s,COMMISSIONS[0].id);
  run=playPujiangMove(run,{kind:'ability',id:'insight'});expect(episodeView(run).secret).toBeTruthy();
  expect(()=>playPujiangMove(run,{kind:'ability',id:'insight'})).toThrow();
  expect(()=>playPujiangMove(run,{kind:'ability',id:'forecast'})).toThrow('指定');
  run=playPujiangMove(run,{kind:'ability',id:'forecast',target:'practical'});expect(episodeView(run).choices.filter(c=>c.preview)).toHaveLength(1);
  expect(()=>equipAbility(run,'borrow')).toThrow();expect(()=>learnAbility(run,'borrow')).toThrow();
  const basic=learnAbility(fresh(),'borrow');
  let first=startEpisode(basic,'pj-system-18');
  expect(episodeView(first).choices.find(c=>c.id==='wire')?.disabled).toBeTruthy();
  first=playPujiangMove(first,{kind:'ability',id:'borrow'});
  expect(episodeView(first).choices.find(c=>c.id==='wire')?.disabled).toBeUndefined();
  const assist=learnAbility(fresh(),'seek');let help=startEpisode(assist,'pj-system-18');help=playPujiangMove(help,{kind:'ability',id:'seek'});
  expect(episodeView(help)).toMatchObject({team:1,budget:3});
  s=equipAbility(equipAbility(s,'insight'),'forecast');s=equipAbility(equipAbility(s,'combine'),'resonate');
  s.relationships['pj-wen'].trust=35;
  let team=startEpisode(s,COMMISSIONS[0].id);team=playPujiangMove(team,{kind:'ability',id:'combine'});expect(episodeView(team).budget).toBe(2);
  team=playPujiangMove(team,{kind:'ability',id:'resonate',target:'team'});expect(episodeView(team).team).toBe(2);
  const dispatched=playPujiangMove(startEpisode(s,COMMISSIONS[0].id),{kind:'ability',id:'resonate',target:'dispatch'});expect(episodeView(dispatched)).toMatchObject({team:1,budget:2});
 });
 it('makes the rival respond to previously shown abilities and disables powers in chapter6',()=>{
  let s=fresh();s=learnAbility(s,'insight');s=startEpisode(s,'pj-system-18');s=playPujiangMove(s,{kind:'ability',id:'insight'});
  s=leaveEpisode(paths(s).find(p=>p.state.episode!.receipt!.verdict==='win')!.state);
  for(let age=19;age<=20;age++)s=settle(toNext(s));
  s=toNext(s);s=learnAbility(s,'borrow');
  let known=startEpisode(s,'pj-system-21');expect(episodeView(known).choices.find(c=>c.id==='habit')?.score).toBe(0);
  s=equipAbility(s,'insight');known=startEpisode(s,'pj-system-21');expect(episodeView(known).choices.find(c=>c.id==='habit')?.score).toBe(3);
  s=settle(s);s=settle(toNext(s));s=toNext(s);const offline=startEpisode(s,'pj-system-23');
  expect(episodeView(offline).abilities.every(a=>a.reason==='本章异能离线')).toBe(true);
  expect(()=>playPujiangMove(offline,{kind:'ability',id:'borrow'})).toThrow();
  expect(paths(offline).some(p=>p.state.episode!.receipt!.verdict==='win')).toBe(true);
  const won=toNext(leaveEpisode(paths(offline).find(p=>p.state.episode!.receipt!.verdict==='win')!.state));
  expect(episodeView(startEpisode(won,'pj-system-24')).budget).toBe(4);
  const lost=toNext(leaveEpisode(paths(offline).find(p=>p.state.episode!.receipt!.verdict==='loss')!.state));
  expect(episodeView(startEpisode(lost,'pj-system-24')).budget).toBe(3);
 });
 it('carries a harmed relationship into a locked aid route, without blocking ordinary choices',()=>{
  let s=through();s.age=23;s.ended=false;s.seenEvents=s.seenEvents.filter(id=>id!=='pj-system-23');
  s.flags.push('pj-xu-left');s.relationships['pj-xu'].trust=5;
  let run=startEpisode(s,'pj-system-23');run=playPujiangMove(run,{kind:'choice',id:'assign'});
  expect(episodeView(run).choices.find(c=>c.id==='call')?.disabled).toBeTruthy();
  expect(episodeView(run).choices.find(c=>c.id==='prioritize')?.disabled).toBeUndefined();
 });
 it('charges a commission once, caps rewards and rejects replayed settlements',()=>{
  let s=clearAnnual(settle(fresh()));s.systemProgress!.rewardCash=2_999_995;
  const before=s.actions;let run=startEpisode(s,COMMISSIONS[0].id);expect(run.actions).toBe(before-1);
  run=paths(run).find(p=>p.state.episode!.receipt!.verdict==='win')!.state;
  expect(run.episode!.receipt!.cash).toBe(5);expect(run.systemProgress!.rewardCash).toBe(3_000_000);
  const restored=validateSave(JSON.parse(JSON.stringify(run)));expect(()=>playPujiangMove(restored,{kind:'choice',id:'finish'})).toThrow();
  expect(()=>startEpisode(leaveEpisode(restored),COMMISSIONS[0].id)).toThrow();
 });
});

describe('存档、分叉与排位隔离',()=>{
 it('compares the actual forked scene when several acts share a chapter id',()=>{
  let state=startEpisode(fresh(),'pj-system-18'),book=startBook(state);
  for(const id of ['acoustic','host','solo']){
   state=playPujiangMove(state,{kind:'choice',id});book=recordEpisodeDecision(book,state,id);
  }
  const fork=forkLife(book,2),before=activeLine(fork).state;
  const changed=recordEpisodeDecision(fork,playPujiangMove(before,{kind:'choice',id:'share'}),'share');
  const diff=lineDivergence(changed.lines[0],changed.lines[1]);
  expect(diff?.left.title).toBe('八万，写谁的名字');
  expect(diff?.left.choice).toContain('负责人');expect(diff?.right.choice).toContain('共同贡献');
  expect(book.lines[0].state.cash).toBe(state.cash);
 });
 it('round trips an in-progress ability use and forks without sharing rewards or charges',()=>{
  let state=learnAbility(fresh(),'borrow');state=startEpisode(state,'pj-system-18');state=playPujiangMove(state,{kind:'ability',id:'borrow'});
  let book=startBook(state);const next=playPujiangMove(state,{kind:'choice',id:'wire'});book=recordEpisodeDecision(book,next,'wire');
  const restored=decodeLife(JSON.parse(JSON.stringify(encodeLife(book))));expect(activeLine(restored).state.episode!.moves).toHaveLength(2);
  const fork=forkLife(restored,0);const alternate=activeLine(fork).state;
  expect(alternate.episode!.moves).toHaveLength(1);expect(episodeView(alternate).abilities[0].reason).toBe('本场已使用');
  const changed=playPujiangMove(alternate,{kind:'choice',id:'acoustic'});
  expect(activeLine(updateLife(fork,changed)).state.episode!.moves.at(-1)?.id).toBe('acoustic');
  expect(fork.lines[0].state.episode!.moves.at(-1)?.id).toBe('wire');
 });
 it('keeps old saves and old confrontations on legacy rules, only defaulting new contacts',()=>{
  const old=createGame('OLD','小申','free',drawOrigins('OLD'));
  for(const id of ['pj-gu','pj-wen','pj-xu'])delete old.relationships[id];
  const restored=validateSave(old);expect(restored.storyEdition).toBeUndefined();expect(episodeOffer(restored)).toBeUndefined();
  expect(old.relationships['pj-xu']).toBeUndefined();
  expect(selectEvent(restored,'year').id).not.toMatch(/^pj-/);expect(restored.relationships['pj-xu'].trust).toBe(15);
  const broken=structuredClone(restored);delete broken.relationships.mao;expect(()=>validateSave(broken)).toThrow();
 });
 it('rejects invalid progress, unlearned equipment and malformed scene moves',()=>{
  const s=fresh();expect(()=>validateSave({...s,systemProgress:{learned:[],equipped:['forecast'],rewardCash:0}})).toThrow();
  expect(()=>validateSave({...s,seenEvents:['pj-system-25']})).toThrow();
  const run=startEpisode(s,'pj-system-18');expect(()=>validateSave({...run,episode:{...run.episode,moves:[{kind:'choice',id:'solo'}]}})).toThrow();
 });
 it('does not change weekly duel scoring when narrative abilities are upgraded',()=>{
  const weekly=weeklyShowdown('2026-11-16','system');
  const result=['proof','verify','expose'].reduce(playShowdown,weekly);
  expect(showdownView(result)).toMatchObject({verdict:'win',score:80});
  expect(weeklyShowdown('2026-11-16','system')).toEqual(weekly);
 });
});

describe('抢话、赌局与读数',()=>{
 it('lets the other side cut in when the clock runs out, and never counts that as a finish',()=>{
  let s=startEpisode(fresh('worker'),'pj-worker-18');
  for(const id of ['night','sort'])s=playPujiangMove(s,{kind:'choice',id});
  s=playPujiangMove(s,{kind:'choice',id:STALL});
  // Four 气势 were banked, but the last word was taken: the chapter settles short of a win.
  expect(s.episode?.receipt?.verdict).toBe('partial');
  expect(validateSave(JSON.parse(JSON.stringify(s))).episode?.moves.at(-1)?.id).toBe(STALL);
  let early=playPujiangMove(startEpisode(fresh('worker'),'pj-worker-18'),{kind:'choice',id:STALL});
  early=playPujiangMove(early,{kind:'choice',id:'sort'});
  expect(episodeView(early).choices.find(c=>c.id==='crew')!.disabled).toBe('气势达到 4');
  const run=startEpisode(fresh('worker'),'pj-worker-18'),book=startBook(run);
  const stalled=playPujiangMove(run,{kind:'choice',id:STALL});
  // Being cut in on is not a decision to branch from.
  expect(recordEpisodeDecision(book,stalled,STALL).lines[0].points).toHaveLength(0);
  expect(()=>recordEpisodeDecision(book,playPujiangMove(run,{kind:'choice',id:'night'}),'night')).not.toThrow();
 });
 it('settles a gamble from the save seed and writes the roll into the move',()=>{
  const first=playPujiangMove(startEpisode(fresh('worker'),'pj-worker-18'),{kind:'choice',id:'night'});
  const bet=playPujiangMove(first,{kind:'choice',id:'bet'});
  const luck=bet.episode!.moves.at(-1)!.luck;
  expect(['hit','miss']).toContain(luck);
  const view=episodeView(bet);
  expect(view.score).toBe(luck==='hit'?5:2);
  expect(view.budget).toBe(luck==='hit'?2:1);
  expect(view.flags.includes('bet-missed')).toBe(luck==='miss');
  expect(validateSave(JSON.parse(JSON.stringify(bet))).episode?.moves.at(-1)?.luck).toBe(luck);
  // The same question in the same life always lands the same way, whatever the player knows.
  expect(rollLuck(first,view.script,1,'bet')).toBe(luck);
  expect(rollLuck({...first,seed:'ANOTHER-LIFE'},view.script,1,'bet')).toBeDefined();
  const chance=gambleChance(first,view.script.scenes[1].choices.find(c=>c.id==='bet')!);
  expect(chance).toBeGreaterThanOrEqual(25);
  expect(chance).toBeLessThanOrEqual(90);
  expect(gambleChance({...first,stats:{...first.stats,health:100}},view.script.scenes[1].choices.find(c=>c.id==='bet')!)).toBeGreaterThanOrEqual(chance!);
  const forged=structuredClone(bet);
  forged.episode!.moves.at(-1)!.luck='heads' as 'hit';
  expect(()=>validateSave(forged)).toThrow();
 });
 it('names the meters the way the stage shows them, and says what a locked option still needs',()=>{
  const view=episodeView(startEpisode(fresh('worker'),'pj-worker-18'));
  expect(view.choices.find(c=>c.id==='shuttle')!.gain).toBe('人心 +2 · 底牌 -1');
  expect(view.choices.find(c=>c.id==='night')!.gain).toBe('气势 +2 · 吴师傅信任 +6');
  expect(view.choices.find(c=>c.id==='echo')!.disabled).toBe('先在序章里顶回去');
  let s=playPujiangMove(startEpisode(fresh('worker'),'pj-worker-18'),{kind:'choice',id:'self'});
  s=playPujiangMove(s,{kind:'choice',id:'swap'});
  const last=episodeView(s).choices;
  expect(last.find(c=>c.id==='route')!.disabled).toBe('人心达到 4，或已安排短驳');
  expect(last.find(c=>c.id==='crew')!.tag).toBe('终结技');
 });
 it('puts the clock on every main chapter and leaves commissions and prologues untimed',()=>{
  for(const script of [...OPENING_EPISODES,...SYSTEM_EPISODES])expect(script.pressure,script.id).toBeGreaterThanOrEqual(15);
  for(const script of COMMISSIONS)expect(script.pressure).toBe(0);
 });
});
