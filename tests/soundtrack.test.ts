import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { musicSceneFor, PLAYLISTS, SOUNDTRACK, type MusicView } from '../src/game/soundtrack';
import { MODU_STATIONS } from '../src/game/moduRadio';
import { PROLOGUES, prologueChoices } from '../src/game/pujiangPrologue';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCredits from '../src/components/GameCredits';

const quiet: MusicView = { arcade: false, parallel: false, screen: 'home', cards: false, tender: false, story: false, night: false, district: 'bund' };

describe('配乐场景', () => {
 it('only lists songs whose file ships with the game, and every song has a station', () => {
  for (const song of Object.values(SOUNDTRACK)) {
   expect(existsSync(`public/audio/${song.file}.mp3`), song.title).toBe(true);
   expect(MODU_STATIONS.some(station => station.key !== undefined && SOUNDTRACK[station.key].file === song.file), song.title).toBe(true);
  }
  for (const [scene, list] of Object.entries(PLAYLISTS)) {
   expect(new Set(list).size, scene).toBe(list.length);
   expect(list.length, scene).toBeGreaterThanOrEqual(2);
   for (const key of list) expect(SOUNDTRACK[key], `${scene}: ${key}`).toBeDefined();
  }
 });

 it('keeps the streets, the story, the mini-games and the menu each on their own songs', () => {
  expect(musicSceneFor(quiet)).toBe('home');
  expect(musicSceneFor({ ...quiet, screen: 'draw' })).toBe('home');
  expect(musicSceneFor({ ...quiet, screen: 'play' })).toBe('street');
  expect(musicSceneFor({ ...quiet, screen: 'play', district: 'lujiazui' })).toBe('work');
  expect(musicSceneFor({ ...quiet, screen: 'play', district: 'zhangjiang' })).toBe('work');
  expect(musicSceneFor({ ...quiet, screen: 'play', night: true })).toBe('night');
  expect(musicSceneFor({ ...quiet, screen: 'play', story: true })).toBe('story');
  expect(musicSceneFor({ ...quiet, cards: true })).toBe('cards');
  expect(musicSceneFor({ ...quiet, parallel: true })).toBe('night');
  expect(musicSceneFor({ ...quiet, screen: 'end' })).toBe('night');
  expect(musicSceneFor({ ...quiet, arcade: true })).toBe('arcade');
 });

 it('gives love its own music wherever it happens', () => {
  // A date is still a date in 陆家嘴, in the middle of a story scene, or at the very end of a life.
  expect(musicSceneFor({ ...quiet, screen: 'play', district: 'lujiazui', tender: true })).toBe('tender');
  expect(musicSceneFor({ ...quiet, screen: 'play', story: true, tender: true })).toBe('tender');
  expect(musicSceneFor({ ...quiet, screen: 'end', tender: true })).toBe('tender');
  expect(musicSceneFor({ ...quiet, cards: true, tender: true })).toBe('tender');
  // The arcade keeps its own music.
  expect(musicSceneFor({ ...quiet, screen: 'play', arcade: true, tender: true })).toBe('arcade');
 });

 it('opens tender scenes on 六月下, a song the story scenes do not start with, so the change is heard', () => {
  expect(PLAYLISTS.tender[0]).toBe('liuyuexia');
  expect(PLAYLISTS.tender[0]).not.toBe(PLAYLISTS.story[0]);
  const song = SOUNDTRACK.liuyuexia;
  expect(song.artist).toBe('MT1990');
  expect(song.license).toBeTruthy();
  expect(song.isrc).toBeUndefined();
 });
});

describe('抒情段落', () => {
 it.each(['arrival', 'worker', 'heir', 'system'] as const)('%s: only the first meeting and staying behind are tender', route => {
  for (const choice of prologueChoices(route)) for (const option of choice.options) {
   expect(option.mood, `${route}: ${choice.id}/${option.id}`).toBe(choice.id === 'meet' || (choice.id === 'parting' && option.id === 'stay') ? 'tender' : undefined);
  }
  const tender = PROLOGUES[route].script.filter(beat => beat.t === 'choice').length;
  expect(tender).toBe(3);
 });
});

describe('制作名单里的配乐', () => {
 it('credits the shared licence once and any separately licensed song on its own line', () => {
  const page = renderToStaticMarkup(createElement(GameCredits));
  expect(page).toContain('配乐 · Kevin MacLeod');
  expect(page).toContain('CC BY 4.0');
  for (const track of Object.values(SOUNDTRACK).filter(song => song.isrc)) expect(page).toContain(track.title);
  for (const track of Object.values(SOUNDTRACK).filter(song => !song.isrc)) {
   expect(page).toContain(track.title);
   expect(page).toContain(track.artist ?? '作者未登记');
  }
 });
});
