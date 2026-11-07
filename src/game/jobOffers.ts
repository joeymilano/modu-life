import { offerPhoto } from './art';
import { CAREERS } from './content';
import { employmentOf, MAX_PAY_RATE, monthlySalary, moveJob, NIGHT_WORK } from './employment';
import type { Career, EventChoice, GameState, LifeEvent } from './types';

type OfferTopic = 'pay' | 'hours' | 'none';
export type InterviewOffer = { topic: OfferTopic; proof: boolean };

const money = (value: number) => '¥' + value.toLocaleString('zh-CN');
const prefix = 'mini-offer-';
const extraShift: Record<string, [title: string, condition: string, firstShift: string]> = {
 tech: ['谁来接凌晨的电话', '夜里系统响了，轮到谁谁起床。', '刚睡着，手机响了。告警标题写着「可忽略」。'],
 finance: ['月底算谁的时间', '月底得留两晚，最后一笔对平了才走。', '九点半，沈经理拆了袋饼干，把最后一张表发给你。'],
 creative: ['礼拜天谁来改稿', '礼拜天甲方改稿，得有人开电脑。', '礼拜天十一点，甲方问能不能再看第一版。'],
 service: ['最后一桌谁送走', '晚市最后一桌走了，才轮到你关店。', '最后一桌又添了一碗面。你把刚叠好的凳子放回去一张。'],
 public: ['周末谁接报修', '周末轮值，楼上漏水也会打你电话。', '礼拜六刚下雨，阿姨打来问，她家滴水算不算紧急。'],
 trade: ['对面上班，你下班伐', '客户那边刚开工，上海已经过十点了。', '你在末班地铁上回了封邮件。对面说早上好。'],
};

export function offerTopic(index: number): OfferTopic {
 return index === 0 ? 'pay' : index === 1 ? 'hours' : 'none';
}

export function isJobOffer(eventId: string) { return eventId.startsWith(prefix); }

export function isSelfEmployed(careerId: string) { return careerId === 'freelance' || careerId === 'business'; }

function quote(state: GameState, career: Career, rate: number) {
 const projection = { ...state, employment: { ...employmentOf(state) } };
 moveJob(projection, career.id);
 projection.employment.rate = rate;
 const monthly = monthlySalary(projection), months = 12 - projection.employment.closedMonths;
 return { monthly, months, previous: projection.employment.earned };
}

function baseEvent(career: Career, offer: InterviewOffer) {
 return {
  id: prefix + career.id + '-' + offer.topic + '-' + Number(offer.proof),
  category: 'career' as const,
  tag: career.name,
  illustration: offerPhoto(career.id),
 };
}

function decline(state: GameState, career: Career): EventChoice {
 const contract = isSelfEmployed(career.id);
 return {
  id: 'leave',
  label: contract ? '先不接这单' : '笔还给对方，先不签',
  hint: state.jobId ? '现有工作和收入照旧' : '继续找活',
  reply: career.id === 'business' ? '你把订货本合起来。他走到门口，又回来买了两个现成的。'
   : contract ? '你把样稿合起来。对方送你到门口，临走问了句，下礼拜还有空伐。'
   : '你把笔还回去。刚才跟你换过座的候选人还在门口，问上面有没有提加班。',
  effect: { skill: 5, spirit: 2 },
 };
}

function employeeOffer(state: GameState, career: Career, offer: InterviewOffer): LifeEvent {
 const [title, condition, firstShift] = extraShift[career.id];
 const current = state.jobId === career.id ? employmentOf(state).rate : 0;
 const dayRate = Math.max(offer.proof && offer.topic === 'hours' ? 1.05 : 1, state.flags.includes(NIGHT_WORK) ? 0 : current);
 const lateRate = Math.max(dayRate, current, offer.proof && offer.topic === 'pay' ? MAX_PAY_RATE : 1.12);
 const day = quote(state, career, dayRate), late = quote(state, career, lateRate);
 const terms = (pay: ReturnType<typeof quote>) => `${money(pay.monthly)}/月 · 今年计 ${pay.months} 个月，入账 ${money(pay.monthly * pay.months)}`;
 const intro = offer.topic === 'pay' ? '你问津贴是不是每个月都发。对方把「看情况」划掉，另写了一行。'
  : offer.topic === 'hours' ? '你问加班能不能推。对方把两张排班表摊开，朝你这边转了一下。'
  : '你刚说自己能吃苦，对方就把第二张排班表也拿出来了。';
 const previous = day.previous ? ` 前面的工作已计 ${money(day.previous)}，年底另外到账。` : '';
 return {
  ...baseEvent(career, offer), title,
  text: `${intro} ${condition}${previous}`,
  choices: [
   {
    id: 'day', label: '签普通班，到点走', hint: terms(day),
    effect: { job: career.id, payRate: dayRate, skill: 4, face: 5, spirit: 7, removeFlags: [NIGHT_WORK] },
    reply: `你把每月 ${money(day.monthly)} 圈了一遍。对方说群还是要进，有事明天回。`,
   },
   {
    id: 'night', label: '把津贴写进去，我接轮值', hint: terms(late) + ' · 每年多耗体力和心气',
    effect: { job: career.id, payRate: lateRate, skill: 4, face: 6, health: -2, spirit: 2, setFlags: [NIGHT_WORK] },
    reply: `对方把 ${money(late.monthly)} 写进工资栏。 ${firstShift}`,
   },
   decline(state, career),
  ],
 };
}

function contractOffer(state: GameState, career: Career, offer: InterviewOffer): LifeEvent {
 const shop = career.id === 'business';
 const depositFlag = 'offer-deposit-' + career.id + '-' + state.age;
 const deposit = state.flags.includes(depositFlag) ? 0 : (shop ? 2100 : 1500) + (offer.proof && offer.topic === 'pay' ? 600 : 0);
 const invoiceRate = offer.proof && offer.topic === 'hours' ? 1.14 : 1.08;
 const advance = quote(state, career, .9), invoice = quote(state, career, invoiceRate);
 const title = shop ? '早点先订几份' : '款哪天结';
 const ask = offer.topic === 'pay' ? '你问今天能先转多少。他把手机翻了过来。'
  : offer.topic === 'hours' ? shop ? '你问周末的份数哪天定。他翻回订货本第一页。' : '你问交完还改几次。他在第二页补了一行。'
  : '他说今天可以先付一小笔，做完再按价结。';
 const opening = shop ? '有人想长期订你家的早点。说好每周来拿，临走又问，临时减量能不能退钱。' : '对方把源文件的话放到一边，问这单今晚能不能开工。';
 return {
  ...baseEvent(career, offer), title, text: opening + ask,
  choices: [
   {
    id: 'deposit', label: deposit ? '先收一笔，钱到再排时间' : '沿用上次的首款价',
    hint: `${deposit ? money(deposit) + ' 现在到账' : '本年首款已收'} · 月收入估 ${money(advance.monthly)}，年底随生意浮动`,
    effect: { job: career.id, cash: deposit, payRate: .9, skill: 4, spirit: 6, setFlags: [depositFlag] },
    reply: deposit ? `转账响了一声，${money(deposit)} 到了。你在纸背写好日期，等他看完才把纸收走。`
     : '你们把上次的约定翻出来，对着收款记录，把下回交货的日期写上。',
   },
   {
    id: 'invoice', label: '按全价走，写死结款日',
    hint: `月收入估 ${money(invoice.monthly)} · 现在先垫工夫，年底随生意浮动`,
    effect: { job: career.id, payRate: invoiceRate, skill: 6, face: 5, spirit: 2 },
    reply: '他先写「月底」，发现你还没接笔，又补了个二十八。',
   },
   decline(state, career),
  ],
 };
}

export function jobOffer(state: GameState, career: Career, offer: InterviewOffer): LifeEvent {
 return isSelfEmployed(career.id) ? contractOffer(state, career, offer) : employeeOffer(state, career, offer);
}

export function replayJobOffer(state: GameState, eventId: string): LifeEvent | null {
 if (state.pendingYearEvent || state.ended || state.actions <= 0) return null;
 const match = /^mini-offer-([a-z]+)-(pay|hours|none)-(0|1)$/.exec(eventId);
 const career = CAREERS.find(item => item.id === match?.[1]);
 return career && match ? jobOffer(state, career, { topic: match[2] as OfferTopic, proof: match[3] === '1' }) : null;
}
