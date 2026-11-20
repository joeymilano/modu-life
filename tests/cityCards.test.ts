import { describe, expect, it } from 'vitest';
import { CITY_PITY, CITY_RATES, cityDrawHistory, cityTickets } from '../src/game/cityCards';
import { createGame, drawCityCards, drawOrigins, nextYear, validateSave } from '../src/game/engine';
import { decodeLife, encodeLife, startBook } from '../src/game/lifeLines';

function newLife() {
  const seed = 'STREETCARDS';
  return { ...createGame(seed, '小申', 'craft', drawOrigins(seed)), pendingYearEvent: false };
}

describe('street cards', () => {
  it('consumes the welcome ticket once and grants the next ticket on annual settlement', () => {
    const game = newLife();
    expect(cityTickets(game)).toBe(1);
    const drawn = drawCityCards(game, 1);
    expect(drawn.cityDraws).toBe(1);
    expect(drawn.rng).toBe(game.rng);
    expect(drawn.actions).toBe(game.actions);
    expect(game.cityDraws).toBeUndefined();
    expect(cityTickets(drawn)).toBe(0);
    expect(() => drawCityCards(drawn, 1)).toThrow('抽奖券不够');
    expect(cityTickets(nextYear(drawn).state)).toBe(1);
  });

  it('produces the same collection and awards in a batch, as single draws, and after reload', () => {
    const game = { ...newLife(), age: 22 };
    const batch = drawCityCards(game, 5);
    let single = game;
    for (let index = 0; index < 5; index++) single = drawCityCards(single, 1);
    expect(single).toEqual(batch);
    const reloaded = decodeLife(JSON.parse(JSON.stringify(encodeLife(startBook(batch))))).lines[0].state;
    expect(reloaded.cityDraws).toBe(5);
    expect(cityTickets(reloaded)).toBe(0);
    expect(reloaded.cash).toBe(batch.cash);
    expect(reloaded.stats).toEqual(batch.stats);
    expect(() => validateSave({ ...game, cityDraws: 6 })).toThrow('抽卡记录无效');
  });

  it('guarantees SS or SSS by the tenth draw, even in a batch', () => {
    expect(Object.values(CITY_RATES).reduce((sum, value) => sum + value, 0)).toBe(100);
    let guarantees = 0;
    for (let seed = 0; seed < 100; seed++) {
      const { cards } = cityDrawHistory(String(seed), 42);
      let misses = 0;
      for (const card of cards) {
        if (misses === CITY_PITY - 1) {
          expect(['SS', 'SSS']).toContain(card.rarity);
          guarantees++;
        }
        misses = ['SS', 'SSS'].includes(card.rarity) ? 0 : misses + 1;
      }
    }
    expect(guarantees).toBeGreaterThan(0);
  });
});
