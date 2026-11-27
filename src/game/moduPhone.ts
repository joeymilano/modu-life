import { calendarYear } from './calendar';
import { CAST } from './content';
import { ownedBusinesses, ownedEmpireAssets } from './empire';
import { marketValue } from './market';
import { streetCredOf } from './moduRadio';
import { hashSeed } from './seed';
import { HUSTLE_HEAT_FLAGS, streetHeatOf } from './streetHustles';
import type { GameState, StatKey } from './types';

export type PhoneEra = 'pager' | 'feature' | 'smart';

export interface PhoneShell {
  era: PhoneEra;
  deviceName: string;
  networkLabel: string;
  feedTitle: string;
}

export interface SocialPost {
  id: string;
  authorId?: string;
  author: string;
  handle: string;
  location: string;
  timeAgo: string;
  text: string;
  likes: number;
  liked: boolean;
  canInteract: boolean;
}

export interface QuickContact {
  id: string;
  name: string;
  role: string;
  cost: number;
  cooldownFlag: string;
  calledThisYear: boolean;
  actionTitle: string;
  desc: string;
}

export interface BlackMarketItem {
  id: string;
  name: string;
  price: number;
  minYear: number;
  cooldownFlag: string;
  boughtThisYear: boolean;
  desc: string;
  perkLabel: string;
  stats: Partial<Record<StatKey, number>>;
  clearsOneHeat?: boolean;
}

const clampStat = (n: number) => Math.max(0, Math.min(100, n));

export function phoneShellOf(state: GameState): PhoneShell {
  const year = calendarYear(state);
  if (year < 1999) {
    return {
      era: 'pager',
      deviceName: '摩托罗拉汉显寻呼 · 大哥大',
      networkLabel: '上海邮电 126 台 · 满格',
      feedTitle: '寻呼台广播与传呼留言',
    };
  }
  if (year < 2010) {
    return {
      era: 'feature',
      deviceName: '诺基亚 N系直板 · 动感地带',
      networkLabel: '中国移动 GPRS · 沪A漫游',
      feedTitle: '短信群发与弄堂飞信',
    };
  }
  return {
    era: 'smart',
    deviceName: '魔都全面屏终端 · 5G',
    networkLabel: 'SH-5G · 浦江满格',
    feedTitle: '魔都朋友圈 · 同城热议',
  };
}

export function phoneFeedOf(state: GameState): SocialPost[] {
  const year = calendarYear(state);
  const heat = streetHeatOf(state);
  const cred = streetCredOf(state);
  const biz = ownedBusinesses(state);
  const lux = ownedEmpireAssets(state).filter(a => a.kind === 'luxury');
  const stockVal = marketValue(state);
  const likeFlagPrefix = `phone-like-${state.age}-`;

  const posts: SocialPost[] = [];

  // 1. Reactive Heat / Street Rumor Post
  if (heat.level >= 2) {
    const id = 'rumor-heat';
    posts.push({
      id,
      author: '上海滩包打听',
      handle: year < 1999 ? '126寻呼群发' : '@bund_insider',
      location: '外滩 · 十六铺防汛墙',
      timeAgo: '12 分钟前',
      text: `听说最近有人在街面上连做几票急单，风头正紧（${heat.label}）。夜里过卢浦大桥瞧见两辆闪灯的巡查车，诸位老法师低调点收网。`,
      likes: 42 + heat.level * 19,
      liked: state.flags.includes(likeFlagPrefix + id),
      canInteract: true,
    });
  }

  // 2. Reactive Empire Business Post
  if (biz.length > 0) {
    const latestBiz = biz[biz.length - 1];
    const id = 'biz-' + latestBiz.id;
    posts.push({
      id,
      authorId: 'fei',
      author: '费启',
      handle: year < 2010 ? '139****8888' : '@fei_lujiazui',
      location: latestBiz.location,
      timeAgo: '38 分钟前',
      text: `昨晚路过${latestBiz.name}，才知道幕后东家已经换成了${state.name}。闷声发大财还是你会玩，下回组局记得给老哥留张熟客台。`,
      likes: 68 + biz.length * 24,
      liked: state.flags.includes(likeFlagPrefix + id),
      canInteract: true,
    });
  }

  // 3. Reactive Luxury / Supercar Post
  if (lux.length > 0) {
    const latestLux = lux[lux.length - 1];
    const id = 'lux-' + latestLux.id;
    posts.push({
      id,
      authorId: 'chen',
      author: '陈恺',
      handle: year < 2010 ? '短信签名' : '@anfu_roaster',
      location: latestLux.location,
      timeAgo: '1 小时前',
      text: `刚在街角撞见那台/处「${latestLux.name}」，排面确实拉满了。在上海滩混出这副腔调，不容易。`,
      likes: 95,
      liked: state.flags.includes(likeFlagPrefix + id),
      canInteract: true,
    });
  }

  // 4. Era & Market Reactive Post
  const marketId = 'era-' + year;
  const eraText =
    year <= 1995
      ? '广东路文化街边全是倒腾认购证和磁带的人，一碗大排面涨到三块五，但谁眼里都冒着光。'
      : year === 2007 || year === 2015
        ? '连弄堂口修脚的爷叔都在聊大盘冲几千点，茶水间没人干活全在盯红绿K线，这行情疯得吓人。'
        : year === 2008
          ? '陆家嘴咖啡馆今天安静得掉针都能听见，好几个做出口跟美股的朋友都在找过桥资金。手里有现金的才是大爷。'
          : stockVal > 200_000
            ? `看了一眼持仓账面（¥${stockVal.toLocaleString('zh-CN')}），风浪里坐得住冷板凳的人，早晚吃上大肉。`
            : '晚高峰二号线挤掉半只鞋，出站买只烤红薯捂手。魔都的账不好算，但明天太阳照常升。';

  posts.push({
    id: marketId,
    authorId: 'mao',
    author: '毛小毛',
    handle: year < 1999 ? '传呼机 #709' : '@mao_xinzhuang',
    location: '莘庄 · 地铁天桥',
    timeAgo: '2 小时前',
    text: eraText,
    likes: 23 + (hashSeed(state.seed + year) % 45),
    liked: state.flags.includes(likeFlagPrefix + marketId),
    canInteract: true,
  });

  // 5. Romance / Cast Reactive Post
  const metPartner = state.partnerId
    ? CAST.find(c => c.id === state.partnerId)
    : CAST.find(c => c.role === 'romance' && state.relationships[c.id]?.met);
  if (metPartner) {
    const id = 'cast-' + metPartner.id;
    posts.push({
      id,
      authorId: metPartner.id,
      author: metPartner.name,
      handle: year < 2010 ? '私人号码' : `@${metPartner.id}_sh`,
      location: '苏州河畔 · 夜风',
      timeAgo: '昨晚',
      text:
        state.partnerId === metPartner.id
          ? '回家的路上顺手买了两只鲜肉月饼，还烫手，留了一只等门响。'
          : `今天收工早，沿着梧桐马路走了一站地。忙归忙，总得留半小时给自己喘口气。（腔势印象：${cred.title}）`,
      likes: 51,
      liked: state.flags.includes(likeFlagPrefix + id),
      canInteract: true,
    });
  }

  return posts.slice(0, 4);
}

export function likePhonePost(state: GameState, postId: string, authorId?: string): GameState {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('先把眼前这件事处理完再刷手机。');
  }
  const flag = `phone-like-${state.age}-${postId}`;
  if (state.flags.includes(flag)) throw new Error('这条动态已经点过赞了。');

  const next = structuredClone(state);
  next.flags = [...next.flags, flag];
  next.stats.spirit = clampStat(next.stats.spirit + 1);
  next.stats.network = clampStat(next.stats.network + 1);
  if (authorId && next.relationships[authorId]) {
    next.relationships[authorId].met = true;
    next.relationships[authorId].trust = clampStat(next.relationships[authorId].trust + 2);
  }
  return next;
}

export function quickContactsOf(state: GameState): QuickContact[] {
  const flagPrefix = `phone-call-${state.age}-`;
  return [
    {
      id: 'mao',
      name: '毛小毛 · 街头百事通',
      role: '老乡搭子',
      cost: 0,
      cooldownFlag: flagPrefix + 'mao',
      calledThisYear: state.flags.includes(flagPrefix + 'mao'),
      actionTitle: '通电话嘎三胡摸行情',
      desc: '不花钱唠十分钟家常，恢复心气 +5、人脉 +3，毛小毛与你信任 +3。',
    },
    {
      id: 'yan',
      name: '严可 · 夜班急诊熟人',
      role: '医护朋友',
      cost: 800,
      cooldownFlag: flagPrefix + 'yan',
      calledThisYear: state.flags.includes(flagPrefix + 'yan'),
      actionTitle: '预约私家理疗调养 · ¥800',
      desc: '下班顺路去挂个营养针做推拿，身体 +10、心气 +4。',
    },
    {
      id: 'fei',
      name: '费启 · 外滩组局经纪',
      role: '名利场掮客',
      cost: 3_600,
      cooldownFlag: flagPrefix + 'fei',
      calledThisYear: state.flags.includes(flagPrefix + 'fei'),
      actionTitle: '攒一桌外滩私密红酒局 · ¥3,600',
      desc: '替你引荐城中叔伯与买手，腔势 +6、人脉 +7。',
    },
    {
      id: 'gu',
      name: '老码头律所 · 加急公关',
      role: '危机摆平人',
      cost: 6_800,
      cooldownFlag: flagPrefix + 'gu',
      calledThisYear: state.flags.includes(flagPrefix + 'gu'),
      actionTitle: '委托律师出面撤下街头风声 · ¥6,800',
      desc: '花钱消灾，当场抹平 2 桩街头急单风头，心气 +4。',
    },
  ];
}

export function callQuickContact(state: GameState, contactId: string): { state: GameState; summary: string } {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('先把眼前的事件处理完再打电话。');
  }
  const item = quickContactsOf(state).find(c => c.id === contactId);
  if (!item) throw new Error('号码不在通讯录里。');
  if (item.calledThisYear) throw new Error('今年已经联系过这位了，明年再约。');
  if (state.cash < item.cost) throw new Error('话费或局钱不够，手头先留点余粮。');

  const next = structuredClone(state);
  next.cash -= item.cost;
  next.flags = [...next.flags, item.cooldownFlag];

  if (contactId === 'mao') {
    next.stats.spirit = clampStat(next.stats.spirit + 5);
    next.stats.network = clampStat(next.stats.network + 3);
    if (next.relationships.mao) {
      next.relationships.mao.met = true;
      next.relationships.mao.trust = clampStat(next.relationships.mao.trust + 3);
    }
    return { state: next, summary: '毛小毛在电话那头把最近哪条街房租便宜全抖给了你 · 心气 +5 / 人脉 +3' };
  }
  if (contactId === 'yan') {
    next.stats.health = clampStat(next.stats.health + 10);
    next.stats.spirit = clampStat(next.stats.spirit + 4);
    if (next.relationships.yan) {
      next.relationships.yan.met = true;
      next.relationships.yan.trust = clampStat(next.relationships.yan.trust + 3);
    }
    return { state: next, summary: '严可替你开了套调理方子，紧绷的肩颈松快多了 · 身体 +10 / 心气 +4' };
  }
  if (contactId === 'fei') {
    next.stats.face = clampStat(next.stats.face + 6);
    next.stats.network = clampStat(next.stats.network + 7);
    if (next.relationships.fei) {
      next.relationships.fei.met = true;
      next.relationships.fei.trust = clampStat(next.relationships.fei.trust + 3);
    }
    return { state: next, summary: '外滩包厢三巡酒过，桌上几位老板都记住了你的名字 · 腔势 +6 / 人脉 +7' };
  }

  // Crisis lawyer PR
  let removed = 0;
  next.flags = next.flags.filter(flag => {
    if (removed < 2 && (HUSTLE_HEAT_FLAGS as readonly string[]).includes(flag)) {
      removed++;
      return false;
    }
    return true;
  });
  next.stats.spirit = clampStat(next.stats.spirit + 4);
  return {
    state: next,
    summary: removed > 0 ? `律所连夜发函摆平了 ${removed} 桩街头风声 · 心气 +4` : '律师替你备好了合规底档，有备无患 · 心气 +4',
  };
}

export function blackMarketOf(state: GameState): BlackMarketItem[] {
  const year = calendarYear(state);
  const flagPrefix = `phone-bm-${state.age}-`;
  return [
    {
      id: 'pass',
      name: '和平饭店酒会暗门请柬',
      price: 2_400,
      minYear: 1992,
      cooldownFlag: flagPrefix + 'pass',
      boughtThisYear: state.flags.includes(flagPrefix + 'pass'),
      desc: '黄牛手里的烫金副卡，混进顶楼露台听半晚大佬交底。',
      perkLabel: '腔势 +5 · 人脉 +4',
      stats: { face: 5, network: 4 },
    },
    {
      id: 'tonic',
      name: '淮海路老字号参茸膏方',
      price: 3_200,
      minYear: 1992,
      cooldownFlag: flagPrefix + 'tonic',
      boughtThisYear: state.flags.includes(flagPrefix + 'tonic'),
      desc: '熬夜拼命后的硬核回血补给，早晚一勺把底子托住。',
      perkLabel: '身体 +12 · 心气 +5',
      stats: { health: 12, spirit: 5 },
    },
    {
      id: 'ledger',
      name: '张江内部行业拆解密报',
      price: 5_800,
      minYear: 1998,
      cooldownFlag: flagPrefix + 'ledger',
      boughtThisYear: state.flags.includes(flagPrefix + 'ledger'),
      desc: '猎头与技术总监私下传阅的实战复盘，少走两年弯路。',
      perkLabel: '本事 +9 · 人脉 +3',
      stats: { skill: 9, network: 3 },
    },
    {
      id: 'cleanplate',
      name: '外环套牌换壳与公关封口包',
      price: 9_500,
      minYear: 1995,
      cooldownFlag: flagPrefix + 'cleanplate',
      boughtThisYear: state.flags.includes(flagPrefix + 'cleanplate'),
      desc: '专治急单留下的手尾，悄无声息抹掉一桩街头风头并涨腔势。',
      perkLabel: '消减 1 级风头 · 腔势 +4',
      stats: { face: 4 },
      clearsOneHeat: true,
    },
  ].filter(item => year >= item.minYear);
}

export function buyBlackMarketItem(state: GameState, itemId: string): { state: GameState; summary: string } {
  if (state.ended || state.pendingYearEvent || state.showdown || state.episode) {
    throw new Error('先把眼前的事件处理完再下单。');
  }
  const item = blackMarketOf(state).find(i => i.id === itemId);
  if (!item) throw new Error('这件暗线货品今年没货。');
  if (item.boughtThisYear) throw new Error('这件货今年已经拿过了，明年初再补货。');
  if (state.cash < item.price) throw new Error('手头现钱不够付跑腿定金。');

  const next = structuredClone(state);
  next.cash -= item.price;
  next.flags = [...next.flags, item.cooldownFlag];
  for (const [k, v] of Object.entries(item.stats) as [StatKey, number][]) {
    next.stats[k] = clampStat(next.stats[k] + v);
  }
  if (item.clearsOneHeat) {
    const target = next.flags.find(f => (HUSTLE_HEAT_FLAGS as readonly string[]).includes(f));
    if (target) next.flags = next.flags.filter(f => f !== target);
  }
  next.journal = [
    ...next.journal,
    {
      age: next.age,
      title: '暗巷闪送 · ' + item.name,
      text: `花 ¥${item.price.toLocaleString('zh-CN')} 从暗线渠道路子拿下了「${item.name}」。`,
      tag: '暗线',
    },
  ].slice(-1000);
  return { state: next, summary: `闪送签收「${item.name}」 · ${item.perkLabel}` };
}

export function unreadPhoneCount(state: GameState): number {
  return phoneFeedOf(state).filter(post => !post.liked).length;
}
