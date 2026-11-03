import type { LooksLevel, PlayerAppearance } from './types';
export interface ArtRegion {src:string;columns:number;rows:number;index:number;aspect:number;}
export const LOOKS:{id:LooksLevel;name:string;line:string;flavor:string;face:number;attraction:number}[]=[
 {id:'everyday',name:'普通耐看',line:'混进人群，活得自在。',flavor:'不靠回头率，也有自己的故事。',face:0,attraction:0},
 {id:'charming',name:'颇有姿色',line:'第一眼，蛮有腔调。',flavor:'路人多看一眼，聊天还得自己接。',face:8,attraction:3},
 {id:'stunning',name:'惊艳全场',line:'沪上回头率，有点超标。',flavor:'美貌先开门，日子进去再谈。',face:16,attraction:6},
];
export function playerArt(a:PlayerAppearance):ArtRegion{return {src:`/art/player-${a.gender}.webp`,columns:3,rows:1,index:LOOKS.findIndex(x=>x.id===a.looks),aspect:.5};}
const female=['xia','lin','qiao','lu'],male=['ning','chen','yang','he'];
const support=['aunt','uncle','mother','father','mao','tang','gao','boss','fang','wu','yu','fei','yan','sun','qi','song'];
export function castArt(id:string):ArtRegion{
 if(female.includes(id))return {src:'/art/romance-female.webp',columns:2,rows:2,index:female.indexOf(id),aspect:2/3};
 if(male.includes(id))return {src:'/art/romance-male.webp',columns:2,rows:2,index:male.indexOf(id),aspect:2/3};
 return {src:'/art/supporting-cast.webp',columns:4,rows:4,index:Math.max(0,support.indexOf(id)),aspect:1};
}
