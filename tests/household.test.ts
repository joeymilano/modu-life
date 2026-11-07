import { expect, it } from 'vitest';
import { CAST } from '../src/game/content';
import { commitRelationship, createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice } from '../src/game/engine';
import { householdFlag, householdPlan, householdVisit } from '../src/game/household';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';
import { draftFromEvent } from '../src/game/timelines';
import type { GameState, LifeEvent } from '../src/game/types';

function together(person = 'lin'): GameState {
 const state = createGame('KEYS', '小申', 'love', drawOrigins('KEYS'));
 return {
  ...state, age: 27, pendingYearEvent: false, partnerId: person, cash: 180000, housing: 1, leaseRent: 3600,
  seenEvents: ['mini-' + person + '-26-3', 'date-return-' + person],
  relationships: { ...state.relationships, [person]: { met: true, trust: 65, attraction: 57, commitment: 28, memories: [] } },
 };
}

it('waits for a return visit and has a distinct scene for every partner', () => {
 for (const person of CAST.filter(person => person.role === 'romance')) {
  const state = together(person.id);
  const event = householdVisit(state, person.id)!;
  expect(event.speakerId).toBe(person.id);
  expect(event.illustration).toBe('/art/dates/' + person.id + '-home.webp');
  expect(event.choices).toHaveLength(3);
  expect(householdVisit({ ...state, seenEvents: [] }, person.id)).toBeUndefined();
  expect(householdVisit({ ...state, partnerId: null }, person.id)).toBeUndefined();
 }
});

it('shares the lease, forks to standing dates and records the actual annual expenses', () => {
 const state = together();
 const event = householdVisit(state, 'lin')!;
 const shared = resolveChoice(state, event, 'share').state;
 expect(shared.cash).toBe(state.cash - 1600);
 expect(shared.actions).toBe(2);
 expect(shared.leaseRent).toBe(3600);
 expect(householdPlan(shared)).toBe('shared');
 expect(monthlyBudget(shared).rent).toBe(2160);
 expect(nextYear(shared).rentExpense).toBe(25920);
 expect(nextYear(shared).sharedHousing).toBe(true);
 const book = recordDecision(startBook(state), shared, event, 'share', 'lin');
 const line = activeLine(decodeLife(encodeLife(forkLife(book, 0))));
 const alternate = replayScene(line.state, line.replay!)!;
 expect(alternate).toEqual(event);
 const standing = resolveChoice(line.state, alternate, 'standing').state;
 expect(monthlyBudget(standing).rent).toBe(3600);
 expect(monthlyBudget(standing).living).toBe(monthlyBudget(state).living + 120);
 expect(draftFromEvent(event, 'share', '配了钥匙', 27, '莘庄').turns[0].shot).toBe(event.illustration);
 const later = { ...standing, age: 28 };
 expect(nextYear(later).state.relationships.lin.trust).toBe(standing.relationships.lin.trust - 1);
 expect(nextYear({ ...later, flags: [] }).state.relationships.lin.trust).toBe(standing.relationships.lin.trust - 4);
});

it('handles a new lease, year-to-year changes, and moving out', () => {
 const before = { ...together(), housing: 0, leaseRent: undefined };
 const event = householdVisit(before, 'lin')!;
 expect(() => resolveChoice({ ...before, cash: 3000 }, event, 'share')).toThrow();
 const shared = resolveChoice(before, event, 'share').state;
 expect(shared.housing).toBe(1);
 expect(monthlyBudget(shared).rent).toBe(1980);
 expect(shared.cash).toBe(before.cash - 3500);
 expect(householdVisit(shared, 'lin')).toBeUndefined();
 const later = { ...shared, age: 28 };
 const update = householdVisit(later, 'lin')!;
 const continued = resolveChoice(later, update, 'share').state;
 expect(continued.cash).toBe(shared.cash);
 const moved = resolveChoice(later, update, 'standing').state;
 expect(householdPlan(moved)).toBe('standing');
 expect(moved.flags).not.toContain(householdFlag('lin', 'shared'));
 expect(monthlyBudget(moved).rent).toBe(3300);
 const rescue = nextYear({ ...shared, cash: 0 }).state;
 expect(householdPlan(rescue)).toBeUndefined();
 expect(rescue.flags).not.toContain(householdFlag('lin', 'shared'));
});

it('drops household arrangements when the couple splits or changes', () => {
 const state = together();
 const shared = resolveChoice(state, householdVisit(state, 'lin')!, 'share').state;
 const breakup: LifeEvent = {
  id: 'split', category: 'romance', title: '道别', text: '', speakerId: 'lin',
  choices: [{ id: 'leave', label: '分开', reply: '', effect: { love: false } }],
 };
 const apart = resolveChoice(shared, breakup, 'leave').state;
 expect(apart.partnerId).toBeNull();
 expect(apart.flags).not.toContain(householdFlag('lin', 'shared'));
 expect(monthlyBudget(apart).rent).toBe(3600);
 const qiReady = { ...shared, relationships: { ...shared.relationships, qiao: { ...shared.relationships.lin } } };
 const changed = commitRelationship(qiReady, 'qiao');
 expect(changed.partnerId).toBe('qiao');
 expect(changed.flags).not.toContain(householdFlag('lin', 'shared'));
});
