import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PujiangStage from '../src/components/PujiangStage';
import { allOrigins, createGame, drawOrigins, nextYear, playPujiangMove } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, recordEpisodeDecision, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { advancePrologue, beginPujiangLife, episodeCarry, episodeOffer, episodeView, pujiangYear, startEpisode } from '../src/game/pujiang';
import { PROLOGUES, PROLOGUE_PENDING, prologueChoices, prologueFlag, prologueOption, prologueStart, rememberedMeeting } from '../src/game/pujiangPrologue';
import { everyBeat } from '../src/game/dialogue';
import type { PujiangRoute } from '../src/game/pujiangTypes';
import type { GameState } from '../src/game/types';

const RIVALS: Record<PujiangRoute, string> = { arrival: 'fei', worker: 'zheng', heir: 'zhouxiao', system: 'gu' };

function start(route: PujiangRoute) {
 const profile = LIFE_STARTS.find(s => s.id === (route === 'worker' ? 'daywork' : route));
 const cards = profile ? profile.cards.map(id => allOrigins().find(c => c.id === id)!) : drawOrigins('first-meeting');
 return beginPujiangLife(createGame('first-meeting', '阿黎', 'free', cards));
}
function reload(state: GameState) {
 return activeLine(decodeLife(JSON.parse(JSON.stringify(encodeLife(startBook(state)))))).state;
}
function stage(state: GameState) {
 const noop = () => {};
 return renderToStaticMarkup(createElement(PujiangStage, { game: state, onStart: noop, onMove: noop, onDone: noop, onPause: noop, onChange: noop, onError: noop, audio: false, onAudio: noop }));
}

describe('四条出身的冷开场', () => {
 it.each(['arrival', 'worker', 'heir', 'system'] as const)('%s puts the antagonist on stage first and owes three answers', route => {
  const state = reload(start(route)), story = PROLOGUES[route], lines = everyBeat(story.script).filter(beat => beat.t === 'line');
  // Short-drama rule: trouble opens the scene. Where the guide is met first, the opening line still names the trouble.
  const firstRival = lines.findIndex(line => line.who === RIVALS[route]);
  expect(firstRival, route).toBeGreaterThanOrEqual(0);
  expect(firstRival, route).toBeLessThanOrEqual(route === 'worker' || route === 'heir' ? 0 : 14);
  expect(['bg', 'sys']).toContain(story.script[0].t);
  const flat = everyBeat(story.script), rivalLine = flat.findIndex(beat => beat.t === 'line' && beat.who === RIVALS[route]);
  const staged = flat.findIndex(beat => beat.t === 'cast' && beat.enter?.some(person => person.who === RIVALS[route]));
  expect(staged).toBeGreaterThanOrEqual(0);
  expect(staged).toBeLessThanOrEqual(rivalLine);
  if (route === 'arrival' || route === 'system') {
   const before = flat.slice(0, rivalLine).flatMap(beat => beat.t === 'nar' || beat.t === 'think' ? [beat.text] : beat.t === 'sys' ? beat.lines : []).join('');
   expect(before).toMatch(/撕|踢|取消|八万/);
  }
  expect(prologueChoices(route).map(choice => choice.id)).toEqual(expect.arrayContaining(['stance', 'meet', 'parting']));
  const page = stage(state);
  expect(page).toContain('vn-stage');
  expect(page).toContain(story.routeName);
  expect(page).not.toContain('data-pj-start');
  expect(existsSync('public' + story.photo)).toBe(true);
 });

 it.each(['arrival', 'worker', 'heir', 'system'] as const)('%s records each answer once and carries it into the chapter and the next year', route => {
  const state = reload(start(route)), story = PROLOGUES[route], opening = episodeOffer(state)!;
  const [stance, meet, parting] = ['stance', 'meet', 'parting'].map(id => prologueChoices(route).find(choice => choice.id === id)!);
  for (const temper of stance.options) for (const meeting of meet.options) for (const farewell of parting.options) {
   let game = reload(state);
   game = reload(advancePrologue(game, temper.id));
   expect(stage(game)).toContain('vn-stage');
   expect(advancePrologue(game, stance.options.find(other => other !== temper)!.id)).toBe(game);
   game = reload(advancePrologue(game, meeting.id));
   expect(advancePrologue(game, meeting.id)).toBe(game);
   game = reload(advancePrologue(game, farewell.id));
   expect(advancePrologue(game, farewell.id)).toBe(game);
   for (const key of ['actions', 'cash', 'age'] as const) expect(game[key]).toBe(state[key]);
   const flag = (group: 'stance' | 'meet' | 'parting', id: string) => prologueFlag(route, group, id);
   expect(game.flags).toEqual(expect.arrayContaining([flag('stance', temper.id), flag('meet', meeting.id), flag('parting', farewell.id), PROLOGUE_PENDING]));
   expect(game.flags).not.toContain(flag('stance', stance.options.find(other => other !== temper)!.id));
   expect(game.stats.face).toBe(state.stats.face + (temper.effect?.face ?? 0));
   expect(game.stats.skill).toBe(state.stats.skill + (temper.effect?.skill ?? 0));
   const contact = game.relationships[story.personId];
   expect(contact.met).toBe(true);
   expect(contact.memories).toContain(meeting.memory);
   expect(contact.trust).toBe(state.relationships[story.personId].trust + (farewell.id === 'stay' ? 3 : 0));
   expect(game.journal.map(entry => entry.tag)).toEqual(expect.arrayContaining(['开场', '初识', '赴约']));
   // Every answer resumes at the next one still owed.
   expect(prologueStart(route, state.flags)).toBe(0);
   expect(PROLOGUES[route].script[prologueStart(route, reload(advancePrologue(state, temper.id)).flags)]).toMatchObject({ t: 'choice', id: 'meet' });
   // Finishing the last line hands over to the chapter briefing.
   const ready = reload(advancePrologue(game, 'finish'));
   expect(ready.flags).not.toContain(PROLOGUE_PENDING);
   expect(stage(ready)).toContain('data-pj-start');
   const inScene = reload(startEpisode(ready, opening.id));
   expect(episodeView(inScene)!.budget).toBe(opening.budget + (farewell.id === 'prepare' ? 1 : 0));
   const nineteen = { ...ready, age: 19 };
   const text = route === 'system' ? episodeCarry(nineteen, episodeOffer(nineteen)!).join(' ') : pujiangYear(nineteen)?.text;
   expect(text).toContain(meeting.nextYear);
   expect(prologueChoices(route).filter(choice => choice.id === 'meet').flatMap(choice => choice.options).find(option => option !== meeting)!.nextYear)
    .toBeTruthy();
   expect(text).not.toContain((meet.options.find(option => option !== meeting)!.nextYear)!);
  }
 });

 it('skips without inventing answers, ignores unknown actions and lets old saves straight into the briefing', () => {
  const state = start('arrival');
  expect(advancePrologue(state, 'nonsense')).toBe(state);
  expect(advancePrologue(state, 'finish-prologue')).toBe(state);
  // Answers may be given out of order, but never twice.
  const ahead = advancePrologue(state, 'hard');
  expect(stage(reload(ahead))).toContain('vn-stage');
  expect(advancePrologue(ahead, 'soft')).toBe(ahead);
  const skipped = advancePrologue(state, 'skip');
  expect(stage(reload(skipped))).toContain('data-pj-start');
  expect(skipped.relationships.mao).toEqual(state.relationships.mao);
  expect(skipped.stats).toEqual(state.stats);
  const chosen = advancePrologue(advancePrologue(state, 'hard'), 'bowl');
  expect(advancePrologue(chosen, 'skip').relationships.mao.memories).toContain(prologueOption('arrival', 'bowl')!.option.memory);
  expect(rememberedMeeting(chosen.flags, 'arrival')?.id).toBe('bowl');
  const old = reload({ ...state, flags: state.flags.filter(flag => flag !== PROLOGUE_PENDING) });
  expect(stage(old)).not.toContain('vn-stage');
  expect(advancePrologue(old, 'hard')).toBe(old);
 });

 it('shows the repairman only once he speaks in the second act', () => {
  const state = start('system'), opening = episodeOffer(state)!;
  const spoken = (act: number) => new Set(opening.scenes.slice(0, act + 1).flatMap(scene => everyBeat(scene.beats)).filter(beat => beat.t === 'line').map(beat => beat.who));
  expect(spoken(0).has('wen')).toBe(false);
  expect(spoken(1).has('wen')).toBe(true);
 });
});

describe('序章的态度会被十八岁这一章记住', () => {
 it.each([
  ['worker', 'hard', 'echo', 'soft', 'ledger'], ['heir', 'hard', 'seat', 'soft', 'faces'],
  ['system', 'hard', 'standground', 'soft', 'battery'], ['arrival', 'hard', 'callout', 'soft', 'count'],
 ] as const)('%s: %s opens %s and %s opens %s', (route, hard, hardOption, soft, softOption) => {
  const base = start(route);
  for (const [temper, option] of [[hard, hardOption], [soft, softOption]] as const) {
   const chosen = advancePrologue(advancePrologue(base, temper), 'finish');
   const view = episodeView(startEpisode(chosen, episodeOffer(chosen)!.id))!;
   expect(view.choices.find(choice => choice.id === option)!.disabled).toBeUndefined();
   const other = view.choices.find(choice => choice.id === (temper === hard ? softOption : hardOption))!;
   expect(other.disabled).toBeTruthy();
   expect(other.disabled).toMatch(/序章/);
   const plain = episodeView(startEpisode(advancePrologue(base, 'finish'), episodeOffer(base)!.id))!;
   expect(plain.choices.filter(choice => /序章/.test(choice.disabled ?? ''))).toHaveLength(2);
  }
 });
});
