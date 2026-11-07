import { CAREERS, CAST, GOALS, ORIGIN_POOLS } from './content';
import { FIRST_NIGHT_FLAG, firstNightYear } from './firstNight';
import { lastDayEvent } from './lastDay';
import { workYearEvent } from './workScenes';
import { employmentOf, monthlySalary, moveJob, NIGHT_WORK, registerReview } from './employment';
import { EVENTS } from './events';
import type { ActivityKind, ChoiceResult, Effect, EventChoice, GameState, GoalId, LifeEvent, LooksLevel, OriginCard, OriginSlot, PlayerAppearance, StatKey } from './types';

export const STAT_NAMES: Record<StatKey,string> = { health:'身体', spirit:'心气', skill:'本事', face:'腔势', network:'人脉' };
export const ACTIVITY_NAMES: Record<ActivityKind,string> = { career:'事业', romance:'约会', rest:'歇一歇', learn:'长本事', housing:'住下来', social:'交朋友', business:'搞点事业', explore:'白相相' };
export const CHAPTERS = [
  {name:'初来乍到', years:'18至24岁', quote:'行李不重，心思蛮重。'},
  {name:'各凭本事', years:'25至31岁', quote:'朋友圈很体面，银行卡很安静。'},
  {name:'立得住脚', years:'32至38岁', quote:'买房、换工作，还是先吃饭？'},
  {name:'中场换气', years:'39至45岁', quote:'体检预约排在年会前面'},
  {name:'重新开张', years:'46至52岁', quote:'这回先问问自己欢喜伐。'},
  {name:'自有腔调', years:'53至59岁', quote:'饭局少了，牌局多了'},
];
export const clamp = (n:number,min=0,max=100) => Math.max(min,Math.min(max,n));
export function hashSeed(seed:string):number {let h=2166136261;for(const c of seed){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0 || 42;}
export function randomStep(rng:number):[number,number] {let x=rng||42;x^=x<<13;x^=x>>>17;x^=x<<5;return [(x>>>0)/4294967296,x>>>0];}
export const allOrigins = () => Object.values(ORIGIN_POOLS).flat();
export function drawOrigins(seed:string, reroll=0):OriginCard[] {
  let rng=hashSeed(seed+':'+reroll);
  return (['出身','家底','天赋','牵绊','秘密'] as OriginSlot[]).map(slot=>{const [r,next]=randomStep(rng);rng=next;const pool=ORIGIN_POOLS[slot];return pool[Math.floor(r*pool.length)];});
}
export function newSeed():string {const values=new Uint32Array(1);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(values);else values[0]=Date.now();return values[0].toString(36).toUpperCase().padStart(6,'0').slice(0,7);}
export function chapterOf(age:number){return Math.min(5,Math.floor((age-18)/7));}
const DEFAULT_APPEARANCE: PlayerAppearance = {gender:'male',looks:'everyday'};
const LOOKS_BONUS: Record<LooksLevel,{face:number;attraction:number}> = {
  everyday:{face:0,attraction:0}, charming:{face:8,attraction:3}, stunning:{face:16,attraction:6},
};
function validateAppearance(value:unknown):PlayerAppearance {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('外观选项不完整。');
  const appearance=value as Record<string,unknown>;
  if(!['female','male'].includes(appearance.gender as string)||!['everyday','charming','stunning'].includes(appearance.looks as string))throw new Error('外观选项不匹配。');
  return {gender:appearance.gender as PlayerAppearance['gender'],looks:appearance.looks as LooksLevel};
}
function applyEffect(state:GameState,effect:Effect,npcId?:string):GameState {
  const s=structuredClone(state);s.cash=Math.round(s.cash+(effect.cash||0));
  for(const key of Object.keys(STAT_NAMES) as StatKey[])s.stats[key]=clamp(s.stats[key]+(effect[key]||0));
  if(effect.job==='unemployed')moveJob(s,null);
  else if(effect.job&&CAREERS.some(c=>c.id===effect.job))moveJob(s,effect.job);
  if(effect.payRate!==undefined&&s.jobId)s.employment={...employmentOf(s),rate:effect.payRate};
  if(effect.housing!==undefined)s.housing=clamp(effect.housing,0,3);
  s.flags=[...new Set([...s.flags,...(effect.setFlags||[])])].filter(f=>!(effect.removeFlags||[]).includes(f));
  const relationTarget=npcId||s.partnerId;
  if(effect.romanticInvitation&&s.partnerId&&relationTarget&&s.partnerId!==relationTarget){
    const current=s.relationships[s.partnerId];
    current.trust=clamp(current.trust-12);
    if(!s.flags.includes('dating_others'))s.flags.push('dating_others');
  }
  if(relationTarget&&s.relationships[relationTarget]){
    const rel=s.relationships[relationTarget];
    const firstImpression=!rel.met&&CAST.some(c=>c.id===relationTarget&&c.role==='romance')?LOOKS_BONUS[s.appearance.looks].attraction:0;
    rel.met=true;rel.trust=clamp(rel.trust+(effect.trust||0));rel.attraction=clamp(rel.attraction+(effect.attraction||0)+firstImpression);rel.commitment=clamp(rel.commitment+(effect.commitment||0));
    if(effect.love&&rel.trust>=40&&rel.attraction>=35)s.partnerId=relationTarget;
    if(effect.love===false&&s.partnerId===relationTarget)s.partnerId=null;
  }
  return s;
}
export function createGame(seed:string,name:string,goal:GoalId,cards:OriginCard[],appearance:PlayerAppearance=DEFAULT_APPEARANCE):GameState {
  const selectedAppearance=validateAppearance(appearance);
  let state:GameState={version:1,seed:seed.slice(0,32),rng:hashSeed(seed),name:name.trim().slice(0,12)||'小申',age:18,actions:3,goal,appearance:selectedAppearance,district:'bund',cash:36000,stats:{health:80,spirit:75,skill:28,face:30+LOOKS_BONUS[selectedAppearance.looks].face,network:20},jobId:null,jobRank:0,housing:0,origins:cards.map(c=>c.id),flags:[FIRST_NIGHT_FLAG],seenEvents:[],relationships:Object.fromEntries(CAST.map(c=>[c.id,{attraction:10,trust:15,commitment:0,met:false,memories:[]}])),partnerId:null,journal:[],pendingYearEvent:true,ended:false,totalEarned:0,yearsEmployed:0,rescues:0};
  for(const card of cards)state=applyEffect(state,card.effect);
  if(state.flags.some(f=>/own.?home|有房|home_owner/i.test(f)))state.housing=3;
  state.cash=Math.max(3000,state.cash);
  if(state.flags.includes('family_rich')&&state.flags.includes('card_frozen')){
    state.cash=Math.min(state.cash,24000);
    state.journal.push({age:18,title:'副卡暂时不给刷',text:'刷卡失败。老爸回了四个字，自己想办法。你翻遍账户，还能凑出两万四。',tag:'开局牵绊'});
  }
  state.journal.push({age:18,title:'到上海了',text:'车门开了。手机刚切回信号，连着响了三声。',tag:'开局'});
  return state;
}
export function monthlyBudget(s:GameState){
  const salary=monthlySalary(s);
  const rent=[1800,3300,5500,1000][s.housing]||1800;
  const living=1800+(s.partnerId?600:0)+(s.age>=40?500:0);
  return {salary,rent,living,net:salary-rent-living};
}
export function eligibleEvent(e:LifeEvent,s:GameState,kind:ActivityKind|'year'):boolean {
  if(e.chainId==='family_card'&&e.chainStep===0&&!s.flags.some(f=>f==='family_rich'||f==='card_frozen'))return false;
  if((e.chainId==='project_credit'||e.chainId==='layoff_story')&&e.chainStep===0&&!s.jobId)return false;
  return e.category===kind&&(!e.district||e.district===s.district)&&(!e.minAge||s.age>=e.minAge)&&(!e.maxAge||s.age<=e.maxAge)&&(!e.once||!s.seenEvents.includes(e.id))&&!s.seenEvents.includes(e.id)&&(!e.requiredFlags||e.requiredFlags.every(f=>s.flags.includes(f)))&&(!e.forbiddenFlags||e.forbiddenFlags.every(f=>!s.flags.includes(f)));
}
export function selectEvent(s:GameState,kind:ActivityKind|'year',npcId?:string):LifeEvent {
  const annual = kind === 'year' ? firstNightYear(s) ?? lastDayEvent(s) ?? workYearEvent(s) : undefined;
  if (annual && !s.seenEvents.includes(annual.id)) return annual;
  let candidates=EVENTS.filter(e=>eligibleEvent(e,s,kind));
  if(npcId){const personal=candidates.filter(e=>e.speakerId===npcId);if(personal.length)candidates=personal;else candidates=candidates.filter(e=>!e.speakerId);}
  const continuing=candidates.filter(e=>e.chainId&&(e.chainStep||0)>0);if(continuing.length)candidates=continuing;
  if(candidates.length){const [r]=randomStep(s.rng);const total=candidates.reduce((n,e)=>n+(e.weight||1),0);let weight=r*total;const picked=candidates.find(e=>(weight-=e.weight||1)<0)||candidates[0];
    if(picked.id==='year-20'&&s.housing===3)return {...picked,title:'有房，也得看合同',text:'家里有房可住。物业送来一叠维修文件，老妈让你看看，哪些需要自己掏钱。'};
    if(picked.id==='year-23'&&!s.jobId)return {...picked,title:'朋友第一笔像样工资',text:'朋友的工资到了，在群里发了个红包。你抢到两块三，顺手又点开了招聘软件。',choices:picked.choices.map((c,i)=>i===0?{...c,label:'接一份临时小项目',reply:'项目做完，四千块到账。你给那张收款截图点了收藏。'}:c)};
    if(picked.id==='year-28'&&s.housing===3)return {...picked,text:'朋友发来新房钥匙，你点了赞。旁边自家的维修清单还摊着，今天得先打电话找师傅。'};
    if(picked.id==='year-32'&&!s.jobId)return {...picked,title:'本事还在手上',text:'旧同事打来电话，问上次那个问题怎么解决。你一边啃面包，一边给他画了张图。'};
    return picked;}
  return routineEvent(s,kind,npcId);
}
export function routineEvent(s:GameState,kind:ActivityKind|'year',npcId?:string):LifeEvent {
  const npc=CAST.find(c=>c.id===npcId);
  const mk=(id:string,label:string,reply:string,effect:Effect):EventChoice=>({id,label,reply,effect});
  const content:Record<string,[string,string,EventChoice[]]>={
    rest:['今天先不争气','手机扣在桌上，水壶刚响。楼下有人在讲电话，讲的也不是什么大事。',[
      mk('nap','补一觉，谁也别找我','一觉睡到下午三点。手机没几条新消息，你又翻了个身。',{health:14,spirit:10}),
      mk('walk','到江边走一圈','走到第二座桥，终于不再一遍遍想那句气话。',{health:8,spirit:14}),
      mk('call','给一个惦记的人打电话','本来只想问吃了伐，聊到水壶响了第二回。',{spirit:10,network:5,trust:5})]],
    learn:['收藏的课该看了','新课程的广告说，七天改变人生。老师本人看起来已经七天没睡觉。',[
      mk('practice','先拿手头的真问题练习','你照着试了三遍，同事那份卡了一周的文件总算能打开了。',{skill:9,spirit:-2}),
      mk('course','报个正经课程 · ¥2,000','报名之后，老师先发来一份作业。你当天就做了两个钟头。',{cash:-2000,skill:15,network:2}),
      mk('peer','约同行交换一门手艺','你教他改方案，他把以前报过的价格给你看，说下次别报那么低。',{skill:6,network:7})]],
    social:['碰头还是碰杯','朋友发来消息，问有空伐，后面紧跟着一家饭店的位置。',[
      mk('listen','坐下来听听他的近况','你听他把最近的事讲完，约好周末再见一面。',{network:8,spirit:5,trust:5}),
      mk('treat','请一顿家常饭 · ¥600','菜上齐以后，谁也没顾上拍照。吃完几个人还站在门口聊。',{cash:-600,network:12,spirit:7,trust:8}),
      mk('help','帮他把一件难事拆开做','你们一起弄了一个下午，朋友终于把那份拖着的文件交了。',{network:10,skill:3,health:-3,trust:7})]],
    explore:['拐进一条没走过的路','导航又让你掉头。你抬眼看见街角有家店，门口正有人排队。',[
      mk('wander','收起手机，随便走走','发现一家店，老板连招牌都没擦。东西却做得认真。',{spirit:9,network:3}),
      mk('photo','拍一张不发朋友圈的照片','照片拍了三张，留了最亮的那张，存在手机里没发。',{spirit:8,skill:3}),
      mk('chat','和路边爷叔聊两句','聊了三站路的事，爷叔一句导航都没用。',{network:7,spirit:3})]],
    housing:['住得像自己','中介说这间房很有潜力。你的意思是，还得我花钱？',[
      mk('stay','先把眼前的房间收拾好','窗帘洗了，书架扶正，床底那几只空盒子也扔了。',{spirit:8,health:4}),
      mk('upgrade','换个舒服点的住处 · ¥12,000','钥匙转动的声音很轻。你在空屋里坐了五分钟。',{cash:-12000,housing:Math.min(2,s.housing+1),spirit:12}),
      mk('budget','找个便宜些、通勤还行的房间','看了很多房，最后选了晚上能睡着的那一间。',{housing:0,spirit:3,health:-2})]],
    business:['想法也要交房租','小店门口贴着转让。你站了一会，已经在脑子里算起水电费。',[
      mk('small','先小规模接一单试试','第一单收了六千，你把材料和工时分开记好，开始算下一单的价格。',{cash:6000,skill:5,network:3,spirit:-2}),
      mk('invest','投入一笔钱认真做 · ¥15,000','收支表终于长得比招牌好看了。',{cash:-15000,skill:10,face:5,setFlags:['business_tested']}),
      mk('observe','先帮朋友做两天，看看实际情况','干到打烊才明白，主理人也得倒垃圾。',{skill:7,network:6,health:-4})]],
    year:['这一年，上海还在转','群里开始转发新年红包。你翻到今年的第一张照片，认出那时候住的房间。',[
      mk('keep','把做成的事记下来','你把今年做过的事记下来，第一页不够，又翻了一页。',{spirit:6}),
      mk('people','给帮过你的人回个消息','有人秒回，有人第二天才回。但都回了。',{network:5,trust:3}),
      mk('reset','给来年留一点空白','你把下月最挤的两场安排推了，日历总算不再全是红点。',{health:4,spirit:3})]],
    career:['工作这件事','岗位说明写了一整页。你点进去，对方问你手上有没有能看的项目。',[
      mk('apply','认真谈谈我会做的事','对方问了几个具体问题。你也问了工资和下班时间。',{job:s.jobId||'service',skill:6,network:3}),
      mk('build','先做一份拿得出手的作品','这回简历里，有一行是你真正想让人看的。',{skill:12,spirit:-3}),
      mk('ask','找熟人了解一下行业近况','消息没有直接变成offer，但少绕了几个弯。',{network:10,skill:3})]],
    romance:[npc?`和${npc.name}再聊一会`:'这周约不约',npc?`${npc.name}没有问你工资。今天想知道的，是上次没讲完的那件事。`:'你点开聊天框，最后一句还是上次说的有空再约。今天正好没安排。',[
      mk('listen','认真听，不急着表现','对方说了家一直想吃的店。你顺手存进地图，约下次去。',{trust:12,attraction:5,spirit:4}),
      mk('date','安排一次合对方心意的约会 · ¥500','没有铺满玫瑰。就是你记得，对方说过想来这里。',{cash:-500,trust:10,attraction:14,commitment:4}),
      mk('honest','说说自己的近况，也说困难','讲完有点不好意思。对方却说，谢谢你告诉我。',{trust:15,attraction:3,commitment:5,spirit:5})]],
  };
  const [title,text,choices]=content[kind]||content.explore;
  return {id:`routine-${kind}`,title,text,choices,speakerId:npcId,category:kind,tag:'日常'};
}
export function canAfford(s:GameState,effect:Effect){return (effect.cash||0)>=0||s.cash>=-(effect.cash||0);}
export function checkChance(s:GameState,choice:EventChoice){if(!choice.check)return 100;return Math.round(clamp(50+s.stats[choice.check.stat]-choice.check.threshold,15,95));}
export function resolveChoice(state:GameState,event:LifeEvent,choiceId:string,npcId?:string):ChoiceResult {
  if(state.ended||(!state.pendingYearEvent&&state.actions<=0))throw new Error('今年的时间用完了，先去年度结算。');
  const choice=event.choices.find(c=>c.id===choiceId);if(!choice)throw new Error('这个选择不存在。');
  if(!canAfford(state,choice.effect))throw new Error('这笔钱现在拿不出来。换一个办法。');
  let s=applyEffect(state,choice.effect,npcId||event.speakerId);let text=choice.reply;let effect={...choice.effect};let success:boolean|undefined;
  const [roll,rng]=randomStep(s.rng);s.rng=rng;
  if(choice.check){success=roll*100<checkChance(state,choice);const extra=success?choice.check.success:choice.check.failure;s=applyEffect(s,extra,npcId||event.speakerId);text+=' '+(success?choice.check.successText:choice.check.failureText);effect={...effect};for(const [key,value] of Object.entries(extra)){if(typeof value==='number')(effect as Record<string,unknown>)[key]=Number((effect as Record<string,unknown>)[key]||0)+value;}}
  if(state.pendingYearEvent)s.pendingYearEvent=false;else s.actions=Math.max(0,s.actions-1);
  if(!event.id.startsWith('routine-'))s.seenEvents=[...new Set([...s.seenEvents,event.id])];
  if(event.category==='career'&&!event.id.startsWith('mini-')&&s.jobId===state.jobId){
    const rank=registerReview(s);
    if(rank)text+=` 年度评审过了，接下来做${rank}。`;
  }
  s.journal.push({age:s.age,title:event.title,text,tag:event.tag||ACTIVITY_NAMES[event.category as ActivityKind]||'这一年'});
  const target=npcId||event.speakerId||((choice.effect.trust||choice.effect.attraction||choice.effect.commitment)?s.partnerId||undefined:undefined);
  if(target&&s.relationships[target]){const rel=s.relationships[target];rel.met=true;rel.memories=[...rel.memories,`${s.age}岁 · ${event.title}`].slice(-8);if(rel.trust<20&&s.partnerId===target){s.partnerId=null;s.journal.push({age:s.age,title:'分开一阵',text:'最近几次聊天都没讲完。你们约出来，把东西还了，决定先分开。',tag:'关系'});}}
  s.cash=Math.max(0,s.cash);
  return {state:s,title:event.title,text,effect,success};
}
export function nextYear(state:GameState) {
  if(state.ended)throw new Error('这一生已经结算。');if(state.pendingYearEvent)throw new Error('先把眼前这件事处理好。');
  const s=structuredClone(state),budget=monthlyBudget(s);
  const [yearRoll,nextRng]=randomStep(s.rng);s.rng=nextRng;
  const variable=s.jobId==='freelance'?.7+yearRoll*.6:s.jobId==='business'?.55+yearRoll*.9:1;
  const employment=employmentOf(s);
  const activeMonths=s.jobId?12-employment.closedMonths:0;
  const currentPay=Math.round(budget.salary*activeMonths*variable);
  const income=employment.earned+currentPay,expense=(budget.rent+budget.living)*12;
  const payroll=employment.closedMonths>0?{previous:employment.earned,current:currentPay,months:activeMonths}:undefined;
  const pressure:Record<string,[number,number]>={tech:[5,5],finance:[3,8],creative:[3,4],service:[6,3],public:[2,2],freelance:[2,3],business:[4,4],trade:[4,5]};
  if(s.jobId){const [body,mind]=pressure[s.jobId]||[2,2];const late=s.flags.includes(NIGHT_WORK);
    s.stats.health=clamp(s.stats.health-Math.round((body+(late?4:0))*activeMonths/12));
    s.stats.spirit=clamp(s.stats.spirit-Math.round((mind+(late?3:0))*activeMonths/12));}
  if(s.partnerId){const rel=s.relationships[s.partnerId];const keptInTouch=rel.memories.some(m=>m.startsWith(s.age+'岁 · '));if(!keptInTouch){rel.trust=clamp(rel.trust-4);rel.commitment=clamp(rel.commitment-2);}}
  s.cash+=income-expense;s.totalEarned+=income;if(income>0)s.yearsEmployed++;
  const notices:string[]=[];
  let note=income?`工资到账 ¥${income.toLocaleString()}，固定开支 ¥${expense.toLocaleString()}。`:`这一年没有固定工资，生活开支 ¥${expense.toLocaleString()}。`;
  if(employment.closedMonths>0)note+=` 旧岗位入账 ¥${employment.earned.toLocaleString()}，当前岗位计 ${activeMonths} 个月。`;
  if(s.cash<0){const shortage=-s.cash;s.cash=6000;s.rescues++;s.stats.spirit=clamp(s.stats.spirit-8);s.housing=0;s.flags=[...new Set([...s.flags,'needed_help'])];notices.push(`周转差了 ¥${shortage.toLocaleString()}。朋友帮你垫了一笔，你搬回合租房，手上留下 ¥6,000。`);s.journal.push({age:s.age,title:'先把这关过了',text:'朋友帮忙垫了周转钱，你搬回合租房。收好行李，先把明天的面试地址存下来。',tag:'重整'});}
  s.stats.health=clamp(s.stats.health-(s.age>40?3:1));s.stats.spirit=clamp(s.stats.spirit-2);
  if(s.stats.health<15){
    const care=Math.min(s.cash,3000);
    s.stats.health=35;s.stats.spirit=clamp(s.stats.spirit+5);s.cash-=care;
    notices.push(care?`这年身体撑不住，花了 ¥${care.toLocaleString()} 调养。`:'这年身体撑不住，先歇了一阵。');
  }
  const notice=notices.join(' ');
  if(notice)note+=' '+notice;
  s.journal.push({age:s.age,title:`${s.age}岁年度账本`,text:note,tag:'账本'});
  if(s.employment)s.employment={...employment,closedMonths:0,earned:0};
  s.age++;s.actions=3;s.ended=s.age>=60;s.pendingYearEvent=!s.ended;
  return {state:s,income,expense,note,notice,payroll};
}
export function relationshipLabel(s:GameState,id:string){const r=s.relationships[id];if(!r?.met)return '未遇见';if(s.partnerId===id)return r.trust>75?'彼此笃定':'正在一起';if(r.trust>=70&&r.attraction>=50)return '心照不宣';if(r.trust>=45)return '熟悉的人';return '刚认识';}
export function commitRelationship(s:GameState,id:string):GameState {const rel=s.relationships[id];if(!rel?.met||rel.trust<55||rel.attraction<45)throw new Error('再多了解彼此一点，现在还没到这一步。');let next=structuredClone(s);next.partnerId=id;next.relationships[id].commitment=clamp(rel.commitment+25);next.flags=[...new Set([...next.flags,'committed'])];next.journal.push({age:s.age,title:`和${CAST.find(c=>c.id===id)?.name}一起`,text:'你们吃完饭，顺路一起去买了牙刷。回去的路上，谁也没再说客气话。',tag:'关系'});return next;}
export function ending(s:GameState){
  const rel=s.partnerId?s.relationships[s.partnerId]:null;
  const candidates=[
    {id:'million',goal:'wealth',title:'这回真有钞能力',text:'六十岁生日，你查了眼余额，把几个工作群退了。中午加一只蟹，没人需要批准。',ok:s.cash>=2000000},
    {id:'comfortable',goal:'wealth',title:'卡里还有点钱',text:'存款够用，账单付得出。老同学还在聊项目，你已经在看明天几点退潮。',ok:s.cash>=400000},
    {id:'love',goal:'love',title:'下雨有人来接',text:'下雨了，对方发来消息问你在哪。走出地铁口，那把旧伞又撑在那里。',ok:!!rel&&rel.trust>=75&&rel.commitment>=40},
    {id:'companions',goal:'love',title:'菜还是买多了',text:'你下楼买了菜，对方也买了一份。两个人对着两袋青菜笑了半天，晚上又得吃面。',ok:!!rel&&rel.trust>=45},
    {id:'master',goal:'craft',title:'这活还得找你',text:'老同事把你拉进一个群。新人客气地叫老师，老同事直接问，这个能修伐。',ok:s.stats.skill>=90&&s.yearsEmployed>=15},
    {id:'maker',goal:'craft',title:'手艺还在',text:'街角那块招牌还是你做的。老板见你经过，照旧喊你进来坐，茶早就泡好了。',ok:s.stats.skill>=65},
    {id:'free',goal:'free',title:'今天没安排',text:'睡醒九点半。手机没什么消息，你拎着杯子出门，临时决定坐两站轮渡。',ok:s.stats.spirit>=75&&s.stats.health>=55},
    {id:'reset',goal:'free',title:'又开张了',text:'当年搬走时没带的那盆花，朋友还替你养着。这回拿回来，正好放在新桌子上。',ok:s.flags.includes('needed_help')&&s.stats.spirit>=50},
    {id:'community',goal:'community',title:'弄堂里叫得出名号',text:'下楼买个酱油，来回走了四十分钟。这个喊你吃生煎，那个托你看看手机。',ok:s.stats.network>=85},
    {id:'friends',goal:'community',title:'老地方留了座',text:'群里只发了三个字，老地方。你到的时候，靠窗那张椅子没人坐，筷子已经摆好了。',ok:s.stats.network>=60},
    {id:'comeback',goal:'any',title:'还真让你混下来了',text:'几次交不起房租，也几次换了工作。现在翻出刚来时的照片，你先笑了，箱子那时候真破。',ok:s.rescues>=3},
    {id:'ordinary',goal:'any',title:'在上海过了四十二年',text:'以前换乘总走错，现在闭着眼都知道哪个出口近。今天不赶时间，你偏偏绕了远路。',ok:true},
  ];
  return candidates.find(e=>e.ok&&e.goal===s.goal)||candidates.find(e=>e.ok)||candidates[candidates.length-1];
}
export function mergeEffect(a:Effect,b:Effect):Effect{return {...a,...b};}
export function publicOriginNames(s:GameState){return s.origins.map(id=>allOrigins().find(c=>c.id===id)?.name||'未知');}
export const SAVE_KEY='modu-life-v1';
export function validateSave(value:unknown):GameState {
  if(!value||typeof value!=='object')throw new Error('这不是有效的人生档案。');const s=value as GameState;
  const finite=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  if(s.version!==1||typeof s.seed!=='string'||s.seed.length>32||typeof s.name!=='string'||s.name.length>12||!finite(s.age,18,60)||!Number.isInteger(s.age)||!finite(s.actions,0,3)||!Number.isInteger(s.actions)||!finite(s.cash,0,1e12)||!finite(s.rng,0,4294967295)||!GOALS.some(g=>g.id===s.goal)||!['bund','anfu','people','lujiazui','zhangjiang','xinzhuang'].includes(s.district)||typeof s.ended!=='boolean'||typeof s.pendingYearEvent!=='boolean')throw new Error('档案格式或数值不完整。');
  if(!s.stats||Object.keys(STAT_NAMES).some(k=>!finite(s.stats[k as StatKey],0,100)))throw new Error('人物状态不完整。');
  if(!finite(s.jobRank,0,3)||!finite(s.housing,0,3)||!Number.isInteger(s.housing)||!finite(s.totalEarned,0,1e12)||!finite(s.yearsEmployed,0,42)||!finite(s.rescues,0,1000))throw new Error('年度资料不完整。');
  if(s.jobId!==null&&!CAREERS.some(c=>c.id===s.jobId))throw new Error('职业资料不匹配。');
  const work=s.employment;
  if(work!==undefined&&(!work||!Number.isInteger(work.sinceAge)||!finite(work.sinceAge,18,s.age)||!Number.isInteger(work.reviews)||!finite(work.reviews,0,42)||(work.reviewedAt!==undefined&&(!Number.isInteger(work.reviewedAt)||!finite(work.reviewedAt,work.sinceAge,s.age)))||!finite(work.rate,.5,1)||!Number.isInteger(work.closedMonths)||!finite(work.closedMonths,0,12)||!Number.isInteger(work.earned)||!finite(work.earned,0,1e7)))throw new Error('工作记录不完整。');
  for(const k of ['origins','flags','seenEvents'] as const)if(!Array.isArray(s[k])||s[k].length>1500||s[k].some(x=>typeof x!=='string'||x.length>120))throw new Error('档案记录无效。');
  if(s.origins.length!==5||s.origins.some(id=>!allOrigins().some(c=>c.id===id)))throw new Error('开局卡片不存在。');
  if(!Array.isArray(s.journal)||s.journal.length>1000||s.journal.some(j=>!j||!finite(j.age,18,60)||typeof j.title!=='string'||j.title.length>200||typeof j.text!=='string'||j.text.length>5000||typeof j.tag!=='string'||j.tag.length>80))throw new Error('人生记录损坏。');
  if(!s.relationships||typeof s.relationships!=='object')throw new Error('关系记录不完整。');
  for(const npc of CAST){const r=s.relationships[npc.id];if(!r||!finite(r.attraction,0,100)||!finite(r.trust,0,100)||!finite(r.commitment,0,100)||typeof r.met!=='boolean'||!Array.isArray(r.memories)||r.memories.length>20||r.memories.some(x=>typeof x!=='string'||x.length>300))throw new Error('关系记录损坏。');}
  if(s.partnerId!==null&&!CAST.some(c=>c.id===s.partnerId&&c.role==='romance'))throw new Error('关系对象不存在。');
  if(s.ended!==(s.age>=60))throw new Error('年龄与人生状态不匹配。');
  const appearance=Object.prototype.hasOwnProperty.call(s,'appearance')?validateAppearance(s.appearance):{...DEFAULT_APPEARANCE};
  return {...structuredClone(s),appearance};
}
export function readAutoSave():GameState|null {try{const raw=localStorage.getItem(SAVE_KEY);return raw?validateSave(JSON.parse(raw)):null;}catch{return null;}}
export function writeAutoSave(s:GameState):boolean {try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
