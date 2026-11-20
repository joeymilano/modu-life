import type { DistrictId, Effect } from './types';

export type AbilityId = 'insight' | 'forecast' | 'borrow' | 'combine' | 'seek' | 'resonate';
export type PujiangRoute = 'arrival' | 'worker' | 'heir' | 'system';
export type PujiangEnding = 'independent' | 'together' | 'leave';
export type EpisodeVerdict = 'win' | 'partial' | 'loss';
export interface SystemProgress { learned: AbilityId[]; equipped: AbilityId[]; rewardCash: number; }
export interface EpisodeMove { kind: 'choice' | 'ability'; id: string; target?: string; }
export interface EpisodeReceipt {
 verdict: EpisodeVerdict; title: string; text: string; cash: number; effect: Effect;
 relationships: string[]; next: string; ending?: PujiangEnding;
}
export interface EpisodeRun { id: string; moves: EpisodeMove[]; loadout: AbilityId[]; receipt?: EpisodeReceipt; }
export interface EpisodeChoice {
 id: string; label: string; reply: string; hint: string;
 score?: number; team?: number; budget?: number; cash?: number;
 flags?: string[]; requires?: string; skill?: number; ability?: AbilityId;
 rewardScale?: number; winningFinish?: boolean;
 relation?: [string, number]; ending?: PujiangEnding;
}
export interface EpisodeScene {
 title: string; text: string; secret: string; support: string;
 choices: EpisodeChoice[];
}
export interface EpisodeScript {
 id: string; route: PujiangRoute; age: number; district: DistrictId; title: string; intro: string;
 goal: string; photo: string; budget: number; reward: number; scenes: EpisodeScene[];
 win: string; partial: string; loss: string; next: string;
 commission?: boolean; offline?: boolean;
}
