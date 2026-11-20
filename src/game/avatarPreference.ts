import type { PlayerAppearance } from './types';

const AVATAR_KEY = 'modu-life-avatar';
const DEFAULT_AVATAR: PlayerAppearance = { gender: 'female', looks: 'stunning' };

export function loadAvatarPreference(fallback = DEFAULT_AVATAR): PlayerAppearance {
  try {
    const value = JSON.parse(localStorage.getItem(AVATAR_KEY) ?? 'null');
    if ((value?.gender === 'male' || value?.gender === 'female') &&
        (value.looks === 'everyday' || value.looks === 'charming' || value.looks === 'stunning')) {
      return { gender: value.gender, looks: value.looks };
    }
  } catch {}
  return fallback;
}

export function saveAvatarPreference(value: PlayerAppearance) {
  try { localStorage.setItem(AVATAR_KEY, JSON.stringify(value)); } catch {}
}
