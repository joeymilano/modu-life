import { STALL_MAX_WASTE, STALL_ORDER_COUNT, type StallSchedule, type StallScore } from './stall';
import { SITE_URL } from './site';

export const STALL_PATH = '/stall/';
export type StallChallenge = { seed: string; schedule: StallSchedule; target?: StallScore };

export function stallChallengeHash({ seed, schedule, target }: StallChallenge) {
 const params = new URLSearchParams({ v: '1', s: seed, d: String(schedule) });
 if (target) {
  params.set('n', String(target.served));
  params.set('w', String(target.waste));
 }
 return '#' + params.toString();
}

export function stallChallengeUrl(challenge: StallChallenge) {
 const url = new URL(STALL_PATH, SITE_URL);
 url.hash = stallChallengeHash(challenge);
 return url.toString();
}

export function readStallChallenge(hash: string): StallChallenge | null {
 const params = new URLSearchParams(hash.replace(/^#/, ''));
 const seed = params.get('s'), schedule = params.get('d');
 if (params.get('v') !== '1' || !seed || seed.length > 32 || (schedule !== '0' && schedule !== '1')) return null;
 const challenge: StallChallenge = { seed, schedule: schedule === '1' ? 1 : 0 };
 const n = params.get('n'), w = params.get('w');
 if (n === null && w === null) return challenge;
 if (n === null || w === null || !/^\d{1,2}$/.test(n) || !/^\d{1,2}$/.test(w)) return null;
 const served = Number(n), waste = Number(w);
 if (served > STALL_ORDER_COUNT || waste > STALL_MAX_WASTE) return null;
 return { ...challenge, target: { served, waste } };
}

export function compareStallScores(player: StallScore, friend: StallScore) {
 return player.served - friend.served || friend.waste - player.waste;
}
