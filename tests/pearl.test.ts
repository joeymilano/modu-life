import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { pearlHash, pearlLanes, pearlRank, pearlReward, readPearlChallenge } from '../src/game/pearl';
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

 it('awards a clean run separately from an umbrella save', () => {
  const clean = { hits: 0, blocks: 0 };
  const saved = { hits: 0, blocks: 1 };
  expect(pearlRank(clean)).toBe('一滴没洒');
  expect(pearlRank(saved)).toBe('撑伞也算过关');
  expect(pearlReward({ method: 'run', score: clean }).effect.setFlags).toContain('laser_master');
  expect(pearlReward({ method: 'run', score: saved }).effect.setFlags).not.toContain('laser_master');
  expect(pearlReward({ method: 'run', score: { hits: 3, blocks: 0 } }).effect.health).toBe(-9);
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
