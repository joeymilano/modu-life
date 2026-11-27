import { calendarYear } from './calendar';
import { empireAssetValue, ownedBusinesses, ownedEmpireAssets } from './empire';
import { marketQuote, marketValue, type ListingId } from './market';
import { streetCredOf } from './moduRadio';
import { hashSeed } from './seed';
import { HUSTLE_HEAT_FLAGS, streetHeatOf } from './streetHustles';
import type { GameState } from './types';

export const META_STORAGE_KEY = 'modu-life-meta-v1';
export const XP_PER_LEVEL = 200;
export const MAX_PASS_LEVEL = 10;
export const SPONSOR_COOLDOWN_MS = 45_000;

export type SupplyKey = 'prClear' | 'headhunter' | 'insider' | 'bonusReroll';

export interface ModuSupplies {
  prClear: number;
  headhunter: number;
  insider: number;
  bonusReroll: number;
}

export interface ModuMeta {
  version: 1;
  xp: number;
  blackCard: boolean;
  blackCardSince?: string;
  activeTitle: string;
  unlockedTitles: string[];
  achievements: string[];
  claimedFreeTiers: number[];
  claimedProTiers: number[];
  supplies: ModuSupplies;
  checkin: {
    streak: number;
    lastDate: string;
  };
  lastSponsorAt: number;
  seenLives: string[];
}

export interface ModuAchievement {
  id: string;
  title: string;
  desc: string;
  xp: number;
  check: (game: GameState, meta: ModuMeta) => boolean;
}

export interface PassTier {
  level: number;
  freeLabel: string;
  freeReward: Partial<ModuSupplies> & { title?: string };
  proLabel: string;
  proReward: Partial<ModuSupplies> & { title?: string };
}

export const SUPPLY_INFO: Record<SupplyKey, { name: string; desc: string; actionLabel: string }> = {
  prClear: {
    name: '公关压热令',
    desc: '动用外滩公关人脉，当场平息全部街头风头并恢复 6 点心气。',
    actionLabel: '启用压热',
  },
  headhunter: {
    name: '外滩猎头密函',
    desc: '高管猎头定向举荐，当场提升本事 +6、人脉 +6、腔势 +3（每岁限用一次）。',
    actionLabel: '拆阅密函',
  },
  insider: {
    name: '陆家嘴风向内参',
    desc: '解锁本年度交易所全标的「下一年度涨跌风向预判」（黑卡会员永久免券开启）。',
    actionLabel: '激活内参',
  },
  bonusReroll: {
    name: '老克勒换牌筹码',
    desc: '开局抽牌阶段可额外突破上限多换一张牌（黑卡会员每局自带 +1 次免费重抽）。',
    actionLabel: '开局可用',
  },
};

export const SEASON_PASS_TIERS: readonly PassTier[] = [
  {
    level: 1,
    freeLabel: '陆家嘴风向内参 ×1',
    freeReward: { insider: 1 },
    proLabel: '公关压热令 ×2 · 称号「黑卡新贵」',
    proReward: { prClear: 2, title: '黑卡新贵' },
  },
  {
    level: 2,
    freeLabel: '公关压热令 ×1',
    freeReward: { prClear: 1 },
    proLabel: '外滩猎头密函 ×2',
    proReward: { headhunter: 2 },
  },
  {
    level: 3,
    freeLabel: '称号「弄堂熟手」 · 换牌筹码 ×1',
    freeReward: { bonusReroll: 1, title: '弄堂熟手' },
    proLabel: '风向内参 ×2 · 换牌筹码 ×2',
    proReward: { insider: 2, bonusReroll: 2 },
  },
  {
    level: 4,
    freeLabel: '外滩猎头密函 ×1',
    freeReward: { headhunter: 1 },
    proLabel: '公关压热令 ×2 · 猎头密函 ×1',
    proReward: { prClear: 2, headhunter: 1 },
  },
  {
    level: 5,
    freeLabel: '称号「十里洋场操盘手」 · 内参 ×1',
    freeReward: { insider: 1, title: '十里洋场操盘手' },
    proLabel: '称号「十六铺话事人」 · 全套补给 ×1',
    proReward: { prClear: 1, headhunter: 1, insider: 1, bonusReroll: 1, title: '十六铺话事人' },
  },
  {
    level: 6,
    freeLabel: '公关压热令 ×1',
    freeReward: { prClear: 1 },
    proLabel: '外滩猎头密函 ×2 · 内参 ×2',
    proReward: { headhunter: 2, insider: 2 },
  },
  {
    level: 7,
    freeLabel: '老克勒换牌筹码 ×1',
    freeReward: { bonusReroll: 1 },
    proLabel: '老克勒换牌筹码 ×3',
    proReward: { bonusReroll: 3 },
  },
  {
    level: 8,
    freeLabel: '外滩猎头密函 ×1 · 内参 ×1',
    freeReward: { headhunter: 1, insider: 1 },
    proLabel: '称号「外滩金融巨鳄」 · 猎头密函 ×2',
    proReward: { headhunter: 2, prClear: 2, title: '外滩金融巨鳄' },
  },
  {
    level: 9,
    freeLabel: '公关压热令 ×2',
    freeReward: { prClear: 2 },
    proLabel: '风向内参 ×3 · 换牌筹码 ×2',
    proReward: { insider: 3, bonusReroll: 2 },
  },
  {
    level: 10,
    freeLabel: '满级称号「海派风云人物」',
    freeReward: { bonusReroll: 2, title: '海派风云人物' },
    proLabel: '满级至尊称号「浦江传奇教父」 · 豪华礼箱',
    proReward: { prClear: 3, headhunter: 3, insider: 3, bonusReroll: 3, title: '浦江传奇教父' },
  },
];

export const MODU_ACHIEVEMENTS: readonly ModuAchievement[] = [
  {
    id: 'first_pot',
    title: '第一桶金',
    desc: '单局总身价（现金+持仓+产业）突破 ¥500,000',
    xp: 120,
    check: g => g.cash + marketValue(g) + empireAssetValue(g) >= 500_000,
  },
  {
    id: 'bund_millionaire',
    title: '十里洋场百万户',
    desc: '单局总身价突破 ¥2,000,000',
    xp: 200,
    check: g => g.cash + marketValue(g) + empireAssetValue(g) >= 2_000_000,
  },
  {
    id: 'tycoon_10m',
    title: '浦江千万巨鳄',
    desc: '单局总身价突破 ¥10,000,000',
    xp: 320,
    check: g => g.cash + marketValue(g) + empireAssetValue(g) >= 10_000_000,
  },
  {
    id: 'first_biz',
    title: '挂牌当老板',
    desc: '在魔都产业会收购首家现金流产业',
    xp: 150,
    check: g => ownedBusinesses(g).length >= 1,
  },
  {
    id: 'empire_three',
    title: '商业版图成型',
    desc: '单局同时坐拥 3 家以上魔都现金流产业',
    xp: 300,
    check: g => ownedBusinesses(g).length >= 3,
  },
  {
    id: 'garage_collector',
    title: '沪A名流车房主',
    desc: '购入任意名流座驾或沪上精品不动产',
    xp: 180,
    check: g => ownedEmpireAssets(g).some(item => item.kind === 'luxury'),
  },
  {
    id: 'cred_5star',
    title: '五星上海滩排面',
    desc: '魔都腔势评级达到 5★「上海滩老克勒」',
    xp: 260,
    check: g => streetCredOf(g).stars >= 5,
  },
  {
    id: 'heat_survivor',
    title: '风浪越大鱼越贵',
    desc: '背负 2 级以上街头风头打拼场面',
    xp: 160,
    check: g => streetHeatOf(g).level >= 2,
  },
  {
    id: 'true_love',
    title: '黄浦江畔同路人',
    desc: '与伴侣确立关系且信任度达到 75 以上',
    xp: 180,
    check: g => Boolean(g.partnerId && (g.relationships[g.partnerId]?.trust ?? 0) >= 75),
  },
  {
    id: 'craft_master',
    title: '行里压舱老法师',
    desc: '人物本事属性突破 85 点',
    xp: 180,
    check: g => g.stats.skill >= 85,
  },
  {
    id: 'full_life',
    title: '四十二载风云录',
    desc: '完整走完一局 18 岁至 60 岁的上海人生',
    xp: 260,
    check: g => g.ended && g.age >= 60,
  },
  {
    id: 'multi_origin',
    title: '百态人生收藏家',
    desc: '累计开启 3 局不同种子的魔都人生',
    xp: 200,
    check: (_g, m) => m.seenLives.length >= 3,
  },
];

export const SPONSOR_SPOTS: readonly { station: string; brand: string; copy: string; reward: SupplyKey }[] = [
  {
    station: 'FM 97.7 外滩财经台',
    brand: '十六铺老船长威士忌',
    copy: '「风浪再大，冰球照转——十六铺老船长单一麦芽，敬每一位在牌桌上坐到最后的上海滩狠人。」',
    reward: 'prClear',
  },
  {
    station: 'FM 101.7 陆家嘴夜航',
    brand: '国金汇亚太猎头行',
    copy: '「跳槽不是换工位，是换牌桌——国金汇高管寻访，替你的身价重新开价。」',
    reward: 'headhunter',
  },
  {
    station: 'FM 93.4 浦江证券早报',
    brand: '申江私募研报席位',
    copy: '「散户看热闹，庄家看底牌——申江季度风向内参，提前一年摸清潮水往哪退。」',
    reward: 'insider',
  },
  {
    station: 'FM 103.7 安福路爵士夜',
    brand: '衡复老克勒俱乐部',
    copy: '「发牌手气不好？真正有腔调的人，永远多留一枚换牌筹码。」',
    reward: 'bonusReroll',
  },
];

export function defaultMeta(): ModuMeta {
  return {
    version: 1,
    xp: 0,
    blackCard: false,
    activeTitle: '外滩新客',
    unlockedTitles: ['外滩新客'],
    achievements: [],
    claimedFreeTiers: [],
    claimedProTiers: [],
    supplies: { prClear: 1, headhunter: 0, insider: 1, bonusReroll: 0 },
    checkin: { streak: 0, lastDate: '' },
    lastSponsorAt: 0,
    seenLives: [],
  };
}

export function loadMeta(): ModuMeta {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as Partial<ModuMeta>;
    if (!parsed || typeof parsed !== 'object') return defaultMeta();
    const base = defaultMeta();
    const unlockedTitles = Array.isArray(parsed.unlockedTitles)
      ? [...new Set(['外滩新客', ...parsed.unlockedTitles.filter((x): x is string => typeof x === 'string')])]
      : base.unlockedTitles;
    return {
      version: 1,
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) && parsed.xp >= 0 ? Math.floor(parsed.xp) : 0,
      blackCard: Boolean(parsed.blackCard),
      blackCardSince: typeof parsed.blackCardSince === 'string' ? parsed.blackCardSince : undefined,
      activeTitle:
        typeof parsed.activeTitle === 'string' && unlockedTitles.includes(parsed.activeTitle)
          ? parsed.activeTitle
          : unlockedTitles[0],
      unlockedTitles,
      achievements: Array.isArray(parsed.achievements)
        ? parsed.achievements.filter((x): x is string => typeof x === 'string')
        : [],
      claimedFreeTiers: Array.isArray(parsed.claimedFreeTiers)
        ? parsed.claimedFreeTiers.filter((x): x is number => Number.isInteger(x))
        : [],
      claimedProTiers: Array.isArray(parsed.claimedProTiers)
        ? parsed.claimedProTiers.filter((x): x is number => Number.isInteger(x))
        : [],
      supplies: {
        prClear: Math.max(0, Math.floor(Number(parsed.supplies?.prClear ?? 1) || 0)),
        headhunter: Math.max(0, Math.floor(Number(parsed.supplies?.headhunter ?? 0) || 0)),
        insider: Math.max(0, Math.floor(Number(parsed.supplies?.insider ?? 1) || 0)),
        bonusReroll: Math.max(0, Math.floor(Number(parsed.supplies?.bonusReroll ?? 0) || 0)),
      },
      checkin: {
        streak: Math.max(0, Math.min(7, Math.floor(Number(parsed.checkin?.streak ?? 0) || 0))),
        lastDate: typeof parsed.checkin?.lastDate === 'string' ? parsed.checkin.lastDate : '',
      },
      lastSponsorAt: typeof parsed.lastSponsorAt === 'number' && Number.isFinite(parsed.lastSponsorAt) ? parsed.lastSponsorAt : 0,
      seenLives: Array.isArray(parsed.seenLives)
        ? parsed.seenLives.filter((x): x is string => typeof x === 'string').slice(-50)
        : [],
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: ModuMeta): void {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors in restricted webviews.
  }
}

export function passLevelOf(xp: number): { level: number; progressXp: number; nextXp: number } {
  const level = Math.min(MAX_PASS_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
  const progressXp = level >= MAX_PASS_LEVEL ? XP_PER_LEVEL : xp % XP_PER_LEVEL;
  return { level, progressXp, nextXp: XP_PER_LEVEL };
}

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canClaimDaily(meta: ModuMeta, now = new Date()): boolean {
  return meta.checkin.lastDate !== todayKey(now);
}

export function claimDailySupply(meta: ModuMeta, now = new Date()): { meta: ModuMeta; summary: string } {
  const today = todayKey(now);
  if (meta.checkin.lastDate === today) {
    throw new Error('今日街头补给已经领过了，明早再来。');
  }
  const yesterday = todayKey(new Date(now.getTime() - 86_400_000));
  const streak = meta.checkin.lastDate === yesterday ? (meta.checkin.streak % 7) + 1 : 1;
  const next = structuredClone(meta);
  next.checkin = { streak, lastDate: today };
  const vipMultiplier = next.blackCard ? 2 : 1;
  const xpGain = (50 + streak * 10) * vipMultiplier;
  next.xp += xpGain;

  const cycleReward: SupplyKey = (['insider', 'prClear', 'headhunter', 'bonusReroll'] as const)[(streak - 1) % 4];
  next.supplies[cycleReward] += vipMultiplier;
  const itemLabel = SUPPLY_INFO[cycleReward].name;

  return {
    meta: next,
    summary: `签到第 ${streak} 天：获得 ${itemLabel} ×${vipMultiplier} · 声望 +${xpGain} XP`,
  };
}

export function generateLicenseKey(serial: string): string {
  const clean = serial.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || '1992';
  const sig = (hashSeed('MODU-PRO-' + clean) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `MODU-${clean}-${sig}`;
}

export function verifyBlackCardCode(input: string): boolean {
  const normalized = input.trim().toUpperCase();
  if (['MODU-1992-VIP', 'MODU-BLACK-888', 'SHANGHAI-GTA6'].includes(normalized)) return true;
  const match = /^MODU-([A-Z0-9]{4,6})-([0-9A-F]{4})$/.exec(normalized);
  if (!match) return false;
  const [, serial, sig] = match;
  const expected = (hashSeed('MODU-PRO-' + serial) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return sig === expected;
}

export function activateBlackCard(meta: ModuMeta, code: string, now = new Date()): ModuMeta {
  if (!verifyBlackCardCode(code)) {
    throw new Error('激活码无效，请核对格式（如 MODU-XXXX-XXXX）。');
  }
  const next = structuredClone(meta);
  next.blackCard = true;
  next.blackCardSince = todayKey(now);
  if (!next.unlockedTitles.includes('创始黑卡名流')) {
    next.unlockedTitles.push('创始黑卡名流');
  }
  next.activeTitle = '创始黑卡名流';
  next.supplies.prClear += 2;
  next.supplies.headhunter += 2;
  next.supplies.insider += 2;
  next.supplies.bonusReroll += 2;
  next.xp += 200;
  return next;
}

export function claimPassTier(meta: ModuMeta, level: number, track: 'free' | 'pro'): ModuMeta {
  const tier = SEASON_PASS_TIERS.find(item => item.level === level);
  if (!tier) throw new Error('通行证等级不存在。');
  const currentLevel = passLevelOf(meta.xp).level;
  if (currentLevel < level) throw new Error(`声望尚未达到 Lv.${level}。`);
  if (track === 'pro' && !meta.blackCard) throw new Error('解锁魔都创始黑卡后即可领取尊享轨奖励。');

  const claimedList = track === 'free' ? meta.claimedFreeTiers : meta.claimedProTiers;
  if (claimedList.includes(level)) throw new Error('该档奖励已经领过了。');

  const next = structuredClone(meta);
  if (track === 'free') next.claimedFreeTiers.push(level);
  else next.claimedProTiers.push(level);

  const reward = track === 'free' ? tier.freeReward : tier.proReward;
  for (const key of ['prClear', 'headhunter', 'insider', 'bonusReroll'] as SupplyKey[]) {
    if (reward[key]) next.supplies[key] += reward[key]!;
  }
  if (reward.title && !next.unlockedTitles.includes(reward.title)) {
    next.unlockedTitles.push(reward.title);
    next.activeTitle = reward.title;
  }
  return next;
}

export function claimSponsorReward(meta: ModuMeta, spotIndex: number, nowMs = Date.now()): { meta: ModuMeta; summary: string } {
  if (nowMs - meta.lastSponsorAt < SPONSOR_COOLDOWN_MS) {
    const waitSec = Math.ceil((SPONSOR_COOLDOWN_MS - (nowMs - meta.lastSponsorAt)) / 1000);
    throw new Error(`电台特约时段冷却中，请 ${waitSec} 秒后再收听。`);
  }
  const spot = SPONSOR_SPOTS[((spotIndex % SPONSOR_SPOTS.length) + SPONSOR_SPOTS.length) % SPONSOR_SPOTS.length];
  const next = structuredClone(meta);
  next.lastSponsorAt = nowMs;
  next.supplies[spot.reward] += 1;
  next.xp += 45;
  return {
    meta: next,
    summary: `收听完特约播报：获得「${SUPPLY_INFO[spot.reward].name}」×1 · 声望 +45 XP`,
  };
}

export function syncGameAchievements(
  meta: ModuMeta,
  game: GameState,
): { meta: ModuMeta; newlyUnlocked: ModuAchievement[] } {
  let changed = false;
  const next = structuredClone(meta);

  if (game.seed && !next.seenLives.includes(game.seed)) {
    next.seenLives = [...next.seenLives, game.seed].slice(-50);
    changed = true;
  }

  const newlyUnlocked: ModuAchievement[] = [];
  for (const ach of MODU_ACHIEVEMENTS) {
    if (!next.achievements.includes(ach.id) && ach.check(game, next)) {
      next.achievements.push(ach.id);
      next.xp += ach.xp;
      newlyUnlocked.push(ach);
      changed = true;
    }
  }

  return { meta: changed ? next : meta, newlyUnlocked };
}

export function useTacticalSupply(
  meta: ModuMeta,
  game: GameState,
  supply: 'prClear' | 'headhunter' | 'insider',
): { meta: ModuMeta; game: GameState; message: string } {
  if (game.ended || game.pendingYearEvent || game.showdown || game.episode) {
    throw new Error('请先完成眼前的年度事件或剧情再使用特权指令。');
  }
  if (supply === 'insider' && meta.blackCard) {
    throw new Error('创始黑卡会员已永久开启交易所内参视野，无需消耗内参券。');
  }
  if (meta.supplies[supply] <= 0) {
    throw new Error(`「${SUPPLY_INFO[supply].name}」库存不足，可通过签到或通行证获取。`);
  }

  const nextMeta = structuredClone(meta);
  const nextGame = structuredClone(game);
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  if (supply === 'prClear') {
    const hadHeat = streetHeatOf(nextGame).level > 0;
    nextGame.flags = nextGame.flags.filter(flag => !(HUSTLE_HEAT_FLAGS as readonly string[]).includes(flag));
    nextGame.stats.spirit = clamp(nextGame.stats.spirit + 6);
    nextMeta.supplies.prClear -= 1;
    nextGame.journal = [
      ...nextGame.journal,
      {
        age: nextGame.age,
        title: '外滩公关压热',
        text: hadHeat ? '一通电话打进老码头公关行，街面上的紧风声连夜撤干净了。' : '提前托熟人打点好上下关节，心里踏实不少。',
        tag: '特权',
      },
    ].slice(-1000);
    return {
      meta: nextMeta,
      game: nextGame,
      message: hadHeat ? '街头风头已全部平息 · 心气 +6' : '关节打点完毕 · 心气 +6',
    };
  }

  if (supply === 'headhunter') {
    const usedFlag = `used-headhunter-${nextGame.age}`;
    if (nextGame.flags.includes(usedFlag)) {
      throw new Error('今年已经拆阅过猎头密函了，明年再约。');
    }
    nextGame.flags = [...nextGame.flags, usedFlag];
    nextGame.stats.skill = clamp(nextGame.stats.skill + 6);
    nextGame.stats.network = clamp(nextGame.stats.network + 6);
    nextGame.stats.face = clamp(nextGame.stats.face + 3);
    nextMeta.supplies.headhunter -= 1;
    nextGame.journal = [
      ...nextGame.journal,
      {
        age: nextGame.age,
        title: '外滩猎头密会',
        text: '在国金楼下喝了半小时浓缩咖啡，摸清了今年各大行的底牌与人脉缺口。',
        tag: '特权',
      },
    ].slice(-1000);
    return {
      meta: nextMeta,
      game: nextGame,
      message: '猎头密会完成 · 本事 +6 / 人脉 +6 / 腔势 +3',
    };
  }

  const year = calendarYear(nextGame);
  const insiderFlag = `insider-year-${year}`;
  if (nextGame.flags.includes(insiderFlag)) {
    throw new Error(`${year} 年的交易所内参已经激活了。`);
  }
  nextGame.flags = [...nextGame.flags, insiderFlag];
  nextMeta.supplies.insider -= 1;
  return {
    meta: nextMeta,
    game: nextGame,
    message: `已解锁 ${year} 年度交易所全标的涨跌预判！`,
  };
}

export function hasMarketInsider(meta: ModuMeta, game: GameState): boolean {
  return meta.blackCard || game.flags.includes(`insider-year-${calendarYear(game)}`);
}

export function nextYearQuoteForecast(game: Pick<GameState, 'seed' | 'age' | 'calendar'>, id: ListingId): {
  current: number;
  next: number;
  pct: number;
} {
  const year = calendarYear(game as GameState);
  const current = marketQuote(game, id, year);
  const next = marketQuote(game, id, year + 1);
  const pct = current > 0 ? Math.round(((next - current) / current) * 1000) / 10 : 0;
  return { current, next, pct };
}

export function unclaimedPassCount(meta: ModuMeta): number {
  const { level } = passLevelOf(meta.xp);
  let count = 0;
  for (const tier of SEASON_PASS_TIERS) {
    if (tier.level <= level) {
      if (!meta.claimedFreeTiers.includes(tier.level)) count++;
      if (meta.blackCard && !meta.claimedProTiers.includes(tier.level)) count++;
    }
  }
  if (canClaimDaily(meta)) count++;
  return count;
}
