import { matchPhoto } from './art';
import type { GameState, LifeEvent } from './types';

type Visit = { event: LifeEvent; message?: string };

const openingId = 'matchmaking-paper';
const location = { category: 'romance', district: 'people', tag: '相亲角' } as const;

function opening(housing: GameState['housing']): LifeEvent {
 const owns = housing === 3;
 const line = owns ? '她在「有房」下面划了条线，提醒你别写面积。上次有人带着卷尺来。'
  : (housing ? '那是你租的房子。' : '你现在借住在那儿。') + '汪阿姨倒也承认，这张纸换成房东的名字就对了。';
 return {
  ...location, id: openingId, title: '伞下这张写的是你', speakerId: 'aunt', illustration: matchPhoto('paper'),
  text: '人民公园刚停雨。汪阿姨捏着个夹子，把一张纸递给你。名字是你的，地址是你的，旁边添了一行「上海有房」。' + line,
  choices: [
   { id: 'list', label: owns ? '就这么挂 · 留个联系方式' : '先挂上 · 房本的事见面再说',
    reply: '纸夹上去不到五分钟，有人来问「有房」那行怎么写得比名字还大。汪阿姨说纸就这么宽，然后把你号码发过去了。',
    effect: { face: 6, network: 4, setFlags: ['match-listed', ...(owns ? [] : ['match-address-only'])] } },
   { id: 'edit', label: '把地址那行划掉 · 写周末想去哪里',
    reply: '你写了去吃碗馄饨，下面加了一句排队超过十分钟就换一家。有个人看了半天，问旁边能不能写上「我也这么想」。',
    effect: { spirit: 6, skill: 3, setFlags: ['match-edited'] } },
   { id: 'fold', label: '把纸折起来 · 陪汪阿姨收伞',
    reply: '她让你把夹子留着，坏了就拿个新的。最后一把伞收好，她没急着走，问你现在的手机能不能把人拍得像本人。',
    effect: { trust: 9, spirit: 4, setFlags: ['match-folded'] } },
  ],
 };
}

function listed(overstated: boolean): LifeEvent {
 return {
  ...location, id: 'matchmaking-coffee', title: '地址那行，怎么说', speakerId: 'tang', illustration: matchPhoto('coffee'),
  text: '唐圆拿着两张纸。她说她妈那张把「刚辞职」印成了「职业自由」，问你这张是不是也有人帮你改过。奶茶都喝到一半了，她还把纸压在杯底。',
  choices: [
   { id: 'talk', label: overstated ? '先说清 · 房本上没我名字' : '把房子的事说清，再问她近况',
    reply: overstated ? '唐圆先把你那行划掉，再把自己的也划掉。她说都到这儿了，能不能换成聊哪家房东退押金痛快。'
      : '唐圆把两张纸收起来。她说现在能不能聊点双方家长都没写的，比如她到底想不想再去上那个班。',
    effect: { trust: 10, spirit: 5, face: overstated ? -3 : 2 } },
   { id: 'rewrite', label: '借支笔 · 两张都改回来',
    reply: '她写「最近在找工作」，你把你那张也翻过来。老板收空杯时看了半天，以为两张纸加起来是一份问卷。',
    effect: { skill: 7, trust: 8, network: 4 } },
   { id: 'buy', label: '先把话题岔开 · 今天我请 ¥128',
    reply: '她把多点的点心装进袋子，说她妈下次还要问。你到家发现一张纸夹在袋里，有房那行被奶茶洇得看不清了。',
    effect: { cash: -128, spirit: -3, face: 4 } },
  ],
 };
}

const edited: LifeEvent = {
 ...location, id: 'matchmaking-bench', title: '这份也给你看看', speakerId: 'tang', illustration: matchPhoto('bench'),
 text: '唐圆在长椅上给你留了半边干的。馄饨摊还没开，她先把那张写着「我也这么想」的纸递给你，底下还夹着一份没投出去的简历。',
 choices: [
  { id: 'practice', label: '趁摊没开 · 一人挑一段简历改',
   reply: '你把「协助参与」圈了出来。唐圆问你自己上回那份写的什么，你翻了一下，也是一模一样四个字。',
   effect: { skill: 8, trust: 7 } },
  { id: 'eat', label: '先吃馄饨 · 顺便打包一碗 ¥40',
   reply: '你把打包的递给唐圆。她说她妈下礼拜还来挂纸，到时候给她带去，让她站在那儿也有口热的。',
   effect: { cash: -40, spirit: 9, trust: 8 } },
  { id: 'keep', label: '简历给我一份 · 有合适的就转你',
   reply: '她把文件改了名才发你。过几天你也收到一个职位链接，唐圆说她看了半天，感觉写的是你。',
   effect: { network: 10, trust: 5 } },
 ],
};

const folded: LifeEvent = {
 ...location, id: 'matchmaking-portrait', title: '这回拍我', speakerId: 'aunt', illustration: matchPhoto('own-umbrella'),
 text: '汪阿姨把手机递给你，外壳还是透明的。她要找个人礼拜天一起走一圈。走一圈是从公园走到菜场，十点四十前必须到家，她还得烧饭。',
 choices: [
  { id: 'hang', label: '就在这儿拍 · 我帮你把纸挂上',
   reply: '她写「不赶路，也不迟到」。隔壁的爷叔看了，说能不能十点半就到，摊上还剩两条小黄鱼。他们约好了在菜场门口等。',
   effect: { network: 9, trust: 10 } },
  { id: 'walk', label: '这礼拜先跟我走 · 九点门口见',
   reply: '走到菜场她把你丢给卖豆腐的摊主，自己去买鱼。回来时豆腐摊主已经跟你讲完了他儿子两次辞职的事。',
   effect: { health: 5, network: 6, trust: 5 } },
  { id: 'print', label: '只拍张本人 · 洗两张 ¥12',
   reply: '她把一张塞进透明手机壳，另一张寄给了外地的老同学。后来你路过，那张纸上换了行字，写的是什么时候去逛菜场。',
   effect: { cash: -12, spirit: 8, trust: 7 } },
 ],
};

export function parkVisit(state: GameState): Visit | null {
 if (state.pendingYearEvent || state.ended) return null;
 if (!state.seenEvents.includes(openingId)) return state.partnerId ? null : { event: opening(state.housing) };
 const next = state.flags.includes('match-listed') ? { event: listed(state.flags.includes('match-address-only')), message: '有人拿着你那张纸来问地址' }
  : state.flags.includes('match-edited') ? { event: edited, message: '唐圆在长椅上给你留了个位' }
  : state.flags.includes('match-folded') ? { event: folded, message: '汪阿姨问你能不能帮她拍张照' }
  : null;
 return next && !state.seenEvents.includes(next.event.id) ? next : null;
}

export const PARK_TICKET_SCENES = [opening(1), listed(true), edited, folded] as const;
