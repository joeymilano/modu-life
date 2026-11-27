import { hashSeed, randomStep } from './seed';
import { cityDrawHistory, cityTicketAllowance, cityTickets, type CityDrawSize } from './cityCards';
import { episodeById, episodeOffer, episodeSettlement, isPujiang, isPujiangSystem, playEpisode, pujiangEpilogue, pujiangYear, PUJIANG_CONTACTS, validatePujiang } from './pujiang';
import type { EpisodeMove } from './pujiangTypes';
import { calendarYear, cityYearNote, SHANGHAI_START } from './calendar';
import { marketValue, validateMarket } from './market';
import type { Showdown } from './showdowns';
import { playShowdown, showdownView, validateShowdown } from './showdowns';
import { storyRoute, storySettlement, storyShowdownId, storyShowdownOffer, storyShowdownScene } from './storyShowdown';
import { DAYWORK, DAYWORK_TEMP, FAMILY_HOME, FAMILY_PAY, HEIR, HEIR_PAY_RATE, lifeStartRent, lifeStartYear, validLifeStartHand } from './lifeStarts';
import { CAREERS, CAST, GOALS, LIFE_START_CARDS, ORIGIN_POOLS } from './content';
import { FIRST_NIGHT_FLAG, firstNightYear, hasSharedWithMao } from './firstNight';
import { hasHeirStory, HEIR_WEST_BUND } from './heirStory';
import { livesInPenthouse, replayConcierge } from './heirConcierge';
import { empireAssetValue, empireDividend, ownedBusinesses, ownsEmpireClub, ownsEmpirePenthouse } from './empire';
import { HUSTLE_HEAT_FLAGS } from './streetHustles';
import { campaignEpilogue, campaignPressureYear, campaignYear } from './lifeCampaign';
import { isSystemLife } from './systemStory';
import { OPENING_DRAMA } from './openingStakes';
import { lastDayEvent } from './lastDay';
import { workYearEvent } from './workScenes';
import { longTableBudget, longTableYear } from './longTable';
import { employmentOf, LONG_COMMUTE, MAX_PAY_RATE, monthlySalary, moveJob, NIGHT_WORK, registerReview } from './employment';
import { EVENTS } from './events';
import { LOAN_DUE, LOAN_INSTALLMENT } from './originStories';
import { STALL_YEARLY_PAY, stallCommitment } from './stall';
import { clearHousehold, householdFlag, householdPlan, housingPayment, STANDING_DATE_MONTHLY_COST } from './household';
import { closeRentalLease } from './rental';
import { receiptMoment, validYearReceipt, type YearReceipt } from './yearReceipt';
import { STAFF_BED } from './classLives';
import { HEIR_PERSONAL_CASH, heirTerms } from './heirCapital';
import type { ActivityKind, ChoiceResult, Effect, EventChoice, GameState, GoalId, LifeEvent, LooksLevel, OriginCard, OriginSlot, PlayerAppearance, StatKey } from './types';

export const STAT_NAMES: Record<StatKey,string> = { health:'身体', spirit:'心气', skill:'本事', face:'腔势', network:'人脉' };
export const ACTIVITY_NAMES: Record<ActivityKind,string> = { career:'事业', romance:'约会', rest:'歇一歇', learn:'长本事', housing:'住下来', social:'交朋友', business:'搞点事业', explore:'白相相' };
export const CHAPTERS = [
  {name:'初闯码头', years:'18至24岁', quote:'皮箱轮子磨平了，路数才刚摸熟。'},
  {name:'各显神通', years:'25至31岁', quote:'场面上滴水不漏，卡里余额自己心里有数。'},
  {name:'扎稳脚跟', years:'32至38岁', quote:'先上车买房、跳槽单干，还是今晚先吃顿好的？'},
  {name:'中场换挡', years:'39至45岁', quote:'酒局推掉一半，体检报告比年终奖先拆。'},
  {name:'二次开张', years:'46至52岁', quote:'前半场替别人赶路，后半场先问自家欢喜伐。'},
  {name:'老克勒腔调', years:'53至59岁', quote:'虚头巴脑的局不去了，留几桌真朋友吃茶。'},
];
export const clamp = (n:number,min=0,max=100) => Math.max(min,Math.min(max,n));
export { hashSeed, randomStep } from './seed';
export const allOrigins = () => [...Object.values(ORIGIN_POOLS).flat(), ...LIFE_START_CARDS];
export function drawOrigins(seed:string, reroll=0):OriginCard[] {
  let rng=hashSeed(seed+':'+reroll);
  return (['出身','家底','天赋','牵绊','秘密'] as OriginSlot[]).map(slot=>{const [r,next]=randomStep(rng);rng=next;const pool=ORIGIN_POOLS[slot];return pool[Math.floor(r*pool.length)];});
}
export function rerollOptions(seed: string, round: number, current: OriginCard): readonly [OriginCard, OriginCard] {
 const candidates = ORIGIN_POOLS[current.slot].filter(card => card.id !== current.id);
 const [roll, rng] = randomStep(hashSeed(seed + ':swap:' + round + ':' + current.slot));
 const [next] = randomStep(rng);
 const first = Math.floor(roll * candidates.length);
 const second = (first + 1 + Math.floor(next * (candidates.length - 1))) % candidates.length;
 return [candidates[first], candidates[second]];
}
export function rerollOrigin(seed: string, round: number, current: OriginCard): OriginCard {
 return rerollOptions(seed, round, current)[0];
}
export { newSeed } from './seed';
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
  if(effect.housing!==undefined){
    s.housing=clamp(effect.housing,0,3);
    s.flags=s.flags.filter(flag=>flag!==FAMILY_HOME&&flag!==FAMILY_PAY&&flag!==DAYWORK_TEMP&&flag!==STAFF_BED);
    if(s.leaseRent!==undefined)s.flags=closeRentalLease(s.flags);
    delete s.leaseRent;
  }
  if(effect.leaseRent!==undefined&&s.housing===1)s.leaseRent=effect.leaseRent;
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
  if(s.partnerId!==state.partnerId)s.flags=clearHousehold(s.flags);
  else if(s.housing===0&&s.partnerId){
    const shared=householdFlag(s.partnerId,'shared');
    s.flags=s.flags.filter(flag=>flag!==shared);
  }
  return s;
}
export function drawCityCards(state: GameState, amount: CityDrawSize): GameState {
  if (state.ended || state.episode || state.showdown) throw new Error('现在不能抽卡。');
  if (amount !== 1 && amount !== 5) throw new Error('抽卡张数无效。');
  if (cityTickets(state) < amount) throw new Error('抽奖券不够。');
  const before = state.cityDraws ?? 0;
  const count = before + amount;
  const drawn = cityDrawHistory(state.seed, count).cards.slice(before);
  const next = drawn.reduce((game, card) => applyEffect(game, card.effect), state);
  return { ...next, cityDraws: count };
}
export function createGame(seed:string,name:string,goal:GoalId,cards:OriginCard[],appearance:PlayerAppearance=DEFAULT_APPEARANCE):GameState {
  const selectedAppearance=validateAppearance(appearance);
  let state:GameState={version:1,seed:seed.slice(0,32),rng:hashSeed(seed),name:name.trim().slice(0,12)||'小申',age:18,actions:3,goal,appearance:selectedAppearance,district:'bund',cash:36000,stats:{health:80,spirit:75,skill:28,face:30+LOOKS_BONUS[selectedAppearance.looks].face,network:20},jobId:null,jobRank:0,housing:0,origins:cards.map(c=>c.id),flags:[FIRST_NIGHT_FLAG,OPENING_DRAMA],seenEvents:[],relationships:Object.fromEntries(CAST.map(c=>[c.id,{attraction:10,trust:15,commitment:0,met:false,memories:[]}])),partnerId:null,journal:[],pendingYearEvent:true,ended:false,totalEarned:0,yearsEmployed:0,rescues:0};
  for(const card of cards)state=applyEffect(state,card.effect);
  if(state.flags.some(f=>/own.?home|有房|home_owner/i.test(f)))state.housing=3;
  for (const person of CAST) if (person.role==='family') state.relationships[person.id].met=true;
  const daywork=state.flags.includes(DAYWORK), heir=state.flags.includes(HEIR);
  state.cash=Math.max(daywork?0:3000,state.cash);
  if(heir){state.cash=HEIR_PERSONAL_CASH;state.flags.push(HEIR_WEST_BUND);}
  if(daywork||heir)state.district=daywork?'xinzhuang':'lujiazui';
  if(state.flags.includes('family_rich')&&state.flags.includes('card_frozen')){
    state.cash=Math.min(state.cash,24000);
    state.journal.push({age:18,title:'副卡暂时不给刷',text:'刷卡失败。老爸回了四个字，自己想办法。你翻遍账户，还能凑出两万四。',tag:'开局牵绊'});
  }
  state.journal.push({age:18,title:'到上海了',text:daywork?'床位只付了一晚。早班的地址存进了手机。':heir?'司机把箱子送到门厅。财务发来两份分开的账单。':isSystemLife(state)?'便利店借了根充电线。刚开机就收到一条任务。':'车门开了。手机刚切回信号，连着响了三声。',tag:'开局'});
  return state;
}
export function monthlyBudget(s:GameState){
  const salary=monthlySalary(s);
  const plan=householdPlan(s);
  const shared=plan==='shared';
  const rent=lifeStartRent(s,housingPayment(s.housing,s.leaseRent,shared),shared);
  const familyHome=s.housing===2&&s.flags.includes(FAMILY_HOME);
  const terms=heirTerms(s);
  const fixedLiving=familyHome?terms.living:1800;
  const living=fixedLiving+(s.partnerId?600:0)+(s.age>=40?500:0)+(plan==='standing'?STANDING_DATE_MONTHLY_COST:0);
  const familyPaid=familyHome&&s.flags.includes(FAMILY_PAY)?Math.min(terms.familyCap,rent+fixedLiving):0;
  return {salary,rent,living,familyPaid,net:salary-rent-living+familyPaid};
}
export function eligibleEvent(e:LifeEvent,s:GameState,kind:ActivityKind|'year',replay=false):boolean {
  if(e.chainId==='family_card'&&e.chainStep===0&&!s.flags.some(f=>f==='family_rich'||f==='card_frozen'))return false;
  if((e.chainId==='project_credit'||e.chainId==='layoff_story')&&e.chainStep===0&&!s.jobId)return false;
  if(!replay){
    if(e.chainId==='family_plan'&&hasHeirStory(s))return false;
    if(e.chainId==='roommates'&&(e.chainStep??0)<2
      &&(s.housing!==1||s.leaseRent!==undefined||householdPlan(s)==='shared'||!hasSharedWithMao(s)))return false;
    if(e.housingLevels&&!e.housingLevels.includes(s.housing))return false;
    if(e.needsRoommate&&s.housing!==0&&householdPlan(s)!=='shared'
      &&(s.housing!==1||s.leaseRent!==undefined||!hasSharedWithMao(s)))return false;
  }
  return e.category===kind&&(!e.district||e.district===s.district)&&(!e.minAge||s.age>=e.minAge)&&(!e.maxAge||s.age<=e.maxAge)&&(!e.once||!s.seenEvents.includes(e.id))&&!s.seenEvents.includes(e.id)&&(!e.requiredFlags||e.requiredFlags.every(f=>s.flags.includes(f)))&&(!e.forbiddenFlags||e.forbiddenFlags.every(f=>!s.flags.includes(f)));
}
function adaptYearLetter(picked:LifeEvent,s:GameState):LifeEvent {
  if(picked.id==='year-20'&&s.housing===3)return {...picked,title:'有房，也得看合同',text:'家里有房可住。物业送来一叠维修文件，老妈让你看看，哪些需要自己掏钱。'};
  if(picked.id==='year-20'&&s.flags.includes(HEIR))return {...picked,title:'这次租约怎么续',text:'续约单到了。物业把房租和代收费用分开列了两页，附了个空白的报修清单。'};
  if(picked.id==='year-23'&&!s.jobId)return {...picked,title:'朋友第一笔像样工资',text:'朋友的工资到了，在群里发了个红包。你抢到两块三，顺手又点开了招聘软件。',choices:picked.choices.map((c,i)=>i===0?{...c,label:'接一份临时小项目',reply:'项目做完，四千块到账。你给那张收款截图点了收藏。'}:c)};
  if(picked.id==='year-28'&&s.housing===3)return {...picked,text:'朋友发来新房钥匙，你点了赞。旁边自家的维修清单还摊着，今天得先打电话找师傅。'};
  if(picked.id==='year-28'&&s.flags.includes(FAMILY_HOME))return {...picked,title:'江边的租约快到期了',text:'公寓经理把续约单送到门口。楼下的房间腾出来一间，朝向一样，少一扇能看江的窗。',choices:picked.choices.map((choice,index)=>index===0?{...choice,label:'问清续约条件',reply:'经理把朝向和续约报价分开写。你拿着两份单子，绕楼走了一圈。'}:index===1?{...choice,label:'问问楼下的房间',reply:'站到窗前，那截江面刚好被另一栋楼挡住。你把钥匙还给经理。'}:choice)};
  if(picked.id==='year-32'&&!s.jobId)return {...picked,title:'本事还在手上',text:'旧同事打来电话，问上次那个问题怎么解决。你一边啃面包，一边给他画了张图。'};
  return picked;
}
export function oldYearLetter(state:GameState):LifeEvent|undefined {
  const event=EVENTS.find(item=>item.id===`year-${state.age}`);
  return event&&adaptYearLetter(event,state);
}
export function replayCatalogEvent(state:GameState,id:string,kind:ActivityKind,npc?:string) {
  const event=EVENTS.find(item=>item.id===id);
  return event&&(!npc||!event.speakerId||event.speakerId===npc)&&eligibleEvent(event,state,kind,true)
    ? adaptYearLetter(event,state) : null;
}
function authoredYear(s:GameState) {
  return [pujiangYear(s), lifeStartYear(s), isPujiang(s)?undefined:firstNightYear(s), lastDayEvent(s), workYearEvent(s), campaignYear(s), campaignPressureYear(s), longTableYear(s)]
    .find(event=>event&&!s.seenEvents.includes(event.id));
}
export function selectEvent(s:GameState,kind:ActivityKind|'year',npcId?:string):LifeEvent {
  const annual = kind === 'year' ? authoredYear(s) : undefined;
  if (annual) return annual;
  let candidates=EVENTS.filter(e=>eligibleEvent(e,s,kind));
  if(npcId){const personal=candidates.filter(e=>e.speakerId===npcId);if(personal.length)candidates=personal;else candidates=candidates.filter(e=>!e.speakerId);}
  const continuing=candidates.filter(e=>e.chainId&&(e.chainStep||0)>0);if(continuing.length)candidates=continuing;
  if(candidates.length){const [r]=randomStep(s.rng);const total=candidates.reduce((n,e)=>n+(e.weight||1),0);let weight=r*total;const picked=candidates.find(e=>(weight-=e.weight||1)<0)||candidates[0];
    if(picked.id==='laser_story-1'){
      const remembered=s.flags.includes('pearl_appeal')?'他把你退过四块的那张小票压在玻璃下面，说这是第一版防伪标。'
        :s.flags.includes('pearl_help')?'当年一起抬桌子的爷叔坐在隔壁。他用拐杖敲了敲凳腿，给你留个位置。'
        :s.flags.includes('pearl_drink')?'你先认出了柜台上那台卡纸的打印机。那天跟着你喝的人，现在管收银。':null;
      if(remembered)return {...picked,text:picked.text+' '+remembered};
    }
    return adaptYearLetter(picked,s);}
  return routineEvent(s,kind,npcId);
}
export function routineEvent(s:GameState,kind:ActivityKind|'year',npcId?:string):LifeEvent {
  const npc=CAST.find(c=>c.id===npcId);
  const mk=(id:string,label:string,reply:string,effect:Effect):EventChoice=>({id,label,reply,effect});
  const content:Record<string,[string,string,EventChoice[]]>={
    rest:['今天挂免战牌','手机反扣在桌面，电水壶咔哒跳闸。弄堂里有人隔窗喊收衣裳，没一桩事催你立刻回话。',[
      mk('nap','拉上窗帘睡到天擦黑','一觉闷到下午四点，工作群静悄悄的，翻个身把风头也避了过去。',{health:14,spirit:10,removeFlags:['hustle_heat_bund','hustle_heat_anfu','hustle_heat_people']}),
      mk('walk','晃去苏州河边吹夜风','溜达到第二座老桥，胸口堵着的那句闷气顺着江风散干净了。',{health:8,spirit:14,removeFlags:['hustle_heat_lujia','hustle_heat_zhang','hustle_heat_xin']}),
      mk('call','给挂心的人拨通电话','本来只随口问句吃了伐，不知不觉聊到水壶烧开第二轮。',{spirit:10,network:5,trust:5})]],
    learn:['压箱底的课该拆封了','广告吹得震天响：七天重塑核心竞争力。点开试听，讲师的黑眼圈比你还重。',[
      mk('practice','拿手头卡壳的真活练手','照着文档硬啃三遍，把同事拖了一礼拜的烂摊子当场跑通了。',{skill:9,spirit:-2}),
      mk('course','掏钱报个实战硬课 · ¥2,000','刚交完学费助教就甩来两份实操题，逼着自己连啃两个钟头。',{cash:-2000,skill:15,network:2}),
      mk('peer','约圈内老手拿手艺换手艺','你帮他改完方案，他顺手把行里真实的底价区间透给了你。',{skill:6,network:7})]],
    social:['碰头吃茶还是组局碰杯','老熟人弹来一条消息问今朝有空伐，底下紧跟着一家本帮小馆的定位。',[
      mk('listen','找个角落听他倒苦水','听他把近半年的弯路竹筒倒豆子讲完，临走约实了下回碰头。',{network:8,spirit:5,trust:5}),
      mk('treat','做东请顿热炒本帮菜 · ¥600','响油鳝丝一上桌没人顾得上玩手机，散席了还在马路牙子上聊了半宿。',{cash:-600,network:12,spirit:7,trust:8}),
      mk('help','卷起袖子帮他拆解棘手事','俩人对坐忙活一下午，总算把他卡死的那份申报单清干净了。',{network:10,skill:3,health:-3,trust:7})]],
    explore:['拐进导航没标的后弄堂','高架桥下信号打飘，抬眼撞见转角小铺排起长队，油锅滋啦冒着香气。',[
      mk('wander','揣起手机顺着弄堂瞎逛','撞见家门头掉漆的老铺子，老板脾气倔，手底下出品倒是真讲究。',{spirit:9,network:3}),
      mk('photo','捏一张不发圈的街景留底','连按三下快门留住最亮那张霓虹倒影，揣回兜里谁也没给看。',{spirit:8,skill:3}),
      mk('chat','蹲马路牙子跟爷叔嘎三胡','三站路的陈年八卦听了个遍，比任何城市攻略都灵光。',{network:7,spirit:3})]],
    housing:['把日子过出点人样','中介拍着胸脯夸这间房极具改造空间——翻译过来就是还得你自己掏腰包。',[
      mk('stay','挽起袖子把现住处拾掇清爽','窗帘拆洗晾干，歪腿书架垫平，床底攒了半年的空快递箱全清出门。',{spirit:8,health:4}),
      mk('upgrade','咬牙换套敞亮住处 · ¥12,000','新锁芯转动一声轻响，你在洒满夕阳的空客厅里独坐了五分钟。',{cash:-12000,housing:Math.min(2,s.housing+1),spirit:12}),
      mk('budget','挑间通勤顺脚、夜里不吵的实惠房','跑断腿看了七八套，最后拍板了弄堂深处最安静的那一间。',{housing:0,spirit:3,health:-2})]],
    business:['再好的点子也得先交房租','临街铺面贴出旺铺急转，你站在马路对面，脑子里已经噼里啪啦算起了坪效水电。',[
      mk('small','先接一票小单试探水深','头一单落袋六千现钱，材料工时分列得明明白白，心里有了底价。',{cash:6000,skill:5,network:3,spirit:-2}),
      mk('invest','真金白银砸下去试水 · ¥15,000','忙活大半个月，流水账面总算长得比门头招牌顺眼了。',{cash:-15000,skill:10,face:5,setFlags:['business_tested']}),
      mk('observe','先去朋友店里盯两天晚班','干到凌晨拉卷帘门才悟透：叫主理人也好叫老板也罢，打烊都得自己拎垃圾袋。',{skill:7,network:6,health:-4})]],
    year:['黄浦江的水还在往前淌','满屏都在转迎新红包。你翻到年初随手拍的旧照片，差点没认出当时落脚的那间屋子。',[
      mk('keep','把今年啃下来的硬骨头记一笔','拿笔一条条列下来，一页纸居然没写满，翻过面又添了两行。',{spirit:6}),
      mk('people','给搭过手的朋友挨个回声谢','有人秒回表情包，有人隔天清晨才回，好在情分都还在。',{network:5,trust:3}),
      mk('reset','替开春的台历留几格透气窗','果断推掉两场虚头巴脑的应酬，下个月总算不用连轴转了。',{health:4,spirit:3})]],
    career:['饭碗与身价这笔账','招聘简章写得天花乱坠，真坐上谈判桌，对面头一句还是问你手头有没有硬活。',[
      mk('apply','摊开做成的项目谈真格的','对面追问了三个落地细节，你也毫不客气问清了底薪跟加班规矩。',{job:s.jobId||'service',skill:6,network:3}),
      mk('build','闭关攒一份镇得住场的代表作','简历上总算多出一行不用心虚圆场的硬通货。',{skill:12,spirit:-3}),
      mk('ask','约行里熟人摸摸今年真实行情','虽没当场拿到录用函，但把坑人的两家公司提前排了雷。',{network:10,skill:3})]],
    romance:[npc?`约${npc.name}出来吹吹晚风`:'这礼拜约不约出来',npc?`${npc.name}没打听你月底拿多少钞票，只顺着上回没讲完的话头往下聊。`:'点开置顶对话框，上一句还停在「改天约饭」，今晚偏巧两边都没局。',[
      mk('listen','收起表现欲，踏踏实实听对方讲','对方随口提了家藏在弄堂里的小馆子，你不动声色记进地图备忘录。',{trust:12,attraction:5,spirit:4}),
      mk('date','订一处合对方脾气的去处 · ¥500','没搞浮夸排场，就是对方上月念叨过一句的地方，你一直记着。',{cash:-500,trust:10,attraction:14,commitment:4}),
      mk('honest','不端着架子，连近来的难处一块摊开','话讲出口反倒松快了，对方安静听完，替你把空茶杯续上了热茶。',{trust:15,attraction:3,commitment:5,spirit:5})]],
  };
  const [title,text,choices]=content[kind]||content.explore;
  return {id:`routine-${kind}`,title,text,choices,speakerId:npcId,category:kind,tag:'日常'};
}
export function canAfford(s:GameState,effect:Effect){return (effect.cash||0)>=0||s.cash>=-(effect.cash||0);}
export function checkChance(s:GameState,choice:EventChoice){if(!choice.check)return 100;return Math.round(clamp(50+s.stats[choice.check.stat]-choice.check.threshold,15,95));}
export function resolveChoice(state:GameState,event:LifeEvent,choiceId:string,npcId?:string):ChoiceResult {
  if(state.episode||episodeOffer(state))throw new Error('先完成眼前的章节。');
  const actionCost=event.actionCost??1;
  if(state.ended||(!state.pendingYearEvent&&state.actions<actionCost))throw new Error('今年的时间用完了，先去年度结算。');
  if(actionCost===0){
    const available=replayConcierge(state,event.id);
    if(!available)throw new Error('这项安排现在无法办理。');
    event=available;
  }
  const choice=event.choices.find(c=>c.id===choiceId);if(!choice)throw new Error('这个选择不存在。');
  if(!canAfford(state,choice.effect))throw new Error('这笔钱现在拿不出来。换一个办法。');
  let s=applyEffect(state,choice.effect,npcId||event.speakerId);let text=choice.reply;let effect={...choice.effect};let success:boolean|undefined;
  const [roll,rng]=randomStep(s.rng);s.rng=rng;
  if(choice.check){success=roll*100<checkChance(state,choice);const extra=success?choice.check.success:choice.check.failure;s=applyEffect(s,extra,npcId||event.speakerId);text+=' '+(success?choice.check.successText:choice.check.failureText);effect={...effect};for(const [key,value] of Object.entries(extra)){if(typeof value==='number')(effect as Record<string,unknown>)[key]=Number((effect as Record<string,unknown>)[key]||0)+value;}}
  if(state.pendingYearEvent)s.pendingYearEvent=false;else s.actions-=actionCost;
  if(!event.id.startsWith('routine-'))s.seenEvents=[...new Set([...s.seenEvents,event.id])];
  if(event.category==='career'&&!event.id.startsWith('mini-')&&s.jobId===state.jobId){
    const rank=registerReview(s);
    if(rank)text+=` 年度评审过了，接下来做${rank}。`;
  }
  s.journal.push({age:s.age,title:event.title,text,tag:event.tag||ACTIVITY_NAMES[event.category as ActivityKind]||'这一年'});
  const target=npcId||event.speakerId||((choice.effect.trust||choice.effect.attraction||choice.effect.commitment)?s.partnerId||undefined:undefined);
  if(target&&s.relationships[target]){const rel=s.relationships[target];rel.met=true;rel.memories=[...rel.memories,`${s.age}岁 · ${event.title}`].slice(-8);if(rel.trust<20&&s.partnerId===target){s.partnerId=null;s.flags=clearHousehold(s.flags);s.journal.push({age:s.age,title:'分开一阵',text:'最近几次聊天都没讲完。你们约出来，把东西还了，决定先分开。',tag:'关系'});}}
  s.cash=Math.max(0,s.cash);
  return {state:s,title:event.title,text,effect,success};
}
export function playStoryRound(state:GameState,move:string): {state:GameState; settled?:Showdown; result?:ChoiceResult} {
  const active = state.showdown;
  if (!active || state.ended) throw new Error('这场已经结束了。');
  const showdown = playShowdown(active,move);
  const view = showdownView(showdown);
  if (!view.verdict) return {state:{...state,showdown}};
  const event = storyShowdownScene(state,showdown);
  const {effect,reply} = event.choices[0];
  const settle = storySettlement(showdown);
  const annual = state.pendingYearEvent ? authoredYear(state) : undefined;
  const relation= view.ally ? settle.ally : settle.rival;
  const next = applyEffect(state,relation?{...effect,trust:view.ally?8:-4}:effect,relation);
  if(relation&&next.relationships[relation]){
    const contact=next.relationships[relation];
    contact.memories=[...contact.memories,state.age+'岁 · '+event.title].slice(-8);
  }
  delete next.showdown;
  next.pendingYearEvent = state.pendingYearEvent && (active.age===18 || Boolean(annual && annual.id!==settle.seen));
  next.seenEvents = [...new Set([...next.seenEvents,event.id,settle.seen])];
  next.district = event.district ?? next.district;
  next.journal.push({age:next.age,title:event.title,text:reply,tag:'主线'});
  return {state:next,settled:showdown,result:{state:next,title:event.title,text:reply,effect,success:view.verdict==='win'}};
}
export function playPujiangMove(state:GameState,move:EpisodeMove):GameState {
 const run=playEpisode(state,move),settlement=episodeSettlement(state,run);
 if(!settlement)return {...state,episode:run};
 const {receipt,relations}=settlement;
 let next=applyEffect(state,receipt.effect);
 for(const [id,trust] of relations){
  next=applyEffect(next,{trust},id);
  const person=next.relationships[id];
  if(person){person.met=true;person.memories=[...person.memories,`${state.age}岁 · ${receipt.title}`].slice(-8);}
 }
 next.seenEvents=[...new Set([...next.seenEvents,run.id])];
 if(next.systemProgress)next.systemProgress.rewardCash+=receipt.cash;
 next.episode={...run,receipt};
 next.pendingYearEvent=Boolean(state.pendingYearEvent&&authoredYear(next));
 next.journal.push({age:next.age,title:episodeById(run.id)!.title,text:[receipt.title,receipt.text,...receipt.relationships,receipt.next].join(' '),tag:'浦江破局'});
 return next;
}
export function nextYear(state:GameState) {
  if(state.episode||episodeOffer(state))throw new Error('先完成眼前的章节。');
  if(state.ended)throw new Error('这一生已经结算。');if(state.showdown)throw new Error('先打完眼前这场。');if(state.pendingYearEvent)throw new Error('先把眼前这件事处理好。');
  const s=structuredClone(state),budget=monthlyBudget(s);
  const [yearRoll,nextRng]=randomStep(s.rng);s.rng=nextRng;
  const variable=s.jobId==='freelance'?.7+yearRoll*.6:s.jobId==='business'?.55+yearRoll*.9:1;
  const employment=employmentOf(s);
  const activeMonths=s.jobId?12-employment.closedMonths:0;
  const currentPay=Math.round(budget.salary*activeMonths*variable);
  const table=longTableBudget(state);
  const stallIncome=stallCommitment(state)?STALL_YEARLY_PAY:0;
  const empireIncome=empireDividend(state);
  const workIncome=employment.earned+currentPay;
  const income=workIncome+table.income+stallIncome+empireIncome,rentExpense=budget.rent*12,expense=rentExpense+budget.living*12;
  const payroll=employment.closedMonths>0?{previous:employment.earned,current:currentPay,months:activeMonths}:undefined;
  const plan=householdPlan(s);
  const pressure:Record<string,[number,number]>={tech:[5,5],finance:[3,8],creative:[3,4],service:[6,3],public:[2,2],freelance:[2,3],business:[4,4],trade:[4,5]};
  const commute=s.flags.includes(LONG_COMMUTE);
  if(s.jobId){const [body,mind]=pressure[s.jobId]||[2,2];const late=s.flags.includes(NIGHT_WORK);
    s.stats.health=clamp(s.stats.health-Math.round((body+(late?4:0)+(commute?5:0))*activeMonths/12));
    s.stats.spirit=clamp(s.stats.spirit-Math.round((mind+(late?3:0)+(commute?3:0))*activeMonths/12));}
  if(s.partnerId){const rel=s.relationships[s.partnerId];const keptInTouch=rel.memories.some(m=>m.startsWith(s.age+'岁 · '));if(!keptInTouch){rel.trust=clamp(rel.trust-(plan==='standing'?1:4));rel.commitment=clamp(rel.commitment-(plan==='standing'?1:2));}}
  const repayment=s.flags.includes(LOAN_DUE)?LOAN_INSTALLMENT:0;
  const familyPaid=budget.familyPaid*12;
  s.cash+=income+familyPaid-expense-repayment;s.totalEarned+=income;
  let uncovered=0,friendAdvance=0,care=0;
  if(workIncome>0)s.yearsEmployed++;
  const notices:string[]=[];
  let note=workIncome?`工资到账 ¥${workIncome.toLocaleString()}，固定开支 ¥${expense.toLocaleString()}。`:`这一年没有固定工资，生活开支 ¥${expense.toLocaleString()}。`;
  if(commute&&activeMonths)notices.push('过江那趟赶了一年。你现在站着也能眯一会儿。');
  if(familyPaid)note+=` 家里代付指定账单 ¥${familyPaid.toLocaleString()}。`;
  if(table.income)note+=` 长桌修补台入账 ¥${table.income.toLocaleString()}。`;
  if(stallIncome)note+=` 小吃街晚班入账 ¥${stallIncome.toLocaleString()}。`;
  if(empireIncome)note+=` 名下产业分红 ¥${empireIncome.toLocaleString()}。`;
  if(ownsEmpireClub(s)){
    const activeHeat=s.flags.find(flag=>(HUSTLE_HEAT_FLAGS as readonly string[]).includes(flag));
    if(activeHeat){s.flags=s.flags.filter(flag=>flag!==activeHeat);notices.push('十六铺夜总会替你把街面上的风声压平了一桩。');}
  }
  if(plan==='shared')note+=` 同住的住房费，你这一年出了 ¥${rentExpense.toLocaleString()}。`;
  else if(state.leaseRent!==undefined)note+=` 这份租约全年房租 ¥${rentExpense.toLocaleString()}。`;
  if(repayment){
    s.flags=s.flags.filter(flag=>flag!==LOAN_DUE);
    note+=` 这期助学贷款已扣 ¥${repayment.toLocaleString()}。`;
  }
  if(employment.closedMonths>0)note+=` 旧岗位入账 ¥${employment.earned.toLocaleString()}，当前岗位计 ${activeMonths} 个月。`;
  if(s.cash<0&&s.flags.includes(DAYWORK)){
    uncovered=-s.cash;s.cash=0;s.rescues++;s.housing=0;
    if(s.leaseRent!==undefined)s.flags=closeRentalLease(s.flags);
    delete s.leaseRent;
    if(s.partnerId)s.flags=s.flags.filter(flag=>flag!==householdFlag(s.partnerId!,'shared'));
    s.flags=[...new Set([...s.flags.filter(flag=>flag!==STAFF_BED),DAYWORK_TEMP,'needed_help'])];
    s.stats.spirit=clamp(s.stats.spirit-8);
    s.stats.health=clamp(s.stats.health-5);
    notices.push(`基本开销按年算还差 ¥${uncovered.toLocaleString()}。原来的住处没续上，换成临时落脚，手上剩 ¥0。`);
  }else if(s.cash<0){const shortage=-s.cash;s.cash=6000;friendAdvance=shortage+s.cash;s.rescues++;s.stats.spirit=clamp(s.stats.spirit-8);s.housing=0;
    if(s.leaseRent!==undefined)s.flags=closeRentalLease(s.flags);
    delete s.leaseRent;
    if(s.partnerId)s.flags=s.flags.filter(flag=>flag!==householdFlag(s.partnerId!,'shared'));
    s.flags=[...new Set([...s.flags.filter(flag=>flag!==FAMILY_HOME&&flag!==FAMILY_PAY),'needed_help'])];notices.push(`周转差了 ¥${shortage.toLocaleString()}。朋友帮你垫了一笔，你搬回合租房，手上留下 ¥6,000。`);s.journal.push({age:s.age,title:'先把这关过了',text:'朋友帮忙垫了周转钱，你搬回合租房。收好行李，先把明天的面试地址存下来。',tag:'重整'});}
  s.stats.health=clamp(s.stats.health-(s.age>40?3:1)-(table.income?2:0)-(stallIncome?2:0));s.stats.spirit=clamp(s.stats.spirit-2+table.spirit);
  const recovered=s.stats.health<15;
  if(recovered){
    care=Math.min(s.cash,3000);
    s.stats.health=35;s.stats.spirit=clamp(s.stats.spirit+5);s.cash-=care;
    notices.push(care?`这年身体撑不住，花了 ¥${care.toLocaleString()} 调养。`:'这年身体撑不住，先歇了一阵。');
  }
  const notice=notices.join(' ');
  if(notice)note+=' '+notice;
  const receipt: YearReceipt = {
    before:state.cash, after:s.cash, workIncome, tableIncome:table.income, stallIncome, ...(empireIncome?{empireIncome}:{}),
    rent:rentExpense, living:expense-rentExpense, familyPaid, repayment, uncovered, friendAdvance, care,
    body:s.stats.health-state.stats.health, spirit:s.stats.spirit-state.stats.spirit,
    payroll, rentKind:plan==='shared'?'shared':state.leaseRent!==undefined?'lease':'plain', notice,
    moment:receiptMoment({uncovered,friendAdvance,familyPaid,after:s.cash,before:state.cash},recovered,
      activeMonths>0&&(commute||state.flags.includes(NIGHT_WORK)),livesInPenthouse(s)||ownsEmpirePenthouse(s)),
  };
  s.journal.push({age:s.age,title:`${s.age}岁年度账本`,text:note,tag:'账本',receipt});
  if(s.employment)s.employment={...employment,closedMonths:0,earned:0};
  s.age++;s.actions=3;s.ended=s.age>=60;s.pendingYearEvent=!s.ended;
  return {state:s,income,familyPaid,uncovered,tableIncome:table.income,stallIncome,expense,rentExpense:state.leaseRent!==undefined||plan==='shared'?rentExpense:undefined,sharedHousing:plan==='shared',note,notice,payroll,repayment,receipt};
}
export function advanceToStory(state: GameState) {
  let result=nextYear(state);
  while(!result.state.ended&&!episodeOffer(result.state)&&!authoredYear(result.state)&&!storyShowdownOffer(result.state)&&
    !(result.state.calendar&&cityYearNote(calendarYear(result.state)))){
    result=nextYear({...result.state,pendingYearEvent:false});
  }
  return result;
}
export function relationshipLabel(s:GameState,id:string){
  const relation=s.relationships[id];
  if(CAST.some(person=>person.id===id&&person.role==='family'))return '家人';
  if(!relation?.met)return '未遇见';
  if(s.partnerId===id)return relation.trust>75?'彼此笃定':'正在一起';
  if(relation.trust>=70&&relation.attraction>=50)return '心照不宣';
  if(relation.trust>=45)return '熟悉的人';
  return relation.memories.some(memory=>Number.parseInt(memory,10)<s.age)?'打过交道':'刚认识';
}
export function commitRelationship(s:GameState,id:string):GameState {const rel=s.relationships[id];if(!rel?.met||rel.trust<55||rel.attraction<45)throw new Error('再多了解彼此一点，现在还没到这一步。');let next=structuredClone(s);next.partnerId=id;next.relationships[id].commitment=clamp(rel.commitment+25);next.flags=[...new Set([...(s.partnerId===id?next.flags:clearHousehold(next.flags)),'committed'])];next.journal.push({age:s.age,title:`和${CAST.find(c=>c.id===id)?.name}一起`,text:'你们吃完饭，顺路一起去买了牙刷。回去的路上，谁也没再说客气话。',tag:'关系'});return next;}
export function ending(s:GameState){
  const netWorth=s.cash+marketValue(s)+empireAssetValue(s);
  const bizCount=ownedBusinesses(s).length;
  const rel=s.partnerId?s.relationships[s.partnerId]:null;
  const candidates=[
    {id:'kingpin',goal:'wealth',title:'浦江两岸话事人',text:'从拎只旧皮箱出站，到外滩包厢、张江机房与陆家嘴席位尽数挂在你名下。黄浦江的汽笛还是老腔调，只是如今船过十六铺，岸上亮灯的招牌有一半姓你的姓。',ok:netWorth>=10000000&&bizCount>=3},
    {id:'million',goal:'wealth',title:'黄浦江边钞能力',text:'六十岁生日查了眼资产净值，随手退掉最后几个应酬群。午饭加点一只六月黄大闸蟹，再不用看任何人的脸色批条子。',ok:netWorth>=2000000},
    {id:'comfortable',goal:'wealth',title:'兜里有底不慌张',text:'存折数字扎实，水电账单随手清。老同学还在酒桌上吹百亿风口，你已经在看明早吴淞口几点退潮。',ok:netWorth>=400000},
    {id:'love',goal:'love',title:'梅雨天总有人撑伞',text:'黄梅天骤雨砸下来，手机震了一下问你在哪个出口。迈出地铁站台，那把熟悉的大黑伞稳稳候在风口。',ok:!!rel&&rel.trust>=75&&rel.commitment>=40},
    {id:'companions',goal:'love',title:'菜篮子撞了同款',text:'你拎着一把矮脚青菜上楼，迎面撞见对方也拎着一袋。俩人对着满桌绿叶菜笑弯了腰，今夜爽性下面条吃。',ok:!!rel&&rel.trust>=45},
    {id:'master',goal:'craft',title:'行里压舱老法师',text:'后辈恭恭敬敬拉你进顾问群喊老师，老搭档没讲虚礼，甩来一张图纸直接问：这硬骨头还啃得动伐？',ok:s.stats.skill>=90&&s.yearsEmployed>=15},
    {id:'maker',goal:'craft',title:'手艺长在骨头里',text:'街角那块老招牌还是你早年亲手定的稿。店主远远瞧见你晃过来，熟门熟路端出泡好的明前龙井。',ok:s.stats.skill>=65},
    {id:'free',goal:'free',title:'今朝日程全留白',text:'睡到九点半自然醒，手机干干净净没半条夺命催办。拎起保温杯晃出门，兴起坐了两块钱过江轮渡。',ok:s.stats.spirit>=75&&s.stats.health>=55},
    {id:'reset',goal:'free',title:'跌过跟头照开张',text:'早年退租没带走的那盆绿萝，老友替你养得爬满了窗台。今朝端回新书桌，正好迎着南窗日头。',ok:s.flags.includes('needed_help')&&s.stats.spirit>=50},
    {id:'community',goal:'community',title:'十里街坊有牌面',text:'下楼打瓶酱油硬是晃了四十分钟——前弄堂塞你两只刚出锅的生煎，后弄堂拉你掌眼挑新手机。',ok:s.stats.network>=85},
    {id:'friends',goal:'community',title:'老馆子永远留着座',text:'群里只蹦出三个字：老地方。推门进去，靠窗那把椅子空着，烫好的黄酒和碗筷早替你摆齐了。',ok:s.stats.network>=60},
    {id:'comeback',goal:'any',title:'硬是在上海滩扎下了根',text:'断过房租，也砸过饭碗。如今翻出十八岁出站那张旧照，你指着那只破皮箱先乐出了声。',ok:s.rescues>=3},
    {id:'ordinary',goal:'any',title:'浦江两岸四十二载',text:'刚来那年换乘总迷路，如今闭着眼都摸得准哪扇门离扶梯最近。今朝不赶钟点，你偏挑梧桐树影最密的那条远路慢慢走。',ok:true},
  ];
  const result=candidates.find(e=>e.ok&&e.goal===s.goal)||candidates.find(e=>e.ok)||candidates[candidates.length-1];
  return {...result,...campaignEpilogue(s),...pujiangEpilogue(s)};
}
export function mergeEffect(a:Effect,b:Effect):Effect{return {...a,...b};}
export function publicOriginNames(s:GameState){return s.origins.map(id=>allOrigins().find(c=>c.id===id)?.name||'未知');}
export const SAVE_KEY='modu-life-v1';
export function validateSave(value:unknown):GameState {
  if(!value||typeof value!=='object')throw new Error('这不是有效的人生档案。');const s={...value} as GameState;
  const finite=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  if(s.version!==1||typeof s.seed!=='string'||s.seed.length>32||typeof s.name!=='string'||s.name.length>12||!finite(s.age,18,60)||!Number.isInteger(s.age)||!finite(s.actions,0,3)||!Number.isInteger(s.actions)||!finite(s.cash,0,1e12)||!finite(s.rng,0,4294967295)||!GOALS.some(g=>g.id===s.goal)||!['bund','anfu','people','lujiazui','zhangjiang','xinzhuang'].includes(s.district)||typeof s.ended!=='boolean'||typeof s.pendingYearEvent!=='boolean')throw new Error('档案格式或数值不完整。');
  if(!s.stats||Object.keys(STAT_NAMES).some(k=>!finite(s.stats[k as StatKey],0,100)))throw new Error('人物状态不完整。');
  if(s.cityDraws!==undefined&&(!Number.isInteger(s.cityDraws)||!finite(s.cityDraws,0,cityTicketAllowance(s.age))))throw new Error('抽卡记录无效。');
  if(!finite(s.jobRank,0,3)||!finite(s.housing,0,3)||!Number.isInteger(s.housing)||!finite(s.totalEarned,0,1e12)||!finite(s.yearsEmployed,0,42)||!finite(s.rescues,0,1000))throw new Error('年度资料不完整。');
  if(s.leaseRent!==undefined&&(s.housing!==1||!Number.isInteger(s.leaseRent)||!finite(s.leaseRent,2000,6000)))throw new Error('租约里的房租不对。');
  if(s.jobId!==null&&!CAREERS.some(c=>c.id===s.jobId))throw new Error('职业资料不匹配。');
  const work=s.employment;
  if(work!==undefined&&(!work||!Number.isInteger(work.sinceAge)||!finite(work.sinceAge,18,s.age)||!Number.isInteger(work.reviews)||!finite(work.reviews,0,42)||(work.reviewedAt!==undefined&&(!Number.isInteger(work.reviewedAt)||!finite(work.reviewedAt,work.sinceAge,s.age)))||!finite(work.rate,.5,Math.max(MAX_PAY_RATE,HEIR_PAY_RATE))||!Number.isInteger(work.closedMonths)||!finite(work.closedMonths,0,12)||!Number.isInteger(work.earned)||!finite(work.earned,0,1e7)))throw new Error('工作记录不完整。');
  for(const k of ['origins','flags','seenEvents'] as const)if(!Array.isArray(s[k])||s[k].length>1500||s[k].some(x=>typeof x!=='string'||x.length>120))throw new Error('档案记录无效。');
  if(s.origins.length!==5||!validLifeStartHand(s.origins)||s.origins.some(id=>!allOrigins().some(c=>c.id===id)))throw new Error('开局卡片不存在。');
  if(!Array.isArray(s.journal)||s.journal.length>1000||s.journal.some(j=>!j||!finite(j.age,18,60)||typeof j.title!=='string'||j.title.length>200||typeof j.text!=='string'||j.text.length>5000||typeof j.tag!=='string'||j.tag.length>80||(j.receipt!==undefined&&(j.tag!=='账本'||!validYearReceipt(j.receipt)))))throw new Error('人生记录损坏。');
  if(!s.relationships||typeof s.relationships!=='object')throw new Error('关系记录不完整。');
  // Only the three newly introduced people get defaults; missing legacy contacts still fail validation.
  s.relationships=structuredClone(s.relationships);
  for(const id of PUJIANG_CONTACTS)if(!Object.hasOwn(s.relationships,id))s.relationships[id]={attraction:10,trust:15,commitment:0,met:false,memories:[]};
  for(const npc of CAST){const r=s.relationships[npc.id];if(!r||!finite(r.attraction,0,100)||!finite(r.trust,0,100)||!finite(r.commitment,0,100)||typeof r.met!=='boolean'||!Array.isArray(r.memories)||r.memories.length>20||r.memories.some(x=>typeof x!=='string'||x.length>300))throw new Error('关系记录损坏。');}
  if(s.partnerId!==null&&!CAST.some(c=>c.id===s.partnerId&&c.role==='romance'))throw new Error('关系对象不存在。');
  if(s.ended!==(s.age>=60))throw new Error('年龄与人生状态不匹配。');
  const appearance=Object.prototype.hasOwnProperty.call(s,'appearance')?validateAppearance(s.appearance):{...DEFAULT_APPEARANCE};
  const state={...structuredClone(s),appearance};
  if(state.calendar!==undefined&&state.calendar!==SHANGHAI_START)throw new Error('开局年份读不出来。');
  if(state.market!==undefined)state.market=validateMarket(state.market,calendarYear(state));
  if (state.showdown!==undefined) {
    const showdown=validateShowdown(state.showdown);
    if (state.ended||showdown.route!==storyRoute(state)||showdown.age!==state.age||showdown.moves.length>=3||
        state.seenEvents.includes(storyShowdownId(showdown))) throw new Error('任务和存档进度对不上。');
    state.showdown=showdown;
  }
  validatePujiang(state);
  for(const person of CAST)if(person.role==='family')state.relationships[person.id].met=true;
  return state;
}
export function readAutoSave():GameState|null {try{const raw=localStorage.getItem(SAVE_KEY);return raw?validateSave(JSON.parse(raw)):null;}catch{return null;}}
export function writeAutoSave(s:GameState):boolean {try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
