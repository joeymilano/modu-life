import { describe, expect, it } from 'vitest';
import { DISTRICTS } from '../src/game/content';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { activeLine, forkLife, recordDecision, startBook } from '../src/game/lifeLines';
import { districtHustle, HUSTLE_LEADS, streetHeatOf } from '../src/game/streetHustles';

describe('码头急单与街头风头系统', () => {
  it('covers all six Shanghai districts with unique fixer dispatches and three valid choices', () => {
    expect(HUSTLE_LEADS.length).toBe(12);
    const ids = new Set(HUSTLE_LEADS.map(h => h.event.id));
    expect(ids.size).toBe(12);
    for (const district of DISTRICTS) {
      const hustles = HUSTLE_LEADS.filter(h => h.district === district.id);
      expect(hustles.length, district.id).toBe(2);
      for (const h of hustles) {
        expect(h.event.id.startsWith('street-hustle-')).toBe(true);
        expect(h.event.choices.length).toBe(3);
        expect(h.event.choices.every(c => (c.effect.cash ?? 0) > 0)).toBe(true);
      }
    }
  });

  it('raises heat on aggressive plays, cools heat on clean plays, and supports timeline branching', () => {
    const base = { ...createGame('HUSTLE', '小申', 'wealth', drawOrigins('HUSTLE')), pendingYearEvent: false, age: 20, district: 'bund' as const };
    const found = districtHustle(base)!;
    expect(found.event.id).toBe('street-hustle-bund-fx');
    expect(streetHeatOf(base).level).toBe(0);

    const aggressive = resolveChoice(base, found.event, 'sprint');
    expect(streetHeatOf(aggressive.state).level).toBeGreaterThanOrEqual(1);
    expect(districtHustle(aggressive.state)).toBeUndefined();

    // Verify timeline fork & replay compatibility via lifeLines
    const book = recordDecision(startBook(base), aggressive.state, found.event, 'sprint');
    const forked = forkLife(book, 0);
    expect(activeLine(forked).replay?.eventId).toBe('street-hustle-bund-fx');

    // Clean choice removes heat
    const cooled = resolveChoice({ ...base, flags: [...base.flags, 'hustle_heat_bund'] }, found.event, 'clean');
    expect(streetHeatOf(cooled.state).level).toBe(0);
  });
});
