import type { Beat } from './dialogue';
import type { DistrictId, Effect, StatKey } from './types';

export type AbilityId = 'insight' | 'forecast' | 'borrow' | 'combine' | 'seek' | 'resonate';
export type PujiangRoute = 'arrival' | 'worker' | 'heir' | 'system';
export type PujiangEnding = 'independent' | 'together' | 'leave';
export type EpisodeVerdict = 'win' | 'partial' | 'loss';
export type Tag = '刚' | '稳' | '奇' | '情' | '赌' | '终结技';
export interface SystemProgress { learned: AbilityId[]; equipped: AbilityId[]; rewardCash: number; }
export interface EpisodeMove { kind: 'choice' | 'ability'; id: string; target?: string; luck?: 'hit' | 'miss'; }
export interface EpisodeReceipt {
 verdict: EpisodeVerdict; title: string; text: string; cash: number; effect: Effect;
 relationships: string[]; next: string; ending?: PujiangEnding;
}
export interface EpisodeRun { id: string; moves: EpisodeMove[]; loadout: AbilityId[]; receipt?: EpisodeReceipt; }
/** A gamble is settled by one stat; the roll is written into the move so a reload reads the same outcome. */
export interface EpisodeGamble { stat: StatKey; need: number; miss?: Beat[] }
export interface EpisodeChoice {
 id: string; label: string; reply: string; hint: string;
 tag?: Tag; react?: Beat[];
 /** What the option is worth before any roll. */
 score?: number; team?: number; budget?: number; cash?: number;
 flags?: string[]; requires?: string; need?: string; skill?: number; ability?: AbilityId;
 rewardScale?: number; winningFinish?: boolean;
 relation?: [string, number]; ending?: PujiangEnding; gamble?: EpisodeGamble;
}
export interface EpisodeScene {
 title: string; text: string; secret: string; support: string;
 stage: { bg: string; place?: string; clock?: string }; beats: Beat[]; prompt: string;
 /** What the other side says when the player lets the clock run out. */
 stall: { who: string; text: string };
 choices: EpisodeChoice[];
}
export interface EpisodeScript {
 id: string; route: PujiangRoute; age: number; district: DistrictId; title: string; teaser: string;
 goal: string; photo: string; budget: number; reward: number; scenes: EpisodeScene[];
 win: string; partial: string; loss: string; next: string;
 commission?: boolean; offline?: boolean;
 /** Seconds to answer before the other side cuts in. */
 pressure: number;
}
