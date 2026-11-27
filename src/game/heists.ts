import { calendarYear } from './calendar';
import { hashSeed, randomStep } from './seed';
import type { DistrictId, GameState } from './types';

export type HeistCrewId = 'mao' | 'yan' | 'fei';
export type HeistApproach = 'smart' | 'loud';

export interface HeistCrewOption {
  id: HeistCrewId;
  name: string;
  role: string;
  cutPct: number;
  chanceBonus: number;
  payoutBonusPct: number;
  reducesHeat: boolean;
  pitch: string;
}

export interface HeistSpec {
  id: string;
  title: string;
  codename: string;
  district: DistrictId;
  location: string;
  openYear: number;
  prepCost: number;
  basePayout: number;
  heatFlag: string;
  brief: string;
  scoutSummary: string;
  smartLabel: string;
  loudLabel: string;
}

export interface HeistOutcome {
  state: GameState;
  success: boolean;
  netTake: number;
  crewCut: number;
  headline: string;
  detail: string;
}

const clampStat = (n: number) => Math.max(0, Math.min(100, n));

export const HEIST_CREW: readonly HeistCrewOption[] = [
  {
    id: 'mao',
    name: '毛小毛 · 弄堂撤退车手',
    role: '稳健后勤',
    cutPct: 15,
    chanceBonus: 10,
    payoutBonusPct: 0,
    reducesHeat: true,
    pitch: '全上海后弄堂闭着眼都能钻出去，抽成最低（15%），收尾不留街头风头。',
  },
  {
    id: 'yan',
    name: '周宁 · 精密控场技术流',
    role: '技术内应',
    cutPct: 20,
    chanceBonus: 22,
    payoutBonusPct: 5,
    reducesHeat: false,
    pitch: '把时间表卡到秒针上，行动成功率大幅提升 +22%，抽成 20%。',
  },
  {
    id: 'fei',
    name: '费启 · 外滩庄家抬轿手',
    role: '资本放大器',
    cutPct: 25,
    chanceBonus: 12,
    payoutBonusPct: 30,
    reducesHeat: false,
    pitch: '直接对接大户买盘把蛋糕做大，总盘子暴涨 +30%，抽成 25%。',
  },
];

export const HEISTS: readonly HeistSpec[] = [
  {
    id: 'bond95',
    title: '九五国债逼空夜',
    codename: 'OPERATION 327',
    district: 'bund',
    location: '外滩 · 万国证券大户室走廊',
    openYear: 1995,
    prepCost: 12_000,
    basePayout: 185_000,
    heatFlag: 'hustle_heat_bund',
    brief: '交割日前夜多空双方杀红了眼，大户室专线电话烫得握不住。只要提前摸清席位底仓，就能在尾盘八分钟吃下整段溢价。',
    scoutSummary: '已买通机房抄单员摸清三家主力保证金水位，只等收盘前最后八分钟动手。',
    smartLabel: 'A计划 · 分仓对倒暗渡（考本事+人脉，低风头稳收）',
    loudLabel: 'B计划 · 满仓抢筹掀桌（考腔势+心气，多赚 35% 但惹风头）',
  },
  {
    id: 'pier03',
    title: '十六铺古董货柜截胡局',
    codename: 'OPERATION NIGHT TIDE',
    district: 'lujiazui',
    location: '十六铺对岸 · 保税仓三号栈桥',
    openYear: 2002,
    prepCost: 48_000,
    basePayout: 680_000,
    heatFlag: 'hustle_heat_lujia',
    brief: '一批海外回流的民国紫檀屏风与铜首卡在清关夹层，拍卖行与灰市买家同时盯着明早六点的提货单。',
    scoutSummary: '夜班叉车班排班表与海关铅封号已核对无误，提货窗口只有四十分钟。',
    smartLabel: 'A计划 · 换单保税过户（考本事+人脉，干净落袋）',
    loudLabel: 'B计划 · 码头当场竞价截盘（考腔势+心气，溢价 35% 高风头）',
  },
  {
    id: 'chip14',
    title: '张江光刻底稿跨江暗渡',
    codename: 'OPERATION SILICON FOG',
    district: 'zhangjiang',
    location: '张江高科 · 卢浦大桥引桥',
    openYear: 2012,
    prepCost: 160_000,
    basePayout: 2_400_000,
    heatFlag: 'hustle_heat_zhang',
    brief: '破产外企清算组明天封存实验室，整套已流片验证的射频专利包面临贱卖，三家大厂都在抢独家受让签字权。',
    scoutSummary: '清算律师函与核心工程师底薪包已谈妥，今晚十二点前签下排他协议即可转手溢价交割。',
    smartLabel: 'A计划 · 离岸壳公司暗签（考本事+人脉，不露锋芒）',
    loudLabel: 'B计划 · 组银团当面截标（考腔势+心气，多拿 35% 轰动全城）',
  },
];

export const heistPrepFlag = (id: string) => `heist-prep-${id}`;
export const heistDoneFlag = (id: string) => `heist-done-${id}`;
export const heistCrewPrefix = (id: string) => `heist-crew-${id}-`;

export function selectedHeistCrew(state: Pick<GameState, 'flags'>, heistId: string): HeistCrewOption {
  const prefix = heistCrewPrefix(heistId);
  const found = state.flags.find(f => f.startsWith(prefix));
  const crewId = found ? (found.slice(prefix.length) as HeistCrewId) : 'mao';
  return HEIST_CREW.find(c => c.id === crewId) ?? HEIST_CREW[0];
}

export function heistChance(state: GameState, heist: HeistSpec, approach: HeistApproach): number {
  const crew = selectedHeistCrew(state, heist.id);
  const statScore =
    approach === 'smart'
      ? (state.stats.skill * 0.6 + state.stats.network * 0.4)
      : (state.stats.face * 0.6 + state.stats.spirit * 0.4);
  const difficulty = heist.id === 'bond95' ? 35 : heist.id === 'pier03' ? 48 : 58;
  return Math.round(Math.max(25, Math.min(96, 48 + (statScore - difficulty) + crew.chanceBonus)));
}

export function scoutHeist(state: GameState, heistId: string): GameState {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('请先处理完眼前的事件再筹备大买卖。');
  }
  const heist = HEISTS.find(h => h.id === heistId);
  if (!heist) throw new Error('未找到该项行动档案。');
  if (calendarYear(state) < heist.openYear) throw new Error(`${heist.openYear} 年后才出现这桩大局。`);
  if (state.flags.includes(heistDoneFlag(heist.id))) throw new Error('这票大买卖已经完美收官了。');
  if (state.flags.includes(heistPrepFlag(heist.id))) throw new Error('前期踩点已经就绪，挑好搭档即可动手。');
  if (state.actions < 1) throw new Error('今年行动点已用完，明年继续推进。');
  if (state.cash < heist.prepCost) throw new Error('前期打点经费不足。');

  const next = structuredClone(state);
  next.cash -= heist.prepCost;
  next.actions -= 1;
  next.district = heist.district;
  next.stats.skill = clampStat(next.stats.skill + 3);
  next.flags = [...new Set([...next.flags, heistPrepFlag(heist.id), `${heistCrewPrefix(heist.id)}mao`])];
  next.journal = [
    ...next.journal,
    {
      age: next.age,
      title: `筹备踩点 · ${heist.title}`,
      text: `砸下 ¥${heist.prepCost.toLocaleString('zh-CN')} 摸清了${heist.location}的全部底细，作战白板已就位。`,
      tag: '大买卖',
    },
  ].slice(-1000);
  return next;
}

export function assignHeistCrew(state: GameState, heistId: string, crewId: HeistCrewId): GameState {
  const heist = HEISTS.find(h => h.id === heistId);
  if (!heist || !state.flags.includes(heistPrepFlag(heist.id)) || state.flags.includes(heistDoneFlag(heist.id))) {
    throw new Error('请先完成前期踩点再定搭档。');
  }
  const crew = HEIST_CREW.find(c => c.id === crewId);
  if (!crew) throw new Error('搭档人选无效。');
  const prefix = heistCrewPrefix(heist.id);
  const next = structuredClone(state);
  next.flags = [...next.flags.filter(f => !f.startsWith(prefix)), `${prefix}${crew.id}`];
  return next;
}

export function executeHeist(state: GameState, heistId: string, approach: HeistApproach): HeistOutcome {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('请先处理完眼前的事件再收网。');
  }
  const heist = HEISTS.find(h => h.id === heistId);
  if (!heist) throw new Error('未找到该项行动档案。');
  if (!state.flags.includes(heistPrepFlag(heist.id))) throw new Error('尚未完成前期踩点摸底。');
  if (state.flags.includes(heistDoneFlag(heist.id))) throw new Error('这票买卖已经收过网了。');
  if (state.actions < 1) throw new Error('今年行动点不足，留一格行动再来收网。');

  const crew = selectedHeistCrew(state, heist.id);
  const chance = heistChance(state, heist, approach);
  const next = structuredClone(state);
  const [roll, nextRng] = randomStep(hashSeed(next.seed + '-heist-' + heist.id + '-' + next.age + '-' + approach));
  next.rng = nextRng;
  next.actions -= 1;
  next.district = heist.district;
  next.flags = [...new Set([...next.flags, heistDoneFlag(heist.id)])];

  const success = roll * 100 < chance;
  const approachMult = approach === 'loud' ? 1.35 : 1.0;
  const grossPool = Math.round(
    heist.basePayout * (1 + crew.payoutBonusPct / 100) * approachMult * (success ? 1 : 0.28),
  );
  const crewCut = Math.round((grossPool * crew.cutPct) / 100);
  const netTake = Math.max(0, grossPool - crewCut);

  next.cash = Math.min(1e12, Math.round(next.cash + netTake));
  next.totalEarned = Math.min(1e12, Math.round(next.totalEarned + netTake));

  if (success) {
    next.stats.face = clampStat(next.stats.face + (approach === 'loud' ? 10 : 6));
    next.stats.skill = clampStat(next.stats.skill + 5);
    next.stats.spirit = clampStat(next.stats.spirit + 8);
    if (approach === 'loud' && !crew.reducesHeat) {
      next.flags = [...new Set([...next.flags, heist.heatFlag])];
    }
  } else {
    next.stats.health = clampStat(next.stats.health - 6);
    next.stats.spirit = clampStat(next.stats.spirit - 4);
    if (!crew.reducesHeat) {
      next.flags = [...new Set([...next.flags, heist.heatFlag])];
    }
  }

  const headline = success ? `漂亮收网 · ${heist.title}` : `险中求退 · ${heist.title}`;
  const detail = success
    ? `与${crew.name.split(' · ')[0]}默契配合拿下整盘大局！扣除搭档分成 ¥${crewCut.toLocaleString('zh-CN')}，你个人净落袋 ¥${netTake.toLocaleString('zh-CN')}！`
    : `临场突生变数，亏得${crew.name.split(' · ')[0]}及时断后保住底仓，扣除分成后拿回 ¥${netTake.toLocaleString('zh-CN')} 保底红利。`;

  next.journal = [
    ...next.journal,
    {
      age: next.age,
      title: headline,
      text: detail,
      tag: '大买卖',
    },
  ].slice(-1000);

  return { state: next, success, netTake, crewCut, headline, detail };
}
