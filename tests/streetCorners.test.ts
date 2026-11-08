import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { CORNER_DISTRICTS, cornerCashDue, cornerCount, cornerEvidence, streetCorner } from '../src/game/streetCorners';
import { ticketFromHash, validateTicket, walk } from '../src/game/timelines';
import type { DistrictId, GameState } from '../src/game/types';

const life = (district: DistrictId): GameState => ({
 ...createGame('WALK','小申','free',drawOrigins('WALK')),
 district,age:26,cash:70_000,pendingYearEvent:false,
});
const older = (s: GameState) => ({...s,age:s.age+1,actions:3});

describe('walk-up stories', () => {
 it.each(CORNER_DISTRICTS)('unlocks the object and counts its visit once in %s',district=>{
  const start=life(district);
  expect(streetCorner({...start,actions:0})).toBeUndefined();
  expect(streetCorner({...start,pendingYearEvent:true})).toBeUndefined();
  const event=streetCorner(start)!;
  expect(event.illustration).toBe('/art/corners/'+district+'-prop.webp');
  const result=resolveChoice(start,event,event.choices[0].id).state;
  expect(result.actions).toBe(2);
  expect(cornerCount(result)).toBe(1);
  expect(streetCorner(result)).toBeUndefined();
  expect(result.relationships[event.speakerId!].met).toBe(true);
 });
 it('keeps exhibition wages out of cash until the follow-up and restores the choice on a fork',()=>{
  const start=life('lujiazui');
  const event=streetCorner(start)!;
  const quick=resolveChoice(start,event,'go').state;
  expect(quick.cash-start.cash).toBe(300);
  expect(cornerCashDue(quick)).toBe(180);
  const followup=streetCorner(older(quick))!;
  expect(followup.text).toContain('还差你一百八');
  const paid=resolveChoice(older(quick),followup,'all').state;
  expect(paid.cash-start.cash).toBe(480);
  expect(cornerCashDue(paid)).toBe(0);
  expect(streetCorner(older(paid))).toBeUndefined();
  const original=recordDecision(startBook(start),quick,event,'go');
  const branched=activeLine(forkLife(decodeLife(encodeLife(original)),0));
  expect(replayScene(branched.state,branched.replay!)).toEqual(event);
  const signed=resolveChoice(branched.state,event,'sign').state;
  expect(signed.cash-start.cash).toBe(480);
  expect(cornerCashDue(signed)).toBe(0);
  expect(streetCorner(older(signed))?.text).toContain('工钱印在最上头');
 });
 it('keeps the meter evidence and the refund on the correct branches',()=>{
  const start=life('xinzhuang');
  const event=streetCorner(start)!;
  expect(cornerEvidence(event.id)?.choiceId).toBe('show');
  const advanced=resolveChoice(start,event,'pay').state;
  expect(advanced.cash-start.cash).toBe(-45);
  const revisit=streetCorner(older(advanced))!;
  expect(resolveChoice(older(advanced),revisit,'leave').state.cash).toBe(start.cash);
  expect(resolveChoice(older(advanced),revisit,'lamp').state.cash).toBe(advanced.cash);
  const photographed=resolveChoice(start,event,'show').state;
  expect(photographed.cash).toBe(start.cash);
  expect(streetCorner(older(photographed))?.text).toContain('表号还贴在物业底账');
 });
 it('retains the different coffee returns in the standalone ticket',()=>{
  const {timeline}=validateTicket(ticketFromHash('#story=queue-cup')!);
  expect(timeline.turns[walk(timeline,[{pick:0}]).next!].scene).toContain('只找出你一只手');
  expect(timeline.turns[walk(timeline,[{pick:1}]).next!].scene).toContain('把椅子留在门口');
  const done=walk(timeline,[{pick:1},{pick:0}]);
  expect(done.next).toBeNull();
  expect(done.steps.at(-1)?.option.shot).toBe('/art/corners/anfu-return.webp');
 });
});
