import { hashSeed, randomStep } from './engine';
import type { Effect, GameState, LifeEvent } from './types';
import { pearlPhoto } from './art';

export const PEARL_DELAYS = [1560, 1320, 1130, 960, 820];
export const PEARL_LANES = ['左侧', '中间', '右侧'] as const;
export const CURRENT_PEARL_RULES = 4;
export const PEARL_PATH = '/pearl/';
export const isPearlPath = (path: string) => [PEARL_PATH, PEARL_PATH.slice(0, -1), PEARL_PATH + 'index.html'].includes(path);
export type PearlRules = 1 | 2 | 3 | typeof CURRENT_PEARL_RULES;
const pearlMarks = ['clear', 'hit', 'blocked', 'both'] as const;
export type PearlMark = (typeof pearlMarks)[number];
export type PearlScore = { hits: number; blocks: number; trail?: readonly PearlMark[] };
export type PearlResult = { method: 'run'; score: PearlScore } | { method: 'sleeve' } | { method: 'neighbor' };
export type PearlChallenge = { seed: string; target?: number; targetBlocks?: number; targetTrail?: readonly PearlMark[]; rules?: PearlRules };
export const PEARL_RUNNERS = [{id:'yan',name:'严可',caption:'刚下夜班'}, {id:'sun',name:'孙阿宝',caption:'相机先收起来'}] as const;
export type PearlRunnerId = (typeof PEARL_RUNNERS)[number]['id'];
export type PearlWave = { kind: 'single' | 'double' | 'lock'; mask: number; warn: number; lockAt?: number }
 | { kind: 'reflection'; mask: number; warn: number; echoMask: number }
 | { kind: 'sweep' | 'return'; mask: number; warn: number; order: readonly [number, number, number, ...number[]]; stepMs: number };
export const pearlRoundCount = (rules: PearlRules = 1) => rules === 1 ? PEARL_DELAYS.length : rules === 2 ? 6 : rules === 3 ? 7 : 8;
export const pearlCueNames: Record<PearlWave['kind'], string> = {
 single:'单道', double:'双道', lock:'追踪', sweep:'横扫', reflection:'倒影', return:'折返',
};
export const pearlMarkText: Record<PearlMark, string> = {
 clear:'杯子还稳着', hit:'洒了', blocked:'伞挡住了', both:'撑了伞，还是洒了',
};
export const pearlMarkStamp: Record<PearlMark, string> = {clear:'稳', hit:'洒', blocked:'挡', both:'挡洒'};

export function pearlResultPhoto(score: PearlScore, rules: PearlRules) {
 if (rules < 4) return pearlPhoto(score.hits ? 'spill' : 'clean');
 return pearlPhoto(score.hits ? 'after-rain-spill' : score.blocks ? 'after-rain-blocked' : 'after-rain-clean');
}

export function pearlLanes(seed: string): number[] {
 let rng = hashSeed(seed + ':pearl');
 const lanes = [0, 1, 2];
 for (let i = 2; i > 0; i--) {
  const [roll, next] = randomStep(rng);
  rng = next;
  const j = Math.floor(roll * (i + 1));
  [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
 }
 while (lanes.length < PEARL_DELAYS.length) {
  const [roll, next] = randomStep(rng);
  rng = next;
  lanes.push((lanes.at(-1)! + 1 + Math.floor(roll * 2)) % 3);
 }
 return lanes;
}

export function pearlRounds(seed: string, rules: PearlRules): PearlWave[] {
 const lanes = pearlLanes(seed);
 const single = (index: number, warn: number): PearlWave => ({ kind: 'single', mask: 1 << lanes[index], warn });
 if (rules === 1) return PEARL_DELAYS.map((warn, index) => single(index, warn));
 if (rules === 2) return [
  single(0, 1550),
  single(1, 1280),
  { kind: 'double', mask: 5, warn: 1390 },
  { kind: 'lock', mask: 0, warn: 1710, lockAt: 850 },
  { kind: 'double', mask: 7 ^ (1 << lanes[3]), warn: 1060 },
  { kind: 'lock', mask: 0, warn: 1450, lockAt: 850 },
 ];
 const leftFirst = (hashSeed(seed + ':sweep') & 1) === 0;
 const sweep = (left: boolean, warn: number, stepMs: number): PearlWave =>
  ({ kind: 'sweep', mask: left ? 1 : 4, warn, order: left ? [0, 1, 2] : [2, 1, 0], stepMs });
 if (rules === 4) {
  const first = leftFirst ? 2 : 0, other = 2 - first;
  return [
   single(0, 1550),
   { kind:'reflection', mask:1 << lanes[1], echoMask:1 << lanes[2], warn:1510 },
   { kind:'double', mask:7 ^ (1 << lanes[2]), warn:1310 },
   sweep(leftFirst, 1400, 540),
   { kind:'lock', mask:0, warn:1570, lockAt:780 },
   { kind:'reflection', mask:7 ^ (1 << lanes[3]), echoMask:1 << lanes[3], warn:1210 },
   { kind:'return', mask:1 << first, warn:1470, order:[first,1,other,1,first], stepMs:490 },
   { kind:'lock', mask:0, warn:1400, lockAt:720 },
  ];
 }
 return [
  single(0, 1550),
  single(1, 1220),
  { kind: 'double', mask: 7 ^ (1 << lanes[2]), warn: 1310 },
  sweep(leftFirst, 1390, 520),
  { kind: 'lock', mask: 0, warn: 1580, lockAt: 790 },
  { kind: 'double', mask: 7 ^ (1 << lanes[3]), warn: 1040 },
  sweep(!leftFirst, 1160, 450),
 ];
}

export function pearlRank({hits, blocks}: PearlScore) {
 if (!hits) return blocks ? '撑伞也算过关' : '一滴没洒';
 if (hits <= 2) return '还能喝半杯';
 return '下次买带盖的';
}

export function comparePearlScore(score: PearlScore, target: number, targetBlocks?: number) {
 return score.hits - target || (targetBlocks === undefined ? 0 : score.blocks - targetBlocks);
}

function readTrail(raw: string | null, hits: number | undefined, blocks: number | undefined) {
 if (!raw || raw.length!==pearlRoundCount(4) || !/^[0-3]+$/.test(raw) || hits===undefined || blocks===undefined) return;
 const values=[...raw].map(Number);
 if (values.filter(value=>value & 1).length!==hits || values.filter(value=>value & 2).length!==blocks) return;
 return values.map(value=>pearlMarks[value]);
}

export function pearlReward(result: PearlResult): { effect: Effect; text: string } {
 if (result.method === 'sleeve') return {
  effect: { cash: -80, face: 5, spirit: 3, setFlags: ['laser_done', 'pearl_sleeve'] },
  text: '八十块的杯套往上一套，红灯绕开了。你揭开盖子尝了口，还是四块钱的味道。',
 };
 if (result.method === 'neighbor') return {
  effect: { network: 8, spirit: 7, face: -2, setFlags: ['laser_done', 'pearl_neighbor'] },
  text: '旁边阿姨把伞往你这边一歪。红光扫过她的菜篮，她头也没抬。「帮我把那袋青菜扶一下。」',
 };
 const { hits, blocks } = result.score;
 const clean = hits === 0 && blocks === 0;
 return {
  effect: { health: -hits * 3, spirit: 12 - hits * 2, face: 8 - hits, network: hits >= 3 ? 5 : 2,
   setFlags: ['laser_done', 'pearl_run', ...(clean ? ['laser_master'] : [])] },
  text: clean ? '红光停了，一滴没洒。路人问你怎么练的，你说刚才排队的时候练过。'
   : hits === 0 ? '伞开得正好，冰块全在。你把伞还给阿姨，她先摸了摸伞尖。'
   : `你洒了 ${hits} 回。最后一次红光过去，旁边有人递纸巾，问冰块还要不要。`,
 };
}

export function readPearlChallenge(hash: string): PearlChallenge | null {
 if (!hash.startsWith('#pearl=')) return null;
 const params = new URLSearchParams(hash.slice(1));
 const seed = params.get('pearl'), target = params.get('hits'), version = params.get('v');
 if (!seed || !/^[a-z0-9-]{1,32}$/i.test(seed)) return null;
 if (version !== null && !['1','2','3','4'].includes(version)) return null;
 const rules = (version===null ? 1 : Number(version)) as PearlRules;
 const hits = target !== null && /^\d$/.test(target) && Number(target) <= pearlRoundCount(rules) ? Number(target) : undefined;
 const blocks = params.get('blocks');
 const targetBlocks=rules>=3 && hits!==undefined && (blocks==='0'||blocks==='1') ? Number(blocks) : undefined;
 const targetTrail=rules===4 ? readTrail(params.get('trail'),hits,targetBlocks) : undefined;
 return {
  seed,
  target: hits,
  ...(targetBlocks!==undefined && {targetBlocks}),
  ...(targetTrail && {targetTrail}),
  ...(rules !== 1 && { rules }),
 };
}

export function pearlHash(seed: string, target?: number, rules: PearlRules = 1, blocks?: number, trail?: readonly PearlMark[]): string {
 const encoded=rules===4 && trail ? trail.map(mark=>pearlMarks.indexOf(mark)).join('') : '';
 return '#pearl=' + encodeURIComponent(seed) + (rules === 1 ? '' : '&v=' + rules) +
  (target === undefined ? '' : '&hits=' + target + (rules >= 3 && blocks !== undefined ? '&blocks=' + blocks : '') +
   (readTrail(encoded,target,blocks) ? '&trail='+encoded : ''));
}

export function pearlReceipt(state: GameState): LifeEvent | undefined {
 const played = ['pearl_run', 'pearl_neighbor', 'pearl_sleeve'].some(flag => state.flags.includes(flag));
 if (!played || state.seenEvents.includes('pearl-receipt')) return undefined;
 const recalled = state.flags.includes('pearl_sleeve') ? '杯套八十，饮料四块，打印机把杯套记成了护具。'
  : state.flags.includes('pearl_neighbor') ? '小票说你用了公用雨伞。刚才借伞给你的阿姨，还在隔壁摊挑青菜。'
  : state.flags.includes('laser_master') ? '打印机吐出一张零伤小票。最底下多算了四块钱的地面清洁费。'
  : '小票把地砖上的水渍按滴数了。值班的人拿着计算器，问你刚才总共洒了几回。';
 return {
  id: 'pearl-receipt', category: 'explore', tag: '魔都怪谈', district: 'bund',
  title: '小票比胳膊还长', illustration: pearlPhoto('receipt'),
  text: '江边临时摆了张桌子。红灯刚灭，小票还在往外吐。' + recalled + ' 有个爷叔扶着桌子，说等他盖章再走。',
  choices: [
   { id: 'appeal', label: '先对账，把乱收的四块退回来', hint: '拿回四块，留一张盖过章的小票',
    reply: '值班的人核了半天，真退了四块。红章盖在杯套那栏，转身还问你空杯要不要带走。', effect: { cash: 4, skill: 5, setFlags: ['pearl_appeal', 'laser_story_0'] } },
   { id: 'help', label: '帮爷叔把折叠桌抬走', hint: '留一步帮他收摊',
    reply: '爷叔一喊「沪爷冲击」，你以为还要再躲一轮。他把桌腿抬起来，让你往左一点，别把豆浆打翻。', effect: { network: 9, spirit: 6, setFlags: ['pearl_help', 'laser_story_0'] } },
   { id: 'drink', label: '先喝完，给后面的人留张空桌', hint: '站着喝完，看看还有谁跟着喝',
    reply: '你刚喝下第一口，后面三个人也把吸管戳了进去。塔没再响，打印机倒是卡纸了。', effect: { spirit: 10, face: 4, setFlags: ['pearl_drink', 'laser_story_0'] } },
  ],
 };
}
