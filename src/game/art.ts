import type { DistrictId, LifeEvent, LooksLevel, PlayerAppearance } from './types';
export interface ArtRegion {src:string;columns:number;rows:number;index:number;aspect:number;}
export const LOOKS:{id:LooksLevel;name:string;line:string;flavor:string;face:number;attraction:number}[]=[
 {id:'everyday',name:'普通耐看',line:'地铁闸机都不会多看你一眼',flavor:'无外貌加成',face:0,attraction:0},
 {id:'charming',name:'颇有姿色',line:'出门常被问路，偶尔被要微信',flavor:'有点回头率',face:8,attraction:3},
 {id:'stunning',name:'惊艳全场',line:'路过咖啡店，主理人亲自开门',flavor:'回头率超标',face:16,attraction:6},
];
export function playerArt(a:PlayerAppearance):ArtRegion{return {src:`/art/player-${a.gender}.webp`,columns:3,rows:1,index:LOOKS.findIndex(x=>x.id===a.looks),aspect:.5};}
const female=['xia','lin','qiao','lu'],male=['ning','chen','yang','he'];
const support=['aunt','uncle','mother','father','mao','tang','gao','boss','fang','wu','yu','fei','yan','sun','qi','song'];
export function castArt(id:string):ArtRegion{
 if(female.includes(id))return {src:'/art/romance-female.webp',columns:2,rows:2,index:female.indexOf(id),aspect:2/3};
 if(male.includes(id))return {src:'/art/romance-male.webp',columns:2,rows:2,index:male.indexOf(id),aspect:2/3};
 return {src:'/art/supporting-cast.webp',columns:4,rows:4,index:Math.max(0,support.indexOf(id)),aspect:1};
}

export type StreetPhoto = DistrictId | 'cover' | 'station' | 'keys' | 'kitchen' | 'ferry' | 'table' | 'bookshop';

export function streetPhoto(photo: StreetPhoto): string {
 return '/art/shanghai-streets/' + photo + '.webp';
}

const eventPhotos: Partial<Record<LifeEvent['category'], StreetPhoto>> = {
 career: 'lujiazui', romance: 'table', learn: 'bookshop', housing: 'keys', business: 'kitchen',
};

export function eventPhoto(event: LifeEvent, district: DistrictId): string {
 return event.illustration ?? streetPhoto(eventPhotos[event.category] ?? district);
}
