import { CAREERS, CAST, GOALS, ORIGIN_POOLS } from './content';
import { EVENTS } from './events';
import type { ActivityKind, ChoiceResult, Effect, EventChoice, GameState, GoalId, LifeEvent, OriginCard, OriginSlot, StatKey } from './types';

export const STAT_NAMES: Record<StatKey,string> = { health:'身体', spirit:'心气', skill:'本事', face:'腔势', network:'人脉' };
export const ACTIVITY_NAMES: Record<ActivityKind,string> = { career:'事业', romance:'约会', rest:'歇一歇', learn:'长本事', housing:'住下来', social:'交朋友', business:'搞点事业', explore:'白相相' };
export const CHAPTERS = [
  {name:'初来乍到', years:'18—24岁', quote:'行李不重，心思蛮重。'},
  {name:'各凭本事', years:'25—31岁', quote:'朋友圈很体面，银行卡很安静。'},
  {name:'立得住脚', years:'32—38岁', quote:'买房、换工作，还是先吃饭？'},
  {name:'中场换气', years:'39—45岁', quote:'原来稳住，也是一种本事。'},
  {name:'重新开张', years:'46—52岁', quote:'这回先问问自己欢喜伐。'},
  {name:'自有腔调', years:'53—59岁', quote:'上海还是那个上海，你已经不一样。'},
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
function applyEffect(state:GameState,effect:Effect,npcId?:string):GameState {
  const s=structuredClone(state);s.cash=Math.round(s.cash+(effect.cash||0));
  for(const key of Object.keys(STAT_NAMES) as StatKey[])s.stats[key]=clamp(s.stats[key]+(effect[key]||0));
  if(effect.job!==undefined){s.jobId=effect.job==='unemployed'?null:CAREERS.some(c=>c.id===effect.job)?effect.job:s.jobId;s.jobRank=0;}
  if(effect.housing!==undefined)s.housing=clamp(effect.housing,0,3);
  s.flags=[...new Set([...s.flags,...(effect.setFlags||[])])].filter(f=>!(effect.removeFlags||[]).includes(f));
  const relationTarget=npcId||s.partnerId;
  if(relationTarget&&s.relationships[relationTarget]){
    const rel=s.relationships[relationTarget];rel.met=true;rel.trust=clamp(rel.trust+(effect.trust||0));rel.attraction=clamp(rel.attraction+(effect.attraction||0));rel.commitment=clamp(rel.commitment+(effect.commitment||0));
    if(effect.love&&rel.trust>=40&&rel.attraction>=35)s.partnerId=relationTarget;
  }
  return s;
}
export function createGame(seed:string,name:string,goal:GoalId,cards:OriginCard[]):GameState {
  let state:GameState={version:1,seed:seed.slice(0,32),rng:hashSeed(seed),name:name.trim().slice(0,12)||'小申',age:18,actions:3,goal,district:'bund',cash:36000,stats:{health:80,spirit:75,skill:28,face:30,network:20},jobId:null,jobRank:0,housing:0,origins:cards.map(c=>c.id),flags:[],seenEvents:[],relationships:Object.fromEntries(CAST.map(c=>[c.id,{attraction:10,trust:15,commitment:0,met:false,memories:[]}])),partnerId:null,journal:[],pendingYearEvent:true,ended:false,totalEarned:0,yearsEmployed:0,rescues:0};
  for(const card of cards)state=applyEffect(state,card.effect);
  if(state.flags.some(f=>/own.?home|有房|home_owner/i.test(f)))state.housing=3;
  state.cash=Math.max(3000,state.cash);
  if(state.flags.includes('family_rich')&&state.flags.includes('card_frozen')){
    state.cash=Math.min(state.cash,24000);
    state.journal.push({age:18,title:'副卡暂时不给刷',text:'家里账上有钱，和你现在能动用的钱，是两回事。手头只留下两万四，条件以后再谈。',tag:'开局牵绊'});
  }
  state.journal.push({age:18,title:'来都来了',text:`带着「${cards[0]?.name}」的出身，和一点不服气，${state.name}在上海开了局。`,tag:'开局'});
  return state;
}
export function monthlyBudget(s:GameState){
  const career=CAREERS.find(c=>c.id===s.jobId);
  const salary=career?Math.round(career.salary*(1+s.jobRank*.65)):0;
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
  let candidates=EVENTS.filter(e=>eligibleEvent(e,s,kind));
  if(npcId){const personal=candidates.filter(e=>e.speakerId===npcId);if(personal.length)candidates=personal;else candidates=candidates.filter(e=>!e.speakerId);}
  const continuing=candidates.filter(e=>e.chainId&&(e.chainStep||0)>0);if(continuing.length)candidates=continuing;
  if(candidates.length){const [r]=randomStep(s.rng);const total=candidates.reduce((n,e)=>n+(e.weight||1),0);let weight=r*total;const picked=candidates.find(e=>(weight-=e.weight||1)<0)||candidates[0];
    if(picked.id==='year-20'&&s.housing===3)return {...picked,title:'有房，也得看合同',text:'家里有房可住，物业和维修文件却还是得自己看。你发现，以前没问过的事还真不少。'};
    if(picked.id==='year-23'&&!s.jobId)return {...picked,title:'朋友第一笔像样工资',text:'群里有人晒了工资到账，你还没找到固定工作。先从眼前能做的小事开始。',choices:picked.choices.map((c,i)=>i===0?{...c,label:'接一份临时小项目',reply:'项目不大，做完拿到四千块。先有一笔自己挣的钱，再找下一次机会。'}:c)};
    if(picked.id==='year-28'&&s.housing===3)return {...picked,text:'朋友发了新房钥匙，你点了赞。回头看见自家的维修清单：有房，也还有要操心的事。'};
    if(picked.id==='year-32'&&!s.jobId)return {...picked,title:'本事还在手上',text:'暂时没有固定工作，一个旧相识却来请教你熟悉的事。原来头衔停了一会，本事没有。'};
    return picked;}
  return routineEvent(s,kind,npcId);
}
export function routineEvent(s:GameState,kind:ActivityKind|'year',npcId?:string):LifeEvent {
  const npc=CAST.find(c=>c.id===npcId);
  const mk=(id:string,label:string,reply:string,effect:Effect):EventChoice=>({id,label,reply,effect});
  const content:Record<string,[string,string,EventChoice[]]>={
    rest:['今天先不争气','手机扣在桌上，水壶刚响。楼下有人在讲电话，讲的也不是什么大事。',[
      mk('nap','补一觉，谁也别找我','醒来没有奇迹发生。不过肩膀松了，人也没那么想吵架了。',{health:14,spirit:10}),
      mk('walk','到江边走一圈','走到第二座桥，终于不再一遍遍想那句气话。',{health:8,spirit:14}),
      mk('call','给一个惦记的人打电话','本来只想问吃了伐，聊到水都烧干了。',{spirit:10,network:5,trust:5})]],
    learn:['本事是自己的','新课程的广告说，七天改变人生。老师本人看起来已经七天没睡觉。',[
      mk('practice','先拿手头的真问题练习','最后没拿到证书，倒是把困扰同事一周的事做完了。',{skill:9,spirit:-2}),
      mk('course','报个正经课程 · ¥2,000','老师不保证改变人生，只布置作业。还蛮可信。',{cash:-2000,skill:15,network:2}),
      mk('peer','约同行交换一门手艺','你教他改方案，他教你报价格。原来大家都曾不敢开口。',{skill:6,network:7})]],
    social:['碰头还是碰杯','朋友问，有空伐？这三个字，有时比长篇道理更有用。',[
      mk('listen','坐下来听听他的近况','你们都没解决对方的问题，但离开时各自轻了一点。',{network:8,spirit:5,trust:5}),
      mk('treat','请一顿家常饭 · ¥600','菜很普通，话很密。有人把这顿饭记了很久。',{cash:-600,network:12,spirit:7,trust:8}),
      mk('help','帮他把一件难事拆开做','花掉的是一个下午，攒下的是下次敢开口的人。',{network:10,skill:3,health:-3,trust:7})]],
    explore:['拐进一条没走过的路','导航提示重新规划。你忽然觉得，今天也可以不用那么准。',[
      mk('wander','收起手机，随便走走','发现一家店，老板连招牌都没擦。东西却做得认真。',{spirit:9,network:3}),
      mk('photo','拍一张不发朋友圈的照片','照片里没有你，但很像你今天的心情。',{spirit:8,skill:3}),
      mk('chat','和路边爷叔聊两句','聊了三站路的事，爷叔一句导航都没用。',{network:7,spirit:3})]],
    housing:['住得像自己','中介说这间房很有潜力。你的意思是，还得我花钱？',[
      mk('stay','先把眼前的房间收拾好','窗帘洗了，书架扶正。生活还没变好，屋子先像样了。',{spirit:8,health:4}),
      mk('upgrade','换个舒服点的住处 · ¥12,000','钥匙转动的声音很轻。你在空屋里坐了五分钟。',{cash:-12000,housing:Math.min(2,s.housing+1),spirit:12}),
      mk('budget','找个便宜些、通勤还行的房间','看了很多房，最后选了晚上能睡着的那一间。',{housing:0,spirit:3,health:-2})]],
    business:['想法也要交房租','小店门口贴着转让。你站了一会，已经在脑子里算起水电费。',[
      mk('small','先小规模接一单试试','第一单没赚多少，但总算知道客户为什么付钱。',{cash:6000,skill:5,network:3,spirit:-2}),
      mk('invest','投入一笔钱认真做 · ¥15,000','收支表终于长得比招牌好看了。',{cash:-15000,skill:10,face:5,setFlags:['business_tested']}),
      mk('observe','先帮朋友做两天，看看实际情况','干到打烊才明白，主理人也得倒垃圾。',{skill:7,network:6,health:-4})]],
    year:['这一年，上海还在转','有人换了工作，有人换了头像。你翻了翻日历，发现自己也做成了一些小事。',[
      mk('keep','把做成的事记下来','原来这一年，也不是白过的。',{spirit:6}),
      mk('people','给帮过你的人回个消息','有人秒回，有人第二天才回。但都回了。',{network:5,trust:3}),
      mk('reset','给来年留一点空白','这次没把计划排满。让生活也有地方坐下。',{health:4,spirit:3})]],
    career:['工作这件事','岗位说明写得很满。负责人只说了一句：先聊聊你做过什么。',[
      mk('apply','认真谈谈我会做的事','对方问了几个具体问题。你也问了工资和下班时间。',{job:s.jobId||'service',skill:6,network:3}),
      mk('build','先做一份拿得出手的作品','这回简历里，有一行是你真正想让人看的。',{skill:12,spirit:-3}),
      mk('ask','找熟人了解一下行业近况','消息没有直接变成offer，但少绕了几个弯。',{network:10,skill:3})]],
    romance:[npc?`和${npc.name}再聊一会`:'留一点时间给喜欢',npc?`${npc.name}没有问你工资。今天想知道的，是上次没讲完的那件事。`:'爱情不负责解决所有问题。不过两个人可以商量着，先解决今天的。',[
      mk('listen','认真听，不急着表现','你记住了一个小细节。下次见面，它会比漂亮话管用。',{trust:12,attraction:5,spirit:4}),
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
  s.journal.push({age:s.age,title:event.title,text,tag:event.tag||ACTIVITY_NAMES[event.category as ActivityKind]||'这一年'});
  const target=npcId||event.speakerId||((choice.effect.trust||choice.effect.attraction||choice.effect.commitment)?s.partnerId||undefined:undefined);
  if(target&&s.relationships[target]){const rel=s.relationships[target];rel.met=true;rel.memories=[...rel.memories,`${s.age}岁 · ${event.title}`].slice(-8);if(rel.trust<20&&s.partnerId===target){s.partnerId=null;s.journal.push({age:s.age,title:'这段关系，需要停一下',text:'承诺还在，信任却跟不上了。你们决定先分开。',tag:'关系'});}}
  if(s.jobId){const career=CAREERS.find(c=>c.id===s.jobId);if(career){const nextRank=Math.max(0,career.thresholds.filter(t=>s.stats.skill>=t).length-1);s.jobRank=Math.min(3,Math.max(s.jobRank,nextRank));}}
  s.cash=Math.max(0,s.cash);
  return {state:s,title:event.title,text,effect,success};
}
export function nextYear(state:GameState):{state:GameState;income:number;expense:number;note:string} {
  if(state.ended)throw new Error('这一生已经结算。');if(state.pendingYearEvent)throw new Error('先把眼前这件事处理好。');
  const s=structuredClone(state),budget=monthlyBudget(s);
  const [yearRoll,nextRng]=randomStep(s.rng);s.rng=nextRng;
  const variable=s.jobId==='freelance'?.7+yearRoll*.6:s.jobId==='business'?.55+yearRoll*.9:1;
  const income=Math.round(budget.salary*12*variable),expense=(budget.rent+budget.living)*12;
  const pressure:Record<string,[number,number]>={tech:[5,5],finance:[3,8],creative:[3,4],service:[6,3],public:[2,2],freelance:[2,3],business:[4,4],trade:[4,5]};
  if(s.jobId){const [body,mind]=pressure[s.jobId]||[2,2];s.stats.health=clamp(s.stats.health-body);s.stats.spirit=clamp(s.stats.spirit-mind);}
  if(s.partnerId){const rel=s.relationships[s.partnerId];const keptInTouch=rel.memories.some(m=>m.startsWith(s.age+'岁 · '));if(!keptInTouch){rel.trust=clamp(rel.trust-4);rel.commitment=clamp(rel.commitment-2);}}
  s.cash+=income-expense;s.totalEarned+=income;if(s.jobId)s.yearsEmployed++;
  let note=income?`工资到账 ¥${income.toLocaleString()}，固定开支 ¥${expense.toLocaleString()}。`:`这一年没有固定工资，生活开支 ¥${expense.toLocaleString()}。`;
  if(s.cash<0){const shortage=-s.cash;s.cash=6000;s.rescues++;s.stats.spirit=clamp(s.stats.spirit-8);s.housing=0;s.flags=[...new Set([...s.flags,'needed_help'])];note+=` 周转缺口 ¥${shortage.toLocaleString()}。你接受了一次互助，搬回预算内的房间，手上留下 ¥6,000，重新找机会。`;s.journal.push({age:s.age,title:'先把这关过了',text:'这回借了力。以后有余力的时候，再把这份人情传下去。',tag:'重整'});}
  s.stats.health=clamp(s.stats.health-(s.age>40?3:1));s.stats.spirit=clamp(s.stats.spirit-2);
  if(s.stats.health<15){s.stats.health=35;s.stats.spirit=clamp(s.stats.spirit+5);s.cash=Math.max(0,s.cash-3000);note+=' 身体提醒你歇一歇。调整以后，继续生活。';}
  s.journal.push({age:s.age,title:`${s.age}岁年度账本`,text:note,tag:'账本'});
  s.age++;s.actions=3;s.ended=s.age>=60;s.pendingYearEvent=!s.ended;
  return {state:s,income,expense,note};
}
export function relationshipLabel(s:GameState,id:string){const r=s.relationships[id];if(!r?.met)return '未遇见';if(s.partnerId===id)return r.trust>75?'彼此笃定':'正在一起';if(r.trust>=70&&r.attraction>=50)return '心照不宣';if(r.trust>=45)return '熟悉的人';return '刚认识';}
export function commitRelationship(s:GameState,id:string):GameState {const rel=s.relationships[id];if(!rel?.met||rel.trust<55||rel.attraction<45)throw new Error('再多了解彼此一点，现在还没到这一步。');let next=structuredClone(s);next.partnerId=id;next.relationships[id].commitment=clamp(rel.commitment+25);next.flags=[...new Set([...next.flags,'committed'])];next.journal.push({age:s.age,title:`和${CAST.find(c=>c.id===id)?.name}一起`,text:'没有宣布以后不会有困难。只是决定，遇到困难先一起商量。',tag:'关系'});return next;}
export function ending(s:GameState){
  const rel=s.partnerId?s.relationships[s.partnerId]:null;
  const candidates=[
    {id:'million',goal:'wealth',title:'钞能力，留了后手',text:'你攒下的不只是数字。遇到不喜欢的事，终于可以先说不。',ok:s.cash>=2000000},
    {id:'comfortable',goal:'wealth',title:'账上有余，心里有数',text:'没有登上什么榜。你知道钱去了哪里，也知道明天的饭在哪里。',ok:s.cash>=400000},
    {id:'love',goal:'love',title:'同一把伞，下了很多年雨',text:'年轻时急着说喜欢。后来更多时候，只说一句：我来接你。',ok:!!rel&&rel.trust>=75&&rel.commitment>=40},
    {id:'companions',goal:'love',title:'两个人，各有自己的日子',text:'有些年走得近，有些年各自忙。留下来的，是愿意继续谈的两个人。',ok:!!rel&&rel.trust>=45},
    {id:'master',goal:'craft',title:'这个事，还是得找你',text:'称呼换了好几个。最后大家不再问你的头衔，直接问你什么时候有空。',ok:s.stats.skill>=90&&s.yearsEmployed>=15},
    {id:'maker',goal:'craft',title:'有一门手艺，能走很远',text:'你做过的东西，还在别人手里好好用着。这种感觉蛮好。',ok:s.stats.skill>=65},
    {id:'free',goal:'free',title:'今天不证明什么',text:'保温杯里是自己喜欢喝的。要去哪里，今天由你说了算。',ok:s.stats.spirit>=75&&s.stats.health>=55},
    {id:'reset',goal:'free',title:'人生中场，重新开张',text:'换过方向，也丢过面子。好在你后来还是认出了自己的声音。',ok:s.flags.includes('needed_help')&&s.stats.spirit>=50},
    {id:'community',goal:'community',title:'小区里，有人等你回来',text:'出门有人招呼，难处有人搭手。你把自己的日子，过成了一张温暖的网。',ok:s.stats.network>=85},
    {id:'friends',goal:'community',title:'有空伐？老地方',text:'没有多少惊天动地的大事。只是这些年，你们一直还在。',ok:s.stats.network>=60},
    {id:'comeback',goal:'any',title:'一手烂牌，也打出了声音',text:'这一路不算轻巧。你接受过帮助，也找回过自己。上海很大，终于有了你的落脚处。',ok:s.rescues>=3},
    {id:'ordinary',goal:'any',title:'来过，爱过，白相过',text:'这城没有为你停下来。你也没有白来：人见过了，路走过了，几句真心话还记得。',ok:true},
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
  for(const k of ['origins','flags','seenEvents'] as const)if(!Array.isArray(s[k])||s[k].length>1500||s[k].some(x=>typeof x!=='string'||x.length>120))throw new Error('档案记录无效。');
  if(s.origins.length!==5||s.origins.some(id=>!allOrigins().some(c=>c.id===id)))throw new Error('开局卡片不存在。');
  if(!Array.isArray(s.journal)||s.journal.length>1000||s.journal.some(j=>!j||!finite(j.age,18,60)||typeof j.title!=='string'||j.title.length>200||typeof j.text!=='string'||j.text.length>5000||typeof j.tag!=='string'||j.tag.length>80))throw new Error('人生记录损坏。');
  if(!s.relationships||typeof s.relationships!=='object')throw new Error('关系记录不完整。');
  for(const npc of CAST){const r=s.relationships[npc.id];if(!r||!finite(r.attraction,0,100)||!finite(r.trust,0,100)||!finite(r.commitment,0,100)||typeof r.met!=='boolean'||!Array.isArray(r.memories)||r.memories.length>20||r.memories.some(x=>typeof x!=='string'||x.length>300))throw new Error('关系记录损坏。');}
  if(s.partnerId!==null&&!CAST.some(c=>c.id===s.partnerId&&c.role==='romance'))throw new Error('关系对象不存在。');
  if(s.ended!==(s.age>=60))throw new Error('年龄与人生状态不匹配。');
  return structuredClone(s);
}
export function readAutoSave():GameState|null {try{const raw=localStorage.getItem(SAVE_KEY);return raw?validateSave(JSON.parse(raw)):null;}catch{return null;}}
export function writeAutoSave(s:GameState):boolean {try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
