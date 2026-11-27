import { describe, expect, it } from 'vitest';
import { SHANGHAI_START } from '../src/game/calendar';
import { createGame, drawOrigins, ending, nextYear, validateSave } from '../src/game/engine';
import {
  buyEmpireAsset,
  empireAssetValue,
  empireDividend,
  ownedBusinesses,
  ownsEmpirePenthouse,
  sellEmpireAsset,
} from '../src/game/empire';
import { validYearReceipt } from '../src/game/yearReceipt';

describe('Modu Empire business & luxury asset system', () => {
  function readyGame(cash = 50_000_000, age = 30) {
    const base = createGame('EMPIRE-TEST', '申老板', 'wealth', drawOrigins('EMPIRE-TEST'));
    return {
      ...base,
      calendar: SHANGHAI_START,
      age,
      cash,
      pendingYearEvent: false,
    };
  }

  it('allows any origin to buy cash-flowing businesses and settles dividends cleanly in YearReceipt', () => {
    let state = readyGame(2_000_000, 28); // Year = 2002
    state = buyEmpireAsset(state, 'stall');
    state = buyEmpireAsset(state, 'cafe');
    state = buyEmpireAsset(state, 'club');

    expect(ownedBusinesses(state)).toHaveLength(3);
    expect(empireDividend(state)).toBe(9_600 + 32_000 + 235_000);
    expect(empireAssetValue(state)).toBe(38_000 + 128_000 + 980_000);
    expect(validateSave(state)).toBeTruthy();

    // Add street heat and verify club cools 1 heat flag on nextYear and pays exact dividend
    state = { ...state, flags: [...state.flags, 'hustle_heat_bund'] };
    const settled = nextYear(state);
    expect(settled.receipt.empireIncome).toBe(276_600);
    expect(validYearReceipt(settled.receipt)).toBe(true);
    expect(settled.state.flags).not.toContain('hustle_heat_bund');
    expect(validateSave(settled.state)).toBeTruthy();
  });

  it('upgrades housing to own-home on estate purchase, triggers penthouse moment, and supports resale', () => {
    let state = readyGame(40_000_000, 35); // Year = 2009
    expect(state.housing).toBeLessThan(3);

    state = buyEmpireAsset(state, 'penthouse');
    expect(state.housing).toBe(3);
    expect(ownsEmpirePenthouse(state)).toBe(true);

    const settled = nextYear(state);
    expect(settled.receipt.moment).toBe('penthouse');
    expect(validYearReceipt(settled.receipt)).toBe(true);

    const resold = sellEmpireAsset({ ...settled.state, pendingYearEvent: false }, 'penthouse');
    expect(ownsEmpirePenthouse(resold)).toBe(false);
    expect(resold.housing).toBe(1);
    expect(validateSave(resold)).toBeTruthy();
  });

  it('unlocks the Shanghai Syndicate kingpin ending when net worth >= 10M with 3+ businesses', () => {
    let state = readyGame(15_000_000, 40); // Year = 2014
    state = buyEmpireAsset(state, 'stall');
    state = buyEmpireAsset(state, 'cafe');
    state = buyEmpireAsset(state, 'compute');
    const finalState = { ...state, age: 60, ended: true };
    expect(ending(finalState).id).toBe('kingpin');
  });
});
