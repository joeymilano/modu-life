import { openingPhoto, streetPhoto, tablePhoto, workPhoto } from './art';
import { heirStoryPhoto } from './heirStory';
import { systemPhoto } from './systemStory';
import { CAMPAIGN_NAMES, CAMPAIGN_SCRIPT, CHAPTER_AGES, type CampaignBeat, type CampaignMove, type CampaignRoute } from './campaignScript';
import { campaignPressure, PRESSURE_YEARS } from './campaignPressure';
import { OPENING_ALLIES, OPENING_PROOF } from './openingStakes';
import type { EventChoice, GameState, LifeEvent } from './types';

const skillTargets = [55, 64, 72, 79, 85, 90];
const networkTargets = [50, 60, 70, 77, 84, 90];
const moves = ['proof','people','bid','walk'] as const;
const openingCallbacks: Record<CampaignRoute,readonly [string,string]> = {
 arrival:['{ally}翻出首演那晚留的签字单。费启这次拿来的海报，连日期都没换。','首演那晚跟着进场的几个人又来了。有人问，这回还是{ally}给留座吗。'],
 worker:['第一年拿走的复写联还在。吴师傅把它和赵正今天填的名单摆到一起。','当年肯来认班次的司机刚下车。吴师傅把领班的号码递给他们。'],
 heir:['老妈把第一次酒会的签约原件又给你拿了过来。周骁看到纸角的签名，把手从名单上移开了。','第一场被你请到临江那桌的人，今天比周骁更早到。经理替你留着他们的名字。'],
 system:['第一批任务最后那张结算凭证还在。你把旧权限和顾桥递来的共同账户摆在一起。','当年和顾桥分账的人还认得那张凭证。你把他们都叫到了同一层。'],
};
const firstDocuments: Record<CampaignRoute,readonly [string,string,string]> = {
 arrival:['预约人：你和搭档。周五 20:00。房东签字。','宣传名单：费启独家主办。周五 20:00。','时间没变，主办人被换了。带上有房东签字的那张。'],
 worker:['门禁原件：18:02 入仓，01:14 出仓。三天齐。','待发工时：最后一晚留空。','少算的是过了零点的那一晚，原始时间能对上。'],
 heir:['订场原件：签约人是你，财务已收订金。','下季请帖：周骁独家主办。','请帖上换了名字，订金凭证和签约原件还在。'],
 system:['首单存根：交付人和收款人是你。','长期权限：新增顾桥为共同收款人。','原件只有一个签名，分账是后来加进去的。'],
};
const firstQuestions: Record<CampaignRoute,{prompt:string;options:string[];answer:number}> = {
 arrival:{prompt:'哪一栏被换了？',options:['开门时间','主办人'],answer:1},
 worker:{prompt:'少算了哪一班？',options:['最后一晚','第一天白班'],answer:0},
 heir:{prompt:'原件能证明什么？',options:['哪家印的请帖','谁付了订金、谁签的合同'],answer:1},
 system:{prompt:'哪一项是后来加的？',options:['共同收款人','实际交付人'],answer:0},
};
const campaignStills: Record<CampaignRoute,readonly string[]> = {
 arrival:[streetPhoto('bund'),streetPhoto('bookshop'),tablePhoto('folded-table'),streetPhoto('ferry'),tablePhoto('table-inside'),tablePhoto('empty-chair')],
 worker:[openingPhoto('daywork-pay'),workPhoto('shift'),openingPhoto('worker-notice'),workPhoto('overtime'),openingPhoto('daywork-gate'),workPhoto('settlement')],
 heir:[heirStoryPhoto('club'),heirStoryPhoto('boardroom'),heirStoryPhoto('garage'),heirStoryPhoto('club'),heirStoryPhoto('boardroom'),heirStoryPhoto('club')],
 system:[systemPhoto('roof'),systemPhoto('phone'),streetPhoto('zhangjiang'),workPhoto('invoice'),streetPhoto('ferry'),systemPhoto('roof')],
};
const epilogue: Record<CampaignRoute,Record<CampaignMove,string>> = {
 arrival:{proof:'招牌上还有你的名字',people:'钥匙有了下一任',bid:'江边开了一整年',walk:'最后一晚，你坐台下'},
 worker:{proof:'按表结钱',people:'这班有人接',bid:'第一笔班费到账了',walk:'下班去吃面'},
 heir:{proof:'西岸主位',people:'下一位做东',bid:'整条江都来做客',walk:'给我留个窗位'},
 system:{proof:'最后一个签名',people:'有人接了下一单',bid:'第一笔周转金',walk:'这次是真的关机了'},
};

const routeOf = (state: GameState): CampaignRoute => state.origins.includes('born-heir') ? 'heir'
 : state.origins.includes('born-daywork') ? 'worker' : state.origins.includes('born-system') ? 'system' : 'arrival';
const allyOf = (state: GameState) => state.flags.includes('night-shift') ? '何亮'
 : state.flags.includes('night-ferry') ? '陆嘉' : '毛小毛';
const replaceAlly = (text: string, state: GameState) => text.replaceAll('{ally}', allyOf(state));
const sceneId = (route: CampaignRoute, age: number) => `campaign-${route}-${age}`;
const moveFlag = (id: string, move: CampaignMove) => id+'-'+move;
const prepFlag = (id: string, prep: 'proof'|'people') => id+'-prep-'+prep;
const chosenMove = (state: GameState, id: string) => moves.find(move=>state.flags.includes(moveFlag(id,move)));

function ready(state: GameState, id: string, index: number) {
 return {
  proof: state.flags.includes(prepFlag(id,'proof')) || state.stats.skill >= skillTargets[index]
   || (index===0&&state.flags.includes(OPENING_PROOF))
   || (routeOf(state)==='system'&&state.flags.includes('system-proof-'+CHAPTER_AGES[index]))
   || (index===0&&routeOf(state)==='worker'&&state.seenEvents.includes('life-start-daywork-pay')),
  people: state.flags.includes(prepFlag(id,'people')) || state.stats.network >= networkTargets[index]
   || (index===0&&state.flags.includes(OPENING_ALLIES))
   || (index===0&&routeOf(state)==='arrival'&&state.flags.includes('laser_master')),
 };
}

function makeChoice(state: GameState, id: string, beat: CampaignBeat, move: CampaignMove): EventChoice {
 const [label,reply,effect] = beat.choices[move];
 return {
  id:move,label,reply:replaceAlly(reply,state),effect:{...effect,setFlags:[moveFlag(id,move)]},
  ...(move==='proof'?{hint:'亮出原件'}:move==='people'?{hint:'让到场的人说话'}:{}),
 };
}

export function campaignYear(state: GameState): LifeEvent | undefined {
 const index = CHAPTER_AGES.findIndex(age=>age===state.age);
 if (index<0) return;
 const route = routeOf(state);
 const beat = CAMPAIGN_SCRIPT[route][index];
 const id = sceneId(route,state.age);
 const prior = index>0 ? chosenMove(state,sceneId(route,CHAPTER_AGES[index-1])) : undefined;
 const context = prior && beat.carry?.[prior];
 const status = ready(state,id,index);
 const lounge = index===0 && route==='heir' && state.flags.includes('heir-owned-lounge')
  ? '楼下两席车位和会客厅的合同都在你名下。周骁拿走的是活动排期。' : '';
 const split = index===0 && route==='system' && state.flags.includes('system-split-first')
  ? '他把上回平分的付款单翻过来，指着两个人的名字说，照这次来。' : '';
 const opening = index===0 ? (state.flags.includes(OPENING_PROOF)?openingCallbacks[route][0]
  :state.flags.includes(OPENING_ALLIES)?openingCallbacks[route][1]:'') : '';
 return {
  id,category:'year',tag:'主线',title:beat.title,objective:beat.objective,district:beat.district,illustration:campaignStills[route][index],
  text:replaceAlly([context,beat.scene,opening,lounge,split].filter(Boolean).join(''),state),
  choices:moves.filter(move=>move==='bid'||move==='walk'||status[move]).map(move=>makeChoice(state,id,beat,move)),
 };
}

export function campaignPressureYear(state:GameState) {
 const age=state.age;
 if(age!==26&&age!==38)return;
 const route=routeOf(state);
 const timing=PRESSURE_YEARS[age];
 const prior=chosenMove(state,sceneId(route,timing.after));
 if(prior)return campaignPressure(route,age,prior,kind=>prepFlag(sceneId(route,timing.before),kind));
}

export function campaignProgress(state: GameState) {
 const route = routeOf(state);
 const chapters = CHAPTER_AGES.map((age,index) => {
  const beat = CAMPAIGN_SCRIPT[route][index];
  const id = sceneId(route,age);
  const decision = moves.find(move=>state.flags.includes(moveFlag(id,move)));
  return { age, id, title:beat.title, district:beat.district, decision:decision&&beat.choices[decision][0] };
 });
 const index = chapters.findIndex(chapter=>chapter.age>=state.age&&!state.seenEvents.includes(chapter.id));
 const next = chapters[index];
 const status = next ? ready(state,next.id,index) : undefined;
 const responses = ([26,38] as const).flatMap(age=>{
  const event=campaignPressureYear({...state,age});
  return event?[{age,id:event.id,title:event.title,district:event.district,
   decision:state.seenEvents.includes(event.id)?'已处理':undefined}]:[];
 });
 const timeline=[...chapters,...responses].sort((a,b)=>a.age-b.age);
 const current=timeline.find(beat=>beat.age>=state.age&&!state.seenEvents.includes(beat.id));
 return { name:CAMPAIGN_NAMES[route], chapters, next, status, timeline, current };
}

export function campaignLead(state: GameState) {
 if (state.pendingYearEvent||state.ended||state.actions<=0||state.age<20) return;
 const {next} = campaignProgress(state);
 if (!next||next.age<=state.age) return;
 const id = next.id+'-prep';
 if (state.seenEvents.includes(id)) return;
 const route = routeOf(state);
 const index = CHAPTER_AGES.indexOf(next.age);
 const beat = CAMPAIGN_SCRIPT[route][index];
 const [title,text,proof,people] = beat.prep;
 const event: LifeEvent = {
  id, title, text:replaceAlly(text,state),category:'explore',district:beat.district,tag:'主线筹备',
  illustration:streetPhoto(beat.district),
  choices:[
   {id:'proof',label:proof,reply:'原件收好了。开会时带上。',hint:'解锁「'+beat.choices.proof[0]+'」',
    effect:{skill:3,setFlags:[prepFlag(next.id,'proof')]}},
   {id:'people',label:people,reply:'该到的人都答应了。到时给他们留位。',hint:'解锁「'+beat.choices.people[0]+'」',
    effect:{network:3,setFlags:[prepFlag(next.id,'people')]}},
  ],
 };
 return {message:title,event};
}

export function campaignClue(state: GameState, eventId: string) {
 const route = routeOf(state);
 if (eventId !== sceneId(route,23)+'-prep') return;
 const [original, altered, text] = firstDocuments[route];
 return {label:'对一下两份单子',text,choiceId:'proof',papers:[
  {label:'原件',value:original},{label:'被换过的版本',value:altered},
 ],question:firstQuestions[route]};
}

export function campaignEpilogue(state: GameState) {
 const route = routeOf(state);
 const id = sceneId(route,57);
 const decision = moves.find(move=>state.flags.includes(moveFlag(id,move)));
 if (!decision) return;
 const coda = {
  arrival:'六十岁生日，{ally}发来一张江边的排期表。周五那格还是亮的。你关掉手机，到门口等第一批客人。',
  worker:'六十岁那天，门房给你留了一张工时表复印件。最下面多了一格，领钱时间。字是后来的人填的。',
  heir:'六十岁生日，西岸的请帖送到家里。周骁先打来电话，问这回要不要从正门接你。你让他到江边等。',
  system:'六十岁那天，便利店新来的收银员问你要不要借充电线。柜台底下那根居然还在，线头贴着你当年写的号码。',
 };
 return {title:epilogue[route][decision],text:replaceAlly(coda[route],state)};
}
