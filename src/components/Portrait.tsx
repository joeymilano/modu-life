import type { CSSProperties } from 'react';
import type { ActivityKind, CastMember, OriginCard, PlayerAppearance } from '../game/types';
import { ORIGIN_POOLS } from '../game/content';
import { castArt, playerArt, type ArtRegion } from '../game/art';
export function AtlasArt({region,className='',label}:{region:ArtRegion;className?:string;label?:string}){
 const x=region.index%region.columns,y=Math.floor(region.index/region.columns);
 const style:CSSProperties={backgroundImage:`url(${region.src})`,backgroundSize:`${region.columns*100}% ${region.rows*100}%`,backgroundPosition:`${region.columns===1?0:x/(region.columns-1)*100}% ${region.rows===1?0:y/(region.rows-1)*100}%`,aspectRatio:region.aspect};
 return <div className={'atlas-art '+className} style={style} role={label?'img':undefined} aria-label={label} aria-hidden={!label}/>;
}
export function Portrait({person,size=64,full=false}:{person:CastMember;size?:number;full?:boolean}){
 return <div className={'portrait '+(full?'portrait-full':'portrait-head')} style={full?undefined:{width:size,height:size}}><AtlasArt region={castArt(person.id)} label={person.name+' · '+person.title}/></div>;
}
export function PlayerPortrait({appearance,full=false,size=52}:{appearance:PlayerAppearance;full?:boolean;size?:number}){
 return <div className={'player-portrait '+(full?'player-portrait-full':'player-portrait-head')} style={full?undefined:{width:size,height:size}}><AtlasArt region={playerArt(appearance)} label={(appearance.gender==='female'?'女性':'男性')+'玩家形象'}/></div>;
}
export function CardArt({card}:{card:OriginCard}){
 const sheets={'出身':'birth','家底':'wealth','天赋':'talent','牵绊':'ties','秘密':'secrets'};
 const index=ORIGIN_POOLS[card.slot].findIndex(c=>c.id===card.id);
 return <div className="card-art"><AtlasArt region={{src:`/art/cards-${sheets[card.slot]}.webp`,columns:4,rows:2,index:Math.max(0,index),aspect:1}}/></div>;
}
export function StoryArt({kind,className=''}:{kind:ActivityKind|'year';className?:string}){
 const index=({career:0,romance:1,rest:2,learn:3,housing:4,social:5,business:6,explore:7,year:2})[kind];
 return <div className={'story-art '+className}><AtlasArt region={{src:'/art/story-scenes.webp',columns:4,rows:2,index,aspect:1}}/></div>;
}
