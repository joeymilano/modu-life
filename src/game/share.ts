import { ending, publicOriginNames } from './engine';import { playerArt, LOOKS, streetPhoto } from './art';
import { DISTRICTS, GOALS } from './content';import type { GameState } from './types';
export const SITE_URL='https://modulife.pages.dev';
function lines(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,max:number,lineHeight:number){let line='';for(const c of text){if(ctx.measureText(line+c).width>max){ctx.fillText(line,x,y);y+=lineHeight;line=c;}else line+=c;}ctx.fillText(line,x,y);return y;}
export async function makeShareCard(s:GameState):Promise<Blob>{
 const c=document.createElement('canvas');c.width=1080;c.height=1440;const g=c.getContext('2d')!;g.fillStyle='#f4efe3';g.fillRect(0,0,1080,1440);g.fillStyle='#223d3d';g.fillRect(58,58,964,4);
 g.font='24px sans-serif';try{const logo=new Image();logo.src='/brand/logo-dark.svg';await logo.decode();g.drawImage(logo,62,72,230,54);}catch{g.fillText('魔都人生',62,109);}g.textAlign='right';g.fillText('人生档案 NO. '+s.seed,1018,109);g.textAlign='left';
 g.fillStyle='#b2402b';g.font='bold 28px sans-serif';g.fillText(s.ended?'这一生，我在上海':'这回，我在上海',65,196);g.fillStyle='#223d3d';g.font='bold 73px "Songti SC",serif';
 const result=s.ended?ending(s):{title:s.name+'的'+s.age+'岁',text:DISTRICTS.find(district=>district.id===s.district)?.name??'上海'};
 let y=lines(g,result.title,60,295,950,93);g.font='27px sans-serif';y=lines(g,result.text,65,y+69,900,46);
 const scene=document.querySelector<HTMLCanvasElement>('.city-stage canvas, .hero-city canvas');const imageY=Math.max(y+60,540);
 try{const img=new Image();img.src=scene?scene.toDataURL('image/png'):streetPhoto(s.district);await img.decode();g.save();g.beginPath();g.roundRect(60,imageY,960,400,20);g.clip();g.fillStyle='#e7e8db';g.fillRect(60,imageY,960,400);const ratio=Math.max(960/img.width,400/img.height);g.drawImage(img,60+(960-img.width*ratio)/2,imageY+(400-img.height*ratio)/2,img.width*ratio,img.height*ratio);g.restore();}catch{g.fillStyle='#dde2d4';g.fillRect(60,imageY,960,400);}
 try{const art=playerArt(s.appearance),img=new Image();img.src=art.src;await img.decode();const sw=img.width/art.columns,sh=img.height/art.rows;g.save();g.beginPath();g.roundRect(755,imageY+40,220,330,8);g.clip();g.drawImage(img,art.index*sw,0,sw,sh,755,imageY+40,220,440);g.restore();g.fillStyle='#183c33';g.fillRect(755,imageY+327,220,43);g.fillStyle='#fff3dc';g.font='21px sans-serif';g.fillText(LOOKS.find(l=>l.id===s.appearance.looks)!.name,777,imageY+356);}catch{}
 y=imageY+448;g.fillStyle='#62736a';g.font='22px sans-serif';g.fillText('开局这手牌',65,y);g.fillStyle='#223d3d';g.font='bold 28px sans-serif';y=lines(g,publicOriginNames(s).join(' / '),65,y+48,920,46);
 y+=80;g.font='22px sans-serif';g.fillStyle='#63766a';g.fillText('想过的日子',65,y);g.fillText('现在的积蓄',590,y);g.font='bold 36px sans-serif';g.fillStyle='#223d3d';g.fillText(GOALS.find(x=>x.id===s.goal)?.name||'',65,y+53);g.fillText('¥'+s.cash.toLocaleString(),590,y+53);
 g.strokeStyle='#b7c1b3';g.beginPath();g.moveTo(60,1310);g.lineTo(1020,1310);g.stroke();g.font='23px sans-serif';g.fillText('同一手牌，换你来试试',65,1360);g.textAlign='right';g.fillStyle='#b2402b';g.fillText('种子 '+s.seed,1015,1360);
 return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('分享卡生成失败')),'image/png'));
}
export function challengeUrl(s:GameState){const url=new URL(SITE_URL);url.searchParams.set('seed',s.seed);url.searchParams.set('cards',s.origins.join('.'));url.searchParams.set('goal',s.goal);url.searchParams.set('gender',s.appearance.gender);url.searchParams.set('looks',s.appearance.looks);return url.toString();}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

