import type { YearReceipt } from './yearReceipt';

export type DistrictId = 'bund' | 'anfu' | 'people' | 'lujiazui' | 'zhangjiang' | 'xinzhuang';
export type ActivityKind = 'career' | 'romance' | 'rest' | 'learn' | 'housing' | 'social' | 'business' | 'explore';
export type StatKey = 'health' | 'spirit' | 'skill' | 'face' | 'network';
export type GoalId = 'wealth' | 'love' | 'craft' | 'free' | 'community';
export type OriginSlot = '出身' | '家底' | '天赋' | '牵绊' | '秘密';
export type Gender = 'female' | 'male';
export type LooksLevel = 'everyday' | 'charming' | 'stunning';
export interface PlayerAppearance { gender: Gender; looks: LooksLevel; }
export interface Effect {
 cash?: number; health?: number; spirit?: number; skill?: number; face?: number; network?: number;
 trust?: number; attraction?: number; commitment?: number;
 payRate?: number; leaseRent?: number;
 setFlags?: string[]; removeFlags?: string[]; job?: string; housing?: number; love?: boolean; romanticInvitation?: boolean;
}
export interface EventChoice {
 id: string; label: string; hint?: string; senderId?: string; effect: Effect; reply: string;
 check?: { stat: StatKey; threshold: number; success: Effect; failure: Effect; successText: string; failureText: string };
}
export type FirstDatePicks = readonly [number, number];
export interface LifeEvent {
 id: string; title: string; text: string; speakerId?: string; illustration?: string; category: ActivityKind | 'year';
 district?: DistrictId; minAge?: number; maxAge?: number; requiredFlags?: string[]; forbiddenFlags?: string[];
 once?: boolean; chainId?: string; chainStep?: number; choices: EventChoice[]; tag?: string; weight?: number;
 firstDate?: FirstDatePicks; rentalEvidence?: number;
}
export interface OriginCard { id: string; slot: OriginSlot; name: string; rarity: 'SSR'|'SR'|'R'|'N'; subtitle: string; description: string; tag: string; accent: string; effect: Effect; }
export interface CastMember { id: string; name: string; ageOffset: number; title: string; district: DistrictId; role: 'romance'|'friend'|'family'|'rival'|'mentor'; description: string; trait: 'sincerity'|'ambition'|'freedom'|'security'|'humor'; color: string; gender: 'female'|'male'; }
export interface Hotspot { id: string; name: string; kind: ActivityKind; position: [number,number]; caption: string; }
export interface District { id: DistrictId; name: string; en: string; subtitle: string; color: string; hotspots: Hotspot[]; }
export interface Career { id: string; name: string; entry: string; salary: number; ranks: string[]; thresholds: number[]; color: string; description: string; }
export interface Goal { id: GoalId; name: string; subtitle: string; description: string; }
export interface Relationship { attraction: number; trust: number; commitment: number; met: boolean; memories: string[]; }
export interface JournalEntry { age: number; title: string; text: string; tag: string; receipt?: YearReceipt; }
export interface Employment { sinceAge: number; reviews: number; reviewedAt?: number; rate: number; closedMonths: number; earned: number; }
export interface GameState {
 version: 1; seed: string; rng: number; name: string; age: number; actions: number; goal: GoalId;
 appearance: PlayerAppearance;
 district: DistrictId; cash: number; stats: Record<StatKey,number>; jobId: string|null; jobRank: number; housing: number; leaseRent?: number;
 employment?: Employment;
 origins: string[]; flags: string[]; seenEvents: string[]; relationships: Record<string,Relationship>; partnerId: string|null;
 journal: JournalEntry[]; pendingYearEvent: boolean; ended: boolean; totalEarned: number; yearsEmployed: number; rescues: number;
}
export interface ChoiceResult { state: GameState; title: string; text: string; effect: Effect; success?: boolean; }

