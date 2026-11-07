import { hashSeed, randomStep } from './engine';
import type { Effect, GameState, LifeEvent } from './types';
import { pearlPhoto } from './art';

export const PEARL_DELAYS = [1560, 1320, 1130, 960, 820];
export const PEARL_LANES = ['左侧', '中间', '右侧'] as const;
export type PearlScore = { hits: number; blocks: number };
export type PearlResult = { method: 'run'; score: PearlScore } | { method: 'sleeve' } | { method: 'neighbor' };
export type PearlChallenge = { seed: string; target?: number };

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

export function pearlRank({hits, blocks}: PearlScore) {
 if (!hits) return blocks ? '撑伞也算过关' : '一滴没洒';
 if (hits <= 2) return '还能喝半杯';
 return '下次买带盖的';
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
  text: clean ? '五轮下来一滴没洒。路人问你怎么练的，你说刚才排队的时候练过。'
   : hits === 0 ? '伞开得正好，冰块全在。你把伞还给阿姨，她先摸了摸伞尖。'
   : `你洒了 ${hits} 回。最后一次红光过去，旁边有人递纸巾，问冰块还要不要。`,
 };
}

export function readPearlChallenge(hash: string): PearlChallenge | null {
 if (!hash.startsWith('#pearl=')) return null;
 const params = new URLSearchParams(hash.slice(1));
 const seed = params.get('pearl'), target = params.get('hits');
 if (!seed || !/^[a-z0-9-]{1,32}$/i.test(seed)) return null;
 return { seed, target: target !== null && /^[0-5]$/.test(target) ? Number(target) : undefined };
}

export function pearlHash(seed: string, target?: number): string {
 return '#pearl=' + encodeURIComponent(seed) + (target === undefined ? '' : '&hits=' + target);
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
