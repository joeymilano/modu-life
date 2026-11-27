import { calendarYear } from './calendar';
import { DAYWORK_TEMP, FAMILY_HOME, FAMILY_PAY } from './lifeStarts';
import { STAFF_BED } from './classLives';
import { closeRentalLease } from './rental';
import { HUSTLE_HEAT_FLAGS } from './streetHustles';
import type { DistrictId, GameState, StatKey } from './types';

export type EmpireTab = 'business' | 'luxury';

export interface EmpireAsset {
  id: string;
  flag: string;
  kind: EmpireTab;
  name: string;
  district: DistrictId;
  location: string;
  openYear: number;
  price: number;
  resaleRate: number;
  annualDividend: number;
  isEstate?: boolean;
  coolsHeat?: boolean;
  penthouseView?: boolean;
  stats: Partial<Record<StatKey, number>>;
  tagline: string;
  story: string;
  perkLabel: string;
}

const clampStat = (n: number) => Math.max(0, Math.min(100, n));
const MAX_CASH = 1e12;
export const EMPIRE_HOME_UPGRADED = 'empire-home-upgraded';

export const EMPIRE_ASSETS: readonly EmpireAsset[] = [
  {
    id: 'stall',
    flag: 'empire-biz-stall',
    kind: 'business',
    name: '莘庄夜市联营档口',
    district: 'xinzhuang',
    location: '莘庄 · 地铁南广场夜市',
    openYear: 1992,
    price: 38_000,
    resaleRate: 0.8,
    annualDividend: 9_600,
    stats: { network: 3, skill: 2 },
    tagline: '两排铁板滋啦冒油，不用自己盯夜班，月底照分干股。',
    story: '盘下紧挨地铁出站口的黄金拐角档位，雇了两位手脚麻利的熟手老师傅看摊，晚高峰人流就是你的现金奶牛。',
    perkLabel: '每年净分红 ¥9,600 · 人脉 +3 / 本事 +2',
  },
  {
    id: 'cafe',
    flag: 'empire-biz-cafe',
    kind: 'business',
    name: '安福路街角手冲馆',
    district: 'anfu',
    location: '安福路 · 梧桐街角洋房底商',
    openYear: 1996,
    price: 128_000,
    resaleRate: 0.8,
    annualDividend: 32_000,
    stats: { face: 5, spirit: 4 },
    tagline: '梧桐树影落在黄铜门把上，半条街的导演和买手都在门口碰头。',
    story: '不搞加盟噱头，只卖烘得极稳的拼配豆。店面不大，却成了沪上文艺圈心照不宣的据点。',
    perkLabel: '每年净分红 ¥32,000 · 腔势 +5 / 心气 +4',
  },
  {
    id: 'fleet',
    flag: 'empire-biz-fleet',
    kind: 'business',
    name: '申江冷链短驳车队',
    district: 'xinzhuang',
    location: '莘庄 · 外环冷链物流港',
    openYear: 1998,
    price: 380_000,
    resaleRate: 0.8,
    annualDividend: 92_000,
    stats: { skill: 5, network: 4 },
    tagline: '六台厢式冷藏车昼夜跑外环，全城生鲜商超都有你的过路账。',
    story: '签下三家连锁商超的夜间冷链专线，调度表排得严丝合缝，风里雨里车轮一转就是稳当进项。',
    perkLabel: '每年净分红 ¥92,000 · 本事 +5 / 人脉 +4',
  },
  {
    id: 'club',
    flag: 'empire-biz-club',
    kind: 'business',
    name: '外滩十六铺爵士夜总会',
    district: 'bund',
    location: '外滩 · 十六铺老码头暗门',
    openYear: 2000,
    price: 980_000,
    resaleRate: 0.8,
    annualDividend: 235_000,
    coolsHeat: true,
    stats: { face: 9, network: 6 },
    tagline: '萨克斯吹过海关钟声，包厢门一关，多少难摆平的局都在酒杯里化了。',
    story: '红丝绒卡座只留给熟客，驻场老乐手一开腔就是老克勒排面，连街面上最扎手的风声都能替你挡在门外。',
    perkLabel: '每年净分红 ¥235,000 · 自动消减街头风头',
  },
  {
    id: 'compute',
    flag: 'empire-biz-compute',
    kind: 'business',
    name: '张江智算代工机房',
    district: 'zhangjiang',
    location: '张江 · 高科园恒温数据中心',
    openYear: 2010,
    price: 2_400_000,
    resaleRate: 0.8,
    annualDividend: 580_000,
    stats: { skill: 8, face: 5 },
    tagline: '机柜指示灯彻夜闪烁，全上海最烧算力的团队排队买你的机时。',
    story: '趁园区扩建拿下整层双路供电冷通道机房，长约包年锁死，躺收数字时代的硬核地租。',
    perkLabel: '每年净分红 ¥580,000 · 本事 +8 / 腔势 +5',
  },
  {
    id: 'fund',
    flag: 'empire-biz-fund',
    kind: 'business',
    name: '陆家嘴滨江私募席位',
    district: 'lujiazui',
    location: '陆家嘴 · 国金高区江景层',
    openYear: 2005,
    price: 6_500_000,
    resaleRate: 0.85,
    annualDividend: 1_560_000,
    stats: { face: 12, network: 10 },
    tagline: '三十八楼俯瞰黄浦江拐弯，不再替别人路演，轮到别人等你的批条。',
    story: '拿下独立LP份额与投决会席位，管理费加超额分成每年按时打进个人账户。',
    perkLabel: '每年净分红 ¥1,560,000 · 腔势 +12 / 人脉 +10',
  },
  {
    id: 'santana',
    flag: 'empire-lux-santana',
    kind: 'luxury',
    name: '桑塔纳 2000 · 沪A黑牌',
    district: 'people',
    location: '人民广场 · 老牌名车行',
    openYear: 1995,
    price: 168_000,
    resaleRate: 0.75,
    annualDividend: 0,
    stats: { face: 6, network: 4 },
    tagline: '九十年代上海滩最硬的通行证，停在和平饭店门口门童都多敬半个礼。',
    story: '擦得锃亮的黑色方头车身配上一块稀缺沪A牌照，去哪谈生意都不用多递第二张名片。',
    perkLabel: '名流座驾 · 腔势 +6 / 人脉 +4',
  },
  {
    id: 's600',
    flag: 'empire-lux-s600',
    kind: 'luxury',
    name: '虎头奔 S600 · 礼宾定制',
    district: 'bund',
    location: '外滩 · 半岛名车展厅',
    openYear: 1994,
    price: 880_000,
    resaleRate: 0.75,
    annualDividend: 0,
    stats: { face: 10, network: 7 },
    tagline: '双层夹胶玻璃一升，延安高架上的风雨喧嚣全隔在车窗外。',
    story: 'V12引擎怠速稳得能立硬币，后排胡桃木小桌板一翻，半个上海滩的大合同都在这后座签下。',
    perkLabel: '旗舰礼宾座驾 · 腔势 +10 / 人脉 +7',
  },
  {
    id: 'porsche',
    flag: 'empire-lux-porsche',
    kind: 'luxury',
    name: '保时捷 911 Turbo · 霓虹夜行',
    district: 'lujiazui',
    location: '陆家嘴 · 滨江超跑俱乐部',
    openYear: 2004,
    price: 1_980_000,
    resaleRate: 0.75,
    annualDividend: 0,
    stats: { face: 12, spirit: 10 },
    tagline: '凌晨两点驶过南浦大桥盘旋引桥，水平对置声浪贴着江风炸开。',
    story: '银粉漆面映着陆家嘴紫青色的霓虹灯带，踩下油门那一秒，所有憋屈都甩在后视镜里。',
    perkLabel: '超跑收藏 · 腔势 +12 / 心气 +10',
  },
  {
    id: 'loft',
    flag: 'empire-lux-loft',
    kind: 'luxury',
    name: '苏州河红砖仓库顶层 Loft',
    district: 'people',
    location: '苏州河畔 · 百年老堆栈顶层',
    openYear: 1999,
    price: 1_450_000,
    resaleRate: 0.85,
    annualDividend: 0,
    isEstate: true,
    stats: { spirit: 10, face: 8 },
    tagline: '四米五挑高红砖拱窗，楼下画廊散场，推窗正对邮政大楼绿顶。',
    story: '拿到红本产权证那天，你再也不用看任何房东脸色，每月省下大笔房租只交千元物业费。',
    perkLabel: '自有产权落户（免租） · 心气 +10 / 腔势 +8',
  },
  {
    id: 'villa',
    flag: 'empire-lux-villa',
    kind: 'luxury',
    name: '衡复梧桐老洋房整栋',
    district: 'anfu',
    location: '安福路 · 衡复风貌区静谧弄堂',
    openYear: 2002,
    price: 8_800_000,
    resaleRate: 0.88,
    annualDividend: 0,
    isEstate: true,
    stats: { face: 16, network: 10, spirit: 12 },
    tagline: '铸铁院门推开是百年香樟，全上海最金贵的安静都在这扇钢窗里。',
    story: '整栋三层带独立南向小花园，老克勒看了都要竖大拇指的压箱底不动产。',
    perkLabel: '顶奢不动产（免租） · 腔势 +16 / 人脉 +10',
  },
  {
    id: 'penthouse',
    flag: 'empire-lux-penthouse',
    kind: 'luxury',
    name: '陆家嘴汤臣江景顶层复式',
    district: 'lujiazui',
    location: '陆家嘴 · 滨江头排天际线顶层',
    openYear: 2006,
    price: 28_000_000,
    resaleRate: 0.9,
    annualDividend: 0,
    isEstate: true,
    penthouseView: true,
    stats: { face: 22, spirit: 15, network: 12 },
    tagline: '二百七十度弧形落地窗正对外滩万国建筑群，整条黄浦江是你的背景墙。',
    story: '私家电梯刷卡直达入户门厅，每年岁末站在落地窗前看末班江轮过境，这就是魔都人生的塔尖。',
    perkLabel: '江景天际线（解锁顶层专属岁末结算） · 腔势 +22',
  },
];

export function ownedEmpireAssets(state: Pick<GameState, 'flags'>): EmpireAsset[] {
  return EMPIRE_ASSETS.filter(asset => state.flags.includes(asset.flag));
}

export function ownedBusinesses(state: Pick<GameState, 'flags'>): EmpireAsset[] {
  return EMPIRE_ASSETS.filter(asset => asset.kind === 'business' && state.flags.includes(asset.flag));
}

export function empireDividend(state: Pick<GameState, 'flags'>): number {
  return ownedBusinesses(state).reduce((sum, item) => sum + item.annualDividend, 0);
}

export function empireAssetValue(state: Pick<GameState, 'flags'>): number {
  return ownedEmpireAssets(state).reduce((sum, item) => sum + item.price, 0);
}

export function ownsEmpirePenthouse(state: Pick<GameState, 'flags'>): boolean {
  return EMPIRE_ASSETS.some(item => item.penthouseView && state.flags.includes(item.flag));
}

export function ownsEmpireClub(state: Pick<GameState, 'flags'>): boolean {
  return EMPIRE_ASSETS.some(item => item.coolsHeat && state.flags.includes(item.flag));
}

export function empireResalePrice(asset: EmpireAsset): number {
  return Math.round(asset.price * asset.resaleRate);
}

export function buyEmpireAsset(state: GameState, assetId: string): GameState {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('先把眼前这件事处理完再置业。');
  }
  const asset = EMPIRE_ASSETS.find(item => item.id === assetId);
  if (!asset) throw new Error('未找到该项产业或资产。');
  const year = calendarYear(state);
  if (year < asset.openYear) throw new Error(`${asset.openYear} 年后才开放这项标的。`);
  if (state.flags.includes(asset.flag)) throw new Error('这项资产已经在你名下了。');
  if (state.cash < asset.price) throw new Error('手头现金不足，再去周转一笔。');

  const next = structuredClone(state);
  next.cash = Math.round(next.cash - asset.price);
  for (const [k, delta] of Object.entries(asset.stats) as [StatKey, number][]) {
    next.stats[k] = clampStat(next.stats[k] + delta);
  }
  next.flags = [...new Set([...next.flags, asset.flag])];

  if (asset.coolsHeat) {
    next.flags = next.flags.filter(flag => !(HUSTLE_HEAT_FLAGS as readonly string[]).includes(flag));
  }
  if (asset.isEstate && next.housing < 3) {
    next.housing = 3;
    next.flags = [...new Set([...next.flags, EMPIRE_HOME_UPGRADED])].filter(
      flag => flag !== FAMILY_HOME && flag !== FAMILY_PAY && flag !== DAYWORK_TEMP && flag !== STAFF_BED,
    );
    if (next.leaseRent !== undefined) next.flags = closeRentalLease(next.flags);
    delete next.leaseRent;
  }

  next.journal = [
    ...next.journal,
    {
      age: next.age,
      title: (asset.kind === 'business' ? '收购产业 · ' : '名流置业 · ') + asset.name,
      text: `斥资 ¥${asset.price.toLocaleString('zh-CN')} 拿下${asset.name}。${asset.tagline}`,
      tag: asset.kind === 'business' ? '产业' : '置业',
    },
  ].slice(-1000);

  return next;
}

export function sellEmpireAsset(state: GameState, assetId: string): GameState {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('先把眼前这件事处理完再处置资产。');
  }
  const asset = EMPIRE_ASSETS.find(item => item.id === assetId);
  if (!asset || !state.flags.includes(asset.flag)) throw new Error('你名下还没有这项资产。');
  const payout = empireResalePrice(asset);
  if (state.cash + payout > MAX_CASH) throw new Error('现金账户已达上限。');

  const next = structuredClone(state);
  next.cash = Math.round(next.cash + payout);
  next.flags = next.flags.filter(flag => flag !== asset.flag);

  if (asset.isEstate) {
    const stillHasEstate = EMPIRE_ASSETS.some(item => item.isEstate && next.flags.includes(item.flag));
    if (!stillHasEstate && next.flags.includes(EMPIRE_HOME_UPGRADED)) {
      next.housing = 1;
      next.flags = next.flags.filter(flag => flag !== EMPIRE_HOME_UPGRADED);
    }
  }

  next.journal = [
    ...next.journal,
    {
      age: next.age,
      title: '资产变现 · ' + asset.name,
      text: `转让${asset.name}，回笼现金 ¥${payout.toLocaleString('zh-CN')}。`,
      tag: asset.kind === 'business' ? '产业' : '置业',
    },
  ].slice(-1000);

  return next;
}
