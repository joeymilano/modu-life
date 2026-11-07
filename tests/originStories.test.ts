import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, nextYear, rerollOrigin, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine } from '../src/game/lifeLines';
import { LOAN_DUE, openingLead, openingStory } from '../src/game/originStories';
import { challengeUrl, readChallenge } from '../src/game/share';
import { streetLead } from '../src/game/streetLeads';
import { draftFromEvent } from '../src/game/timelines';
import { LONG_COMMUTE, monthlySalary, moveJob } from '../src/game/employment';

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
  expect(openingStory([a])?.event.id).not.toBe(expected.id);
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

 it.each([
  ['rich', 'badge', 'trade'],
  ['local', 'knock', null],
  ['migrant', 'shift', 'service'],
  ['scholar', 'staff', 'public'],
  ['suburb', 'near', 'service'],
  ['return', 'trade', 'trade'],
  ['trade', 'open', 'business'],
  ['artist', 'fix', null],
 ])('gives %s a playable scene when no combination matches', (origin, pick, job) => {
  const selected = ['born-' + origin, 'fund-savings', 'talent-fit', 'tie-free', 'secret-kind'];
  const state = start(selected);
  const event = openingLead(state)!.event;
  expect(event.id).toBe('origin-arrival-' + origin);
  expect(event.illustration).toBe('/art/opening/arrival-' + origin + '.webp');
  expect(event.choices).toHaveLength(3);
  const result = resolveChoice(state, event, pick, event.speakerId);
  expect(result.state.jobId).toBe(job);
  expect(result.state.actions).toBe(state.actions - 1);
  expect(openingLead(result.state)).toBeUndefined();
  expect(draftFromEvent(event, pick, result.text, 18, '上海').turns[0].shot).toBe(event.illustration);
  const original = recordDecision(startBook(state), result.state, event, pick, event.speakerId);
  const line = activeLine(decodeLife(encodeLife(forkLife(original, 0))));
  expect(replayScene(line.state, line.replay!)).toEqual(event);
 });

 it('keeps a combination in place of the ordinary birth story', () => {
  const state = start(['born-rich', 'fund-frozen', 'tie-free', 'secret-kind']);
  const first = openingLead(state)!.event;
  expect(first.id).toBe('origin-garage');
  expect(openingLead(resolveChoice(state, first, 'leave', first.speakerId).state)).toBeUndefined();
 });

 it('pays more across the river and applies the commute each year on that job', () => {
  const state = start(['born-suburb', 'fund-savings', 'talent-fit', 'tie-free', 'secret-kind']);
  const event = openingLead(state)!.event;
  const near = resolveChoice(state, event, 'near', event.speakerId).state;
  const far = resolveChoice(state, event, 'far', event.speakerId).state;
  expect(monthlySalary(far) - monthlySalary(near)).toBe(1500);
  expect(far.flags).toContain(LONG_COMMUTE);
  const annual = nextYear(far);
  const localComparison = nextYear({ ...far, flags: far.flags.filter(flag => flag !== LONG_COMMUTE) });
  expect(annual.income - nextYear(near).income).toBe(18000);
  expect(localComparison.state.stats.health - annual.state.stats.health).toBe(5);
  expect(localComparison.state.stats.spirit - annual.state.stats.spirit).toBe(3);
  expect(annual.notice).toContain('过江那趟');
  moveJob(far, 'creative');
  expect(far.flags).not.toContain(LONG_COMMUTE);
 });
});
