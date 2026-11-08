import { describe, expect, it } from 'vitest';
import { CAST } from '../src/game/content';
import { dateAnswer, dateTableChoice, finishDate, firstDateParting, romanceQuestions } from '../src/game/dates';
import { returnDate } from '../src/game/dateReturns';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { draftFromEvent, validateTicket } from '../src/game/timelines';
import type { LifeEvent } from '../src/game/types';

describe('date scenes', () => {
 const cast = CAST.filter(person => person.role === 'romance');
 const newGame = () => ({ ...createGame('DATE', '小申', 'free', drawOrigins('DATE')), pendingYearEvent: false });

 it('gives each date its own three beats and a meaningful parting choice', () => {
  const middleScenes = new Set<string>();
  for (const person of cast) {
   const scenes = romanceQuestions(person, []);
   expect(scenes).toHaveLength(3);
   middleScenes.add(scenes[1].text);
   const [date, friend, leave] = scenes[2].answers;
   const romantic = finishDate(person, date, 6, 28);
   expect(romantic.effect.cash).toBe(-28);
   expect(romantic.effect.commitment).toBeGreaterThan(0);
   expect(finishDate(person, date, 2, 0).text).not.toBe(romantic.text);
   expect(finishDate(person, friend, 4, 0).effect).toMatchObject({ trust: 12, network: 4 });
   expect(finishDate(person, leave, 4, 0).text).toBe(leave.reply);
  }
  expect(middleScenes.size).toBe(8);
 });

 it('lets Lu Jia and He Liang remember specific events from the first night', () => {
  const lu = cast.find(person => person.id === 'lu')!;
  const he = cast.find(person => person.id === 'he')!;
  expect(romanceQuestions(lu, ['night-saved-box'])[0].text).toContain('有疤的橘子');
  expect(romanceQuestions(he, ['night-offer'])[0].text).toContain('蓝围裙');
  expect(romanceQuestions(lu, ['night-offer'])[0].text).toBe(romanceQuestions(lu, [])[0].text);
 });

 it('offers a unique return to each real date and preserves friend choices', () => {
  const titles = new Set<string>();
  for (const person of cast) {
   const state = newGame();
   state.relationships[person.id].met = true;
   expect(returnDate(state, person.id)).toBeUndefined();
   const finish = finishDate(person, romanceQuestions(person, [])[2].answers[1], 4, 0);
   state.seenEvents = [`mini-${person.id}-18-3`];
   expect(returnDate(state, person.id)).toBeDefined(); // Previous saves had no date answer flag.
   state.journal.push({ age: 18, title: `和${person.name}见一面`, text: finish.text, tag: '关系' });
   expect(returnDate(state, person.id)?.tag).toBe('朋友见面');
   state.flags.push(...finish.effect.setFlags!);
   const date = returnDate(state, person.id)!;
   titles.add(date.title);
   expect(date.tag).toBe('朋友见面');
   expect(date.choices.map(choice => choice.id)).toEqual(['friend', 'help', 'leave']);
   expect(date.choices.some(choice => choice.effect.attraction || choice.effect.romanticInvitation)).toBe(false);
   expect(returnDate(resolveChoice(state, date, 'friend').state, person.id)).toBeUndefined();
  }
  expect(titles.size).toBe(8);
 });

 it('replays a return on a new timeline and carries its picture into a shareable ticket', () => {
  const state = newGame();
  state.seenEvents.push('mini-lu-18-3');
  state.flags.push('date-lu-again');
  const date = returnDate(state, 'lu')!;
  const original = resolveChoice(state, date, 'date');
  const recorded = recordDecision(startBook(state), original.state, date, 'date', 'lu');
  const branch = decodeLife(encodeLife(forkLife(recorded, 0)));
  const line = activeLine(branch);
  expect(replayScene(line.state, line.replay!)).toEqual(date);
  const other = resolveChoice(line.state, date, 'leave');
  expect(dateAnswer(other.state, 'lu')).toBe('left');
  expect(dateAnswer(activeLine(switchLine(branch, 0)).state, 'lu')).toBe('again');
  const draft = { ...draftFromEvent(date, 'date', original.text, 18, '外滩'), author: '小申' };
  expect(validateTicket({ version: 1, timeline: draft }).timeline.turns[0].shot).toBe(date.illustration);
  draft.turns[0].shot = 'https://example.com/unrelated.webp';
  expect(validateTicket({ version: 1, timeline: draft }).timeline.turns[0].shot).toBeUndefined();
 });

 it('forks a first date with the conversation and bill intact across export', () => {
  const lin = cast.find(person => person.id === 'lin')!;
  const state = { ...newGame(), cash: 100 };
  const event = firstDateParting(state, lin, [2, 0])!;
  expect(firstDateParting({ ...state, cash: 27 }, lin, [2, 0])).toBeUndefined();
  expect(firstDateParting({ ...state, cash: 0 }, lin, [2, 2])).toBeDefined();
  expect(event.choices.map(choice => choice.effect.cash)).toEqual([-28, -28, -28]);
  const original = resolveChoice(state, event, 'date');
  expect(original.state.cash).toBe(72);
  expect(original.state.actions).toBe(state.actions - 1);
  expect(dateAnswer(original.state, 'lin')).toBe('again');
  expect(firstDateParting(original.state, lin, [2, 0])).toBeUndefined();
  const saved = recordDecision(startBook(state), original.state, event, 'date');
  const fork = decodeLife(encodeLife(forkLife(saved, 0)));
  const branch = activeLine(fork);
  const restored = replayScene(branch.state, branch.replay!)!;
  expect(restored).toEqual(event);
  const other = resolveChoice(branch.state, restored, 'friend');
  expect(other.state.cash).toBe(72);
  expect(dateAnswer(other.state, 'lin')).toBe('friends');
  expect(returnDate(other.state, 'lin')?.tag).toBe('朋友见面');
  expect(dateAnswer(activeLine(switchLine(fork, 0)).state, 'lin')).toBe('again');
  const timeline = { ...draftFromEvent(restored, 'friend', other.text, 18, '莘庄'), author: '小申' };
  expect(validateTicket({ version: 1, timeline }).timeline.turns[0].shot).toBe('/art/dates/lin-parting.webp');
 });

 it('only reduces a current partner’s trust when another romantic invitation is chosen', () => {
  const state = newGame();
  const lu = cast.find(person => person.id === 'lu')!;
  state.partnerId = 'ning';
  state.relationships.ning.trust = 60;
  const [invite, friend] = romanceQuestions(lu, [])[2].answers;
  const event: LifeEvent = {
   id: 'mini-lu-18-3', category: 'romance', title: '陆嘉', text: '', speakerId: 'lu',
   choices: [invite, friend].map((answer, index) => {
    const result = finishDate(lu, answer, 6, 0);
    return { id: String(index), label: answer.label, effect: result.effect, reply: result.text };
   }),
  };
  expect(resolveChoice(state, event, '1').state.relationships.ning.trust).toBe(60);
  expect(resolveChoice(state, event, '0').state.relationships.ning.trust).toBe(48);
 });

 it.each(cast)('remembers which action $name saw at the first table', person => {
  const state = newGame();
  const returns = [0,1,2].map(index => {
   const event = firstDateParting(state,person,[0,index])!;
   const after = resolveChoice(state,event,'friend').state;
   expect(dateTableChoice(after,person.id)).toBe(index);
   const visit = returnDate(after,person.id)!;
   expect(visit.tag).toBe('朋友见面');
   expect(visit.choices.map(choice => choice.id)).toHaveLength(3);
   expect(visit.choices.some(choice => choice.effect.romanticInvitation || choice.effect.attraction)).toBe(false);
   return visit;
  });
  expect(new Set(returns.map(visit => visit.text)).size).toBe(3);
  expect(returns.some(visit => visit.choices.some(choice => choice.id==='memory'))).toBe(true);
 });

 it('keeps a tentative return nonromantic and carries a concrete repair into a new timeline', () => {
  const lu=cast.find(person=>person.id==='lu')!;
  const state=newGame();
  const parting=firstDateParting(state,lu,[2,2])!;
  const after=resolveChoice(state,parting,'date').state;
  expect(dateAnswer(after,'lu')).toBe('waiting');
  const visit=returnDate(after,'lu')!;
  expect(visit.tag).toBe('还没定下来');
  expect(visit.text).toContain('上次那半首别往外发');
  expect(visit.choices.map(choice=>choice.id)).toEqual(['friend','memory','leave']);
  const repair=resolveChoice(after,visit,'memory');
  expect(repair.state.relationships.lu.trust).toBe(after.relationships.lu.trust+10);
  expect(dateAnswer(repair.state,'lu')).toBe('waiting');
  const book=recordDecision(startBook(after),repair.state,visit,'memory','lu');
  const branched=activeLine(forkLife(decodeLife(encodeLife(book)),0));
  const replay=replayScene(branched.state,branched.replay!)!;
  expect(replay).toEqual(visit);
  expect(dateAnswer(resolveChoice(branched.state,replay,'friend').state,'lu')).toBe('friends');
 });

});
