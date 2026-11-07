import { expect, it } from 'vitest';
import { compareStallScores, readStallChallenge, stallChallengeHash, stallChallengeUrl } from '../src/game/stallChallenge';
import { stallSchedule, startStall } from '../src/game/stall';

it('preserves the exact life shift and its score when a friend opens the link', () => {
 const seed = '弄堂 A&7';
 const schedule = stallSchedule(seed, 29, 2);
 const original = { seed, schedule, target: { served: 8, waste: 0 } };
 const url = new URL(stallChallengeUrl(original));
 expect(url.pathname).toBe('/stall/');
 const decoded = readStallChallenge(url.hash)!;
 expect(decoded).toEqual(original);
 expect(startStall(decoded.schedule)).toEqual(startStall(schedule));
 expect(readStallChallenge(stallChallengeHash({ seed, schedule }))).toEqual({ seed, schedule });
});

it.each([
 '#v=9&s=PAN&d=0', '#v=1&d=0', '#v=1&s=PAN&d=2',
 '#v=1&s=PAN&d=0&n=9&w=0', '#v=1&s=PAN&d=0&n=0&w=29',
 '#v=1&s=PAN&d=0&n=0', '#v=1&s=PAN&d=0&n=0.5&w=0', '#v=1&s=PAN&d=0&n=0&w=-1',
])('rejects malformed challenge %s', hash => expect(readStallChallenge(hash)).toBeNull());

it('compares orders served before checking waste', () => {
 expect(compareStallScores({ served: 7, waste: 5 }, { served: 6, waste: 0 })).toBeGreaterThan(0);
 expect(compareStallScores({ served: 7, waste: 1 }, { served: 7, waste: 3 })).toBeGreaterThan(0);
 expect(compareStallScores({ served: 7, waste: 3 }, { served: 7, waste: 1 })).toBeLessThan(0);
 expect(compareStallScores({ served: 8, waste: 0 }, { served: 8, waste: 0 })).toBe(0);
});
