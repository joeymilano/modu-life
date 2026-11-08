import type { GameState } from './types';

export const HEIR_CAPITAL_TIER = 'heir-capital-v2';
export const HEIR_PERSONAL_CASH = 60_000_000;
export const HEIR_TERMS = {
 familyCap:80_000, rent:55_000, living:12_000,
 sharePrice:24_000_000, saleProceeds:21_000_000, distribution:12_000_000, dividend:576_000,
};
const legacyTerms: typeof HEIR_TERMS = {
 familyCap:18_000, rent:12_000, living:1_800,
 sharePrice:240_000, saleProceeds:210_000, distribution:1_200_000, dividend:57_600,
};

export function heirTerms(state: Pick<GameState,'flags'>) {
 return state.flags.includes(HEIR_CAPITAL_TIER) ? HEIR_TERMS : legacyTerms;
}

export const familyHousingCap = (state: Pick<GameState,'flags'>) => heirTerms(state).familyCap;
