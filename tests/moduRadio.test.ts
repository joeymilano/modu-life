import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins } from '../src/game/engine';
import { MODU_STATIONS, stationForTrack, streetCredOf, streetWireOf } from '../src/game/moduRadio';
import { SOUNDTRACK } from '../src/game/soundtrack';

describe('魔都电台与腔势系统', () => {
  it('maps every soundtrack file to a distinct Shanghai FM station', () => {
    expect(MODU_STATIONS.length).toBe(Object.keys(SOUNDTRACK).length);
    const freqs = new Set(MODU_STATIONS.map(s => s.freq));
    expect(freqs.size).toBe(MODU_STATIONS.length);
    for (const song of Object.values(SOUNDTRACK)) {
      expect(stationForTrack(song.file).freq).toMatch(/^FM \d/);
    }
  });

  it('computes street cred stars and reactive district wire without mutating game state', () => {
    const base = createGame('GTA-SH', '小申', 'wealth', drawOrigins('GTA-SH'));
    const snapshot = JSON.stringify(base);
    const low = streetCredOf({ ...base, cash: 500, stats: { ...base.stats, face: 15, network: 10 } });
    const high = streetCredOf({ ...base, cash: 2_000_000, stats: { ...base.stats, face: 90, network: 85 } });
    expect(low.stars).toBe(1);
    expect(high.stars).toBe(5);
    const wire1 = streetWireOf({ ...base, calendar: 1992 }, 0);
    const wire2 = streetWireOf({ ...base, calendar: 1992 }, 1);
    expect(wire1.era[0]).toContain('92');
    expect(wire1.text).not.toBe(wire2.text);
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});
