import type { CampaignRoute } from './campaignScript';
import { SHOWDOWN_AGES, createShowdown, type Showdown } from './showdowns';

export const RANK_ATTEMPTS = 3;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SHANGHAI_OFFSET = 8 * 60 * 60 * 1000;
const DAY_MS = WEEK_MS / 7;
const MONDAY = Date.UTC(2024, 0, 1);

export function rankWeek(time = Date.now()) {
 const local = new Date(time + SHANGHAI_OFFSET);
 local.setUTCHours(0,0,0,0);
 local.setUTCDate(local.getUTCDate() - (local.getUTCDay()+6)%7);
 return local.toISOString().slice(0,10);
}

export function weeklyShowdown(week:string, route:CampaignRoute) {
 const index = Math.round((Date.parse(week) - MONDAY) / WEEK_MS);
 const normalized = (index % 8 + 8) % 8;
 return createShowdown(route,SHOWDOWN_AGES[normalized % SHOWDOWN_AGES.length],false,normalized<4?'terms':'floor');
}

export function priorWeek(week:string) {
 return new Date(Date.parse(week) - WEEK_MS).toISOString().slice(0,10);
}

export function isRankWeek(value:string) {
 const time=Date.parse(value);
 return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(time)&&
  new Date(time).toISOString().slice(0,10)===value&&new Date(time).getUTCDay()===1&&time>=MONDAY;
}

export const rankWeekLabel = (week:string) =>
 week.slice(5).replace('-','/')+'–'+new Date(Date.parse(week)+6*DAY_MS).toISOString().slice(5,10).replace('-','/');

export interface RankedPlayer { id:string; nickname:string }
export interface RankRow extends RankedPlayer { score:number; position:number }
export interface RankedRun { id:string; attempt:number; game:Showdown }
export interface RankBoard {
 week:string;
 current:string;
 previous:string;
 player:RankedPlayer|null;
 mine:RankRow|null;
 rows:RankRow[];
 latest:RankedRun|null;
 challenge:Showdown;
}
