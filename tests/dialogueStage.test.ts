import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { everyBeat, everyChoice, stageAt, type Beat } from '../src/game/dialogue';
import { PROLOGUES } from '../src/game/pujiangPrologue';
import { COMMISSIONS, OPENING_EPISODES, PUJIANG_EPISODES, SYSTEM_EPISODES } from '../src/game/pujiangScript';
import { cinemaRelationships, CINEMA_ART, CINEMA_CONTACTS } from '../src/game/pujiangCinema';
import { VN_CAST, VN_STAGES } from '../src/game/vnCast';
import { beginPujiangLife, episodeOffer, episodeView, startEpisode } from '../src/game/pujiang';
import { allOrigins, createGame, playPujiangMove } from '../src/game/engine';
import { LIFE_STARTS } from '../src/game/lifeStarts';

function fresh() {
 const cards = LIFE_STARTS.find(s => s.id === 'system')!.cards.map(id => allOrigins().find(c => c.id === id)!);
 return beginPujiangLife(createGame('CINEMA', '小申', 'free', cards));
}

describe('对话舞台的剧本', () => {
 const scripts = [
  ...Object.values(PROLOGUES).map(story => ({ name: story.routeName, beats: story.script as Beat[], shared: false })),
  ...PUJIANG_EPISODES.map(script => ({ name: script.title, beats: script.scenes.flatMap(scene => scene.beats), shared: !!script.commission })),
 ];
 const spoken = scripts.flatMap(({ beats }) => everyBeat(beats));
 const MODERN = /微信|朋友圈|直播间|弹幕|热搜|智能手机|扫码|二维码|外卖|高铁|网约车|短视频|点赞|APP|直播/;
 const LIMITS: Record<string, number> = { line: 64, nar: 96, think: 56, sys: 30, hand: 52, fx: 12 };

 it('only names people and places that have art on disk', () => {
  for (const [who, person] of Object.entries(VN_CAST)) for (const pose of Object.values(person.poses)) expect(existsSync('public/art/sprites/' + pose.file + '.webp'), who).toBe(true);
  for (const id of VN_STAGES) expect(existsSync('public/art/stages/' + id + '.webp'), id).toBe(true);
  for (const beat of spoken) {
   if (beat.t === 'bg') expect(VN_STAGES, beat.id).toContain(beat.id);
   if (beat.t === 'line') expect(VN_CAST[beat.who] ?? beat.who, beat.who).toBeTruthy();
   if (beat.t === 'cast') for (const person of beat.enter ?? []) expect(VN_CAST[person.who]?.poses[person.pose ?? 'default'], person.who + ':' + person.pose).toBeTruthy();
  }
 });

 it('keeps every line short enough to read at speed, in period voice', () => {
  for (const beat of spoken) {
   if (beat.t === 'line' || beat.t === 'nar' || beat.t === 'think' || beat.t === 'hand' || beat.t === 'fx') {
    expect(beat.text.length, `${beat.t}: ${beat.text}`).toBeLessThanOrEqual(LIMITS[beat.t]);
    expect(beat.text).not.toMatch(MODERN);
    expect(beat.text.trim()).toBe(beat.text);
   }
   if (beat.t === 'sys') for (const line of beat.lines) { expect(line.length).toBeLessThanOrEqual(LIMITS.sys); expect(line).not.toMatch(MODERN); }
  }
  for (const option of spoken.flatMap(beat => beat.t === 'choice' ? beat.options : [])) {
   expect(option.label.length).toBeLessThanOrEqual(40);
   expect((option.hint ?? '').length).toBeLessThanOrEqual(24);
   expect(option.label).not.toMatch(MODERN);
  }
  // A line worth writing twice was worth writing differently; the shared commission template is the one exception.
  for (const { name, beats, shared } of scripts) {
   if (shared) continue;
   const lines = everyBeat(beats).filter(beat => 'text' in beat && beat.t !== 'bg' && beat.t !== 'cast' && beat.t !== 'choice').map(beat => 'text' in beat ? beat.text : '');
   expect(new Set(lines).size, name).toBe(lines.length);
  }
  });

 it('stages each scene with a backdrop, people and a question the other side can steal', () => {
  for (const script of PUJIANG_EPISODES) for (const scene of script.scenes) {
   expect(scene.beats[0]?.t).toBe('bg');
   expect(scene.beats.some(beat => beat.t === 'cast' && beat.enter?.length)).toBe(true);
   expect(scene.beats.at(-1)?.t).not.toBe('choice');
   expect(VN_CAST[scene.stall.who], scene.title).toBeTruthy();
   expect(scene.prompt.length).toBeLessThanOrEqual(30);
   for (const choice of scene.choices) {
    expect(choice.tag, choice.id).toBeTruthy();
    expect(choice.react?.length ?? 0, choice.id).toBeGreaterThanOrEqual(2);
    expect(choice.hint.length).toBeLessThanOrEqual(24);
    if (choice.gamble) { expect(choice.gamble.miss?.length ?? 0).toBeGreaterThanOrEqual(2); expect(choice.tag).toBe('赌'); }
    if (/^score:\d|^team:\d/.test(choice.requires ?? '')) expect(choice.tag).toBe('终结技');
   }
  }
  for (const [route, story] of Object.entries(PROLOGUES)) {
   const ids = everyChoice(story.script).flatMap(choice => choice.options.map(option => prologueFlagName(route, choice.id, option.id)));
   expect(new Set(ids).size).toBe(ids.length);
  }
 });

 it('walks a prologue to any beat and knows who is standing where', () => {
  const script = PROLOGUES.heir.script, beats = everyBeat(script);
  const porch = beats.findIndex(beat => beat.t === 'bg' && beat.id === 'hotel-porch');
  expect(stageAt(beats, porch - 1).actors.zhouxiao).toBeTruthy();
  expect(stageAt(beats, porch + 1).actors.zhouxiao).toBeUndefined();
  expect(stageAt(beats, porch + 1).actors.shen?.slot).toBe('center');
 });
});

function prologueFlagName(route: string, group: string, option: string) {
 return group === 'meet' ? option : route + '-' + option;
}

describe('这场戏里的人', () => {
 it('lists whoever has spoken so far, with the trust this scene has moved', () => {
  const s = playPujiangMove(startEpisode(fresh(), 'pj-system-18'), { kind: 'choice', id: 'cargo' });
  const snapshot = JSON.stringify(s), view = episodeView(s);
  const xu = cinemaRelationships(s, view.script, view.relations).find(person => person.id === 'pj-xu')!;
  expect(xu.delta).toBe(8); expect(xu.trust).toBe(s.relationships['pj-xu'].trust + 8);
  expect(JSON.stringify(s)).toBe(snapshot);
  expect(cinemaRelationships(s, view.script, view.relations).some(person => person.id === 'pj-wen')).toBe(false);
 });
 it('reads settled trust exactly once after refresh', () => {
  let s = startEpisode(fresh(), 'pj-system-18');
  for (const id of ['cargo', 'explain', 'share']) s = playPujiangMove(s, { kind: 'choice', id });
  expect(s.episode?.receipt).toBeDefined();
  const restored = JSON.parse(JSON.stringify(s));
  const xu = cinemaRelationships(restored, SYSTEM_EPISODES[0]).find(person => person.id === 'pj-xu')!;
  expect(xu.trust).toBe(s.relationships['pj-xu'].trust); expect(xu.delta).toBe(0);
 });
 it('keeps contact crops within budget', () => {
  for (const portrait of Object.values(CINEMA_CONTACTS)) expect(existsSync('public' + CINEMA_ART[portrait.art])).toBe(true);
  expect(Object.values(CINEMA_ART).reduce((n, path) => n + statSync('public' + path).size, 0)).toBeLessThan(1_200_000);
 });
});
