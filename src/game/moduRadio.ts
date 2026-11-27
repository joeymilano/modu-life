import { calendarYear } from './calendar';
import { SOUNDTRACK } from './soundtrack';
import type { DistrictId, GameState } from './types';

export type SongKey = keyof typeof SOUNDTRACK;

export interface RadioStation {
  key: SongKey;
  freq: string;
  name: string;
  en: string;
  dj: string;
  line: string;
}

export const MODU_STATIONS: readonly RadioStation[] = [
  { key: 'docks', freq: 'FM 103.7', name: '浦江夜航', en: 'BUND MIDNIGHT', dj: 'DJ 沈阿叔', line: '海关大钟敲过十二下，外滩吹风的比睡觉的多。' },
  { key: 'vibes', freq: 'FM 94.0', name: '梧桐电音', en: 'WUTONG GROOVE', dj: 'DJ Kiki', line: '安福路没有秘密，只有还没结清的账和刚出炉的风声。' },
  { key: 'lobby', freq: 'FM 89.9', name: '陆家嘴内参', en: 'TOWER TAPE', dj: 'DJ 陆敏', line: '有人算市盈率，有人算月底房租，祝各位今晚都平仓。' },
  { key: 'apero', freq: 'FM 101.7', name: '霞飞路日落', en: 'SUNSET CLUB', dj: 'DJ 老克勒陈', line: '太阳落进苏州河，先喝口冰的，天大的官司明朝再讲。' },
  { key: 'noir', freq: 'FM 97.2', name: '暗巷故事会', en: 'ALLEY NOIR', dj: 'DJ 阿宝', line: '这码头规矩很简单：签字看清底联，交人看清底牌。' },
  { key: 'walks', freq: 'FM 105.5', name: '不夜城霓虹', en: 'NEON RUSH', dj: 'DJ 阿飞', line: '钞票不等人，绿灯还剩三秒，这脚油门踩到底伐？' },
  { key: 'liuyuexia', freq: 'FM 96.8', name: '甜爱路来信', en: 'LOVE LETTERS', dj: 'DJ 陆嘉', line: '六月的雨落到甜爱路。情话想好了再开口，今晚只放慢的。' },
];

export function stationForTrack(file: string): RadioStation {
  return MODU_STATIONS.find(s => SOUNDTRACK[s.key].file === file) ?? MODU_STATIONS[0];
}

export interface StreetCred {
  stars: number;
  title: string;
  en: string;
}

export function streetCredOf(state: GameState): StreetCred {
  const score = state.stats.face * 0.55 + state.stats.network * 0.45 + (state.cash >= 1_000_000 ? 22 : state.cash >= 200_000 ? 10 : 0);
  if (score >= 86) return { stars: 5, title: '上海滩大亨', en: 'KINGPIN' };
  if (score >= 68) return { stars: 4, title: '码头有号', en: 'HEAVYWEIGHT' };
  if (score >= 50) return { stars: 3, title: '场面熟脸', en: 'CONNECTED' };
  if (score >= 34) return { stars: 2, title: '混出路数', en: 'HUSTLER' };
  return { stars: 1, title: '新客下船', en: 'FRESH OFF' };
}

const DISTRICT_WIRE: Record<DistrictId, readonly [string, string][]> = {
  bund: [
    ['外滩轮渡客', '两块钱船票看两千万江景，上海滩性价比最高的一笔买卖。'],
    ['海关钟楼夜班保安', '半夜两点还在江边拍合照的，不是刚谈拢大单，就是刚散了伙。'],
    ['和平饭店门童', '西装革履递名片的不一定有现钱，拎塑料袋付现钞的千万别怠慢。'],
  ],
  anfu: [
    ['梧桐区咖啡师', '门口三桌谈融资、两桌聊剧本，真正买单续杯的只有角落赶稿那位。'],
    ['老洋房二房东', '楼梯踩得嘎吱响叫岁月包浆，房租少一分那叫没诚意。'],
    ['武康路街拍客', '行头可以借，腔势借不来，眼神一慌镜头全拍得出来。'],
  ],
  people: [
    ['人民公园汪阿姨', '写年薪百万不稀奇，肯把房产证跟体检报告一块摊出来的才叫硬牌。'],
    ['一号线换乘族', '人民广场地下通道走得明白的人，在上海滩基本吃不了闷亏。'],
    ['夜校后排学员', '白天替老板画饼，晚上替自己攒手艺，两本账得分清爽。'],
  ],
  lujiazui: [
    ['国金天桥白领', 'PPT里写的都是十亿赛道，下楼买煎饼还得问加蛋几块。'],
    ['跨江出租车师傅', '凌晨一点从陆家嘴拉出来的客，上车头一句话十有八九是「师傅开慢点」。'],
    ['世纪大道猎头', '头衔越印越长的时候就要当心了，真正管钱的印张白卡就够。'],
  ],
  zhangjiang: [
    ['祖冲之路夜归人', '园区凌晨两点的路灯比南京路还亮，跑通一行代码顶喝两罐红牛。'],
    ['路演厅投资助理', '故事讲得再花哨，不如现场插电让机器稳稳转上十分钟。'],
    ['软件园班车司机', '早班车全在补觉，晚班车全在敲键盘，连谈恋爱都像在对需求。'],
  ],
  xinzhuang: [
    ['莘庄南广场中介', '别嫌终点站远，早高峰能抢上座，这一天就赢了一半。'],
    ['小吃街颠勺师傅', '大饭店讲排场，我这儿讲锅气，回头客用嘴投票最公道。'],
    ['老公房楼组长', '左邻右舍处好了，台风天有人替你收衣裳，比物业管用。'],
  ],
};

function eraDispatch(year: number): [string, string] {
  if (year <= 1995) return ['92沪上快讯', `${year}年风向：股票认购证排通宵，黄河路包房一桌难求，敢下海的先赚头一桶金。`];
  if (year <= 2002) return ['世纪末风声', `${year}年风向：延安高架一路亮灯，浦东塔吊比树还密，手头有余钱的都在打听内环房价。`];
  if (year <= 2012) return ['都市广播站', `${year}年风向：地铁新线一年开两条，江景写字楼彻夜通明，外企工牌成了相亲角硬通货。`];
  return ['魔都热帖榜', `${year}年风向：梧桐区手冲店扎堆开张，四块钱柠檬水硬刚外滩夜景，搞副业成了打工人标配。`];
}

export function streetWireOf(state: GameState, offset = 0): { source: string; text: string; era: [string, string] } {
  const pool = DISTRICT_WIRE[state.district];
  const idx = Math.abs(state.age + offset) % pool.length;
  const [source, text] = pool[idx];
  return { source, text, era: eraDispatch(calendarYear(state)) };
}
