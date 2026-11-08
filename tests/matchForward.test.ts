import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { forwardClue, MATCH_RELAY } from '../src/game/matchForward';
import { parkPaperClue, parkVisit } from '../src/game/matchmaking';
import { ticketFromHash, validateTicket, walk } from '../src/game/timelines';
import type { GameState } from '../src/game/types';

const fresh = (): GameState => ({
 ...createGame('PAPER','小申','free',drawOrigins('PAPER')),
 district:'people',housing:1,age:18,cash:120000,pendingYearEvent:false,
});
const yearLater = (s: GameState): GameState => ({...s,age:s.age+1,actions:3,pendingYearEvent:false});
const choose = (s: GameState,id: string) => resolveChoice(s,parkVisit(s)!.event,id).state;

function paperStart(path: 'list'|'relay'|'edit'|'fold') {
 const before=fresh();
 const first=choose(before,path);
 const second=choose(first,path==='edit'?'practice':path==='fold'?'hang':'talk');
 const next=yearLater(second);
 const visited=choose(next,path==='edit'?'shift':path==='fold'?'table':'measure');
 expect(parkVisit(visited)).toBeNull();
 return yearLater(visited);
}

describe('forwarded matchmaking papers',()=>{
 it('keeps the relay number private and does not publish a folded paper',()=>{
  expect(parkPaperClue(parkVisit(fresh())!.event.id)?.choiceId).toBe('relay');
  const relay=paperStart('relay');
  expect(relay.flags).toContain(MATCH_RELAY);
  const scene=parkVisit(relay)!.event;
  expect(scene.text).toContain('纸上也没写门牌');
  expect(scene.text).not.toContain('陌生人打电话');
  const clue=forwardClue(scene.id,relay)!;
  expect(clue.papers[0].value).toContain('先问汪阿姨');
  expect(clue.text).toContain('没留你的号码');
  expect(parkVisit(paperStart('fold'))).toBeNull();
  expect(parkVisit({...relay,pendingYearEvent:true})).toBeNull();
 });

 it('uses the cropped trial application and an age-appropriate still',()=>{
  const before=paperStart('edit');
  const scene=parkVisit(before)!.event;
  expect(scene.illustration).toBe('/art/matchmaking/forward-resume.webp');
  expect(forwardClue(scene.id,before)?.papers[0].value).toContain('申请社区活动室');
  const answered=resolveChoice(before,scene,'reply').state;
  expect(parkVisit(answered)).toBeNull();
  expect(parkVisit(yearLater(answered))?.event.title).toBe('馄饨那条还作数伐');
  expect(parkVisit({...before,age:48})?.event.illustration).toBe('/art/matchmaking/forward-later.webp');
  expect(parkVisit({...answered,age:48})?.event.illustration).toBe('/art/matchmaking/forward-wonton-later.webp');
 });

 it('replays the same original screenshot and keeps the eventual payout on its branch',()=>{
  const before=paperStart('list');
  const scene=parkVisit(before)!.event;
  expect(scene.text).toContain('陌生人打电话');
  const replaced=resolveChoice(before,scene,'replace').state;
  expect(replaced.actions).toBe(before.actions-1);
  expect(parkVisit(yearLater(replaced))?.event.title).toBe('蓝夹子还给你');
  const fork=activeLine(forkLife(decodeLife(encodeLife(recordDecision(startBook(before),replaced,scene,'replace'))),0));
  expect(replayScene(fork.state,fork.replay!)).toEqual(scene);
  const traced=resolveChoice(fork.state,scene,'trace').state;
  const later=yearLater(traced);
  const next=parkVisit(later)!.event;
  expect(next.title).toBe('复印店还剩一摞旧版');
  const paid=resolveChoice(later,next,'shift').state;
  expect(paid.cash-later.cash).toBe(260);
  expect(paid.jobId).toBe(later.jobId);
  expect(parkVisit(yearLater(paid))).toBeNull();
 });

 it('opens three different closing photos in the public short',()=>{
  const {timeline}=validateTicket(ticketFromHash('#story=paper-forward'));
  for (const [route,shot] of [
   [[1,1],'forward-stall'],[[0,0,0],'forward-copy'],[[0,1,1],'forward-wonton'],
  ] as const) {
   const steps=walk(timeline,route.map(pick=>({pick})));
   expect(steps.next).toBeNull();
   expect(steps.steps.at(-1)?.option.shot).toBe('/art/matchmaking/'+shot+'.webp');
  }
 });
});
