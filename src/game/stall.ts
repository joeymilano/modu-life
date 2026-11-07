import { stallPhoto } from './art';
import type { GameState, LifeEvent } from './types';

export const STALL_STEPS = 14;
export const STALL_MAX_WASTE = STALL_STEPS * 2;
export const STALL_DISHES = {
 sheng: { name: '生煎', heat: 2 },
 guo: { name: '锅贴', heat: 1 },
} as const;
export type Dish = keyof typeof STALL_DISHES;
export type PanIndex = 0 | 1;
export type StallOrder = { id: number; dish: Dish; arrives: number; deadline: number; person: string; line: string };
type Batch = { dish: Dish; portions: number; ready: number; burns: number };
type OrderStatus = 'waiting' | 'served' | 'left';
export type StallShift = {
 step: number; orders: readonly StallOrder[]; status: OrderStatus[];
 pans: [Batch | null, Batch | null]; waste: number; message: string;
};
export type StallScore = { served: number; waste: number };
export type StallSchedule = 0 | 1;
export type StallMove =
 { type: 'cook'; pan: PanIndex; dish: Dish } | { type: 'serve'; order: number } | { type: 'discard'; pan: PanIndex } | { type: 'wait' };

const ORDERS: readonly StallOrder[] = [
 { id: 1, dish: 'sheng', arrives: 0, deadline: 5, person: 'uncle', line: '棋还摆在那边，别让人替我走。' },
 { id: 2, dish: 'guo', arrives: 1, deadline: 6, person: 'yan', line: '夜班要换衣服，给我包一份。' },
 { id: 3, dish: 'sheng', arrives: 3, deadline: 8, person: 'fang', line: '我跟客户说电梯坏了，还能等会儿。' },
 { id: 4, dish: 'guo', arrives: 5, deadline: 10, person: 'qi', line: '还在等对方回我最后一版。' },
 { id: 5, dish: 'sheng', arrives: 7, deadline: 12, person: 'lu', line: '下一首还没轮到我。' },
 { id: 6, dish: 'guo', arrives: 8, deadline: 13, person: 'lin', line: '我画完这张就走。' },
 { id: 7, dish: 'sheng', arrives: 9, deadline: 13, person: 'gao', line: '替同事买，他说他不饿。' },
 { id: 8, dish: 'guo', arrives: 9, deadline: 13, person: 'aunt', line: '我就站这儿，不催你。' },
];
export const STALL_ORDER_COUNT = ORDERS.length;
const alternate: Record<Dish, Dish> = { sheng: 'guo', guo: 'sheng' };

export function stallSchedule(seed: string, age: number, actions: number): StallSchedule {
 return ((seed.charCodeAt(0) || 0) + age + actions) % 2 === 1 ? 1 : 0;
}

export function startStall(schedule: StallSchedule): StallShift {
 return {
  step: 0, orders: schedule ? ORDERS.map(order => ({ ...order, dish: alternate[order.dish] })) : ORDERS,
  status: ORDERS.map(() => 'waiting'), pans: [null, null], waste: 0,
  message: '顾爷叔到了。吴师傅把单子夹在你眼前。',
 };
}

export function waitingOrders(shift: StallShift) {
 return shift.orders.filter((order, index) => shift.status[index] === 'waiting' && order.arrives <= shift.step);
}

export function servingPan(shift: StallShift, dish: Dish): PanIndex | undefined {
 const [left, right] = shift.pans;
 const leftReady = left?.dish === dish && left.ready <= shift.step;
 const rightReady = right?.dish === dish && right.ready <= shift.step;
 if (leftReady && rightReady) return left.burns <= right.burns ? 0 : 1;
 if (leftReady) return 0;
 if (rightReady) return 1;
}

export function stallScore(shift: StallShift): StallScore {
 return { served: shift.status.filter(state => state === 'served').length, waste: shift.waste };
}

export function stallRank({ served, waste }: StallScore) {
 if (served === STALL_ORDER_COUNT && !waste) return '一张单都没跑';
 if (served >= 6) return '还有人问明天开不开';
 if (served >= 4) return '备用围裙留给你';
 return '下回先倒杯水';
}

export function moveStall(shift: StallShift, move: StallMove): StallShift {
 if (shift.step >= STALL_STEPS) return shift;
 const next: StallShift = { ...shift, step: shift.step + 1, status: [...shift.status], pans: [...shift.pans] };
 const messages: string[] = [];
 if (move.type === 'cook') {
  if (shift.pans[move.pan]) return shift;
  const ready = next.step + STALL_DISHES[move.dish].heat;
  next.pans[move.pan] = { dish: move.dish, portions: 2, ready, burns: ready + 4 };
  messages.push(STALL_DISHES[move.dish].name + '下锅，两份。');
 } else if (move.type === 'serve') {
  const index = shift.orders.findIndex(order => order.id === move.order);
  const order = shift.orders[index];
  if (!order || shift.status[index] !== 'waiting' || order.arrives > shift.step) return shift;
  const pan = servingPan(shift, order.dish);
  if (pan === undefined) return shift;
  const batch = shift.pans[pan]!;
  next.pans[pan] = batch.portions > 1 ? { ...batch, portions: batch.portions - 1 } : null;
  next.status[index] = 'served';
  messages.push(STALL_DISHES[order.dish].name + '出了一份。');
 } else if (move.type === 'discard') {
  const batch = shift.pans[move.pan];
  if (!batch) return shift;
  next.waste += batch.portions;
  next.pans[move.pan] = null;
  messages.push('这锅先撤了。');
 }
 let burned = 0;
 for (const index of [0, 1] as const) {
  const pan = next.pans[index];
  if (!pan || pan.burns > next.step) continue;
  burned += pan.portions;
  next.pans[index] = null;
 }
 if (burned) {
  next.waste += burned;
  messages.push(`有 ${burned} 份糊底，锅已腾空。`);
 }
 if (next.step === STALL_STEPS) {
  next.waste += next.pans.reduce((count, pan) => count + (pan?.portions ?? 0), 0);
  next.pans = [null, null];
 }
 let gone = 0;
 for (const [index, order] of next.orders.entries()) {
  if (next.status[index] !== 'waiting' || order.deadline >= next.step) continue;
  next.status[index] = 'left';
  gone++;
 }
 if (gone) messages.push(`${gone} 单等不及走了。`);
 const arrived = next.orders.filter(order => order.arrives === next.step).length;
 if (arrived) messages.push(`又来了 ${arrived} 单。`);
 next.message = messages.join(' ') || '锅盖还响着。';
 return next;
}

const prefix = 'stall-v1-';
const recurring = 'stall-until-';
export const STALL_YEARLY_PAY = 2400;

export function stallCommitment(state: GameState) {
 const through = Math.max(0, ...state.flags.flatMap(flag => {
  const match = /^stall-until-(\d{2})$/.exec(flag);
  return match ? [Number(match[1])] : [];
 }));
 return through >= state.age ? Math.min(through, 59) - state.age + 1 : 0;
}

export function settleStall(state: GameState, score: StallScore): LifeEvent {
 const { served, waste } = score;
 const paid = Math.max(160, 220 + 85 * served - 40 * waste);
 const contractYears = Math.min(3, 60 - state.age);
 const sign = served >= 4 && stallCommitment(state) <= 0 && contractYears > 0;
 const photos = waste > 0 ? 'burnt' : 'close';
 return {
  id: prefix + served + '-' + waste, title: served === ORDERS.length && !waste ? '一张单都没跑' : '关火了，账还没对',
  text: `出掉 ${served} 单，等走 ${ORDERS.length - served} 单，${waste} 份没卖掉。吴师傅把钱按在账本上，问你下回还来不来。`,
  category: 'business', district: 'xinzhuang', tag: '小吃街晚市', speakerId: 'wu', illustration: stallPhoto(photos),
  choices: [
   { id: 'paid', label: '今晚的工钱先结', hint: `现在到账 ¥${paid.toLocaleString('zh-CN')}`,
    reply: `吴师傅数给你 ¥${paid.toLocaleString('zh-CN')}。他把最后两只醋碟收到一起，说这两只谁也没少拿，倒是挺准。`,
    effect: { cash: paid, skill: 2 + Math.floor(served / 2), health: -3 } },
   sign ? { id: 'shift', label: '留个晚班给我，下回也来',
    hint: `现在拿 ¥${Math.floor(paid / 2)} · 今年起 ${contractYears} 年每年多 ¥2,400，也要耗体力`,
    reply: '吴师傅只问你礼拜几有空。你报了一个，他把那天自己的名字擦掉，又在旁边补了句，锅盖别拿反。',
    effect: { cash: Math.floor(paid / 2), trust: 8, health: -3, setFlags: [recurring + (state.age + contractYears - 1)] } }
    : { id: 'learn', label: '算半份工钱，教我看火',
     hint: `现在拿 ¥${Math.floor(paid / 2)} · 跟吴师傅学一回`,
     reply: '他没讲温度，只让你在锅边站了两分钟。再有响声，你已经听得出哪口锅要开盖。',
     effect: { cash: Math.floor(paid / 2), skill: 9, trust: 5 } },
   { id: 'eat', label: '留一份给最后那桌，咱们坐会儿',
    hint: `现在拿 ¥${Math.floor(paid * .7)} · 和街坊吃宵夜`,
    reply: '汪阿姨说她就尝一口。你找回筷子的时候，醋都倒了第二碟。吴师傅找了把还没叠的凳子给你。',
    effect: { cash: Math.floor(paid * .7), spirit: 7, network: 5, trust: 4 } },
  ],
 };
}

export function replayStall(state: GameState, id: string): LifeEvent | null {
 if (state.district !== 'xinzhuang' || state.pendingYearEvent || state.ended || state.actions <= 0) return null;
 const match = /^stall-v1-([0-8])-(0|[1-9]\d?)$/.exec(id);
 return match && Number(match[2]) <= STALL_MAX_WASTE
  ? settleStall(state, { served: Number(match[1]), waste: Number(match[2]) }) : null;
}

export function isStallSettlement(id: string) { return id.startsWith(prefix); }
