import type { DistrictId, LifeEvent, LooksLevel, PlayerAppearance } from './types';
export const LOOKS:{id:LooksLevel;name:string;line:string;flavor:string;face:number;attraction:number}[]=[
 {id:'everyday',name:'普通耐看',line:'地铁闸机都不会多看你一眼',flavor:'无外貌加成',face:0,attraction:0},
 {id:'charming',name:'颇有姿色',line:'出门常被问路，偶尔被要微信',flavor:'有点回头率',face:8,attraction:3},
 {id:'stunning',name:'惊艳全场',line:'路过咖啡店，主理人亲自开门',flavor:'回头率超标',face:16,attraction:6},
];
export function portraitArt(id: string, full: boolean): string {
 return '/art/portraits/' + (full ? '' : 'head/') + id + '.webp';
}

export function playerArt(appearance: PlayerAppearance, full = true): string {
 return portraitArt('player-' + appearance.gender + '-' + appearance.looks, full);
}

export type StreetPhoto = DistrictId | 'cover-station' | 'station' | 'keys' | 'kitchen' | 'ferry' | 'table' | 'bookshop'
 | 'first-night-room' | 'first-night-shift' | 'first-night-ferry';

export function streetPhoto(photo: StreetPhoto): string {
 return '/art/shanghai-streets/' + photo + '.webp';
}

const eventPhotos: Partial<Record<LifeEvent['category'], StreetPhoto>> = {
 career: 'lujiazui', romance: 'table', learn: 'bookshop', housing: 'keys', business: 'kitchen',
};

export function eventPhoto(event: LifeEvent, district: DistrictId): string {
 return event.illustration ?? streetPhoto(eventPhotos[event.category] ?? district);
}
