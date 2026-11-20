import { describe,expect,it } from 'vitest';
import { existsSync,statSync } from 'node:fs';
import { CINEMA_ART,CINEMA_BEATS,CINEMA_CONTACTS,cinemaBeat,cinemaRelationships } from '../src/game/pujiangCinema';
import { OPENING_EPISODES,SYSTEM_EPISODES } from '../src/game/pujiangScript';
import { beginPujiangLife,episodeView,startEpisode } from '../src/game/pujiang';
import { allOrigins,createGame,playPujiangMove } from '../src/game/engine';
import { LIFE_STARTS } from '../src/game/lifeStarts';

function fresh(){
 const cards=LIFE_STARTS.find(s=>s.id==='system')!.cards.map(id=>allOrigins().find(c=>c.id===id)!);
 return beginPujiangLife(createGame('CINEMA','小申','free',cards));
}
describe('cinematic chapter presentation',()=>{
 it('covers all 33 main-story acts with available, bounded assets',()=>{
  let count=0;
  for(const script of [...OPENING_EPISODES,...SYSTEM_EPISODES]){
   expect(CINEMA_BEATS[script.id]).toHaveLength(script.scenes.length);
   for(let stage=0;stage<script.scenes.length;stage++){
    const shot=cinemaBeat(script,stage);count++;
    expect(existsSync('public'+CINEMA_ART[shot.art])).toBe(true);
    expect(shot.line.length).toBeLessThan(38);
    expect(shot.observation).not.toEqual(script.scenes[stage].secret);
   }
  }
  expect(count).toBe(33);
  expect(Object.values(CINEMA_ART).reduce((n,path)=>n+statSync('public'+path).size,0)).toBeLessThan(1_200_000);
 });
 it('previews trust earned during play without changing the save',()=>{
  const s=playPujiangMove(startEpisode(fresh(),'pj-system-18'),{kind:'choice',id:'cargo'});
  const snapshot=JSON.stringify(s),view=episodeView(s);
  const xu=cinemaRelationships(s,view.script,view.relations).find(p=>p.id==='pj-xu')!;
  expect(xu.delta).toBe(8);expect(xu.trust).toBe(s.relationships['pj-xu'].trust+8);
  expect(JSON.stringify(s)).toBe(snapshot);
 });
 it('reads settled trust exactly once after refresh',()=>{
  let s=startEpisode(fresh(),'pj-system-18');
  for(const id of ['cargo','explain','share'])s=playPujiangMove(s,{kind:'choice',id});
  expect(s.episode?.receipt).toBeDefined();
  const restored=JSON.parse(JSON.stringify(s));
  const xu=cinemaRelationships(restored,SYSTEM_EPISODES[0]).find(p=>p.id==='pj-xu')!;
  expect(xu.trust).toBe(s.relationships['pj-xu'].trust);expect(xu.delta).toBe(0);
 });
 it('keeps final scene art available after the final move',()=>{
  for(const script of [...OPENING_EPISODES,...SYSTEM_EPISODES])expect(cinemaBeat(script,script.scenes.length)).toBe(cinemaBeat(script,script.scenes.length-1));
  for(const portrait of Object.values(CINEMA_CONTACTS))expect(existsSync('public'+CINEMA_ART[portrait.art])).toBe(true);
 });
});
