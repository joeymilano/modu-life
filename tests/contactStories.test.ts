import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { portraitArt } from '../src/game/art';
import { CAST } from '../src/game/content';
import { contactEvidence, contactStory, contactStoryMemory } from '../src/game/contactStories';
import { createGame, drawOrigins, relationshipLabel, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { streetLead } from '../src/game/streetLeads';

function atMidlife() {
 return {
  ...createGame('CONTACTS','小申','free',drawOrigins('CONTACTS')),
  age: 44, pendingYearEvent: false,
 };
}

describe('running into old acquaintances', () => {
 it('offers visits to people the player knows during the right years and costs an action', () => {
  const start = atMidlife();
  expect(contactStory(start)).toBeUndefined();
  start.relationships.wu.met = true;
  expect(contactStory({ ...start, age: 35 },'wu')).toBeUndefined();
  expect(contactStory({ ...start, actions: 0 },'wu')).toBeUndefined();
  expect(contactStory({ ...start, age: 54 },'wu')).toBeUndefined();
  const event = streetLead(start)!.event;
  expect(event.id).toBe('contact-wu-regulars');
  const work = resolveChoice(start,event,'shift').state;
  const refund = resolveChoice(start,event,'refund').state;
  expect(work.cash - refund.cash).toBe(260);
  expect(work.actions).toBe(start.actions - 1);
  expect(contactStory(work,'wu')).toBeUndefined();
  expect(contactStory({...work,age:54},'wu')?.event.text).toContain('写的地址');
  expect(contactStory({...refund,age:54},'wu')?.event.text).toContain('预付的钱退了');
  const older = {...work,age:54};
  const returnVisit = contactStory(older,'wu')!.event;
  const visited = resolveChoice(older,returnVisit,'eat').state;
  expect(contactStory(visited,'wu')).toBeUndefined();
  expect(contactStoryMemory(visited,'wu')).toMatchObject({age:54,title:returnVisit.title});
 });

 it('recovers both versions of the deposit choice in a saved branch outside the active street lead', () => {
  const start = atMidlife();
  start.seenEvents.push('street-lease');
  start.relationships.wu.met = true;
  const visit = contactStory(start,'fang')!.event;
  expect(streetLead(start)?.event.id).not.toBe(visit.id);
  expect(contactEvidence(visit.id)?.choiceId).toBe('check');
  expect(visit.text).toContain('以前碰到过押金');
  const paid = resolveChoice(start,visit,'settle');
  const saved = recordDecision(startBook(start),paid.state,visit,'settle','fang');
  const branch = activeLine(decodeLife(encodeLife(forkLife(saved,0))));
  const reopened = replayScene(branch.state,branch.replay!)!;
  expect(reopened).toEqual(visit);
  const checked = resolveChoice(branch.state,reopened,'check');
  expect(checked.state.cash).toBe(start.cash);
  expect(checked.state.relationships.fang.met).toBe(true);
  expect(relationshipLabel(checked.state,'fang')).toBe('刚认识');
  expect(relationshipLabel({...checked.state,age:55},'fang')).toBe('打过交道');
  expect(contactStory({...paid.state,age:55},'fang')?.event.text).toContain('剩下三百没再追');
  expect(contactStory({...checked.state,age:55},'fang')?.event.text).toContain('租客的女儿');
 });

 it('restores an older street lead even when a known contact now has a new message', () => {
  const state = {...atMidlife(), age:38, jobId:'finance'};
  state.relationships.wu.met = true;
  expect(streetLead(state)?.event.id).toBe('contact-wu-regulars');
  expect(replayScene(state,{kind:'lead',eventId:'street-reorg'})?.title).toBe('名单上只剩一格');
 });

 it('credits teaching income once and recalls who was named in the reference', () => {
  const start = atMidlife();
  start.relationships.boss.met = true;
  start.seenEvents.push('street-reorg');
  const event = contactStory(start,'boss')!.event;
  expect(event.text).toContain('名单只剩一格');
  const credited = resolveChoice(start,event,'credit').state;
  const sent = resolveChoice(start,event,'send').state;
  const older = {...credited,age:57};
  const visit = contactStory(older,'boss')!.event;
  expect(visit.text).toContain('两个人的名字');
  expect(contactStory({...sent,age:57},'boss')?.event.text).toContain('只写了你');
  expect(contactEvidence(visit.id)).toBeUndefined();
  const result = resolveChoice(older,visit,'teach').state;
  expect(result.cash - older.cash).toBe(600);
  expect(contactStory(result,'boss')).toBeUndefined();
 });

 it('ships every contact portrait and avatar at all three life stages', () => {
  const stages = [[18,''], [31,''], [32,'-midlife'], [52,'-midlife'], [53,'-senior'], [60,'-senior']] as const;
  for (const {id} of CAST) {
   for (const [age, suffix] of stages) {
    const full = portraitArt(id, true, age);
    const head = portraitArt(id, false, age);
    expect(full).toBe(`/art/portraits/${id}${suffix}.webp`);
    expect(head).toBe(`/art/portraits/head/${id}${suffix}.webp`);
    expect(existsSync(new URL('../public' + full, import.meta.url)), full).toBe(true);
    expect(existsSync(new URL('../public' + head, import.meta.url)), head).toBe(true);
   }
  }
 });
});
