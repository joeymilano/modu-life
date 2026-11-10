import { lifeStartProfile, validLifeStartHand } from './lifeStarts';
import { lifeYearsAlbumPhoto } from './lifeYears';
import { lastDayMemory } from './lastDay';
import { allOrigins, ending } from './engine';
import { arrivalPhoto, endingPhoto, LIFE_ALBUM_AGES, originPhoto, playerArt, stallPhoto, streetPhoto, TIMELINE_COVER } from './art';
import { openingForecast } from './openingForecast';
import { CAREERS, DISTRICTS } from './content';
import { PEARL_PATH, pearlHash, pearlMarkStamp, pearlRank, pearlResultPhoto, pearlRoundCount, type PearlRules, type PearlScore } from './pearl';
import { comparedFacts, describeDecision, lineDivergence } from './lineComparison';
import { lineName, type LifeLine } from './lifeLines';
import type { GameState } from './types';
import { SITE_URL } from './site';
import { STALL_ORDER_COUNT, stallRank } from './stall';
import { stallChallengeUrl, type StallChallenge } from './stallChallenge';
import { signedYearMoney, yearMoment, yearMoney, type YearReceipt } from './yearReceipt';
import type { StoryComparison } from './timelineComparison';
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

const cardInk = '#243a33';
const cardRust = '#a44832';
const cardPaper = '#f4eee1';
const cardSerif = '"Songti SC", "Noto Serif CJK SC", STSong, serif';

async function paintCardHeader(ctx: CanvasRenderingContext2D, label: string) {
 ctx.fillStyle = cardPaper;
 ctx.fillRect(0, 0, 1080, 1440);
 ctx.fillStyle = cardRust;
 ctx.fillRect(64, 48, 952, 4);
 const logo = new Image();
 logo.src = '/brand/pearl-dusk/logo-dark.svg';
 try {
  await logo.decode();
  ctx.drawImage(logo, 64, 68, 213, 50);
 } catch {
  ctx.fillStyle = cardInk;
  ctx.font = 'bold 32px ' + cardSerif;
  ctx.fillText('魔都人生', 64, 106);
 }
 ctx.fillStyle = cardInk;
 ctx.font = '26px sans-serif';
 ctx.textAlign = 'right';
 ctx.fillText(label, 1016, 105, 700);
 ctx.textAlign = 'left';
}

async function paintCurrentCard(ctx: CanvasRenderingContext2D, state: GameState) {
 await Promise.all([
  paintPhoto(ctx, playerArt(state.appearance, true, state.age), [64, 144, 386, 579]),
  paintPhoto(ctx, streetPhoto(state.district), [470, 144, 546, 364], .4),
 ]);
 const career = CAREERS.find(role => role.id === state.jobId);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 66px ' + cardSerif;
 ctx.fillText(state.name, 470, 599, 546);
 ctx.fillStyle = '#4e6356';
 ctx.font = '30px sans-serif';
 ctx.fillText(career?.ranks[Math.floor(state.jobRank)] ?? '还在找工作', 472, 650, 544);
 ctx.font = '24px sans-serif';
 ctx.fillText('手上还有', 472, 710);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 39px sans-serif';
 ctx.fillText('¥' + Math.round(state.cash).toLocaleString('zh-CN'), 584, 710, 432);
 const entry = state.journal.at(-1);
 ctx.fillStyle = cardRust;
 ctx.font = 'bold 25px sans-serif';
 ctx.fillText('最近一幕', 64, 784);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 45px ' + cardSerif;
 ctx.fillText(entry?.title ?? '刚到上海', 64, 850, 952);
}

async function paintEndingCard(ctx: CanvasRenderingContext2D, state: GameState) {
 const final = ending(state);
 const lastPhoto = lifeYearsAlbumPhoto(state);
 const scene = lastPhoto ?? endingPhoto(final.id);
 const start = lifeStartProfile(state.origins);
 const memory = lastPhoto ? lastDayMemory(state) : undefined;
 await Promise.all([
  paintPhoto(ctx, scene, [64, 144, 952, 292], scene.endsWith('/river.webp') ? .28 : .5),
  ...LIFE_ALBUM_AGES.map((age, index) =>
   paintPhoto(ctx, playerArt(state.appearance, true, age), [64 + 321 * index, 632, 310, 300], .15)),
 ]);
 if (memory) {
  ctx.fillStyle = '#243a33ed';
  ctx.fillRect(64,389,952,47);
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 24px ' + cardSerif;
  ctx.fillText(memory.age+' 岁 · '+memory.title,79,420,909);
 }
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 65px ' + cardSerif;
 ctx.fillText(final.title, 64, 520, 602);
 ctx.textAlign = 'right';
 ctx.fillStyle = '#4e6356';
 ctx.font = '22px sans-serif';
 ctx.fillText(start?'开局 ¥'+start.cash.toLocaleString('zh-CN')+' · 最后存下':'最后存下',1016,478,386);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 32px sans-serif';
 ctx.fillText('¥' + Math.round(state.cash).toLocaleString('zh-CN'), 1016, 520, 326);
 ctx.textAlign = 'left';
 ctx.fillStyle = '#455d50';
 ctx.font = '27px sans-serif';
 lines(ctx, final.text, 66, 569, 950, 38);
 LIFE_ALBUM_AGES.forEach((age, index) => {
  const x = 64 + 321 * index;
  ctx.fillStyle = '#243a33';
  ctx.fillRect(x, 891, 310, 42);
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 24px ' + cardSerif;
  ctx.fillText(age + ' 岁', x + 14, 921);
 });
}

function paintOpeningHand(ctx: CanvasRenderingContext2D, state: GameState) {
 const cards = allOrigins();
 const y = state.ended ? 963 : 924;
 ctx.fillStyle = cardRust;
 ctx.font = 'bold 26px sans-serif';
 ctx.fillText('开局这手牌', 64, y);
 state.origins.forEach((id, index) => {
  const card = cards.find(item => item.id === id);
  const x = 64 + 192 * index;
  ctx.fillStyle = '#ebe3d3';
  ctx.fillRect(x, y + 20, 184, 137);
  ctx.fillStyle = card?.accent ?? cardInk;
  ctx.fillRect(x, y + 20, 184, 4);
  ctx.fillStyle = '#576356';
  ctx.font = '22px sans-serif';
  ctx.fillText(card?.slot ?? '', x + 13, y + 56);
  ctx.textAlign = 'right';
  ctx.fillText(card?.rarity ?? '', x + 171, y + 56);
  ctx.textAlign = 'left';
  ctx.fillStyle = cardInk;
  const name = card?.name ?? '未知';
  ctx.font = 'bold 29px ' + cardSerif;
  const nameWidth = ctx.measureText(name).width;
  if (nameWidth > 158) ctx.font = 'bold ' + Math.floor(29 * 158 / nameWidth) + 'px ' + cardSerif;
  ctx.fillText(name, x + 13, y + 102, 158);
 });
}

export async function makeShareCard(state: GameState): Promise<Blob> {
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = 1440;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('分享卡生成失败');
 const district = DISTRICTS.find(item => item.id === state.district)?.name ?? '上海';
 const label = (state.ended ? state.name : district) + ' · ' + state.age + ' 岁';
 await paintCardHeader(ctx, label);
 if (state.ended) await paintEndingCard(ctx, state);
 else await paintCurrentCard(ctx, state);
 paintOpeningHand(ctx, state);
 const hasCode = await paintChallengeCode(ctx, challengeUrl(state, state.ended), 1016, 1164, 264);
 ctx.fillStyle = '#a99e88';
 ctx.fillRect(64, 1150, 952, 1);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 53px ' + cardSerif;
 ctx.fillText('同一手牌，你怎么过', 64, 1266, 702);
 ctx.font = '27px sans-serif';
 ctx.fillText(hasCode ? '扫码，带着这五张牌来上海' : '来上海，抽你的开局牌', 66, 1325);
 ctx.fillStyle = cardRust;
 ctx.font = '25px sans-serif';
 ctx.fillText('modulife.pages.dev', 66, 1377);
 return new Promise((resolve, reject) => canvas.toBlob(blob =>
  blob ? resolve(blob) : reject(new Error('分享卡生成失败')), 'image/png'));
}

export type SharedHand = Pick<GameState, 'seed' | 'origins' | 'goal' | 'appearance'>;
export function challengeUrl(s:SharedHand, reveal = false){
 const url=new URL(SITE_URL);
 url.searchParams.set('seed',s.seed);
 url.searchParams.set('cards',s.origins.join('.'));
 url.searchParams.set('goal',s.goal);
 url.searchParams.set('gender',s.appearance.gender);
 url.searchParams.set('looks',s.appearance.looks);
 if(reveal)url.searchParams.set('hand','open');
 return url.toString();
}

export async function makeOpeningCard(hand: SharedHand): Promise<Blob> {
 const cards = challengeCards(hand.origins);
 if (!cards) throw new Error('这手牌没凑齐');
 const opening = openingForecast(hand.seed, cards, hand.goal, hand.appearance);
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = 1440;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('开局照没洗出来');
 await paintCardHeader(ctx, '开局手牌  /  #' + hand.seed);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 62px ' + cardSerif;
 ctx.fillText('同一手牌，你怎么过', 64, 191, 952);
 const openingArt = lifeStartProfile(hand.origins) ? opening.story?.event.illustration : undefined;
 const column = (i: number) => 64 + i * 192;
 await Promise.all([
  paintPhoto(ctx, playerArt(hand.appearance, true), [64, 224, 292, 438], .22),
  paintPhoto(ctx, openingArt ?? arrivalPhoto(hand.appearance), [378, 224, 638, 296], openingArt ? .35 : .12),
  ...cards.map((card, i) => paintPhoto(ctx, originPhoto(card.id), [column(i), 763, 184, 124])),
 ]);
 ctx.fillStyle = cardRust;
 ctx.font = 'bold 22px sans-serif';
 ctx.fillText(openingArt || !opening.story ? '开局先碰到' : '这手牌的插曲', 378, 552);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 38px ' + cardSerif;
 ctx.fillText(opening.story?.event.title ?? '出站前的三条消息', 378, 600, 638);
 ctx.font = '24px sans-serif';
 ctx.fillText('手上 ¥' + opening.cash.toLocaleString('zh-CN') + '  ·  ' + opening.housing, 378, 649, 638);
 ctx.fillStyle = cardRust;
 ctx.font = 'bold 29px ' + cardSerif;
 ctx.fillText('带进上海的五张牌', 64, 735, 952);
 cards.forEach((card, i) => {
  const x = column(i);
  ctx.fillStyle = '#eae2d0';
  ctx.fillRect(x, 900, 184, 121);
  ctx.fillStyle = card.accent;
  ctx.fillRect(x, 900, 184, 4);
  ctx.fillStyle = cardInk;
  ctx.font = '21px sans-serif';
  ctx.fillText(card.slot + ' · ' + card.rarity, x + 10, 937, 164);
  ctx.font = 'bold 27px ' + cardSerif;
  lines(ctx, card.name, x + 10, 978, 164, 28);
 });
 ctx.fillStyle = '#ac9d83';
 ctx.fillRect(64, 1087, 952, 1);
 const invite = challengeUrl(hand, true);
 if (!await paintChallengeCode(ctx, invite, 1016, 1113, 248)) throw new Error('这张照上的码还没印出来');
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 36px ' + cardSerif;
 ctx.fillText('扫一下，接这手牌', 64, 1195, 680);
 ctx.font = '24px sans-serif';
 ctx.fillText('modulife.pages.dev', 64, 1244);
 return new Promise((resolve, reject) => canvas.toBlob(blob =>
  blob ? resolve(blob) : reject(new Error('开局照没洗出来')), 'image/png'));
}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

export async function makeYearCard(state: GameState, age: number, receipt: YearReceipt): Promise<Blob> {
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = 1440;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('照片没洗出来');
 const moment = yearMoment(receipt.moment);
 await paintCardHeader(ctx, '年末留影  /  '+age+' 岁');
 await Promise.all([
  paintPhoto(ctx,moment.photo,[64,142,952,602]),
  paintPhoto(ctx,playerArt(state.appearance,true,age),[64,775,196,294],.19),
 ]);
 ctx.fillStyle = cardRust;
 ctx.font = 'bold 25px sans-serif';
 ctx.fillText(state.name+' · '+age+' 岁',288,820,720);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 54px '+cardSerif;
 ctx.fillText(moment.title,288,892,728);
 ctx.font = '28px sans-serif';
 lines(ctx,moment.line,290,943,710,37);
 ctx.fillStyle = '#71614c';
 ctx.font = '25px sans-serif';
 ctx.fillText('结完账还剩 '+yearMoney(receipt.after)+'  ·  本次结算 '+signedYearMoney(receipt.after-receipt.before),290,1036,716);
 ctx.fillStyle = '#a99e88';
 ctx.fillRect(64,1114,952,1);
 const ready = await paintChallengeCode(ctx,challengeUrl(state,true),1016,1155,250);
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 40px '+cardSerif;
 ctx.fillText('拿同一手牌来上海',64,1246,668);
 ctx.font = '25px sans-serif';
 ctx.fillText(ready?'扫码，从 18 岁开局':'modulife.pages.dev',66,1303,650);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('照片没洗出来')),'image/png'));
}

export async function makeStoryPhoto(shot: string, title: string, choice: string, invite: string): Promise<Blob> {
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = 1080;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('这张照片没洗出来');
 ctx.fillStyle = '#f4efe3';
 ctx.fillRect(0, 0, 1080, 1080);
 ctx.fillStyle = '#253d32';
 ctx.fillRect(48, 45, 984, 3);
 ctx.font = 'bold 40px "Songti SC", serif';
 ctx.fillText(title, 48, 106, 984);
 await paintPhoto(ctx, shot, [48, 137, 984, 656]);
 ctx.fillStyle = '#993d2e';
 ctx.font = 'bold 25px sans-serif';
 ctx.fillText('魔都人生 · 平行上海', 48, 855);
 ctx.fillStyle = '#253d32';
 ctx.font = 'bold 37px "Songti SC", serif';
 const caption = lines(ctx, choice, 48, 912, 748, 48);
 ctx.font = '23px sans-serif';
 ctx.fillText('扫码走另一条线', 48, Math.max(1000, caption + 48));
 if (!await paintChallengeCode(ctx, invite, 1032, 838, 180)) throw new Error('照片上的码没印出来');
 return new Promise((resolve, reject) => canvas.toBlob(blob =>
  blob ? resolve(blob) : reject(new Error('这张照片没洗出来')), 'image/png'));
}

export async function makeStoryComparison(title: string, comparison: StoryComparison, invite: string): Promise<Blob> {
 const { date, place, scene, left, right } = comparison;
 const sides = [left,right];
 const showStills = Boolean(left.shot && right.shot && left.shot !== right.shot);
 const longText = scene.length > 105 || sides.some(side => side.choice.length > 20 || side.after.length > 90);
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = showStills || longText ? 1440 : 1080;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('对照图没存下来');
 const write = (value:string,x:number,y:number,width:number,leading:number) => {
  let line = '';
  const parts = value.replace(/\s+/g,' ').match(/[A-Za-z0-9]{1,16}|./gu) ?? [];
  for (const part of parts) {
   if (line && ctx.measureText(line + part).width > width && !/^[，。！？、；）】”’]/u.test(part)) {
    ctx.fillText(line,x,y,width);
    y += leading;
    line = part;
   } else line += part;
  }
  ctx.fillText(line,x,y,width);
  return y;
 };
 await paintCardHeader(ctx, '平行上海 · 两条走法');
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 65px ' + cardSerif;
 ctx.fillText(title, 64, 210, 952);
 ctx.font = '27px sans-serif';
 ctx.fillText(date + ' · ' + place, 64, 265, 952);
 const photoY = 307, photoHeight = 372;
 const contentY = showStills ? 700 : write(scene,64,316,952,36) + 32;
 const footerY = canvas.height - 215;
 await Promise.all(sides.map((side,index) => {
  const x = index === 0 ? 64 : 551;
  const top = showStills ? photoY : contentY;
  ctx.fillStyle = index === 0 ? '#f0e0cc' : '#e2e6d9';
  ctx.fillRect(x, top, 465, footerY - 20 - top);
  if (showStills && side.shot) return paintPhoto(ctx, side.shot, [x, photoY, 465, photoHeight], .36);
 }));
 for (const [index, side] of sides.entries()) {
  const x = index === 0 ? 88 : 575;
  ctx.fillStyle = index === 0 ? cardRust : cardInk;
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText((index === 0 ? '这回' : '另一条') + ' · ' + side.path, x, contentY + 39, 417);
  ctx.fillStyle = cardInk;
  ctx.font = 'bold 34px ' + cardSerif;
  const baseline = write(side.choice, x, contentY + 94, 417, 44);
  const summary = side.after.replace(/\s+/g,' ');
  const long = summary.length > 110;
  ctx.font = (long ? 22 : 27) + 'px sans-serif';
  write(summary, x, baseline + 59, 417, long ? 29 : 32);
 }
 const hasCode = await paintChallengeCode(ctx, invite, 1016, footerY + 23, 171);
 ctx.fillStyle = cardInk;
 ctx.fillRect(64, footerY, 952, 2);
 ctx.font = 'bold 33px ' + cardSerif;
 ctx.fillText(hasCode ? '扫码，换你走一条' : '回平行上海，再走一条', 64, footerY + 75);
 ctx.font = '24px sans-serif';
 ctx.fillText('modulife.pages.dev', 64, footerY + 125);
 return new Promise((resolve, reject) => canvas.toBlob(blob =>
  blob ? resolve(blob) : reject(new Error('对照图没存下来')), 'image/png'));
}

export async function makeLineCard(first: LifeLine, second: LifeLine): Promise<Blob> {
 const canvas = document.createElement('canvas');
 canvas.width = 1080;
 canvas.height = 1440;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('对照图没存下来');
 const split = lineDivergence(first, second);
 const scene = split && describeDecision(first, split.left);
 const facts = comparedFacts([first, second], scene?.speaker);
 const sameHand = challengeUrl(first.state) === challengeUrl(second.state);
 const ink = '#253d32', brick = '#903d2c';
 ctx.fillStyle = '#f5eedf';
 ctx.fillRect(0, 0, 1080, 1440);
 ctx.fillStyle = ink;
 ctx.fillRect(60, 54, 960, 4);
 const logo = new Image();
 logo.src = '/brand/pearl-dusk/logo-dark.svg';
 try {
  await logo.decode();
  ctx.drawImage(logo, 60, 73, 220, 52);
 } catch {
  ctx.font = 'bold 30px "Songti SC", serif';
  ctx.fillText('魔都人生', 60, 108);
 }
 ctx.font = 'bold 67px "Songti SC", serif';
 ctx.fillText(sameHand ? '同一手牌，两种走法' : '两条线，过成什么样', 60, 227, 960);
 await paintPhoto(ctx, scene?.art ?? TIMELINE_COVER, [60, 262, 960, 327], scene?.art ? .18 : .40);
 ctx.fillStyle = brick;
 ctx.font = '27px sans-serif';
 ctx.fillText(split ? split.left.before.age + '岁 · ' + split.left.title : '两条线的近况', 60, 637, 960);
 const starts = [246, 646];
 for (const [i, line] of [first, second].entries()) {
  const x = starts[i];
  ctx.fillStyle = ink;
  ctx.font = 'bold 35px "Songti SC", serif';
  ctx.fillText(lineName(line.id) + ' · ' + line.state.age + '岁', x, 698, 360);
  const choice = split && (i === 0 ? split.left : split.right).choice;
  const place = DISTRICTS.find(district => district.id === line.state.district)?.name ?? '上海';
  ctx.fillStyle = '#4a5a50';
  ctx.font = '25px sans-serif';
  const caption = choice ?? place;
  lines(ctx, caption.length > 38 ? caption.slice(0, 37) + '…' : caption, x, 743, 362, 34);
 }
 for (const [i, row] of facts[0].entries()) {
  const y = 833 + i * 65;
  ctx.fillStyle = facts[0][i].value === facts[1][i].value ? '#f5eedf' : '#ebdec7';
  ctx.fillRect(60, y, 960, 64);
  ctx.fillStyle = '#c9bea8';
  ctx.fillRect(60, y, 960, 1);
  ctx.fillStyle = '#566456';
  ctx.font = '25px sans-serif';
  ctx.fillText(row.label, 76, y + 43);
  ctx.fillStyle = ink;
  ctx.font = 'bold 31px sans-serif';
  for (const [column, x] of starts.entries()) ctx.fillText(facts[column][i].value, x, y + 44, 360);
 }
 const hasCode = sameHand && await paintChallengeCode(ctx, challengeUrl(first.state), 1020, facts[0].length > 5 ? 1234 : 1212, 184);
 ctx.fillStyle = ink;
 ctx.fillRect(60, 1231, hasCode ? 746 : 960, 2);
 ctx.font = 'bold 29px sans-serif';
 ctx.fillText(hasCode ? '扫码抽同一手牌' : '来上海，抽你自己的手牌', 60, 1301);
 ctx.fillStyle = brick;
 ctx.font = '23px sans-serif';
 ctx.fillText('modulife.pages.dev', 60, 1340);
 return await new Promise((resolve, reject) =>
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('对照图没存下来')), 'image/png'));
}

export function readChallenge(params: URLSearchParams) {
 const seed = params.get('seed');
 const ids = params.get('cards')?.split('.');
 if (!seed || seed.length > 32 || !ids) return null;
 const cards = challengeCards(ids);
 return cards ? { seed, cards, ...(params.get('hand') === 'open' && { reveal: true }) } : null;
}

function challengeCards(ids: string[]) {
 if (ids.length !== 5 || !validLifeStartHand(ids)) return null;
 const all = allOrigins();
 const cards = ids.flatMap(id => all.filter(card => card.id === id));
 if (cards.length !== 5 || new Set(cards.map(card => card.slot)).size !== 5) return null;
 return cards;
}


export function pearlChallengeUrl(seed: string, target: number, rules: PearlRules = 1, blocks?: number, trail?: PearlScore['trail']) {
 const url = new URL(rules === 1 ? '/' : PEARL_PATH, SITE_URL);
 url.hash = pearlHash(seed, target, rules, blocks, trail);
 return url.toString();
}

export async function makeStallTicket(challenge: StallChallenge & { target: NonNullable<StallChallenge['target']> }): Promise<Blob> {
 const { seed, target } = challenge;
 const canvas = document.createElement('canvas');
 canvas.width = 960;
 canvas.height = 1200;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('小票暂时打印不了');
 ctx.fillStyle = '#e8dbc0';
 ctx.fillRect(0, 0, 960, 1200);
 ctx.fillStyle = '#faf4e6';
 ctx.fillRect(28, 22, 904, 1156);
 ctx.fillStyle = cardRust;
 ctx.fillRect(60, 54, 840, 4);
 ctx.font = 'bold 25px sans-serif';
 ctx.fillText('魔都人生 · 莘庄晚市', 60, 109);
 ctx.textAlign = 'right';
 ctx.fillText('#' + seed, 900, 109, 420);
 ctx.textAlign = 'left';
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 58px ' + cardSerif;
 ctx.fillText('两口锅，八张单', 60, 182);
 await paintPhoto(ctx, stallPhoto(target.waste || target.served < 6 ? 'receipt-rush' : 'receipt-clean'), [60, 213, 840, 450], .58);
 ctx.font = 'bold 64px ' + cardSerif;
 ctx.fillText(stallRank(target), 60, 760, 840);
 ctx.font = '30px sans-serif';
 ctx.fillText(`出单 ${target.served}/${STALL_ORDER_COUNT} · 损耗 ${target.waste} 份`, 64, 833);
 ctx.strokeStyle = '#a99e88';
 ctx.setLineDash([8, 6]);
 ctx.beginPath();
 ctx.moveTo(60, 882);
 ctx.lineTo(900, 882);
 ctx.stroke();
 if (!await paintChallengeCode(ctx, stallChallengeUrl(challenge), 900, 900, 270)) {
  throw new Error('小票的码还没印出来');
 }
 ctx.fillStyle = cardInk;
 ctx.font = 'bold 37px ' + cardSerif;
 ctx.fillText('扫一下，接同一批单', 60, 1000, 580);
 ctx.fillStyle = cardRust;
 ctx.font = '24px sans-serif';
 ctx.fillText('modulife.pages.dev/stall', 62, 1063);
 return new Promise((resolve, reject) => canvas.toBlob(blob =>
  blob ? resolve(blob) : reject(new Error('小票暂时打印不了')), 'image/png'));
}

export async function makePearlTicket(seed: string, score: PearlScore, rules: PearlRules = 1): Promise<Blob> {
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
 await paintPhoto(ctx, pearlResultPhoto(score,rules), [64, 243, 832, 447], .55);
 ctx.font = 'bold 77px "Songti SC", serif';
 ctx.fillText(pearlRank(score), 64, 804);
 ctx.font = '28px sans-serif';
 ctx.fillText(pearlRoundCount(rules) + ' 轮 · 洒 ' + score.hits + ' 回 · 挡 ' + score.blocks + ' 回', 64, 867);
 if (rules === 4 && score.trail) {
  ctx.font = 'bold 21px sans-serif';
  score.trail.forEach((mark,index) => {
   const x = 64+index*66;
   ctx.fillStyle = mark === 'clear' ? '#d7e3d6' : mark === 'blocked' ? '#f4dda6' : '#edc1b4';
   ctx.fillRect(x,878,60,28);
   ctx.fillStyle = '#263839';
   ctx.textAlign = 'center';
   ctx.fillText(pearlMarkStamp[mark],x+30,900);
  });
  ctx.textAlign = 'left';
 }
 ctx.strokeStyle = '#a29a85';
 ctx.setLineDash([8, 6]);
 ctx.beginPath();
 ctx.moveTo(64, 916);
 ctx.lineTo(896, 916);
 ctx.stroke();
 if (!await paintChallengeCode(ctx, pearlChallengeUrl(seed, score.hits, rules, score.blocks, score.trail), 896, 945, 184)) {
  throw new Error('小票的码还没印出来');
 }
 ctx.font = 'bold 29px sans-serif';
 ctx.fillText('扫小票，躲同一轮红光', 64, 1007);
 ctx.font = '22px sans-serif';
 ctx.fillText('modulife.pages.dev', 64, 1050);
 return new Promise((resolve, reject) =>
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('小票暂时打印不了')), 'image/png'));
}
