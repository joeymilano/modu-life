import { calendarYear } from './calendar';
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
 classic: { name: '奔驰 600 SEL', price: 1_280_000, place: '上海 · 进口车行', image:'/art/era/jinjiang-1992.webp' },
 lv: { name: 'LV 旅行袋', price: 32_000, place: '恒隆广场 · Louis Vuitton', image: heirStoryPhoto('shopping') },
 hermes: { name: '爱马仕 Kelly', price: 188_000, place: '恒隆广场 · Hermès', image: heirStoryPhoto('shopping') },
 cullinan: { name: '劳斯莱斯库里南', price: 8_800_000, place: '徐汇滨江 · 劳斯莱斯', image: heirStoryPhoto('garage') },
 revuelto: { name: '兰博基尼 Revuelto', price: 6_880_000, place: '徐汇滨江 · 兰博基尼', image: heirStoryPhoto('garage') },
 penthouse: { name: '陆家嘴江景顶层', price: 32_800_000, place: '陆家嘴 · 滨江', image: heirStoryPhoto('penthouse') },
 lounge: { name: '西岸会客厅', price: 9_800_000, place: '徐汇滨江', image: heirStoryPhoto('club') },
};
export type AssetId = keyof typeof HEIR_CATALOG;
const opened: Record<AssetId,number> = {classic:1992,lv:2001,hermes:2001,cullinan:2018,revuelto:2023,penthouse:2001,lounge:2010};
export const heirAssetAvailable = (state:GameState,id:AssetId) => calendarYear(state)>=opened[id];
function heirPrice(state:GameState,id:AssetId) {
 const base=HEIR_CATALOG[id].price;
 if (!state.calendar) return base;
 const elapsed=Math.max(0,calendarYear(state)-opened[id]);
 const multiplier=id==='penthouse'||id==='lounge'?Math.pow(1.037,elapsed):
  id==='hermes'||id==='lv'?Math.pow(1.023,elapsed):Math.max(.55,1-elapsed*.035);
 return Math.round(base*multiplier/100)*100;
}
const assetFlag = (id: AssetId) => 'heir-owned-' + id;
export const ownsHeirAsset = (state: GameState, id: AssetId) => state.flags.includes(assetFlag(id));
const hosted = (state: GameState) => state.seenEvents.includes(PARTY)||state.seenEvents.includes('pj-heir-18');
export const hasHeirStory = (state: GameState) => state.origins.includes('born-heir') && state.flags.includes(HEIR_CAPITAL_TIER);
const shopId = (id: string, state: GameState, first: AssetId, second: AssetId, revisit: boolean) =>
 revisit ? `${id}-return-${state.age}-${Number(ownsHeirAsset(state,first))+Number(ownsHeirAsset(state,second))}` : id;

export function heirAssets(state: GameState) {
 return (Object.keys(HEIR_CATALOG) as AssetId[]).filter(id => ownsHeirAsset(state,id)).map(id => ({ id, ...HEIR_CATALOG[id],price:heirPrice(state,id) }));
}

export function buyHeirAssets(state:GameState,ids: AssetId[], label: string, reply: string): EventChoice {
 const price = ids.reduce((total,id) => total + heirPrice(state,id), 0);
 return { id: ids.join('-'), label, hint: yuan(price) + ' · 个人账户', reply, effect: {cash:-price,setFlags:ids.map(assetFlag)} };
}

function mall(state: GameState, revisit: boolean): LifeEvent {
 if(!heirAssetAvailable(state,'lv'))return {
  id:MALL,title:'锦江饭店那张请帖',text:'母亲订了靠窗的位子，把两张请帖并排摊开：一张印你的名字，一张被周骁改成了他自己。「他连你的位子都敢印。」会客厅留存的签约原件还在她包里。',
  category:'explore',location:'锦江饭店',speakerId:'mother',tag:'家宴',illustration:'/art/era/jinjiang-1992.webp',
  choices:[
   {id:'original',label:'把原件收好，去看看今晚的车',reply:'母亲把请帖和订金联叠好塞进你内袋。「让司机从正门进。今晚，谁也别想让你走侧门。」',effect:{skill:4}},
   {id:'call',label:'先让母亲给经理打个电话',reply:'她当着你的面拨给经理：「原件你也见过。今晚谁坐主位，你自己心里有数。」',effect:{network:4}},
  ],
 };
 const choices = [
  !ownsHeirAsset(state,'lv') && buyHeirAssets(state,['lv'],'拿下 LV 旅行袋','店员刚把你往一楼特卖引，POS 机一响，她弯腰的弧度立刻变了。你拎起 LV，那张写错名字的请帖留在柜台上——让周骁自己来拿。'),
  !ownsHeirAsset(state,'hermes') && buyHeirAssets(state,['hermes'],'拿下爱马仕 Kelly','老妈把焦糖色的 Kelly 往你面前一推：「刷你自己的卡，让他看看抬头是谁。」小票打印的十几秒，店员一句话都不敢接。'),
  !ownsHeirAsset(state,'lv') && !ownsHeirAsset(state,'hermes') && buyHeirAssets(state,['lv','hermes'],'两只都要，今天包场','店长亲自把两只包并排装好，刚才劝你去一楼的那个店员站去了角落。老妈看你把名字签在两张单上，这才把西岸的门卡拍进你手心。'),
 ].filter((choice): choice is EventChoice => Boolean(choice));
 return {
  id:shopId(MALL,state,'lv','hermes',revisit), category:'explore', location:'恒隆广场', speakerId:'mother', tag:'西岸开场',
  ...(!revisit&&{objective:'带走酒会的签约原件'}),
  title: revisit ? '店员换了一副面孔' : '店员说，一楼有特卖', illustration:heirStoryPhoto('shopping'),
  text: revisit ? '还是那个柜台。这次店员隔着玻璃朝你鞠躬，问你要不要看上次那只——她记得清清楚楚。'
   : '店员拦在柜台前，上下打量你：「先生，一楼有奥莱特卖，这边要预约。」周骁一早就来过电话——「等会有个自称少爷的穷鬼，别拿好货出来。」老妈从贵宾室出来，把两只包往柜上一放：「叫你们店长来。我儿子今天买的不是包，是你们的眼力。」签约原件在她包里。周骁把今晚的主人印成了自己。',
  choices:[...choices,{id:'pass',label:revisit?'今天先不买':'拿上原件就走，包回头再买',reply:revisit?'店员把包收回柜里，一直送到电梯口。':'你把原件折进外套内袋。包可以不买，这个局必须进。老妈发来西岸展厅的位置。',effect:{}}],
 };
}

function showroom(state: GameState, revisit: boolean): LifeEvent {
 if(!heirAssetAvailable(state,'cullinan'))return {
  id:CARS,title:'周骁订走的那辆 600 SEL',text:'车行老板把灰色绒布掀开，手却在钥匙上停住了：「令表哥下午来订过，放话这车谁也不能动。」他看看你，又看看绒布，一咬牙把钥匙推了过来。',
  category:'explore',location:'上海 · 进口车行',tag:'家宴',illustration:'/art/era/jinjiang-1992.webp',
  choices:[
   ...(!ownsHeirAsset(state,'classic')?[buyHeirAssets(state,['classic'],'开走这辆奔驰','你签下自己的名字，纸拍在桌上。老板把钥匙双手送来。周骁托人来问时，车已经停在饭店正门——他要的那辆，坐着他惹不起的人。')]:[]),
   {id:'pass',label:'坐家里的车去',reply:'司机把请帖立在仪表台上。你说绕过侧门——不，从正门进。今晚不躲任何人。',effect:{}},
  ],
 };
 const choices = [
  !ownsHeirAsset(state,'cullinan') && buyHeirAssets(state,['cullinan'],'刷卡提库里南','销售经理接了个电话，脸色变了三变，对你弯下腰：「误会，都是误会。」你自己坐进驾驶座，屏幕亮起来，今晚的目的地已经存好。'),
  heirAssetAvailable(state,'revuelto') && !ownsHeirAsset(state,'revuelto') && buyHeirAssets(state,['revuelto'],'刷卡提 Revuelto','橙色车门扬起来。你把那张印着周骁名字的请帖扔到副驾：「留着——等会儿让他自己来看。」'),
  heirAssetAvailable(state,'revuelto') && !ownsHeirAsset(state,'cullinan') && !ownsHeirAsset(state,'revuelto') && buyHeirAssets(state,['cullinan','revuelto'],'两辆，全款，现在提','刚才劝你去二手区的销售经理亲自铺了红毯。你把 Revuelto 的钥匙留下，库里南的交给司机：「两辆一起到，让门口看清楚谁来了。」'),
 ].filter((choice): choice is EventChoice => Boolean(choice));
 return {
  id:shopId(CARS,state,'cullinan','revuelto',revisit), category:'explore', location:'徐汇滨江', tag:'西岸开场',
  ...(!revisit&&{objective:'提好车，从会客厅正门入场'}),
  title:revisit?'展厅还记得你':'要不，您看看二手区？', illustration:heirStoryPhoto('garage'),
  text:revisit?'展厅把你上回看过的车挪到了玻璃门口，销售远远就迎上来——上周的事，全行业都知道了。':heirAssetAvailable(state,'revuelto')?'销售经理把你引向角落，压低声音：「周少打过招呼，新车不摆给您……要不您看看二手区？」展厅最里面，黑色库里南和橙色 Revuelto 都在。周骁刚发了条语音，说门口车位只留给自己人。':'展厅刚到一辆库里南。销售把钥匙放到托盘里，眼神却往办公室飘——那边刚接过一个电话。他问你要不要自己试一圈。',
  choices:[...choices,{id:'pass',label:revisit?'改天再提':'先坐家里的车赴宴',reply:revisit?'你把钥匙放回托盘，销售追出来递了张名片。':'你把请帖递给司机，让他走正门。车可以不提，场子必须进。',effect:{}}],
 };
}

function openingNight(state: GameState): LifeEvent {
 const rolls = ownsHeirAsset(state,'cullinan'), lambo = ownsHeirAsset(state,'revuelto');
 const bag = ownsHeirAsset(state,'hermes') ? 'Kelly' : ownsHeirAsset(state,'lv') ? 'LV 旅行袋' : '';
 const arrival = lambo && rolls ? '两辆新车先后停在正门，迎宾的名单还没翻完。' : lambo ? 'Revuelto 的橙色车门一抬，门口的人都回了头。'
  : rolls ? '库里南停在红毯前，经理亲自替你开的门。' : '家里的车停在正门。迎宾翻了两遍名单，说没有你的名字。';
 const choices: EventChoice[] = [
  {id:'take-seat',label:'换座牌，我亲自开场',hint:'拿回主位 · 解锁会客厅',reply:'经理当着全场撤走周骁的座牌，动作快得像早就想好了。你举起杯：「今天我请。周骁别走——大舅教你的规矩，你自己讲给各位听。」',effect:{face:16,network:9,setFlags:['heir-hosted-direct']}},
  {id:'new-table',label:'把位子留给帮你拿原件的人',hint:'另开一桌 · 解锁会客厅',reply:'你在临江那张桌坐下，给送原件的经理留了把椅子。周骁还在台上举杯，可端着杯子走过来的人一桌接一桌——他把敬酒词讲完，台下已经没几个人在听。',effect:{network:15,spirit:6,setFlags:['heir-hosted-new-table']}},
  {id:'pass-mic',label:'让他说完，把原件投上大屏',hint:'公开签约原件 · 解锁会客厅',reply:'周骁正说到「以后西岸我罩着」，大屏切出签约原件——产权栏的名字亮在他背后，全场哗然。他捏着话筒的手在抖，问能不能先下台。没人应他。',effect:{face:12,skill:6}},
 ];
 return {
  id:PARTY, category:'social', location:'西岸会客厅', tag:'西岸开场', title:'今晚谁做东',objective:'当着宾客拿回主办权',illustration:heirStoryPhoto('club'),
  text:arrival + (bag ? '你从'+bag+'里拿出原件。' : '你从外套内袋拿出原件。')
   + '台上周骁举着杯朗声宣布：「西岸，以后姓周。我那位表弟——连请帖都买不起。」哄笑声里，老妈把爷爷的签约原件拍上签到台，产权栏写着你的名字。全场瞬间安静。经理捧着新座牌小跑过来，问主位怎么写。',
  choices:state.flags.includes(OPENING_DRAMA)?choices.map(choice=>({
   ...choice,effect:withOpeningRecord(choice.effect,choice.id==='new-table'?OPENING_ALLIES:OPENING_PROOF),
  })):choices,
 };
}

function venue(state:GameState): LifeEvent {
 return {
  id:VENUE, category:'business', location:'徐汇滨江', tag:'西岸开场', title:'大舅也盯上了这一层', illustration:heirStoryPhoto('club'),
  text:'沈经理亲自把转让书送到你面前，腰弯得比那晚低了一半：「楼下两席车位和长期经营权一起算。」他压低声音：昨夜有人替大舅递话，家族信托愿意出双倍——「可这行的规矩我懂，西岸姓什么，该听原件的。」',
  choices:[
   buyHeirAssets(state,['lounge'],'签了，把门卡给我','到账铃声一响，经理把门卡翻了面，印的是你的名字。他顺手把大舅那边的意向书碎掉了：「您留着——今晚开始，这层想请谁，您定。」'),
   {id:'walk',label:'不接转让，今晚只订一桌',reply:'经理把合同收起来，大舅的钱他也不敢收了。最靠江的桌子照样给你留着——这一层暂时谁也拿不走，都在等你想清楚。',effect:{}},
  ],
 };
}

function firstNightAsOwner(state: GameState): LifeEvent {
 const arrival = ownsHeirAsset(state,'revuelto') ? '橙色 Revuelto 停在门外。'
  : ownsHeirAsset(state,'cullinan') ? '库里南停在门外。' : '门童在台阶下替你拉开车门。';
 return {
  id:FIRST_NIGHT_AS_OWNER,category:'social',location:'西岸会客厅',tag:'西岸开场',title:'今晚关门，只请自己人',
  illustration:heirStoryPhoto('club'),text:arrival+'打烊时分，周骁一个人站在门口，没了那晚的车水马龙。大舅的信托被银行冻结，跟他的人散了大半。他把当年错印的座牌带了回来，翻过来写了自己的号码：「这一面，早该写对。」他说有个项目，想在这儿见人。经理只问你一句，今晚的灯给谁开？',
  choices:[
   {id:'family',label:'叫爸妈来，今晚不谈合同',reply:'老妈先看了一眼门牌——写的是你的名字，再看桌上那盘她爱吃的糖醋小排。老爸把周骁送来的座牌翻了过去：「这桌我就吃饭。」谁输谁赢，今晚不谈。',effect:{spirit:12,network:6}},
   {id:'open-door',label:'给周骁一桌，让他自己把项目讲完',reply:'周骁走到门口又回头：「这次请帖我自己印，名字会写对。」你让经理把最靠江那桌留给他。抬他一把容易，站起来难——剩下的路他自己走。',effect:{network:16,face:6}},
   {id:'late-night',label:'都不约，今晚这层只留给我',reply:'经理把外面的灯全关了。你拿着车钥匙走到窗边，整排空桌后面，江上有一艘船慢慢开过去。那晚的哄笑声、转账短信、老妈拍在桌上的原件，都过去了。',effect:{spirit:16,face:4}},
  ],
 };
}

export function westBundSecondYear(state: GameState): LifeEvent {
 const tookSeat = state.flags.includes('heir-hosted-direct');
 const newTable = state.flags.includes('heir-hosted-new-table');
 const text = calendarYear(state)<2001?'那晚的请帖还压在餐桌抽屉里，大舅在饭桌上再没提过西岸。母亲让沈经理捎来一份续约单，只多问一句：那孩子的场子，还做不做东了？':!hosted(state)
  ? '西岸的请帖还在老妈手里。周骁又发来一张改过的名单——他还在撑着「接班人」的场面，可请他的人越来越少了。她问你，什么时候来拿原件？'
  : tookSeat ? '那晚主位换了名字，这段视频在圈子里传了一周。周骁撤回了一条群消息，大舅的电话直接打到你这里，只说了一句「毛还没长齐」。经理的电话跟着进来：西岸那层，要转让。'
  : newTable ? '上回临江那一桌，还有人在问下一场。经理把报价发了三遍，又补一句：有人替大舅问过价，他没敢接。整层会客厅，现在能谈。'
  : '大屏那段被拍进了家族群，配文是「原件还在」。周骁退群前只发了一句「西岸那地方有什么好」。老妈私信你：爷爷当年为什么把西岸留给你、跳过他那辈人，这笔旧账，哪天该翻一翻。';
 return {
  id:'heir-west-bund-second',category:'year',location:'徐汇滨江',tag:'西岸开场',
  title:calendarYear(state)<2001?'沈经理送来续约单':hosted(state)?'西岸那层要转让':'请帖还在等你',illustration:calendarYear(state)<2001?'/art/era/jinjiang-1992.webp':heirStoryPhoto('club'),text,
  choices:[
   {id:'call',label:calendarYear(state)<2001?'请沈经理把续约单留下':hosted(state)?'告诉经理，合同留给我':'回老妈，我亲自去拿',reply:calendarYear(state)<2001?'经理记下了你的名字：西岸的正门，往后一直给你留着。':hosted(state)?'经理回了一个地址：「您方便就过来，车位我亲自盯。」上回那副面孔，他再没摆过。':'老妈把恒隆柜台的位置发来：「原件我带着。顺便——爷爷的事，妈跟你讲讲。」',effect:{face:4}},
   {id:'wait',label:calendarYear(state)<2001?'收起续约单，晚点再答复':hosted(state)?'先去看看场地':'晚点再回周骁',reply:calendarYear(state)<2001?'你把续约单夹进那天的请帖，两页纸放在一起，才算看懂那晚。':hosted(state)?'你在滨江多绕了一段。从外面看，灯还亮着——这层的灯往后亮给谁，你说了算。':'你把周骁刚发的名单存了下来。输赢不在嘴上，老妈的对话框还置顶着。',effect:{spirit:4}},
  ],
 };
}

export function heirStoryLead(state: GameState) {
 if (!hasHeirStory(state) || state.pendingYearEvent || state.ended || state.actions <= 0) return;
 if (state.storyEdition!==2&&!state.seenEvents.includes(MALL)) return { message:heirAssetAvailable(state,'lv')?'去恒隆拿请帖':'去锦江饭店拿请帖',event:mall(state,false) };
 if (state.storyEdition!==2&&!state.seenEvents.includes(CARS)) return { message:heirAssetAvailable(state,'cullinan')?'去西岸挑车':'去车行看车',event:showroom(state,false) };
 if (!hosted(state)) return { message:'进会客厅，拿回主位',event:openingNight(state) };
 if (state.age>=19 && heirAssetAvailable(state,'lounge') && !state.seenEvents.includes(VENUE)) return { message:'看看会客厅的转让书',event:venue(state) };
 if (state.age>=20 && ownsHeirAsset(state,'lounge') && !state.seenEvents.includes(FIRST_NIGHT_AS_OWNER)) {
  return { message:'开自己的第一场',event:firstNightAsOwner(state) };
 }
}

export function heirShopVisits(state: GameState) {
 if (!hasHeirStory(state) || !hosted(state) || state.pendingYearEvent || state.ended || state.actions<=0) return [];
 const visits: LifeEvent[] = [];
 if (heirAssetAvailable(state,'lv')&&(!ownsHeirAsset(state,'lv') || !ownsHeirAsset(state,'hermes'))) visits.push(mall(state,true));
 if ((heirAssetAvailable(state,'cullinan')&&!ownsHeirAsset(state,'cullinan')) || (heirAssetAvailable(state,'revuelto')&&!ownsHeirAsset(state,'revuelto'))) visits.push(showroom(state,true));
 return visits.filter(visit=>!state.seenEvents.includes(visit.id));
}

export function replayHeirVisit(state: GameState, id: string) {
 const lead = heirStoryLead(state)?.event;
 return lead?.id === id ? lead : heirShopVisits(state).find(visit=>visit.id===id);
}
