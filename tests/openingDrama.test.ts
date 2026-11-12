import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, resolveChoice, selectEvent } from '../src/game/engine';
import { firstNightLead } from '../src/game/firstNight';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { campaignYear } from '../src/game/lifeCampaign';
import { OPENING_ALLIES, OPENING_DRAMA, OPENING_PROOF } from '../src/game/openingStakes';
import { streetLead } from '../src/game/streetLeads';

const randomLife = () => createGame('DRAMA','小申','free',drawOrigins('DRAMA'));
const chapter = (state: ReturnType<typeof randomLife>, age: number) => ({...state,age,pendingYearEvent:true});

describe('direct openings and lasting consequences',()=>{
 it.each([
  ['1','first-night-keys','2','proof',OPENING_PROOF],
  ['2','first-night-till','1','people',OPENING_ALLIES],
  ['3','first-night-box','3','proof',OPENING_PROOF],
 ])('turns South Station reply %s into a different route to the stage', (reply,visitId,answer,tactic,record)=>{
  const start=randomLife();
  const inbox=selectEvent(start,'year');
  expect(inbox.text).toContain('费启');
  expect(inbox.objective).toBeTruthy();
  const replied=resolveChoice(start,inbox,reply).state;
  const visit=firstNightLead(replied)!.event;
  expect(visit.id).toBe(visitId);
  const visited=resolveChoice(replied,visit,answer).state;
  const stage=firstNightLead(visited)!.event;
  const result=resolveChoice(visited,stage,tactic).state;
  expect(result.actions).toBe(1);
  expect(result.flags).toContain(record);
  expect(firstNightLead(result)).toBeNull();
  const book=recordDecision(startBook(visited),result,stage,tactic,'fei');
  const branch=activeLine(forkLife(decodeLife(encodeLife(book)),0));
  expect(replayScene(branch.state,branch.replay!)).toEqual(stage);
  expect(campaignYear(chapter(result,23))!.choices.map(choice=>choice.id)).toContain(tactic);
 });

 it('restores the original scene in saves made before the opening rewrite',()=>{
  const game=randomLife();
  const before={...game,flags:game.flags.filter(flag=>flag!==OPENING_DRAMA)};
  const event=selectEvent(before,'year');
  expect(event.title).toBe('出站前的三条消息');
  const after=resolveChoice(before,event,'1').state;
  const route=firstNightLead(after)!.event;
  const lived=resolveChoice(after,route,'2').state;
  expect(firstNightLead(lived)).toBeNull();
  const old=activeLine(forkLife(recordDecision(startBook(after),lived,route,'2','mao'),0));
  expect(replayScene(old.state,old.replay!)).toEqual(route);
 });

 it('pays the first shift and gives kitchen and dock workers the right receipts',()=>{
  const profile=LIFE_STARTS[0];
  const start=createGame(profile.seed,'小申','free',profile.cards.map(id=>allOrigins().find(card=>card.id===id)!));
  const first=selectEvent(start,'year');
  expect(first.text).toContain('赵正');
  expect(first.objective).toContain('工钱');
  const dock=resolveChoice(start,first,'today').state;
  expect(dock.cash).toBe(1000);
  const signed=resolveChoice(dock,streetLead(dock)!.event,'receipt').state;
  expect(signed.flags).toContain(OPENING_PROOF);
  const kitchen=resolveChoice(start,first,'kitchen').state;
  expect(streetLead(kitchen)!.event.title).toBe('送餐单上写的是谁');
  const due=resolveChoice(start,first,'later').state;
  expect(streetLead(due)!.event.title).toBe('三天都在，表上只有两天');
 });

 it('uses prior decisions in the rival response and changes the next set of choices',()=>{
  const first=chapter({...randomLife(),stats:{...randomLife().stats,skill:25,network:20}},23);
  const fallback=resolveChoice(first,campaignYear(first)!,'walk').state;
  const before=chapter(fallback,26);
  const response=selectEvent(before,'year');
  expect(response.id).toBe('campaign-pressure-arrival-26');
  expect(response.choices.map(choice=>choice.id)).toEqual(['merge','move']);
  const countered=resolveChoice(before,response,'merge').state;
  expect(campaignYear(chapter(countered,28))!.choices.map(choice=>choice.id)).toContain('people');
  const other=resolveChoice(before,response,'move').state;
  expect(campaignYear(chapter(other,28))!.choices.map(choice=>choice.id)).not.toContain('people');
 });
});
