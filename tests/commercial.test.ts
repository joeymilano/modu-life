import { describe, expect, it } from 'vitest';
import { SHANGHAI_START } from '../src/game/calendar';
import {
  activateBlackCard,
  claimDailySupply,
  claimPassTier,
  claimSponsorReward,
  defaultMeta,
  generateLicenseKey,
  hasMarketInsider,
  nextYearQuoteForecast,
  passLevelOf,
  syncGameAchievements,
  useTacticalSupply,
  verifyBlackCardCode,
} from '../src/game/commercial';
import { createGame, drawOrigins, validateSave } from '../src/game/engine';

describe('Commercial Season Pass, Black Card VIP & Tactical Supplies', () => {
  it('generates and verifies cryptographic Black Card license keys', () => {
    const key = generateLicenseKey('8899');
    expect(key).toMatch(/^MODU-8899-[0-9A-F]{4}$/);
    expect(verifyBlackCardCode(key)).toBe(true);
    expect(verifyBlackCardCode('MODU-1992-VIP')).toBe(true);
    expect(verifyBlackCardCode('MODU-8899-0000')).toBe(false);

    const meta = activateBlackCard(defaultMeta(), key, new Date('2026-11-26T10:00:00Z'));
    expect(meta.blackCard).toBe(true);
    expect(meta.activeTitle).toBe('创始黑卡名流');
    expect(passLevelOf(meta.xp).level).toBeGreaterThanOrEqual(2);
  });

  it('handles daily streak check-ins, sponsor cooldowns, and Season Pass tier claims', () => {
    let meta = defaultMeta();
    const day1 = new Date('2026-11-25T09:00:00');
    const day2 = new Date('2026-11-26T09:00:00');

    const first = claimDailySupply(meta, day1);
    expect(first.meta.checkin.streak).toBe(1);
    expect(() => claimDailySupply(first.meta, day1)).toThrow(/已经领过/);

    const second = claimDailySupply(first.meta, day2);
    expect(second.meta.checkin.streak).toBe(2);

    const sponsored = claimSponsorReward(second.meta, 0, 1_000_000);
    expect(() => claimSponsorReward(sponsored.meta, 0, 1_010_000)).toThrow(/冷却中/);

    // Grant enough XP for Lv.3 and claim free + pro tracks
    let leveled = { ...sponsored.meta, xp: 500 };
    leveled = claimPassTier(leveled, 1, 'free');
    expect(leveled.claimedFreeTiers).toContain(1);
    expect(() => claimPassTier(leveled, 1, 'pro')).toThrow(/创始黑卡/);

    leveled = activateBlackCard(leveled, 'MODU-1992-VIP', day2);
    leveled = claimPassTier(leveled, 1, 'pro');
    expect(leveled.claimedProTiers).toContain(1);
  });

  it('applies tactical supplies in-game without breaking validateSave and unlocks market insider forecast', () => {
    const base = createGame('META-PLAY', '阿杰', 'wealth', drawOrigins('META-PLAY'));
    let game = {
      ...base,
      calendar: SHANGHAI_START,
      cash: 2_500_000,
      pendingYearEvent: false,
      flags: [...base.flags, 'hustle_heat_bund'],
    };
    let meta = { ...defaultMeta(), supplies: { prClear: 1, headhunter: 1, insider: 1, bonusReroll: 1 } };

    // Sync achievements for 2.5M net worth
    const synced = syncGameAchievements(meta, game);
    expect(synced.newlyUnlocked.map(a => a.id)).toEqual(expect.arrayContaining(['first_pot', 'bund_millionaire']));
    meta = synced.meta;

    // Clear heat with PR supply
    const pr = useTacticalSupply(meta, game, 'prClear');
    expect(pr.game.flags).not.toContain('hustle_heat_bund');
    expect(pr.meta.supplies.prClear).toBe(0);
    game = pr.game;
    meta = pr.meta;

    // Unlock market insider for current year
    expect(hasMarketInsider(meta, game)).toBe(false);
    const ins = useTacticalSupply(meta, game, 'insider');
    expect(hasMarketInsider(ins.meta, ins.game)).toBe(true);
    const forecast = nextYearQuoteForecast(ins.game, 'sh_trade');
    expect(forecast.current).toBeGreaterThan(0);
    expect(forecast.next).toBeGreaterThan(0);
    expect(validateSave(ins.game)).toBeTruthy();
  });
});
