import { BUND_1992, calendarYear } from './calendar';
import { openingPhoto, streetPhoto } from './art';
import type { CampaignMove, CampaignRoute } from './campaignScript';
import { heirStoryPhoto, ownsHeirAsset } from './heirStory';
import { OPENING_ALLIES, OPENING_PROOF, dramaPhoto } from './openingStakes';
import { SHOWDOWN_AGES, SHOWDOWN_CAST, createShowdown, showdownView } from './showdowns';
import type { Showdown, ShowdownAge, Verdict } from './showdowns';
import { systemPhoto } from './systemStory';
import type { DistrictId, Effect, GameState, LifeEvent } from './types';

export function storyRoute(state: GameState): CampaignRoute {
 if (state.origins.includes('born-heir')) return 'heir';
 if (state.origins.includes('born-daywork')) return 'worker';
 if (state.origins.includes('born-system')) return 'system';
 return 'arrival';
}

const legacyOpening = {arrival:'first-night-stage', worker:'life-start-daywork-showdown', heir:'heir-opening-night', system:'system-third'};
const district: Record<CampaignRoute,DistrictId> = {arrival:'bund', worker:'xinzhuang', heir:'bund', system:'lujiazui'};
const photo = {
 arrival:(age:ShowdownAge)=>age===18?dramaPhoto('stage'):streetPhoto(age===38?'ferry':'bund'),
 worker:(age:ShowdownAge)=>age===18?dramaPhoto('shift'):openingPhoto('daywork-pay'),
 heir:()=>heirStoryPhoto('club'),
 system:()=>systemPhoto('roof'),
};
const opensAfter = {
 arrival:['first-night-keys','first-night-till','first-night-box'],
 worker:['life-start-daywork-first'],
 heir:['heir-showroom'],
 system:['system-second'],
};
const ninetiesPhoto:Record<CampaignRoute,string> = {
 arrival:'/art/era/stage-1992.webp',worker:'/art/era/shift-1992.webp',
 heir:'/art/era/jinjiang-1992.webp',system:'/art/era/terminal-1992.webp',
};
const rivalId = {arrival:'fei', worker:undefined, heir:undefined, system:undefined};
const allyId = {arrival:'mao', worker:'wu', heir:'mother', system:undefined};
export const legacyShowdownEvent = (route:CampaignRoute,age:ShowdownAge) =>
 age===18?legacyOpening[route]:age===38?'campaign-pressure-'+route+'-38':'campaign-'+route+'-'+age;
export const storyShowdownId = ({route,age}:Showdown) => 'showdown-'+route+'-'+age;
const storyFlag = (route:CampaignRoute,age:ShowdownAge,value:string) => 'showdown-'+route+'-'+age+'-'+value;

export function storyVerdict(state: GameState, route: CampaignRoute, age: ShowdownAge) {
 return (['win','partial','loss'] as const).find(result=>state.flags.includes(storyFlag(route,age,result)));
}

export function storyShowdownOffer(state: GameState, forceOpening = false) {
 const route = storyRoute(state), age = state.age as ShowdownAge;
 if (state.ended||!SHOWDOWN_AGES.includes(age)) return;
 const reserveAge = age===38?23:age===57?38:18;
 const showdown = createShowdown(route,age,
  (age!==18&&route==='heir'&&ownsHeirAsset(state,'lounge')) ||
  (age!==18&&state.flags.includes(storyFlag(route,reserveAge,'backup'))) ||
  (age!==18&&state.flags.includes(storyFlag(route,reserveAge,'deal'))),undefined,calendarYear(state)<2000);
 if (state.seenEvents.includes(storyShowdownId(showdown)) || state.seenEvents.includes(legacyShowdownEvent(route,age))) return;
 if (age===18 && (state.pendingYearEvent||!forceOpening&&state.actions>0&&!opensAfter[route].some(id=>state.seenEvents.includes(id)))) return;
 return showdown;
}

const outcomes: Record<CampaignRoute,Record<Verdict,Effect>> = {
 arrival:{win:{cash:600,face:8,network:8},partial:{cash:240,network:4},loss:{spirit:-3}},
 worker:{win:{cash:780,face:6,network:8},partial:{cash:260,network:4},loss:{spirit:-3}},
 heir:{win:{face:12,network:10},partial:{face:4,network:4},loss:{face:-4}},
 system:{win:{cash:888000,skill:8},partial:{cash:444000,network:6},loss:{spirit:-3}},
};

export function storyShowdownScene(state: GameState, showdown: Showdown): LifeEvent {
 const {route,age} = showdown;
 const {scene,verdict,ally,reserve} = showdownView(showdown);
 const finish = showdown.moves[2];
 const move: CampaignMove = verdict==='win' ? finish==='expose'?'proof':'people' : verdict==='partial' && finish!=='walk'?'people':'walk';
 const flags = verdict ? [storyFlag(route,age,verdict)] : [];
 if (ally && verdict!=='loss') flags.push(storyFlag(route,age,'ally'));
 if (reserve) flags.push(storyFlag(route,age,'backup'));
 if (age===23||age===57) flags.push(legacyShowdownEvent(route,age)+'-'+move);
 if (age===18 && verdict!=='loss') {
  if (verdict==='win') flags.push(finish==='expose'?OPENING_PROOF:OPENING_ALLIES);
  if (route==='heir') flags.push(finish==='expose'?'heir-hosted-direct':'heir-hosted-new-table');
  if (route==='system') flags.push('system-third-credit',verdict==='win'?'system-kept-control':'system-split-first');
 }
 const summary = verdict ? scene[verdict] : scene.intro;
 const reward = {...outcomes[route][verdict??'loss']};
 if (route==='worker'&&state.flags.includes('daywork-due')&&verdict==='win') {
  reward.removeFlags=['daywork-due','daywork-remainder'];
 }
 if (route==='system'&&age!==18&&reward.cash) reward.cash=Math.round(reward.cash*(1+(age-18)*.035));
 const carry = age===18 ? undefined : storyCarry(state,route,age===23?18:age===38?23:38);
 const arrival = route==='heir'&&age===18
  ? (ownsHeirAsset(state,'revuelto')?'橙色 Revuelto 停在门口。':ownsHeirAsset(state,'cullinan')?'库里南停在红毯前。':ownsHeirAsset(state,'classic')?'车行刚提的 600 SEL 停在饭店门口。':'')+
    (ownsHeirAsset(state,'hermes')?'母亲让你把原件收进 Kelly。':ownsHeirAsset(state,'lv')?'你从 LV 旅行袋抽出请帖。':'')
  : '';
 return {id:storyShowdownId(showdown),category:'social',district:district[route],speakerId:rivalId[route],tag:'主线',
  title:scene.title,text:[carry,arrival,scene.intro].filter(Boolean).join(''),objective:scene.goal,illustration:showdown.nineties?(route==='arrival'&&age!==18?BUND_1992:ninetiesPhoto[route]):photo[route](age),
  choices:finish&&verdict?[{id:finish,label:scene[verdict],reply:summary,effect:{...reward,setFlags:flags}}]:[],
 };
}

export function storySettlement(showdown: Showdown) {
 const {route,age} = showdown;
 const mark = legacyShowdownEvent(route,age);
 return {
  seen: mark,
  ally: allyId[route],
  rival: rivalId[route],
 };
}

const carryLines: Record<CampaignRoute,Record<Verdict,string>> = {
 arrival:{win:'费启还记得上回谁在门口验票。这次他没跟房东说你会来。',partial:'上回退票的事还挂在群里。陆嘉说可以再帮一晚，先把座位排清楚。',loss:'陆嘉一直留着上回的排练地址。费启要的还是那批观众。'},
 worker:{win:'上回跟你走的那车人还在同一个群。赵正这回先去找了调度。',partial:'吴师傅把少结那一联带来了。老孙说，要发车也得先把这笔写清楚。',loss:'吴师傅留着那张没结的复写联。赵正这回让财务直接找他。'},
 heir:{win:'上回跟你换桌的赞助人也到了。周骁这次提前把合同递给了财务。',partial:'沈经理还留着上回的门卡。方岚问，欠团队的尾款这次谁来付？',loss:'上回的赞助还在周骁手上。沈经理把被压住的名单给你留了一份。'},
 system:{win:'周闻留了上次的正确收款名单。顾桥换了一个入口继续找交付人。',partial:'许舟还走你留下的备用入口。上次少结的那一笔仍然挂着。',loss:'顾桥收走了上次的结算。周闻把他签过字的那份存到另一台机子上。'},
};

export function storyCarry(state:GameState,route:CampaignRoute,age:ShowdownAge) {
 const result = storyVerdict(state,route,age);
 if (!result) return;
 const standing = state.flags.includes(storyFlag(route,age,'ally')) ? SHOWDOWN_CAST[route].broker+'也来了。' : '';
 return carryLines[route][result]+standing;
}

const deals: Record<CampaignRoute,readonly [string,string,number]> = {
 arrival:['把欠的场次和票补上，跟陆嘉签下备用场','陆嘉把下次的节目和地址一起发进群。',600],
 worker:['跟吴师傅核销欠款，留一辆备用短驳','吴师傅把司机和接班人的号码贴在新表背后。',780],
 heir:['结清尾款，跟沈经理签备用包厢','沈经理收好回单，把备用场地的门卡交给你。',80000],
 system:['给交付人补款，和周闻留一条离线入口','周闻写好收款名单。许舟用自己的单子试了一次。',8000],
};
export function storyFollowup(state:GameState,event:LifeEvent) {
 const route = storyRoute(state);
 const age = state.age<=34?23:38;
 const carry = storyCarry(state,route,age);
 if (!carry) return event;
 const flag = storyFlag(route,age,'deal');
 const [label,reply,cost] = deals[route];
 return {...event,text:carry+event.text,choices:state.flags.includes(flag)?event.choices:[
  ...event.choices,{id:'settle-with-cast',label,reply,hint:'¥'+cost.toLocaleString('zh-CN')+' · 下一场可用备用方案',effect:{cash:-cost,network:5,spirit:3,setFlags:[flag]}},
 ]};
}
