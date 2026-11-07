import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, nextYear, rerollOrigin, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { LOAN_DUE, openingLead, openingStory } from '../src/game/originStories';
import { challengeUrl, readChallenge } from '../src/game/share';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent } from '../src/game/timelines';

const lookup = (id: string) => allOrigins().find(card => card.id === id)!;

function start(ids: string[]) {
 const cards = drawOrigins('OPENING').map(card => {
  const replacement = ids.map(lookup).find(picked => picked.slot === card.slot);
  return replacement ?? card;
 });
 const before = createGame('OPENING', '小申', 'free', cards);
 return resolveChoice(before, selectEvent(before, 'year'), '3').state;
}

describe('opening combinations', () => {
 it.each([
  ['born-rich', 'fund-frozen', 'garage'],
  ['born-local', 'secret-local', 'dialect'],
  ['born-artist', 'secret-title', 'portfolio'],
  ['fund-debt', 'secret-money', 'bank'],
  ['fund-room', 'tie-pet', 'cat'],
 ])('finds the story for %s and %s', (a,b,photo) => {
  const before = start([a,b]);
  const expected = openingStory([a,b])!.event;
  expect(expected.illustration).toBe('/art/opening/' + photo + '.webp');
  expect(openingStory([a])).toBeUndefined();
  expect(openingLead(before)?.event).toEqual(expected);
  expect(openingLead({ ...before, age: 19 })).toBeUndefined();
  expect(streetLead(before)?.event.id).toBe('first-night-box');
  const choice = expected.choices[0].id;
  const result = resolveChoice(before, expected, choice, expected.speakerId);
  expect(result.state.actions).toBe(2);
  expect(openingLead(result.state)).toBeUndefined();
  expect(draftFromEvent(expected, choice, result.text, 18, '上海').turns[0].shot).toBe(expected.illustration);
  const played = recordDecision(startBook(before), result.state, expected, choice, expected.speakerId);
  const restored = decodeLife(JSON.parse(JSON.stringify(encodeLife(played))));
  const alternate = forkLife(restored, 0);
  const replay = replayScene(activeLine(alternate).state, activeLine(alternate).replay!);
  expect(replay).toEqual(expected);
  const other = resolveChoice(activeLine(alternate).state, replay!, expected.choices[2].id);
  expect(other.text).not.toBe(result.text);
  expect(activeLine(switchLine(alternate, 0)).state).toEqual(result.state);
 });

 it('queues both stories when one hand contains two combinations', () => {
  const before = start(['born-local', 'secret-local', 'fund-room', 'tie-pet']);
  const first = openingLead(before)!.event;
  expect(first.id).toBe('origin-dialect');
  const next = resolveChoice(before, first, 'plain').state;
  expect(openingLead(next)?.event.id).toBe('origin-cat');
 });

 it('charges the deferred loan once and shows it separately from living costs', () => {
  const before = start(['fund-debt', 'secret-money']);
  const event = openingLead(before)!.event;
  const postponed = resolveChoice(before, event, 'plan').state;
  expect(postponed.cash).toBe(before.cash);
  expect(postponed.flags).toContain(LOAN_DUE);
  const paid = resolveChoice(before, event, 'pay').state;
  const later = nextYear(postponed);
  expect(later.repayment).toBe(4800);
  expect(later.state.flags).not.toContain(LOAN_DUE);
  expect(later.state.cash).toBe(nextYear(paid).state.cash);
  expect(later.note).toContain('助学贷款已扣');
  expect(nextYear({ ...later.state, pendingYearEvent: false }).repayment).toBe(0);
 });

 it('never redraws the same card and shares the exact replacement before starting', () => {
  const state = start(['born-rich', 'fund-frozen']);
  const old = lookup('fund-frozen');
  const replaced = rerollOrigin(state.seed, 1, old);
  expect(replaced.id).not.toBe(old.id);
  expect(replaced.slot).toBe(old.slot);
  expect(rerollOrigin(state.seed, 1, old).id).toBe(replaced.id);
  const hand = { ...state, origins: state.origins.map(id => id === old.id ? replaced.id : id) };
  const shared = readChallenge(new URL(challengeUrl(hand)).searchParams);
  expect(shared?.cards.map(card => card.id)).toEqual(hand.origins);
  expect(openingStory(hand.origins)?.event.id).not.toBe('origin-garage');
 });
});
