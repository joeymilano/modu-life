import { matchPhoto } from './art';
import { householdPlan, housingPayment } from './household';
import type { GameState, LifeEvent } from './types';

type Visit = { event: LifeEvent; message?: string };

const openingId = 'matchmaking-paper';
const location = { category: 'romance', district: 'people', tag: '相亲角' } as const;
const rent = 2800;
const formatMoney = (value: number) => '¥' + value.toLocaleString('zh-CN');

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
    effect: { cash: -128, spirit: -3, face: 4, setFlags: ['match-left-address'] } },
  ],
 };
}

const edited: LifeEvent = {
 ...location, id: 'matchmaking-bench', title: '这份也给你看看', speakerId: 'tang', illustration: matchPhoto('bench'),
 text: '唐圆在长椅上给你留了半边干的。馄饨摊还没开，她先把那张写着「我也这么想」的纸递给你，底下还夹着一份没投出去的简历。',
 choices: [
  { id: 'practice', label: '趁摊没开 · 一人挑一段简历改',
   reply: '你把「协助参与」圈了出来。唐圆问你自己上回那份写的什么，你翻了一下，也是一模一样四个字。',
   effect: { skill: 8, trust: 7, setFlags: ['match-edited-resume'] } },
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
   effect: { network: 9, trust: 10, setFlags: ['match-hung-aunt'] } },
  { id: 'walk', label: '这礼拜先跟我走 · 九点门口见',
   reply: '走到菜场她让你给她拍一张，自己接着去买鱼。回来时豆腐摊主已经跟你讲完了他儿子两次辞职的事。',
   effect: { health: 5, network: 6, trust: 5 } },
  { id: 'print', label: '只拍张本人 · 洗两张 ¥12',
   reply: '她把一张塞进透明手机壳，另一张寄给了外地的老同学。后来你路过，那张纸上换了行字，写的是什么时候去逛菜场。',
   effect: { cash: -12, spirit: 8, trust: 7 } },
 ],
};

function leaseVisit(housing: number, leaseRent?: number, shared = false, leftAddress = false): LifeEvent {
 const canMove = housing < 3 && !shared;
 const memory = leftAddress
  ? '唐圆把当初洇花的那张纸也带来了。她说这回先看哪间真能住。'
  : '唐圆把你们当初那两张纸翻到背面，上头记着房东的号码。';
 return {
  ...location, id: 'matchmaking-lease', title: '房东只配了一把钥匙',
  speakerId: 'tang', illustration: matchPhoto('lease'),
  text: memory + ' 同一层空了两间。她已经定下靠楼梯的那间，另一间月租两千八，水电各算。房东说明早还有人看，今天要留就先押一个月。',
  choices: [
   canMove ? {
    id: 'sign', label: '签隔壁这间 · 押 ¥2,800',
    hint: '你的月租 ' + formatMoney(housingPayment(housing, leaseRent, false)) + ' → ' + formatMoney(rent),
    reply: '房东翻了半天只找到一把。你和唐圆一起下楼配钥匙，回来时已经能分清哪一扇门是自己的。',
    effect: { housing: 1, leaseRent: rent, cash: -rent, trust: 9, setFlags: ['match-neighbor'] },
   } : {
    id: 'sign', label: '我有住处 · 陪她给门锁配把备用钥匙',
    reply: '配钥匙的师傅问要不要多打一把。唐圆说两把够了，又补一句，一把先放你那儿，哪天忘带好找。',
    effect: { cash: -25, trust: 9 },
   },
   { id: 'measure', label: '先不搬 · 帮她把水电表拍下来',
    reply: '唐圆让你再拍一张近的。房东说差一格也没多少钱，她把手机放到合同旁边，说那就更好写进去。',
    effect: { skill: 7, trust: 6 } },
   { id: 'pass', label: '问清空房的价 · 转给正在找房的人',
    reply: '你把采光最差的那张也发了。对方看完问能不能便宜两百。唐圆说这才像有人真的在找房。',
    effect: { network: 8, face: 4 } },
  ],
 };
}

function workVisit(employed: boolean, editedResume = false): LifeEvent {
 const memory = editedResume
  ? '唐圆认出报名表上那句「协助参与」，说这回轮到写招聘的人交代清楚。'
  : '唐圆把招聘表往馄饨碗旁边挪了挪，说这回先把钱那栏看完。';
 return {
  ...location, id: 'matchmaking-work', title: '招聘表最后一栏是周末',
  speakerId: 'tang', illustration: matchPhoto('work'),
  text: memory + ' 社区活动室在找人。试班一天三百六，正式上班得接两次周末。唐圆想先接半天，她问你要不要跟她去一趟。',
  choices: [
   { id: 'shift', label: '一起接今天的班 · 当天结 ¥360',
    reply: '你们把来办事的人按门牌分成两列。最后一位爷叔排了两遍，说第一遍是替楼上的邻居。',
    effect: { cash: 360, health: -3, network: 5, trust: 7, setFlags: ['match-worked-together'] } },
   employed ? {
    id: 'job', label: '我有班上 · 帮她问清周末怎么轮',
    reply: '负责人说两次就是两次。唐圆追问到对方拿出上个月的排班表，你们从第一格数到最后一格。',
    effect: { skill: 6, trust: 8 },
   } : {
    id: 'job', label: '接正式班 · 每月轮两次周末',
    hint: '入职公共与社区 · 基本月薪 ¥7,200',
    reply: '你把名字签在第一周。唐圆选了临时班，看到你的名字又往后挪了一格，说至少有一班能搭着干。',
    effect: { job: 'public', trust: 7, skill: 4, setFlags: ['match-worked-together'] },
   },
   { id: 'help', label: '我不接 · 先帮她试一遍怎么问工钱',
    reply: '你装负责人，她问了三遍午休算不算工时。上场后她只问了一遍，对面就拿出一张新的表。',
    effect: { skill: 8, trust: 6 } },
  ],
 };
}

function marketVisit(hung = false): LifeEvent {
 const memory = hung ? '看过她照片的那位爷叔已经在鱼摊等。' : '汪阿姨带着你拍的照片来买鱼。摊边那位提布袋的爷叔先认出了她，说你不就在公园门口挂过伞。';
 return {
  ...location, id: 'matchmaking-market', title: '九点零五，鱼摊见',
  speakerId: 'aunt', illustration: matchPhoto('market'),
  text: memory + ' 汪阿姨挑了两条小黄鱼，问价时鱼摊老板把另一袋递给她，说爷叔已经付过。她不肯收两份，问你哪袋带回家、哪袋拿去楼下烧。',
  choices: [
   { id: 'table', label: '一起拿到楼下烧 · 给鱼摊老板留个位',
    reply: '他们搭了张折桌，短的那条腿下面塞了三张旧菜单。你问还晃不晃，汪阿姨伸手按住，说坐下来吃就不晃。',
    effect: { spirit: 9, network: 7, trust: 7, setFlags: ['match-market-table'] } },
   { id: 'buy', label: '再称两条 · 拿一袋回家 ¥36',
    reply: '鱼摊老板把三袋放上秤，算到最后只收了你的钱。汪阿姨回去给你发做法，第一句是锅先别洗。',
    effect: { cash: -36, spirit: 8, trust: 8 } },
   { id: 'leave', label: '让他们自己分 · 我替你去收伞',
    reply: '你把蓝伞带回公园。原来夹照片的地方还空着，你干脆把夹子拿下来，别在伞套上。',
    effect: { health: 4, network: 5, trust: 8 } },
  ],
 };
}

function seenInPreviousYear(state: GameState, event: LifeEvent) {
 if (!state.seenEvents.includes(event.id)) return false;
 const entry = state.journal.find(item => item.tag === location.tag && item.title === event.title);
 return entry !== undefined && entry.age < state.age;
}

export function parkVisit(state: GameState): Visit | null {
 if (state.pendingYearEvent || state.ended || state.actions <= 0) return null;
 if (!state.seenEvents.includes(openingId)) return state.partnerId ? null : { event: opening(state.housing) };
 const flags = state.flags;
 const next = flags.includes('match-listed') ? { event: listed(flags.includes('match-address-only')), message: '有人拿着你那张纸来问地址' }
  : flags.includes('match-edited') ? { event: edited, message: '唐圆在长椅上给你留了个位' }
  : flags.includes('match-folded') ? { event: folded, message: '汪阿姨问你能不能帮她拍张照' }
  : null;
 if (!next) return null;
 if (!state.seenEvents.includes(next.event.id)) return next;
 if (!seenInPreviousYear(state, next.event)) return null;
 const follow = flags.includes('match-listed') ? {
  event: leaseVisit(state.housing, state.leaseRent, householdPlan(state) === 'shared', flags.includes('match-left-address')), message: '唐圆说她隔壁空出一间',
 } : flags.includes('match-edited') ? {
  event: workVisit(Boolean(state.jobId), flags.includes('match-edited-resume')), message: '唐圆想请你一起去试班',
 } : { event: marketVisit(flags.includes('match-hung-aunt')), message: '汪阿姨把约会改到鱼摊了' };
 return state.seenEvents.includes(follow.event.id) ? null : follow;
}

export const PARK_TICKET_SCENES = [opening(1), listed(true), edited, folded] as const;
export const PARK_RETURN_TICKET_SCENES = [leaseVisit(1, undefined, false, true), workVisit(false, true), marketVisit(true)] as const;
