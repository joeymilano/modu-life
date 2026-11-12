import { HEIR_CAPITAL_TIER } from './heirCapital';
import { OPENING_ALLIES, OPENING_DRAMA, OPENING_PROOF, withOpeningRecord } from './openingStakes';
import type { EventChoice, GameState, LifeEvent } from './types';

export const HEIR_WEST_BUND = 'heir-west-bund';
const MALL = 'heir-shopping';
const CARS = 'heir-showroom';
const PARTY = 'heir-opening-night';
const VENUE = 'heir-west-bund-venue';
const FIRST_NIGHT_AS_OWNER = 'heir-west-bund-owner';

export const HEIR_SHOTS = ['shopping','garage','club','family','boardroom','relocation','midlife','penthouse','yacht'] as const;
export const heirStoryPhoto = (shot: (typeof HEIR_SHOTS)[number]) => '/art/heir-story/' + shot + '.webp';
const yuan = (value: number) => '¥' + value.toLocaleString('zh-CN');

export const HEIR_CATALOG = {
 lv: { name: 'LV 旅行袋', price: 32_000, place: '恒隆广场 · Louis Vuitton', image: heirStoryPhoto('shopping') },
 hermes: { name: '爱马仕 Kelly', price: 188_000, place: '恒隆广场 · Hermès', image: heirStoryPhoto('shopping') },
 cullinan: { name: '劳斯莱斯库里南', price: 8_800_000, place: '徐汇滨江 · 劳斯莱斯', image: heirStoryPhoto('garage') },
 revuelto: { name: '兰博基尼 Revuelto', price: 6_880_000, place: '徐汇滨江 · 兰博基尼', image: heirStoryPhoto('garage') },
 penthouse: { name: '陆家嘴江景顶层', price: 32_800_000, place: '陆家嘴 · 滨江', image: heirStoryPhoto('penthouse') },
 lounge: { name: '西岸会客厅', price: 9_800_000, place: '徐汇滨江', image: heirStoryPhoto('club') },
};
type AssetId = keyof typeof HEIR_CATALOG;
const assetFlag = (id: AssetId) => 'heir-owned-' + id;
export const ownsHeirAsset = (state: GameState, id: AssetId) => state.flags.includes(assetFlag(id));
const hosted = (state: GameState) => state.seenEvents.includes(PARTY);
export const hasHeirStory = (state: GameState) => state.origins.includes('born-heir') && state.flags.includes(HEIR_CAPITAL_TIER);
const shopId = (id: string, state: GameState, first: AssetId, second: AssetId, revisit: boolean) =>
 revisit ? `${id}-return-${state.age}-${Number(ownsHeirAsset(state,first))+Number(ownsHeirAsset(state,second))}` : id;

export function heirAssets(state: GameState) {
 return (Object.keys(HEIR_CATALOG) as AssetId[]).filter(id => ownsHeirAsset(state,id)).map(id => ({ id, ...HEIR_CATALOG[id] }));
}

export function buyHeirAssets(ids: AssetId[], label: string, reply: string): EventChoice {
 const price = ids.reduce((total,id) => total + HEIR_CATALOG[id].price, 0);
 return { id: ids.join('-'), label, hint: yuan(price) + ' · 个人账户', reply, effect: {cash:-price,setFlags:ids.map(assetFlag)} };
}

function mall(state: GameState, revisit: boolean): LifeEvent {
 const choices = [
  !ownsHeirAsset(state,'lv') && buyHeirAssets(['lv'],'拿下 LV 旅行袋','店员把 LV 装进防尘袋。你把新包拎上车，那张写错名字的请帖就留在柜台上。'),
  !ownsHeirAsset(state,'hermes') && buyHeirAssets(['hermes'],'拿下爱马仕 Kelly','老妈把那只焦糖色的 Kelly 往你面前一推。你刷自己的卡，她拿走小票，说回头给表哥看抬头。'),
  !ownsHeirAsset(state,'lv') && !ownsHeirAsset(state,'hermes') && buyHeirAssets(['lv','hermes'],'两个都要','两家店的纸袋并排放进后备厢。老妈看你把自己的名字签在两张单上，这才把西岸的门卡给你。'),
 ].filter((choice): choice is EventChoice => Boolean(choice));
 return {
  id:shopId(MALL,state,'lv','hermes',revisit), category:'explore', location:'恒隆广场', speakerId:'mother', tag:'西岸开场',
  ...(!revisit&&{objective:'带走酒会的签约原件'}),
  title: revisit ? '柜上还有货' : '请帖拿来，包也留下', illustration:heirStoryPhoto('shopping'),
  text: revisit ? '店里给你发了张柜台照片。上回没带走的那只还在。'
   : '老妈在恒隆等你。LV 的旅行袋和爱马仕的 Kelly 都摆在柜上。她从包里抽出一张请帖。周骁把今晚的主人印成了自己。她问你，原件要不要留着？',
  choices:[...choices,{id:'pass',label:revisit?'今天先不买':'拿请帖，包先留店里',reply:revisit?'店员把包收回柜里。':'你把原件折进外套。老妈发来西岸展厅的位置。',effect:{}}],
 };
}

function showroom(state: GameState, revisit: boolean): LifeEvent {
 const choices = [
  !ownsHeirAsset(state,'cullinan') && buyHeirAssets(['cullinan'],'刷卡提库里南','司机接过备用钥匙，你自己坐进驾驶座。屏幕亮起来，今晚的目的地已经存好了。'),
  !ownsHeirAsset(state,'revuelto') && buyHeirAssets(['revuelto'],'刷卡提 Revuelto','橙色车门扬起来。你把请帖扔到副驾，销售弯下腰问你，出门往滨江还是往内环？'),
  !ownsHeirAsset(state,'cullinan') && !ownsHeirAsset(state,'revuelto') && buyHeirAssets(['cullinan','revuelto'],'两辆都提','你把兰博基尼的钥匙留下，把库里南的钥匙交给司机。让两辆车一起到。'),
 ].filter((choice): choice is EventChoice => Boolean(choice));
 return {
  id:shopId(CARS,state,'cullinan','revuelto',revisit), category:'explore', location:'徐汇滨江', tag:'西岸开场',
  ...(!revisit&&{objective:'挑好车，从会客厅正门入场'}),
  title:revisit?'钥匙还在':'两把车钥匙', illustration:heirStoryPhoto('garage'),
  text:revisit?'销售把你上回试过的车挪到了玻璃门口。':'西岸两家展厅都给你留了现车。黑色库里南，橙色 Revuelto。周骁刚发了一条语音，说门口只留给自己人。你让门童在车位上写哪个名字？',
  choices:[...choices,{id:'pass',label:revisit?'改天再提':'先坐家里的车赴宴',reply:revisit?'你把钥匙放回托盘。':'你把请帖递给司机，让他走正门。',effect:{}}],
 };
}

function openingNight(state: GameState): LifeEvent {
 const rolls = ownsHeirAsset(state,'cullinan'), lambo = ownsHeirAsset(state,'revuelto');
 const bag = ownsHeirAsset(state,'hermes') ? 'Kelly' : ownsHeirAsset(state,'lv') ? 'LV 旅行袋' : '';
 const arrival = lambo && rolls ? '两辆新车先后停在正门。' : lambo ? 'Revuelto 的橙色车门一抬，门口的人都回了头。'
  : rolls ? '库里南停在红毯前，经理亲自替你开的门。' : '家里的车停在正门。迎宾翻了两遍名单，周骁就在玻璃门后。';
 const choices: EventChoice[] = [
  {id:'take-seat',label:'换座牌，我亲自开场',hint:'拿回主位 · 解锁会客厅',reply:'经理当着全桌的面撤走周骁的座牌。你把酒杯抬起来。「今天我请。周骁坐我旁边，等下有事问他。」',effect:{face:16,network:9,setFlags:['heir-hosted-direct']}},
  {id:'new-table',label:'把位子留给帮你拿原件的人',hint:'另开一桌 · 解锁会客厅',reply:'你在临江那张桌子坐下，给把原件送来的经理留了把椅子。周骁还在台上敬酒，刚敬的那几位已经端着杯子过来了。',effect:{network:15,spirit:6,setFlags:['heir-hosted-new-table']}},
  {id:'pass-mic',label:'让他说完，最后把原件投上屏',hint:'公开签约原件 · 解锁会客厅',reply:'周骁刚说完「我来签」，大屏就切到了预订原件。你的签名亮在他身后。他把话筒递过来，问能不能先下台。',effect:{face:12,skill:6}},
 ];
 return {
  id:PARTY, category:'social', location:'西岸会客厅', tag:'西岸开场', title:'今晚谁做东',objective:'当着宾客拿回主办权',illustration:heirStoryPhoto('club'),
  text:arrival + (bag ? '你从'+bag+'里拿出原件。' : '你从外套里拿出原件。')
   + '周骁已经端着杯子在谢来宾。经理把签约原件和新座牌一起送到你手上，问主位怎么写。',
  choices:state.flags.includes(OPENING_DRAMA)?choices.map(choice=>({
   ...choice,effect:withOpeningRecord(choice.effect,choice.id==='new-table'?OPENING_ALLIES:OPENING_PROOF),
  })):choices,
 };
}

function venue(): LifeEvent {
 return {
  id:VENUE, category:'business', location:'徐汇滨江', tag:'西岸开场', title:'临江这一层，给不给你留', illustration:heirStoryPhoto('club'),
  text:'那晚的经理把西岸会客厅的转让书拿来了。九百八十万，含楼下两席车位和会客厅的长期经营权。周骁也问过价格，经理把第一份合同给了你。',
  choices:[
   buyHeirAssets(['lounge'],'签了，把门卡给我','到账铃声一响，经理把门卡翻了面。印的是你的名字。楼下的车位已经空出来了，今晚想叫谁来你定。'),
   {id:'walk',label:'不接转让，今晚只订一桌',reply:'经理把合同收了起来。最靠江的桌子照样给你留着。',effect:{}},
  ],
 };
}

function firstNightAsOwner(state: GameState): LifeEvent {
 const arrival = ownsHeirAsset(state,'revuelto') ? '橙色 Revuelto 停在门外。'
  : ownsHeirAsset(state,'cullinan') ? '库里南停在门外。' : '门童在台阶下替你拉开车门。';
 return {
  id:FIRST_NIGHT_AS_OWNER,category:'social',location:'西岸会客厅',tag:'西岸开场',title:'今晚关门，只请自己人',
  illustration:heirStoryPhoto('club'),text:arrival+'周骁把当年错印的座牌带了回来，翻过来写了自己的号码。他说有个项目想在这儿见人。经理只问你一句，今晚的灯给谁开？',
  choices:[
   {id:'family',label:'叫爸妈来，今晚不谈合同',reply:'老妈先看了一眼门牌，再看桌上那盘她爱吃的糖醋小排。老爸把周骁送来的座牌翻了过去。「这桌我就吃饭。」',effect:{spirit:12,network:6}},
   {id:'open-door',label:'给周骁一桌，让他自己把项目讲完',reply:'周骁走到门口又回头，说这次请帖他自己印，名字会写对。你让经理把最靠江那桌留给他。',effect:{network:16,face:6}},
   {id:'late-night',label:'都不约，今晚这层只留给我',reply:'经理把外面的灯关了。你拿着车钥匙走到窗边。整排空桌后面，江上有一艘船慢慢过去。',effect:{spirit:16,face:4}},
  ],
 };
}

export function westBundSecondYear(state: GameState): LifeEvent {
 const tookSeat = state.flags.includes('heir-hosted-direct');
 const newTable = state.flags.includes('heir-hosted-new-table');
 const text = !hosted(state)
  ? '西岸的请帖还在老妈手里。周骁又发来一张改过的名单。她问你，什么时候有空来拿原件？'
  : tookSeat ? '那晚主位换了名字。周骁刚撤回一条群消息，经理的电话就进来了。西岸那层会客厅要转让。'
  : newTable ? '上回临江那一桌，有人还在问下回什么时候。经理把报价发给你，整层会客厅现在可以谈。'
  : '大屏那段被拍进了家族群。周骁退群前只发了一句「西岸那地方有什么好」。经理问你，要不要来看看转让书？';
 return {
  id:'heir-west-bund-second',category:'year',location:'徐汇滨江',tag:'西岸开场',
  title:hosted(state)?'西岸那层要转让':'请帖还在等你',illustration:heirStoryPhoto('club'),text,
  choices:[
   {id:'call',label:hosted(state)?'告诉经理，合同留给我':'回老妈，我亲自去拿',reply:hosted(state)?'经理回了一个地址。「你方便就过来。我给你留了车位。」':'老妈把恒隆柜台的位置发来。「到了给我电话。」',effect:{face:4}},
   {id:'wait',label:hosted(state)?'先去看看场地':'晚点再回周骁',reply:hosted(state)?'你在滨江多绕了一段，从外面看，灯还亮着。':'你把他刚发的名单存了下来。老妈的对话框还在顶上。',effect:{spirit:4}},
  ],
 };
}

export function heirStoryLead(state: GameState) {
 if (!hasHeirStory(state) || state.pendingYearEvent || state.ended || state.actions <= 0) return;
 if (!state.seenEvents.includes(MALL)) return { message:'去恒隆拿请帖',event:mall(state,false) };
 if (!state.seenEvents.includes(CARS)) return { message:'去西岸挑车',event:showroom(state,false) };
 if (!hosted(state)) return { message:'进会客厅，拿回主位',event:openingNight(state) };
 if (state.age>=19 && !state.seenEvents.includes(VENUE)) return { message:'看看会客厅的转让书',event:venue() };
 if (state.age>=20 && ownsHeirAsset(state,'lounge') && !state.seenEvents.includes(FIRST_NIGHT_AS_OWNER)) {
  return { message:'开自己的第一场',event:firstNightAsOwner(state) };
 }
}

export function heirShopVisits(state: GameState) {
 if (!hasHeirStory(state) || !hosted(state) || state.pendingYearEvent || state.ended || state.actions<=0) return [];
 const visits: LifeEvent[] = [];
 if (!ownsHeirAsset(state,'lv') || !ownsHeirAsset(state,'hermes')) visits.push(mall(state,true));
 if (!ownsHeirAsset(state,'cullinan') || !ownsHeirAsset(state,'revuelto')) visits.push(showroom(state,true));
 return visits.filter(visit=>!state.seenEvents.includes(visit.id));
}

export function replayHeirVisit(state: GameState, id: string) {
 const lead = heirStoryLead(state)?.event;
 return lead?.id === id ? lead : heirShopVisits(state).find(visit=>visit.id===id);
}
