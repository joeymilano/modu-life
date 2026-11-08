import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { comparePearlScore, CURRENT_PEARL_RULES, PEARL_DELAYS, pearlHash, pearlLanes, pearlRank, pearlReward, pearlRoundCount, pearlRounds, readPearlChallenge } from '../src/game/pearl';
import { pearlChallengeUrl } from '../src/game/share';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent } from '../src/game/timelines';
import type { LifeEvent } from '../src/game/types';

describe('Bund lemonade challenge', () => {
 it('shares five deterministic warnings and a score of zero', () => {
  const seed = 'WAIT-4';
  const challenge = readPearlChallenge(pearlHash(seed, 0));
  expect(challenge).toEqual({ seed, target: 0 });
  const lanes = pearlLanes(seed);
  expect(lanes).toHaveLength(5);
  expect([...lanes.slice(0, 3)].sort()).toEqual([0, 1, 2]);
  expect(lanes.slice(1).every((lane, index) => lane !== lanes[index])).toBe(true);
  expect(pearlLanes(challenge!.seed)).toEqual(lanes);
  expect(new Set(['ONE', 'TWO', 'THREE', 'FOUR'].map(value => pearlLanes(value).join(''))).size).toBeGreaterThan(1);
  expect(readPearlChallenge('#timeline=X')).toBeNull();
  expect(readPearlChallenge('#pearl=%3Cscript%3E')).toBeNull();
  expect(readPearlChallenge('#pearl=AA&hits=6')?.target).toBeUndefined();
 });

 it('uses the original five timings for old invites and preserves the six-wave rules in a new receipt', () => {
  const seed = 'RED-SCAN';
  expect(pearlRounds(seed, 1).map(wave => wave.warn)).toEqual(PEARL_DELAYS);
  const hash = pearlHash(seed, 6, 2);
  expect(readPearlChallenge(hash)).toEqual({ seed, target: 6, rules: 2 });
  expect(readPearlChallenge('#pearl=RED-SCAN&hits=6')?.target).toBeUndefined();
  expect(readPearlChallenge('#pearl=RED-SCAN&v=7')).toBeNull();
  const waves = pearlRounds(seed, 2);
  expect(waves).toHaveLength(pearlRoundCount(2));
  expect(waves.map(wave => wave.kind)).toEqual(['single', 'single', 'double', 'lock', 'double', 'lock']);
  expect(waves.filter(wave => wave.kind === 'double').every(wave => [3, 5, 6].includes(wave.mask))).toBe(true);
  expect(waves.filter(wave => wave.kind === 'lock').every(wave => wave.warn - wave.lockAt! >= 600 && wave.mask === 0)).toBe(true);
  expect(pearlRounds(readPearlChallenge(hash)!.seed, 2)).toEqual(waves);
 });

 it('awards a clean run separately from an umbrella save', () => {
  const clean = { hits: 0, blocks: 0 };
  const saved = { hits: 0, blocks: 1 };
  expect(pearlRank(clean)).toBe('一滴没洒');
  expect(pearlRank(saved)).toBe('撑伞也算过关');
  expect(pearlReward({ method: 'run', score: clean }).effect.setFlags).toContain('laser_master');
  expect(pearlReward({ method: 'run', score: saved }).effect.setFlags).not.toContain('laser_master');
  expect(pearlReward({ method: 'run', score: { hits: 3, blocks: 0 } }).effect.health).toBe(-9);
 });

 it('adds two opposite sweeps with a readable first lane and deterministic beats', () => {
  const seed = 'AFTER-RAIN';
  const version = CURRENT_PEARL_RULES;
  expect(pearlRoundCount(version)).toBe(7);
  const waves = pearlRounds(seed, version);
  expect(waves.map(wave => wave.kind)).toEqual(['single', 'single', 'double', 'sweep', 'lock', 'double', 'sweep']);
  const sweeps = waves.filter(wave => wave.kind === 'sweep');
  expect(sweeps[1].order).toEqual([...sweeps[0].order].reverse());
  for (const sweep of sweeps) {
   expect([...sweep.order].sort()).toEqual([0, 1, 2]);
   expect(sweep.mask).toBe(1 << sweep.order[0]);
   expect(sweep.stepMs).toBeGreaterThan(400);
  }
  const link = new URL(pearlChallengeUrl(seed, 7, version, 1));
  expect(link.pathname).toBe('/pearl/');
  expect(readPearlChallenge(link.hash)).toEqual({ seed, target: 7, targetBlocks: 1, rules: 3 });
  expect(readPearlChallenge(pearlHash(seed, 0, version, 0))?.targetBlocks).toBe(0);
  expect(readPearlChallenge('#pearl=AA&v=3&hits=8&blocks=1')?.targetBlocks).toBeUndefined();
  expect(readPearlChallenge('#pearl=AA&v=3&hits=0&blocks=2')?.targetBlocks).toBeUndefined();
  expect(readPearlChallenge('#pearl=AA&v=2&hits=0&blocks=1')?.targetBlocks).toBeUndefined();
 });

 it('compares spills first and only breaks ties by blocks on new receipts', () => {
  expect(comparePearlScore({ hits: 1, blocks: 0 }, 0, 1)).toBeGreaterThan(0);
  expect(comparePearlScore({ hits: 0, blocks: 1 }, 1, 0)).toBeLessThan(0);
  expect(comparePearlScore({ hits: 0, blocks: 1 }, 0)).toBe(0);
  expect(comparePearlScore({ hits: 0, blocks: 0 }, 0, 1)).toBeLessThan(0);
 });

 it('branches from the receipt and carries the choice into the later business', () => {
  const start = createGame('BUND', '小申', 'free', drawOrigins('BUND'));
  const opening = selectEvent(start, 'year');
  const before = resolveChoice(start, opening, '3').state;
  const { effect, text } = pearlReward({ method: 'sleeve' });
  const mini: LifeEvent = {
   id: 'mini-laser', title: '四元柠檬水保卫战', text, category: 'explore', tag: '魔都怪谈',
   choices: [{ id: 'finish', label: '继续', effect, reply: text }],
  };
  const played = resolveChoice(before, mini, 'finish').state;
  expect(played.actions).toBe(2);
  expect(played.cash).toBe(before.cash - 80);
  // The original opening message still comes first.
  const night = streetLead(played)!.event;
  expect(night.id).toBe('first-night-box');
  const visited = resolveChoice(played, night, '1').state;
  const receipt = streetLead(visited)!.event;
  expect(receipt.text).toContain('杯套八十');
  const appealed = resolveChoice(visited, receipt, 'appeal').state;
  expect(appealed.cash).toBe(visited.cash + 4);
  expect(streetLead(appealed)).toBeNull();
  const book = recordDecision(startBook(visited), appealed, receipt, 'appeal');
  const branch = forkLife(book, 0);
  expect(replayScene(activeLine(branch).state, activeLine(branch).replay!)).toEqual(receipt);
  const helped = resolveChoice(activeLine(branch).state, receipt, 'help').state;
  const diverged = recordDecision(branch, helped, receipt, 'help');
  expect(activeLine(diverged).state.flags).toContain('pearl_help');
  expect(activeLine(switchLine(diverged, 0)).state.flags).toContain('pearl_appeal');
  expect(selectEvent({ ...appealed, age: 25, actions: 3 }, 'business').text).toContain('那张小票');
  expect(selectEvent({ ...helped, age: 25, actions: 3 }, 'business').text).toContain('给你留个位置');
  expect(draftFromEvent(receipt, 'appeal', receipt.choices[0].reply, 18, '外滩').turns[0].shot).toBe('/art/pearl/receipt.webp');
  expect(streetLead({ ...visited, flags: ['laser_done'] })).toBeNull();
 });
});
