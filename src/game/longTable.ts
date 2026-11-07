import { tablePhoto } from './art';
import type { Effect, EventChoice, GameState, LifeEvent } from './types';

const CLUB = 'long-table-club';
const BENCH = 'long-table-bench';
const TABLE_INCOME = 2400;
const tag = '弄堂长桌';

function roomPlan(flag?: string): Effect {
 return {
  ...(flag && { setFlags: [flag] }),
  removeFlags: [CLUB, BENCH].filter(plan => plan !== flag),
 };
}

const takeTheTable: LifeEvent = {
 id: 'long-table-folded', category: 'year', district: 'people', speakerId: 'tang', tag,
 title: '折起来只有半张', illustration: tablePhoto('folded-table'),
 text: '改衣铺今天搬空。唐圆把一张旧折桌从门后拽出来，说收废品的人五点到。她掀开桌板，指给你看缺了一角的地方。「放在墙边，折起来就半张。侬要伐？」',
 choices: [
  { id: 'shared', label: '出六百八，修好给街坊用', hint: '支出 ¥680',
   reply: '师傅换了个合页。唐圆把桌子支在楼下，拿粉笔在背面写了个「借」。隔天你下楼，有人在桌上给孩子包书皮。',
   effect: { cash: -680, network: 7, trust: 6, setFlags: ['long-table-shared'] } },
  { id: 'home', label: '搬回家，给自己留个桌面',
   reply: '你们把桌子侧过来才抬进门。唐圆拿旧报纸垫平桌脚，坐下来问能不能先借你这儿吃碗馄饨。',
   effect: { spirit: 6, skill: 3, trust: 4, setFlags: ['long-table-home'] } },
  { id: 'pass', label: '帮她拆桌腿，交给收废品的',
   reply: '最后一颗螺丝怎么也拧不动。唐圆把松开的半块桌板先靠在墙边，说这个倒还能给门厅垫个东西。',
   effect: { health: 4, network: 3, setFlags: ['long-table-passed'] } },
 ],
};

const keepTheRoom: LifeEvent = {
 id: 'long-table-move', category: 'year', district: 'people', speakerId: 'tang', tag,
 title: '楼道里不能再摆桌', illustration: tablePhoto('table-inside'),
 text: '楼道下礼拜修下水，地上用粉笔画了道线。唐圆把腾空的街坊活动室打开，你俩拿尺量了一下。折桌放进去，刚好多出两把椅子的地方。',
 choices: [
  { id: 'club', label: '把灯和插座装好，留给街坊坐坐', hint: '支出 ¥3,200 · 之后每年心气 +4',
   reply: '电工装完灯，唐圆又找来一把椅子。你问谁的。她说先空着，总有人下班晚，坐下来才想起来自己还没吃饭。',
   effect: { ...roomPlan(CLUB), cash: -3200, network: 7, spirit: 7, trust: 5 } },
  { id: 'bench', label: '我留两个晚上，接点修修补补的活', hint: '之后每年多收 ¥2,400 · 身体 −2',
   reply: '第一件是修一把伞。那人来拿的时候又带了口锅，问松了的锅把能不能也帮她拧一下。唐圆开始给你记账。',
   effect: { ...roomPlan(BENCH), skill: 5, network: 5, trust: 4 } },
  { id: 'leave', label: '把位置腾出来，钥匙交给唐圆',
   reply: '唐圆收了钥匙，问你以后周三还从这儿走伐。你说走，她就在门背后给你留了个能挂伞的钩子。',
   effect: { ...roomPlan(), health: 7, spirit: 4, trust: 5 } },
 ],
};

function saturday(state: GameState): LifeEvent {
 const hasBench = state.flags.includes(BENCH);
 const hasClub = state.flags.includes(CLUB);
 const club: EventChoice = {
  id: 'club',
  label: hasBench ? '把工具借出去，我周六来坐坐' : '每周来一趟，给下班晚的人留座',
  hint: '之后每年心气 +4',
  reply: '唐圆把你的位子挪到门边，方便人进来时往里坐。第一个来的是楼上新搬来的人，她把工牌还挂在脖子上。',
  effect: { ...roomPlan(CLUB), spirit: 6, network: 5, trust: 4 },
 };
 const bench: EventChoice = {
  id: 'bench',
  label: hasBench ? '修理台照开，请她来一起做' : '教她修第一把伞，周六一起开台',
  hint: '之后每年多收 ¥2,400 · 身体 −2',
  reply: '她修完第一把伞，顺手把桌角那颗松的螺丝也紧了。唐圆记了两笔账，第二笔是你们三个人的馄饨。',
  effect: { ...roomPlan(BENCH), skill: 5, network: 6, trust: 4 },
 };
 const memory = hasBench ? '账本上还夹着第一把伞的收条。' : hasClub ? '门边那盏你们换过的灯还亮着。' : '唐圆自己找了个新合页，桌子展开时已经不响了。';
 return {
  id: 'long-table-chair', category: 'year', district: 'people', speakerId: 'tang', tag,
  title: '周六还有一张椅子', illustration: tablePhoto('empty-chair'),
  text: memory + ' 唐圆把最靠门的一张椅子拉出来。隔壁来个年轻人，拎了把断骨的伞，问周六能不能跟你们学。',
  choices: [club, bench, {
   id: 'off', label: '把椅子留给她，周六我去坐头班船', hint: '收起这摊事，腾出周末',
   reply: '她把伞摊开，一根一根数骨头。出门前唐圆问你头班船几点，你说不知道，正好去看看。',
   effect: { ...roomPlan(), health: 8, spirit: 8, trust: 6 },
  }],
 };
}

export function longTableYear(state: GameState): LifeEvent | undefined {
 const { age, flags, seenEvents } = state;
 if (age >= 53 && age <= 58 && !seenEvents.includes('long-table-chair')) return saturday(state);
 if (age >= 46 && age <= 52 && !seenEvents.includes(keepTheRoom.id)) {
  const memory = flags.includes('long-table-shared') ? '这些年楼下的人把你借出去的桌子用得很熟，自己知道哪边有缺角。'
   : flags.includes('long-table-home') ? '你用了十几年的那张桌子，最近才从家里搬回楼下。'
   : flags.includes('long-table-passed') ? '唐圆当年没扔那半块桌板，后来配了两条腿。'
   : '唐圆从储藏间拖来一张旧折桌，少了一小块桌角。';
  return { ...keepTheRoom, text: memory + ' ' + keepTheRoom.text };
 }
 if (age >= 32 && age <= 44 && !seenEvents.includes(takeTheTable.id)) return takeTheTable;
 return undefined;
}

export function longTableBudget(state: GameState) {
 return {
  income: state.flags.includes(BENCH) ? TABLE_INCOME : 0,
  spirit: state.flags.includes(CLUB) ? 4 : 0,
 };
}

export function longTableMemory(state: GameState) {
 const entry = state.journal.slice().reverse().find(item => item.tag === tag);
 return entry && { ...entry, illustration: tablePhoto(entry.age >= 53 ? 'empty-chair' : entry.age >= 46 ? 'table-inside' : 'folded-table') };
}
