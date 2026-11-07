import type { LifeEvent } from './types';
import { datePhoto, streetPhoto } from './art';
import { CAST } from './content';

export interface Turn {
  date: string;
  place: string;
  scene: string;
  shot?: string;
  options: { move: string; after: string; next: number | null }[];
}

export interface Timeline {
  id: string;
  kind: 'life' | 'question';
  title: string;
  author: string;
  turns: Turn[];
  original: string;
}

export interface Move {
  pick: number;
  note?: string;
}

export interface Ticket {
  version: 1;
  timeline: Timeline;
  route?: Move[];
}

const end = null;
const ticketShots = new Set([
  streetPhoto('station'),
  ...CAST.filter(person => person.role === 'romance').map(person => datePhoto(person.id, 'return')),
]);

function validShot(value: unknown) {
  return typeof value === 'string' && ticketShots.has(value) ? { shot: value } : {};
}
export const CITY_TIMELINES: Timeline[] = [
  {
    id: 'last-train', kind: 'life', title: '末班车开走之前', author: '魔都人生',
    original: '那晚我坐上了末班车。七年后，公司搬去昆山，爸的修鞋摊还在原来的地方。现在路过，他还是把大一码的拖鞋推到我脚下。',
    turns: [
      {
        date: '2017年 · 22岁', place: '江苏路站',
        scene: '闸机还有三分钟关。新老板发来地址，明早去张江报到。爸也发了一条，缝鞋机压了手，问你明天能不能替半天。下面跟着一句「算了，侬上班」。',
        options: [
          { move: '上车，明早准时到张江', after: '你在车门边回了个「好」。打完才发现，这个好不知道是回给谁的。', next: 1 },
          { move: '出站，回家接半天摊', after: '爸左手夹着筷子吃泡饭。看你进门，他把右手往桌底下缩了缩。', next: 2 },
        ],
      },
      {
        date: '2024年 · 29岁', place: '张江 · 工位 37',
        scene: '公司搬昆山，工资照发，地铁加班车单程九十分钟。你刚算完，组里小周蹲下来问「师傅，你走我也走，行伐？」签字表传到你这儿了。',
        options: [
          { move: '签，和小周一起去昆山', after: '第一个月你们拼车。后来小周嫌油费贵，自己考了驾照。礼拜五，他顺路把你送到爸的摊前。', next: end },
          { move: '把签字表传下去，约小周出去谈', after: '两人借来一张长桌，接了以前看不上眼的小单。头一个月只够交房租，小周把「总经理」的椅子挂闲鱼卖了。', next: end },
        ],
      },
      {
        date: '2024年 · 29岁', place: '愚园路 · 修鞋摊',
        scene: '你当年晚到半天，试用没过。如今牌子上写着「修鞋配钥匙」，底下新添一行「奢侈品修复」。探店博主递来合同，今晚带货，抽四成。爸拿手指头在桌上算。',
        options: [
          { move: '签一场，镜头只拍手', after: '直播卖出十七双护理券。关灯之后，爸问你「刚刚那个说我手好看的，是真人伐？」', next: end },
          { move: '拒了，先给排队的人修完', after: '第一个顾客掏出公交卡包，里面还夹着你爸八年前写的取件条。上面的电话少了一位。', next: end },
        ],
      },
    ],
  },
  {
    id: 'second-chair', kind: 'question', title: '相亲桌上有三把椅子', author: '魔都人生',
    original: '我站起来去买单。后来阿姨还给我发过几张照片，我挑了张人民公园的给她点了赞。',
    turns: [
      {
        date: '星期日下午两点', place: '人民广场 · 港式茶餐厅',
        scene: '人是阿姨介绍的，阿姨也来了。对方把两份餐牌都翻到最后一页，说「你也被交代过，房子的事早点问清爽？」阿姨刚好去拿牙签。',
        options: [
          { move: '直说房是租的，问要不要续杯', after: '对方把菜单合上，说「巧了，我的首付也是租的，每个月还我妈」。你们加点了一份西多士，阿姨回来的时候只剩一个角。', next: end },
          { move: '趁阿姨走开，问要不要出去逛书店', after: '你们在书店待了四十分钟。回到桌上，阿姨已经替你们建好群，群名叫「三方会谈」。', next: end },
        ],
      },
    ],
  },
  {
    id: 'pearl-signal', kind: 'life', title: '东方明珠扫了我一下', author: '魔都人生',
    original: '我把柠檬水扔了，刷卡上班。第二天打卡机说我入职十年了，还给我发了个十周年红包。里面有五块。',
    turns: [
      {
        date: '2026年 · 早上八点五十', place: '外滩 · 轮渡口',
        scene: '你刚戳开四块钱的柠檬水，东方明珠扫过来一道红光。手机收到两条来自自己的语音。一条说「把杯子给我，别迟到」，另一条说「上船，我这边已经周五了」。今天明明是周一。',
        options: [
          { move: '端着柠檬水上船', after: '船到浦东，售票员把船票撕成两张。一张是今天，另一张是五年后。', next: 1 },
          { move: '照常去公司，顺手带杯柠檬水', after: '你推开会议室，另一个你刚讲完 PPT。老板鼓掌，让你俩分一下这个月的工资。', next: end },
        ],
      },
      {
        date: '2031年 · 星期五', place: '浦东 · 江边小卖部',
        scene: '来接你的那个人穿着你的旧外套。公司去年倒了，TA 在渡口卖柠檬水。收摊前只剩一杯，贴了张便签「带回去给周一的我」。',
        options: [
          { move: '把这杯带回周一', after: '你把杯子放在工位上。坐你隔壁的人一看配方，问你下班有没有空，一起去找个摊位。', next: end },
          { move: '喝掉，留在这里帮忙收摊', after: '对方递给你一卷零钱。你数完才知道，这个宇宙的五块钱能买两张船票。', next: end },
        ],
      },
    ],
  },
];

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('这张票认不出来');
  return value as Record<string, unknown>;
}

function field(value: unknown, length: number, optional = false): string {
  if (typeof value !== 'string' || value.length > length || (!optional && !value.trim())) {
    throw new Error('有一栏没写完，或者写得太长了');
  }
  return value.trim();
}

export function validateTicket(value: unknown): Ticket {
  const raw = object(value);
  const source = object(raw.timeline);
  if (raw.version !== 1 || (source.kind !== 'life' && source.kind !== 'question') ||
    !Array.isArray(source.turns) || source.turns.length < 1 || source.turns.length > 5) {
    throw new Error('这张票认不出来');
  }
  const count = source.turns.length;
  const turns: Turn[] = source.turns.map((item, index) => {
    const turn = object(item);
    const openQuestion = source.kind === 'question' && count === 1;
    if (!Array.isArray(turn.options) || (turn.options.length !== 2 && !(openQuestion && turn.options.length === 0))) {
      throw new Error('每个岔路要有两种走法');
    }
    return {
      date: field(turn.date, 28),
      place: field(turn.place, 24),
      scene: field(turn.scene, 220),
      ...validShot(turn.shot),
      options: turn.options.map(item => {
        const choice = object(item);
        const next = choice.next;
        if (next !== null && (typeof next !== 'number' || !Number.isInteger(next) || next <= index || next >= count)) {
          throw new Error('时间线接不上');
        }
        return { move: field(choice.move, 32), after: field(choice.after, 160), next };
      }),
    };
  });
  const timeline: Timeline = {
    id: field(source.id, 48), kind: source.kind, title: field(source.title, 28),
    author: field(source.author, 16), original: field(source.original, 160, true), turns,
  };

  const reached = new Set([0]);
  turns.forEach((turn, index) => {
    if (reached.has(index)) turn.options.forEach(option => {
      if (option.next !== null) reached.add(option.next);
    });
  });
  if (reached.size !== turns.length) throw new Error('还有一幕接不上，选一条路通往那里');
  if (raw.route === undefined) return { version: 1, timeline };
  if (!Array.isArray(raw.route) || raw.route.length > count) throw new Error('这条走法接不上');
  const route: Move[] = raw.route.map(item => {
    const move = object(item);
    if (move.pick !== 0 && move.pick !== 1 && move.pick !== 2) throw new Error('这条走法接不上');
    return move.pick === 2 ? { pick: 2, note: field(move.note, 160) } : { pick: move.pick };
  });
  walk(timeline, route);
  return { version: 1, timeline, route };
}

export function walk(timeline: Timeline, route: Move[]) {
  let next: number | null = 0;
  const steps = route.map(move => {
    if (next === null) throw new Error('这条走法已经走到头了');
    const turn: Turn = timeline.turns[next];
    const option = move.pick === 2 ? { move: '我有个别的办法', after: move.note!, next: null } : turn.options[move.pick];
    if (!option) throw new Error('这条走法接不上');
    next = option.next;
    return { turn, option };
  });
  return { steps, next };
}

export function ticketLink(ticket: Ticket) {
  const url = new URL(window.location.pathname, window.location.origin);
  const bytes = new TextEncoder().encode(JSON.stringify(ticket));
  url.hash = 'timeline=' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return url.toString();
}

export function ticketFromHash(hash: string) {
  const payload = hash.slice('#timeline='.length);
  if (!/^[-_a-zA-Z0-9]{1,22000}$/.test(payload)) throw new Error('链接没收全');
  const bytes = Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  return validateTicket(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}

const STORAGE_KEY = 'modu-life-timeline-tickets';
export function readTickets(): Ticket[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.slice(0, 36).flatMap(value => {
      try { return [validateTicket(value)]; } catch { return []; }
    }) : [];
  } catch { return []; }
}

export function saveTicket(ticket: Ticket) {
  const entries = readTickets();
  const match = JSON.stringify(ticket);
  const updated = [ticket, ...entries.filter(entry => JSON.stringify(entry) !== match)].slice(0, 36);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeTicket(ticket: Ticket) {
  const match = JSON.stringify(ticket);
  const updated = readTickets().filter(entry => JSON.stringify(entry) !== match);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function draftFromEvent(event: LifeEvent, selected: string, result: string, age: number, district: string): Timeline {
  const options = event.choices.filter(choice => choice.id !== selected).slice(0, 2).map(choice => ({
    move: choice.label.slice(0, 32), after: choice.reply.slice(0, 160), next: null,
  }));
  return {
    id: crypto.randomUUID(), kind: 'life', title: event.title.slice(0, 28), author: '',
    original: result.slice(0, 160),
    turns: [{ date: age + '岁', place: district, scene: event.text.slice(0, 220), ...validShot(event.illustration), options }],
  };
}
