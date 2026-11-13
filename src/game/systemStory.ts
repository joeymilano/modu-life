import { calendarYear } from './calendar';
import { streetPhoto } from './art';
import { CHAPTER_AGES } from './campaignScript';
import { OPENING_ALLIES, OPENING_DRAMA, OPENING_PROOF, withOpeningRecord } from './openingStakes';
import type { Effect, EventChoice, GameState, LifeEvent } from './types';

export const SYSTEM_START = 'system-start';
export const SYSTEM_CASH = 18_000;
export const SYSTEM_SHOTS = ['phone','roof'] as const;
export const systemPhoto = (shot: (typeof SYSTEM_SHOTS)[number]) => '/art/system-story/'+shot+'.webp';

const received = ['system-first-credit','system-second-credit','system-third-credit'] as const;
const rewards = [
 {id:'cash',label:'兑 ¥500,000 到账',reply:'系统响了一声，银行的到账短信紧跟着来。楼下便利店那笔赊账也能顺手结了。',hint:'个人账户 +¥500,000',effect:{cash:500000}},
 {id:'skill',label:'兑一次实战训练',reply:'天刚亮你就把练习做完了。原来得翻两遍手册才明白的东西，这回你能直接教给别人。',hint:'本事 +18',effect:{skill:18}},
 {id:'proof',label:'兑一份签过字的后台原件',reply:'打印机吐出一张带现场签名的原件。顾桥那份合同，你知道从哪一行看起了。',hint:'解锁下一章的原件选项',effect:{}},
] satisfies {id:string;label:string;reply:string;hint:string;effect:Effect}[];
const redeemedFlag = (id: string) => 'system-redeemed-'+id;

export const isSystemLife = (state: GameState) => state.flags.includes(SYSTEM_START);

export function systemPoints(state: GameState) {
 const earned = received.filter(flag=>state.flags.includes(flag)).length + Number(state.flags.includes('laser_master'));
 const spent = rewards.filter(reward=>state.flags.includes(redeemedFlag(reward.id))).length;
 return Math.max(0,earned-spent);
}

function choice(id: string,label: string,reply: string,effect: Effect,hint?: string): EventChoice {
 return {id,label,reply,effect,hint};
}

export const systemOpening: LifeEvent = {
 id:'system-opening',title:'有人在替你领奖',text:'屏幕亮了。首单八万，收款人一栏正在被改成顾桥。他的电话紧跟着进来。「新人可以旁观。柜台那张单，我先签。」地址就在外滩，你现在过去还赶得上。',tag:'系统流',
 objective:'去外滩核对取票单，最高当场拿 ¥80,000',
 category:'year',district:'bund',illustration:systemPhoto('phone'),
 choices:[
  choice('accept','接第一单','手机跳出路线。便利店老板问你充电线还借不借，你说回来就还。',{spirit:6},'接单 · 去外滩'),
  choice('check','先把结算规则看完','通知一条条划到底。你把最后一行截下来，再点接单。',{skill:6},'接单 · 保留记录'),
  choice('save','存下地址，先听听谁打来的','电话那头停了一会儿。「顾桥。你看到我的名字了，对吧？」他先挂了。任务还亮着。',{network:6},'接单 · 顾桥来电'),
 ],
};

export const periodSystemOpening = (state:GameState) => calendarYear(state)<2000 ? {
 ...systemOpening,title:'终端里多了一个收款人',illustration:'/art/era/terminal-1992.webp',
 text:'1992 年，机房里最旧的那台终端自己亮了。打印机吐出一行字，外滩首单，八万。顾桥把打了一半的纸往外扯。收款栏里已经有他的名字。',
 choices:systemOpening.choices.map((item,i)=>({...item,reply:[
  '你把外滩的地址抄进记事本，走前把机房的门带上。',
  '你把结算规则手抄了一遍，再按回车。打印机把地址吐出来了。',
  '终端上又跳了一行字。顾桥叫你到渡口，当面看两张票。',
 ][i]})),
} : systemOpening;

export function systemSecondYear(state: GameState): LifeEvent {
 const split = state.flags.includes('system-split-first');
 const completed = state.flags.includes('system-third-credit');
 return {
  id:'system-next-year',title:'顾桥没接电话',tag:'系统流',category:'year',illustration:calendarYear(state)<2000?'/art/era/terminal-1992.webp':systemPhoto('roof'),
  text:calendarYear(state)<2000?'顾桥没来机房。许舟把上次的签收联夹在打字机下面，你进门就能看见。':!completed?'最后一单还亮着。顾桥发来一个地址，半分钟后撤回。系统留了存档，问你还接不接。'
   : split?'上一回你们各拿了一半。过完年，系统又发来一份对账单，顾桥那边的收款人没填。'
   :'上一任宿主那栏变成了灰色。你把顾桥的名字打进搜索框，旧账号还能查到一张没结的单。',
  choices:[
   choice('keep','把旧记录存好，等他回来','手机上多了一份离线存档。你又把顾桥的号码抄到纸背面。',{skill:8}),
   choice('send','留一句话，我这边还接单','消息挂在未读。第二天便利店老板在柜台上找到了一个写着你名字的信封。',{network:9}),
  ],
 };
}

const firstTask: LifeEvent = {
 id:'system-first',title:'一张票卖了两遍',tag:'系统任务',category:'explore',district:'bund',illustration:systemPhoto('phone'),
 objective:'当场确认真正的取票人',
 text:'外滩渡口两个人抢着拿同一张演出取票单。店主已经准备把票给先开口的人。系统只给你一次确认机会，去看看柜台上的两联。',
 choices:[
  choice('proof','按存根末四位核对原主','号码对上，顾桥把伪造的截屏按灭了。原主接过票，系统在你手机上连响两声。',{cash:80000,skill:6,setFlags:[received[0]]},'个人账户 +¥80,000 · 1 点'),
  choice('witness','让出票的人来当面认','柜台后的人认出买票时那件橙色外套。真正的客人走进门时回头说了声谢，系统当场结了款。',{cash:60000,network:7,setFlags:[received[0]]},'个人账户 +¥60,000 · 1 点'),
 ],
};

const secondTask: LifeEvent = {
 id:'system-second',title:'别接他发来的那张单',tag:'系统任务',category:'explore',district:'anfu',illustration:streetPhoto('anfu'),
 objective:'找出多收的那笔钱',
 text:'顾桥拿两份夜场账单来谈合作，说系统也给他发过这道题。两份单子都是九万八。你扫了一眼，只有其中一份在撤场后又被人改过。',
 choices:[
  choice('proof','拆开收款和撤场时间','你把修改时间和撤场单并排放上屏。顾桥伸手来合电脑，店里的人先把屏幕转到了正中。',{cash:220000,skill:8,setFlags:[received[1],'system-compared-ledger']},'个人账户 +¥220,000 · 1 点'),
  choice('backup','保住档期，先让他带走报价','店主听完，把场地预约改成了你来确认。顾桥拿着复印件走了，系统仍然认了这单。',{cash:120000,network:10,setFlags:[received[1]]},'个人账户 +¥120,000 · 1 点'),
 ],
};

const thirdTask: LifeEvent = {
 id:'system-third',title:'顾桥等你上楼',tag:'系统任务',category:'social',district:'lujiazui',illustration:systemPhoto('roof'),
 objective:'拿到长期任务的结算凭证',
 text:'天快亮，顾桥在楼顶等你。他手机上的系统早就停了，最后一单写的是「转交」。他给你两个办法，留名，或者跟他平分。你还可以带着原始记录自己去结。',
 choices:[
  choice('file','拿原件自己提交','提交成功那一刻，顾桥手机上的倒计时终于走完了。你手机收到账通知，他问以后能不能还用原来的号码找你。',{cash:888000,face:10,setFlags:[received[2],'system-kept-control']},'个人账户 +¥888,000 · 1 点'),
  choice('split','账写清楚，当场分给两个人','你俩都收到一半。顾桥把上次那张截屏删了，找了张干净的纸写下今天的结算。',{cash:444000,network:13,setFlags:[received[2],'system-split-first']},'个人账户 +¥444,000 · 1 点'),
 ],
};

const tasks = [
 {message:'去外滩核对两张票',event:firstTask},
 {message:'去安福路查第二张账单',event:secondTask},
 {message:'到陆家嘴见顾桥',event:thirdTask},
];

export function systemLead(state: GameState) {
 if (!isSystemLife(state)||state.pendingYearEvent||state.ended||state.actions<=0||!state.seenEvents.includes(systemOpening.id)) return;
 const task = tasks.find(item=>!state.seenEvents.includes(item.event.id));
 if (task&&calendarYear(state)<2000&&(task.event===firstTask||task.event===secondTask)) return {...task,event:{
  ...task.event,illustration:'/art/era/terminal-1992.webp',
  text:task.event.text.replace('系统只给你一次确认机会','终端只认一次签收').replace('又被人改过','被人重新誊了一遍'),
  choices:task.event.choices.map(item=>({...item,reply:item.reply.replace('把伪造的截屏按灭了','把那份誊错的票收进兜里').replace('你手机上连响两声','账上记了一笔').replace('并排放上屏','并排摆在柜台上')})),
 }};
 if (task?.event!==thirdTask||!state.flags.includes(OPENING_DRAMA)) return task;
 return {...task,event:{...thirdTask,choices:thirdTask.choices.map(choice=>({
  ...choice,effect:withOpeningRecord(choice.effect,choice.id==='file'?OPENING_PROOF:OPENING_ALLIES),
 }))}};
}

export function systemClue(eventId: string) {
 if (eventId===firstTask.id) return {
  label:'翻看两联取票单',choiceId:'proof',text:'真正的票存根末四位是 0816。截图多改了一位。',
  papers:[{label:'柜台存根',value:'尾号 0816 · 已付款 · 20:30'},{label:'手机截图',value:'尾号 0818 · 已付款 · 20:30'}],
  question:{prompt:'哪一项对不上？',options:['开场时间','取票尾号'],answer:1},
 };
 if (eventId===secondTask.id) return {
  label:'对账',choiceId:'proof',text:'场地 22:10 已撤，22:48 多了一笔从未发生的延场。',
  papers:[{label:'撤场签收',value:'22:10 · 场地清空，双方签字。'},{label:'新账单',value:'22:48 · 新增延场。签字栏留空。'}],
  question:{prompt:'哪一笔该划掉？',options:['撤场后的延场','撤场前的正常时段'],answer:0},
 };
}

export function systemRedemption(state: GameState): LifeEvent | undefined {
 if (!isSystemLife(state)||state.pendingYearEvent||state.ended||state.actions<=0||systemPoints(state)<=0) return;
 const next = CHAPTER_AGES.find(age=>age>state.age);
 const choices = rewards.filter(reward=>!state.flags.includes(redeemedFlag(reward.id))&&(reward.id!=='proof'||next)).map(reward=>choice(
  reward.id,reward.label,reward.reply,{...reward.effect,setFlags:[redeemedFlag(reward.id),...(reward.id==='proof'?['system-proof-'+next]:[])]},'1 点 · '+reward.hint,
 ));
 if (!choices.length) return;
 return {id:'system-redeem-'+choices.length,title:'点数兑换',tag:'系统流',category:'explore',illustration:systemPhoto('phone'),
  text:'可用 '+systemPoints(state)+' 点。',choices};
}
