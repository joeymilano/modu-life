import { calendarYear } from './calendar';
import { buyHeirAssets, hasHeirStory, heirAssetAvailable, HEIR_CATALOG, heirStoryPhoto, ownsHeirAsset } from './heirStory';
import type { EventChoice, GameState, LifeEvent } from './types';

export const PENTHOUSE_FEE = 12_000;
export const livesInPenthouse = (state: GameState) => state.housing === 3 && ownsHeirAsset(state, 'penthouse');

const PREFIX = 'heir-concierge-';
const BOOKING = '今晚安排';
export type ConciergeTab = 'shopping' | 'tonight' | 'owned';

interface Offer {
 name: string;
 event: LifeEvent;
}

function offer(
 id: string, name: string, location: string, illustration: string, category: LifeEvent['category'],
 text: string, choices: EventChoice[], tag = '私人礼宾',
): Offer {
 return { name, event: {id:PREFIX+id, title:name, location, illustration, category, tag, text, choices, actionCost:0} };
}

function retail(state: GameState, type: 'mall' | 'cars'): Offer | undefined {
 const mall = type === 'mall';
 const first = mall ? 'lv' : 'cullinan';
 const second = mall ? 'hermes' : 'revuelto';
 const hasFirst = ownsHeirAsset(state, first)||!heirAssetAvailable(state,first);
 const hasSecond = ownsHeirAsset(state, second)||!heirAssetAvailable(state,second);
 if (hasFirst && hasSecond) return;
 const choices = [];
 if (!hasFirst) choices.push(buyHeirAssets(state,[first], mall ? '买下 LV 旅行袋' : '提走库里南',
  mall ? '店员把旅行袋送进你的后备厢。下趟出去玩，出门前往里扔两件衣服就能走。'
   : '销售把两把钥匙都交给你。司机问今晚开哪辆，你指了指刚擦干净的后座。'));
 if (!hasSecond) choices.push(buyHeirAssets(state,[second], mall ? '买下爱马仕 Kelly' : '提走 Revuelto',
  mall ? '店员当着你的面把焦糖色的 Kelly 重新包好。你在门口就拆了，往里放了把车钥匙。'
   : '展厅门一开，淮海路方向的路灯刚亮。你坐进去试了下方向盘，销售把副驾那张保护膜撕掉。'));
 if (!hasFirst && !hasSecond) choices.push(buyHeirAssets(state,[first, second], mall ? '两只都包起来' : '两辆都提',
  mall ? '两只纸袋摆上后座。柜姐问小票要不要分开，你说，一起夹在里面就行。'
   : '你自己开 Revuelto。司机跟在后面开库里南，问回去以后哪辆停电梯口。你说，俩都停。'));
 return offer(type+'-'+Number(hasFirst)+Number(hasSecond),
  mall ? '恒隆扫货' : '西岸提车', mall ? '静安 · 恒隆广场' : '徐汇滨江 · 西岸展厅',
  heirStoryPhoto(mall ? 'shopping' : 'garage'), 'explore',
  mall ? '南京西路还在下雨。柜姐把门掩上，等你挑。'
   : '展厅的灯还亮着。选完车，钥匙可以直接送到你楼下。', choices);
}

function penthouse(state: GameState): Offer | undefined {
 if (!heirAssetAvailable(state,'penthouse')||ownsHeirAsset(state,'penthouse')) return;
 const purchase = buyHeirAssets(state,['penthouse'], '买下，今晚搬进去', '物业把电梯权限录进你的手机。最后一箱东西送上来时，对岸外滩的楼已经亮了。你让搬家师傅把沙发转过去，正对江面。');
 return offer('penthouse', '看江景顶层', HEIR_CATALOG.penthouse.place, HEIR_CATALOG.penthouse.image, 'housing',
  `电梯直接进客厅。露台外面是黄浦江，对岸海关钟楼刚敲完八下。入住后物业费每月 ¥${PENTHOUSE_FEE.toLocaleString('zh-CN')}。搬过去，你就用自己的房卡。`,
  [{...purchase, effect:{...purchase.effect,housing:3}}]);
}

function yacht(state: GameState): Offer {
 return offer('yacht-'+state.age, '黄浦江包船', '外滩 · 黄浦江', heirStoryPhoto('yacht'), 'social',
  '船长留了两个时段。饭后两小时正好看亮灯，要是把后半夜也包了，想什么时候靠岸都行。',
  [
   {id:'two-hours', label:'包两个小时，看外滩亮灯', hint:'¥48,000 · 整船', effect:{cash:-48_000,spirit:14},
    reply:'缆绳一松，码头的嘈杂就留在身后。船绕到陆家嘴前，东方明珠的灯正好亮起来。你让船长在江心多停了五分钟。'},
   {id:'all-night', label:'今晚整艘都归我，开到天亮', hint:'¥168,000 · 整晚', effect:{cash:-168_000,spirit:21,face:6},
    reply:'午夜以后，对岸的灯一层层灭了。你把外套搭在椅背上，叫人再添一壶茶。等第一班渡轮出发，你才让船长掉头。'},
  ], BOOKING);
}

function supper(state: GameState): Offer {
 const owner = ownsHeirAsset(state, 'lounge');
 return offer('supper-'+state.age, owner?'去自己的会客厅做东':'包下西岸临江一层', '徐汇滨江 · 西岸会客厅',
  heirStoryPhoto('club'), 'social',
  owner ? '经理把门卡和今晚的菜单摆在一起。桌子照旧临江，整层开不开门、来哪些人，都等你一句话。'
   : '经理可以替你留一张临江桌，也可以把门关上，只接你的客人。厨房等你到了才开火。',
  [
   {id:'window',label:'就留靠江那一桌',hint:'¥12,800 · 私宴',effect:{cash:-12_800,spirit:10},
    reply:'凉菜刚上，江面划过一条亮线。你吃完小排，把菜单翻回第一页，又点了一份。'},
   {id:'floor',label:owner?'关门，我来做东':'把整层包下来，我来做东',
    hint:owner?'¥38,000 · 餐酒与演出':'¥98,000 · 包场与私宴',
    effect:{cash:owner?-38_000:-98_000,spirit:13,network:12,face:8},
    reply:'厨师把最后一道汤端出来，乐手看了一眼表，问还要不要再弹一支。你把窗边的椅子往后挪了挪，让他挑自己想弹的。'},
  ], BOOKING);
}

function nightDrive(state: GameState): Offer | undefined {
 const choices: EventChoice[] = [];
 if(ownsHeirAsset(state,'classic'))choices.push({id:'classic',label:'叫司机开 600 SEL 去锦江饭店',
  reply:'司机把车停在门廊下。你下车时，门口的领位员已经走过来。',effect:{spirit:8,face:4}});
 if (ownsHeirAsset(state,'revuelto')) choices.push({id:'revuelto',label:'开 Revuelto 去浦东兜一圈',
  reply:'车从延安东路隧道钻出来，两侧灯一下散开。你在滨江停了车，坐在台阶上看对岸的灯亮到最后。',effect:{spirit:10,face:5}});
 if (ownsHeirAsset(state,'cullinan')) choices.push({id:'cullinan',label:'叫司机开库里南，去淮海路吃宵夜',
  reply:'司机在淮海中路让你下车。点心店还开着，你进去要了碗馄饨，出来的时候后座的暖气已经开了。',effect:{spirit:9,health:4}});
 if (!choices.length) return;
 return offer('drive-'+state.age, '今晚用哪辆车', '私人车库', calendarYear(state)<2018?HEIR_CATALOG.classic.image:heirStoryPhoto('garage'), 'explore',
  '车库的灯一排排亮起来。车都在，今晚去哪儿你定。', choices, BOOKING);
}

export function heirConcierge(state: GameState) {
 if (!hasHeirStory(state) || state.pendingYearEvent || state.ended) return;
 const classic=!ownsHeirAsset(state,'classic')&&state.calendar&&calendarYear(state)<1999
  ? offer('classic','订一辆奔驰 600 SEL','上海 · 进口车行',HEIR_CATALOG.classic.image,'explore',
   '车行把钥匙和出库单放在同一个托盘上。',[buyHeirAssets(state,['classic'],'开走这辆奔驰','出库单写上你的名字，司机把钥匙交给你。')])
  : undefined;
 const shopping = [classic,penthouse(state),retail(state,'mall'),retail(state,'cars')].filter(item=>item!==undefined);
 const tonight = [calendarYear(state)>=1994?yacht(state):undefined,calendarYear(state)>=2010?supper(state):undefined,nightDrive(state)].filter(item=>item!==undefined);
 const owned: Offer[] = [];
 if (ownsHeirAsset(state,'penthouse') && !livesInPenthouse(state)) owned.push(offer('move-'+state.age,'搬回江景顶层',
  HEIR_CATALOG.penthouse.place,HEIR_CATALOG.penthouse.image,'housing',
  '物业还留着你的电梯权限。管家问，今晚就把行李搬过来吗？',
  [{id:'move',label:'今晚回去住',reply:'电梯开门，窗边那盏灯还亮着。你把行李箱推到墙边，先去开露台的门。',effect:{housing:3}}]));
 const pause = state.jobId ? offer('leave-'+state.age,'把工作交接出去','私人日程',
  heirStoryPhoto(livesInPenthouse(state)?'penthouse':'family'),'explore',
  '你翻了下接下来的日程。手头的事可以交接完，之后去哪儿、见谁，都由你自己安排。',
  [{id:'leave',label:'交接完，接下来自己安排',hint:'结束当前工作 · 已挣收入照常结算',
   reply:'最后一个工作群退完，屏幕安静了。你问礼宾，今晚江上风大不大。',effect:{job:'unemployed',spirit:8}}]) : undefined;
 return {shopping, tonight, owned, pause};
}

export function replayConcierge(state: GameState, id: string) {
 if (!id.startsWith(PREFIX) || state.seenEvents.includes(id)) return;
 const offers = heirConcierge(state);
 if (!offers) return;
 return [...offers.shopping,...offers.tonight,...offers.owned,offers.pause].find(item=>item?.event.id===id)?.event;
}
