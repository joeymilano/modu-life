import type { DistrictId, LifeEvent, LooksLevel, PlayerAppearance } from './types';
export const LOOKS:{id:LooksLevel;name:string;line:string;flavor:string;face:number;attraction:number}[]=[
 {id:'everyday',name:'普通耐看',line:'地铁闸机都不会多看你一眼',flavor:'无外貌加成',face:0,attraction:0},
 {id:'charming',name:'颇有姿色',line:'出门常被问路，偶尔被要微信',flavor:'有点回头率',face:8,attraction:3},
 {id:'stunning',name:'惊艳全场',line:'路过咖啡店，主理人亲自开门',flavor:'回头率超标',face:16,attraction:6},
];
const agedHeads = new Set(['mao', 'he', 'lu']);
const contactPortraits = new Set(['tang', 'wu', 'fang', 'boss', 'gao']);

export function portraitArt(id: string, full: boolean, age = 18): string {
 const aged = age >= 53 && agedHeads.has(id);
 if (full && aged) return '/art/endings/farewell-' + id + '.webp';
 const stage = aged || (contactPortraits.has(id) && age >= 53) ? '-senior' : contactPortraits.has(id) && age >= 32 ? '-midlife' : '';
 return '/art/portraits/' + (full ? '' : 'head/') + id + stage + '.webp';
}

export function playerArt(appearance: PlayerAppearance, full = true, age = 18): string {
 const stage = age >= 53 ? '-senior' : age >= 32 ? '-midlife' : '';
 return portraitArt('player-' + appearance.gender + '-' + appearance.looks + stage, full);
}

export const LIFE_ALBUM_AGES = [18, 46, 60] as const;

export const CONTACT_STILLS = ['wu-regulars', 'wu-corner', 'fang-deposit', 'fang-handover', 'boss-reference', 'boss-night-class'] as const;
export type ContactShot = (typeof CONTACT_STILLS)[number];

export function contactPhoto(shot: ContactShot) {
 return `/art/contacts/${shot}.webp`;
}

const endingScenes: Record<string, string> = {
 million: 'wealth', comfortable: 'wealth', love: 'love', companions: 'love',
 master: 'craft', maker: 'craft', reset: 'craft', free: 'river', ordinary: 'river',
 community: 'community', friends: 'community', comeback: 'comeback',
};

export function endingPhoto(endingId: string): string {
 return `/art/endings/${endingScenes[endingId] ?? 'river'}.webp`;
}

export const LIFE_YEARS_STILLS = ['daywork-mid','daywork-final','heir-mid','heir-final'] as const;

export function lifeYearsPhoto(shot: (typeof LIFE_YEARS_STILLS)[number]) {
 return `/art/endings/life-${shot}.webp`;
}

export function farewellPhoto(person: 'mao' | 'he' | 'lu'): string {
 return `/art/endings/farewell-${person}.webp`;
}

export function datePhoto(personId: string, scene: 'meeting' | 'middle' | 'parting' | 'return' | 'home'): string {
 return `/art/dates/${personId}-${scene}.webp`;
}

export type WorkPhoto = 'reorg' | 'overtime' | 'shift' | 'invoice' | 'return' | 'interview-office' | 'interview-shop' | 'payroll' | 'settlement';

export function workPhoto(shot: WorkPhoto): string {
 return `/art/work/${shot}.webp`;
}

export function handoverPhoto(careerId: string): string {
 return `/art/work/start-${careerId}.webp`;
}

export function originPhoto(cardId: string): string {
 return `/art/origins/${cardId}.webp`;
}

export function interviewPhoto(careerId: string): string {
 return `/art/interviews/${careerId}.webp`;
}

export function offerPhoto(careerId: string): string {
 return `/art/job-offers/${careerId}.webp`;
}

export function stallPhoto(shot: 'counter' | 'sheng' | 'guo' | 'rush' | 'close' | 'burnt' | 'empty' | 'hero' | 'receipt-clean' | 'receipt-rush') {
 return `/art/stall/${shot}.webp`;
}

export function pearlPhoto(shot: 'arena' | 'hero' | 'receipt' | 'booth' | 'night-office' | 'clean' | 'spill' | 'umbrella'): string {
 return `/art/pearl/${shot}.webp`;
}

export function pearlRunner(appearance: PlayerAppearance): string {
 return `/art/pearl/runners/${appearance.gender}-${appearance.looks}.webp`;
}

export const TIMELINE_COVER = '/art/timelines/ferry.webp';

export const OPENING_STILLS = [
 'garage', 'dialect', 'portfolio', 'bank', 'cat',
 'daywork-gate', 'daywork-pay', 'heir-keys', 'heir-board',
 'arrival-rich', 'arrival-local', 'arrival-migrant', 'arrival-scholar',
 'arrival-suburb', 'arrival-return', 'arrival-trade', 'arrival-artist',
] as const;

export function openingPhoto(shot: (typeof OPENING_STILLS)[number]): string {
 return '/art/opening/' + shot + '.webp';
}

export const TABLE_STILLS = ['folded-table', 'table-inside', 'empty-chair'] as const;

export function tablePhoto(shot: (typeof TABLE_STILLS)[number]): string {
 return '/art/long-table/' + shot + '.webp';
}

export const FERRY_STILLS = ['cake', 'cabin', 'booth'] as const;

export function ferryPhoto(shot: (typeof FERRY_STILLS)[number]): string {
 return '/art/night-ferry/' + shot + '.webp';
}

export const RENTAL_STILLS = ['room', 'wall', 'contract', 'window', 'talk', 'upstairs', 'renew-fee', 'renew-fan', 'renew-tree'] as const;

export function rentalPhoto(shot: (typeof RENTAL_STILLS)[number]): string {
 return '/art/rental/' + shot + '.webp';
}

export const MATCH_STILLS = ['paper', 'coffee', 'bench', 'own-umbrella', 'lease', 'work', 'market'] as const;

export function matchPhoto(shot: (typeof MATCH_STILLS)[number]): string {
 return '/art/matchmaking/' + shot + '.webp';
}

export const FIRST_NIGHT_STILLS = [
 'inbox-room', 'inbox-shift', 'inbox-ferry',
 'first-night-arrival', 'first-night-room', 'first-night-shift', 'first-night-ferry',
 'first-night-room-bill', 'first-night-room-viewing', 'first-night-shift-rota',
 'first-night-shift-handover', 'first-night-ferry-oranges', 'first-night-ferry-gig',
] as const;

export type StreetPhoto = DistrictId | 'cover-south-station' | 'cover-south-station-mobile' | 'station' | 'keys' | 'kitchen' | 'ferry' | 'table' | 'bookshop'
 | (typeof FIRST_NIGHT_STILLS)[number];

export function streetPhoto(photo: StreetPhoto): string {
 return '/art/shanghai-streets/' + photo + '.webp';
}

const eventPhotos: Partial<Record<LifeEvent['category'], StreetPhoto>> = {
 career: 'lujiazui', romance: 'table', learn: 'bookshop', housing: 'keys', business: 'kitchen',
};

export function eventPhoto(event: LifeEvent, district: DistrictId): string {
 return event.illustration ?? streetPhoto(eventPhotos[event.category] ?? district);
}
