import { allOrigins, ending, publicOriginNames } from './engine';
import { endingPhoto, pearlPhoto, playerArt, LOOKS, streetPhoto } from './art';
import { DISTRICTS, GOALS } from './content';
import { PEARL_DELAYS, pearlHash, pearlRank, type PearlScore } from './pearl';
import type { GameState } from './types';
export const SITE_URL='https://modulife.pages.dev';
function lines(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,max:number,lineHeight:number){let line='';for(const c of text){if(ctx.measureText(line+c).width>max){ctx.fillText(line,x,y);y+=lineHeight;line=c;}else line+=c;}ctx.fillText(line,x,y);return y;}
type PhotoFrame = [x: number, y: number, width: number, height: number];

async function paintPhoto(ctx: CanvasRenderingContext2D, source: string, frame: PhotoFrame, focus = .5) {
 const [x, y, width, height] = frame;
 const img = new Image();
 img.src = source;
 try {
  await img.decode();
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const scaledWidth = img.naturalWidth * scale, scaledHeight = img.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.clip();
  ctx.drawImage(img, x + (width - scaledWidth) / 2, y + (height - scaledHeight) * focus, scaledWidth, scaledHeight);
  ctx.restore();
 } catch {
  ctx.fillStyle = '#dde2d4';
  ctx.fillRect(...frame);
 }
}

function photoCaption(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, width: number) {
 ctx.fillStyle = '#183c33';
 ctx.fillRect(x, y, width, 38);
 ctx.fillStyle = '#fff3dc';
 ctx.font = '21px sans-serif';
 ctx.fillText(label, x + 16, y + 27);
}

async function paintChallengeCode(ctx: CanvasRenderingContext2D, url: string, right = 1020, y = 1248, size = 180): Promise<boolean> {
 try {
  const { default: makeCode } = await import('qrcode-generator');
  const code = makeCode(0, 'M');
  code.addData(url);
  code.make();
  const modules = code.getModuleCount();
  const unit = Math.max(1, Math.floor(size / (modules + 8)));
  const edge = (modules + 8) * unit;
  const x = right - edge;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, edge, edge);
  ctx.translate(x + 4 * unit, y + 4 * unit);
  code.renderTo2dContext(ctx, unit);
  ctx.restore();
  return true;
 } catch {
  return false;
 }
}

export async function makeShareCard(s:GameState):Promise<Blob>{
 const c=document.createElement('canvas');c.width=1080;c.height=1440;const g=c.getContext('2d')!;g.fillStyle='#f4efe3';g.fillRect(0,0,1080,1440);g.fillStyle='#223d3d';g.fillRect(58,58,964,4);
 g.font='24px sans-serif';try{const logo=new Image();logo.src='/brand/logo-dark.svg';await logo.decode();g.drawImage(logo,62,72,230,54);}catch{g.fillText('魔都人生',62,109);}g.textAlign='right';g.fillText('人生档案 NO. '+s.seed,1018,109);g.textAlign='left';
 g.fillStyle='#b2402b';g.font='bold 28px sans-serif';g.fillText(s.ended?'这一生，我在上海':'这回，我在上海',65,196);g.fillStyle='#223d3d';g.font='bold 73px "Songti SC",serif';
 const final = s.ended ? ending(s) : undefined;
 const title = final?.title ?? s.name + '的' + s.age + '岁';
 const detail = final?.text ?? DISTRICTS.find(district => district.id === s.district)?.name ?? '上海';
 let y = lines(g, title, 60, 295, 950, 93);
 g.font = '27px sans-serif';
 y = lines(g, detail, 65, y + 69, 900, 46);
 if (final) {
  const sceneY = Math.max(y + 35, 405);
  const portraitsY = sceneY + 250;
  await Promise.all([
   paintPhoto(g, endingPhoto(final.id), [60, sceneY, 960, 234]),
   paintPhoto(g, playerArt(s.appearance), [60, portraitsY, 471, 288], 0),
   paintPhoto(g, playerArt(s.appearance, true, s.age), [549, portraitsY, 471, 288], .20),
  ]);
  photoCaption(g, '18 岁 · 刚到上海', 60, portraitsY + 250, 471);
  photoCaption(g, s.age + ' 岁 · ' + s.name, 549, portraitsY + 250, 471);
  y = portraitsY + 338;
 } else {
  const imageY = Math.max(y + 60, 540);
  const canvas = document.querySelector<HTMLCanvasElement>('.city-stage canvas');
  let scene = streetPhoto(s.district);
  try { if (canvas) scene = canvas.toDataURL('image/png'); } catch { /* Use the district photograph. */ }
  await paintPhoto(g, scene, [60, imageY, 960, 400]);
  await paintPhoto(g, playerArt(s.appearance, true, s.age), [755, imageY + 40, 220, 330], .22);
  photoCaption(g, LOOKS.find(look => look.id === s.appearance.looks)!.name, 755, imageY + 332, 220);
  y = imageY + 448;
 }
 g.fillStyle='#62736a';g.font='22px sans-serif';g.fillText('开局这手牌',65,y);g.fillStyle='#223d3d';g.font='bold 28px sans-serif';y=lines(g,publicOriginNames(s).join(' / '),65,y+48,920,46);
 y+=80;g.font='22px sans-serif';g.fillStyle='#63766a';g.fillText('想过的日子',65,y);g.fillText('现在的积蓄',460,y);g.font='bold 36px sans-serif';g.fillStyle='#223d3d';g.fillText(GOALS.find(x=>x.id===s.goal)?.name||'',65,y+53);g.fillText('¥'+s.cash.toLocaleString(),460,y+53,355);
 const hasCode = await paintChallengeCode(g, challengeUrl(s));
 g.strokeStyle='#b7c1b3';g.beginPath();g.moveTo(60,1310);g.lineTo(hasCode ? 835 : 1020,1310);g.stroke();
 g.fillStyle='#223d3d';g.font='bold 23px sans-serif';g.fillText(hasCode ? '扫码抽同一手牌' : '同一手牌，换你来试试',65,1357);
 g.fillStyle='#b2402b';g.font='22px sans-serif';g.fillText('modulife.pages.dev',65,1392);
 return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('分享卡生成失败')),'image/png'));
}
export function challengeUrl(s:GameState){const url=new URL(SITE_URL);url.searchParams.set('seed',s.seed);url.searchParams.set('cards',s.origins.join('.'));url.searchParams.set('goal',s.goal);url.searchParams.set('gender',s.appearance.gender);url.searchParams.set('looks',s.appearance.looks);return url.toString();}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

export function readChallenge(params: URLSearchParams) {
 const seed = params.get('seed');
 const ids = params.get('cards')?.split('.');
 if (!seed || seed.length > 32 || ids?.length !== 5) return null;
 const all = allOrigins();
 const cards = ids.flatMap(id => all.filter(card => card.id === id));
 if (cards.length !== 5 || new Set(cards.map(card => card.slot)).size !== 5) return null;
 return { seed, cards };
}


export function pearlChallengeUrl(seed: string, target: number) {
 return new URL(pearlHash(seed, target), SITE_URL).toString();
}

export async function makePearlTicket(seed: string, score: PearlScore): Promise<Blob> {
 const canvas = document.createElement('canvas');
 canvas.width = 960;
 canvas.height = 1200;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('小票暂时打印不了');
 ctx.fillStyle = '#ede1c9';
 ctx.fillRect(0, 0, 960, 1200);
 ctx.fillStyle = '#fbf5e8';
 ctx.fillRect(32, 24, 896, 1152);
 ctx.fillStyle = '#943c2b';
 ctx.fillRect(64, 60, 832, 5);
 ctx.font = 'bold 26px sans-serif';
 ctx.fillText('魔都人生 · 外滩', 64, 113);
 ctx.textAlign = 'right';
 ctx.font = '23px monospace';
 ctx.fillText('#' + seed, 896, 112);
 ctx.textAlign = 'left';
 ctx.fillStyle = '#263839';
 ctx.font = 'bold 59px "Songti SC", serif';
 ctx.fillText('四元柠檬水保卫战', 63, 206);
 await paintPhoto(ctx, pearlPhoto('hero'), [64, 243, 832, 447], .35);
 ctx.font = 'bold 77px "Songti SC", serif';
 ctx.fillText(pearlRank(score), 64, 804);
 ctx.font = '28px sans-serif';
 ctx.fillText(PEARL_DELAYS.length + ' 轮 · 洒 ' + score.hits + ' 回 · 挡 ' + score.blocks + ' 回', 64, 867);
 ctx.strokeStyle = '#a29a85';
 ctx.setLineDash([8, 6]);
 ctx.beginPath();
 ctx.moveTo(64, 916);
 ctx.lineTo(896, 916);
 ctx.stroke();
 if (!await paintChallengeCode(ctx, pearlChallengeUrl(seed, score.hits), 896, 945, 184)) {
  throw new Error('小票的码还没印出来');
 }
 ctx.font = 'bold 29px sans-serif';
 ctx.fillText('扫小票，躲同一轮红光', 64, 1007);
 ctx.font = '22px sans-serif';
 ctx.fillText('modulife.pages.dev', 64, 1050);
 return new Promise((resolve, reject) =>
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('小票暂时打印不了')), 'image/png'));
}
