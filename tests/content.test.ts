import { describe, expect, it } from 'vitest';
import { CAREERS, CAST, DISTRICTS, GOALS, ORIGIN_POOLS } from '../src/game/content';
import { EVENTS } from '../src/game/events';

describe('完整人生内容资产', () => {
  it('提供完整且可寻址的城市、人物、开局与目标', () => {
    expect(DISTRICTS).toHaveLength(6);
    expect(DISTRICTS.every(d => d.hotspots.length === 4)).toBe(true);
    expect(new Set(DISTRICTS.flatMap(d => d.hotspots.map(h => h.id))).size).toBe(24);
    expect(DISTRICTS.flatMap(d => d.hotspots).every(h => h.position.every(n => Math.abs(n) <= 10))).toBe(true);
    expect(CAST).toHaveLength(24);
    expect(new Set(CAST.map(c => c.id)).size).toBe(24);
    expect(CAST.filter(c => c.role === 'romance')).toHaveLength(8);
    expect(CAST.filter(c => c.role === 'romance').every(c => c.ageOffset >= 0)).toBe(true);
    expect(Object.values(ORIGIN_POOLS).every(cards => cards.length === 8)).toBe(true);
    expect(new Set(Object.values(ORIGIN_POOLS).flat().map(c => c.id)).size).toBe(40);
    expect(CAREERS).toHaveLength(8);
    expect(GOALS).toHaveLength(5);
  });

  it('有240个不同正文、合法选择与零现金门槛出口', () => {
    const ids = new Set(CAST.map(c => c.id));
    const jobs = new Set([...CAREERS.map(c => c.id), 'unemployed']);
    expect(EVENTS).toHaveLength(240);
    expect(new Set(EVENTS.map(e => e.id)).size).toBe(240);
    expect(new Set(EVENTS.map(e => e.text)).size).toBe(240);
    for (const event of EVENTS) {
      expect(event.choices.length, event.id).toBe(3);
      expect(event.choices.some(c => (c.effect.cash ?? 0) >= 0), event.id).toBe(true);
      expect(new Set(event.choices.map(c => c.id)).size, event.id).toBe(3);
      if (event.speakerId) expect(ids.has(event.speakerId), event.id).toBe(true);
      if (event.minAge !== undefined) expect(event.minAge, event.id).toBeGreaterThanOrEqual(18);
      if (event.maxAge !== undefined) expect(event.maxAge, event.id).toBeLessThanOrEqual(59);
      for (const c of event.choices) {
        for (const effect of [c.effect, c.check?.success, c.check?.failure].filter(Boolean)) {
          if (effect!.job) expect(jobs.has(effect!.job), event.id).toBe(true);
          if (effect!.housing !== undefined) expect([0,1,2,3].includes(effect!.housing), event.id).toBe(true);
        }
      }
    }
  });

  it('18—59岁每年都有独立事件，八种活动都有通用入口', () => {
    for (let age = 18; age < 60; age++) {
      const annual = EVENTS.find(e => e.id === `year-${age}`);
      expect(annual?.category).toBe('year');
      expect(annual?.minAge).toBe(age);
      expect(annual?.maxAge).toBe(age);
    }
    for (const kind of ['career','romance','rest','learn','housing','social','business','explore']) {
      expect(EVENTS.some(e => e.category === kind && !e.chainId && !e.minAge && !e.requiredFlags?.length), kind).toBe(true);
    }
  });

  it('18条四段故事的任意选择都能推进，前置标记均有来源', () => {
    const chains = [...new Set(EVENTS.filter(e => e.chainId).map(e => e.chainId!))];
    const initialFlags = new Set(Object.values(ORIGIN_POOLS).flat().flatMap(c => c.effect.setFlags ?? []));
    const emitted = new Set([...initialFlags, ...EVENTS.flatMap(e => e.choices.flatMap(c => c.effect.setFlags ?? []))]);
    expect(chains).toHaveLength(18);
    for (const id of chains) {
      const nodes = EVENTS.filter(e => e.chainId === id).sort((a,b) => a.chainStep! - b.chainStep!);
      expect(nodes).toHaveLength(4);
      for (let step = 0; step < 4; step++) {
        const event = nodes[step];
        expect(event.chainStep).toBe(step);
        expect(event.choices.every(c => c.effect.setFlags?.includes(`${id}_${step}`)), event.id).toBe(true);
        expect(event.forbiddenFlags).toContain(`${id}_${step}`);
        if (step) {
          expect(event.requiredFlags).toContain(`${id}_${step-1}`);
          expect(event.minAge!).toBeGreaterThanOrEqual(nodes[step-1].minAge!);
        }
        for (const flag of event.requiredFlags ?? []) expect(emitted.has(flag), `${event.id}: ${flag}`).toBe(true);
      }
    }
  });
});
