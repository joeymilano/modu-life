import { ferryPhoto, type FERRY_STILLS } from './art';
import type { GameState, LifeEvent } from './types';

function atThePier(shot: (typeof FERRY_STILLS)[number], title: string, text: string, choices: LifeEvent['choices']): LifeEvent {
 return {
  id: 'bund-ferry-' + shot, category: 'social', district: 'bund', speakerId: 'yan', tag: '外滩 · 摆渡口',
  title, text, choices, illustration: ferryPhoto(shot),
 };
}

const cake = atThePier('cake', '严可的半价蛋糕',
 '严可刚下夜班。蛋糕店打烊，半价给了她一个没人来取的蛋糕。她掀开盖子，巧克力牌上写着「出院快乐」。「今朝我生日，这四个字也能用。」闸机开始催人，便利店的阿姨还在门口收伞。', [
  { id: 'board', label: '刷两张票 · 靠窗找个位子',
   effect: { cash: -4, spirit: 6, trust: 9, setFlags: ['ferry-cake-boarded'] },
   reply: '船一开，唯一一根蜡烛就滚到邻座鞋边。爷叔捡起来问谁出院了。严可说「我每天都从医院出来」。他把保温杯举起来，跟纸杯碰了一下。' },
  { id: 'stay', label: '先切给收伞的阿姨 · 今晚不过江',
   effect: { network: 6, spirit: 4, trust: 7, setFlags: ['ferry-cake-stayed'] },
   reply: '阿姨把门口的塑料凳搬回来，去微波炉边找了把刀。蛋糕吃到一半，最后一班船开了。她说没事，门牌上写十点打烊，灯是她关。' },
 ]);

const cabin = atThePier('cabin', '靠窗那个位置还空着',
 '后来你又在轮渡上碰到严可。她用一盒生煎占了靠窗的位置，见你来才拿起来。她问你下礼拜还坐不坐这班。她排到四个连班，想挑一天换掉。', [
  { id: 'book', label: '约定周三 · 这次我带吃的', effect: { trust: 10, spirit: 6 },
   reply: '周三你带了六个生煎，她也带了六个。船开以后，你们把十二个摆成一排，先数有几个底是脆的。' },
  { id: 'weather', label: '先别换班 · 哪天早下班就叫我', effect: { trust: 5, health: 4, network: 4 },
   reply: '隔了三个礼拜，严可下午四点给你打电话。你问怎么这么早，她说终于轮到她在外滩看一回太阳落下去。' },
 ]);

const booth = atThePier('booth', '阿姨又摆了两把凳子',
 '严可叫你来便利店。阿姨今天过生日，她让蛋糕店照上次的做。阿姨揭开盒子，看见巧克力牌上还是那四个字，说「我又没进过医院」。严可把刀递给她，问是从字上切，还是从边上切。', [
  { id: 'sign', label: '请阿姨切第一刀 · 字留给她', effect: { trust: 8, network: 8 },
   reply: '阿姨拿走那块巧克力，掰了半截给你。后来你在这儿买水，她只要看见你，就会把靠窗那把凳子转过来。' },
  { id: 'share', label: '多切一块 · 给刚收工的摆渡师傅', effect: { spirit: 8, network: 6, trust: 4 },
   reply: '师傅拿到那块时还戴着手套，摘了半天。他说要留给孙女，最后只剩那个空纸碟带回家。' },
 ]);

export function ferryVisit(state: GameState): LifeEvent | null {
 if (state.district !== 'bund' || state.ended || state.pendingYearEvent || state.actions <= 0) return null;
 if (!state.seenEvents.includes(cake.id)) return cake;
 const next = state.flags.includes('ferry-cake-boarded') ? cabin : state.flags.includes('ferry-cake-stayed') ? booth : null;
 return next && !state.seenEvents.includes(next.id) ? next : null;
}
