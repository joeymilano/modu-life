import { describe, expect, it } from 'vitest';
import { portraitArt } from '../src/game/art';
import { CAST } from '../src/game/content';
import { romanceQuestions } from '../src/game/dates';
import { createGame, drawOrigins, nextYear, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { firstNightClue, firstNightThread } from '../src/game/firstNight';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent } from '../src/game/timelines';

const routes = [
 { sender: 'mao', primary: 'room-bill', alternate: 'room-viewing', alternateChange: { cash: -1200, housing: 1 }, echo: '这回还是你先挑' },
 { sender: 'he', primary: 'shift-rota', alternate: 'shift-handover', alternateChange: { job: 'service' }, echo: '你签过的班表' },
 { sender: 'lu', primary: 'ferry-oranges', alternate: 'ferry-gig', alternateChange: { trust: 12, attraction: 5 }, echo: '剥橘子皮的声音' },
];

describe('revisiting first-night contacts', () => {
 it.each(routes)('carries $sender through the next year and into the farewell', ({sender,primary,alternate,alternateChange,echo}) => {
  const start = createGame('FIRSTNIGHT', '阿申', 'free', drawOrigins('FIRSTNIGHT'));
  const opening = selectEvent(start, 'year');
  const reply = opening.choices.find(choice => choice.senderId === sender)!;
  const invited = resolveChoice(start, opening, reply.id).state;
  const meeting = streetLead(invited)!.event;
  expect(meeting.speakerId).toBe(sender);

  const original = resolveChoice(invited, meeting, '1').state;
  const originalBook = recordDecision(startBook(invited), original, meeting, '1');
  const forked = activeLine(forkLife(originalBook, 0));
  const replay = replayScene(forked.state, forked.replay!)!;
  const changed = resolveChoice(forked.state, replay, '2').state;
  const yearOne = selectEvent(nextYear(original).state, 'year');
  const yearTwo = { ...nextYear(changed).state, cash: 10000 };
  const alternateScene = selectEvent(yearTwo, 'year');
  expect(yearOne.id).toBe(alternateScene.id);
  expect(yearOne.illustration).toBe('/art/shanghai-streets/first-night-' + primary + '.webp');
  expect(alternateScene.illustration).toBe('/art/shanghai-streets/first-night-' + alternate + '.webp');
  expect(alternateScene.choices[0].effect).toMatchObject(alternateChange);
  expect(alternateScene.choices).toHaveLength(3);
  expect(draftFromEvent(alternateScene, '1', '那天的事', 19, '上海').turns[0].shot).toBe(alternateScene.illustration);

  const next = resolveChoice(yearTwo, alternateScene, '1').state;
  expect(next.actions).toBe(3);
  const date = CAST.find(person => person.id === sender && person.role === 'romance');
  if (date) expect(romanceQuestions(date, next.flags)[0].text).toContain(sender === 'he' ? '又问你周六' : '下次剥橘子');
  const farewell = selectEvent({ ...next, age: 59, pendingYearEvent: true }, 'year');
  expect(farewell.text).toContain(echo);
  expect(farewell.speakerId).toBe(sender);
  expect(portraitArt(sender, false, 59)).toBe('/art/portraits/head/' + sender + '-senior.webp');
 });
});

describe('first-night discoveries', () => {
 const discoveries = [
  { sender: 'mao', photo: 'room', cash: -160, flag: 'night-refused', next: 'room-viewing' },
  { sender: 'he', photo: 'shift', cash: 260, flag: 'night-offer', next: 'shift-rota' },
  { sender: 'lu', photo: 'ferry', cash: 60, flag: 'night-saved-box', next: 'ferry-oranges' },
 ];

 it.each(discoveries)('records and replays the discovery from $sender', ({sender,photo,cash,flag,next}) => {
  const start = createGame('INBOX', '阿申', 'free', drawOrigins('INBOX'));
  const arrival = selectEvent(start, 'year');
  const message = arrival.choices.find(choice => choice.senderId === sender)!;
  expect(firstNightThread(sender)?.photo).toBe('/art/shanghai-streets/inbox-' + photo + '.webp');
  const invited = resolveChoice(start, arrival, message.id).state;
  expect(invited.actions).toBe(start.actions);
  const meeting = streetLead(invited)!.event;
  expect(firstNightClue(meeting.id)?.text).toBeTruthy();
  const visit = resolveChoice(invited, meeting, '3').state;
  expect(visit.actions).toBe(invited.actions - 1);
  expect(visit.cash).toBe(invited.cash + cash);
  expect(visit.flags).toContain(flag);
  expect(selectEvent(nextYear(visit).state, 'year').illustration)
   .toBe('/art/shanghai-streets/first-night-' + next + '.webp');
  const branch = activeLine(forkLife(recordDecision(startBook(invited), visit, meeting, '3'), 0));
  const replay = replayScene(branch.state, branch.replay!)!;
  expect(replay.choices.map(choice => choice.id)).toEqual(['1', '2', '3']);
  expect(branch.state.cash).toBe(invited.cash);
 });
});
