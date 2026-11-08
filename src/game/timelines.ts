import { forwardClue, PARK_FORWARD_TICKET } from './matchForward';
import { RELOCATION_PLANS, RELOCATION_SHOTS, RELOCATION_TICKET, relocationPhoto } from './relocation';
import { ANFU_CORNER_TICKET, CORNER_STILLS, cornerPhoto } from './streetCorners';
import { laterDaywork, laterHeir } from './lifeYears';
import { contactEvidence, FANG_TICKET_SCENES } from './contactStories';
import type { EventChoice, LifeEvent } from './types';
import { PARK_RETURN_TICKET_SCENES, PARK_TICKET_SCENES } from './matchmaking';
import { RENEWAL_TICKET_SCENES } from './rental';
import { HANDOVER_TICKET } from './workHandover';
import { CONTACT_STILLS, FERRY_STILLS, FIRST_NIGHT_STILLS, LIFE_YEARS_STILLS, MATCH_STILLS, OPENING_STILLS, RENTAL_STILLS, TABLE_STILLS, contactPhoto, datePhoto, farewellPhoto, ferryPhoto, handoverPhoto, lifeYearsPhoto, matchPhoto, offerPhoto, openingPhoto, pearlPhoto, rentalPhoto, stallPhoto, streetPhoto, tablePhoto, workPhoto } from './art';
import { CAREERS, CAST } from './content';
import { PHOTO_SHOP_STILLS, PHOTO_SHOP_STORY, photoShopStill } from './photoShop';

export interface Turn {
  date: string;
  place: string;
  scene: string;
  shot?: string;
  options: { move: string; after: string; next: number | null; shot?: string }[];
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
const archiveShots = {
  station: '/art/timelines/last-train.webp',
  office: '/art/timelines/zhangjiang-desk.webp',
  shoe: '/art/timelines/shoe-repair.webp',
  chair: '/art/timelines/third-chair.webp',
  pearlFirst: '/art/timelines/pearl-quay.webp',
  pearlLater: '/art/timelines/pearl-kiosk.webp',
};
const ticketShots = new Set([
  streetPhoto('station'),
  streetPhoto('people'),
  ...Object.values(archiveShots),
  ...PHOTO_SHOP_STILLS.map(photoShopStill),
  ...FIRST_NIGHT_STILLS.map(streetPhoto),
  ...MATCH_STILLS.map(matchPhoto),
  ...OPENING_STILLS.map(openingPhoto),
  ...LIFE_YEARS_STILLS.map(lifeYearsPhoto),
  ...CONTACT_STILLS.map(contactPhoto),
  ...CORNER_STILLS.map(cornerPhoto),
  ...RELOCATION_SHOTS.map(relocationPhoto),
  ...TABLE_STILLS.map(tablePhoto),
  ...FERRY_STILLS.map(ferryPhoto),
  stallPhoto('close'), stallPhoto('burnt'),
  ...CAREERS.map(career => offerPhoto(career.id)),
  ...CAREERS.map(career => handoverPhoto(career.id)),
  ...(['receipt', 'booth', 'night-office'] as const).map(pearlPhoto),
  ...(['mao', 'he', 'lu'] as const).map(farewellPhoto),
  ...(['reorg', 'overtime', 'shift', 'invoice', 'return', 'payroll', 'settlement'] as const).map(workPhoto),
  ...CAST.filter(person => person.role === 'romance').flatMap(person => [datePhoto(person.id, 'parting'), datePhoto(person.id, 'return'), datePhoto(person.id, 'home')]),
  datePhoto('lin', 'meeting'), datePhoto('lin', 'middle'),
  ...RENTAL_STILLS.map(rentalPhoto),
]);

function validShot(value: unknown) {
  return typeof value === 'string' && ticketShots.has(value) ? { shot: value } : {};
}
function ticketOption(choice: EventChoice, next: number | null) {
  return { move: choice.label.slice(0, 32), after: choice.reply.slice(0, 160), next };
}

const [parkOpening, ...parkFollowups] = PARK_TICKET_SCENES;
const parkStory: Timeline = {
  id: 'park-umbrella', kind: 'life', title: parkOpening.title, author: '魔都人生',
  original: '我当时直接把纸夹上去了。唐圆问完地址，又问馄饨摊开没开。我俩喝完两杯奶茶，出门才发现都没带伞。',
  turns: [
    {
      date: '礼拜天 · 刚停雨', place: '人民公园 · 相亲角', scene: parkOpening.text,
      shot: parkOpening.illustration,
      options: [
        ticketOption(parkOpening.choices[0], 2),
        { move: '先别挂，把纸递给我', after: '汪阿姨把笔也给你了。她刚才试过这支笔，得在手背上划两下才出水。', next: 1 },
      ],
    },
    {
      date: '过了一会儿', place: '人民公园 · 伞边', shot: parkOpening.illustration,
      scene: '你在纸背试了试笔。汪阿姨等着你写，有个小孩过来借她的伞，她说里面还夹着人，等一等。',
      options: [ticketOption(parkOpening.choices[1], 3), ticketOption(parkOpening.choices[2], 4)],
    },
    ...parkFollowups.map((event, index) => ({
      date: ['下午', '摊主还没来', '收伞前'][index],
      place: ['公园门口 · 奶茶店', '人民公园 · 长椅', '人民公园 · 相亲角'][index],
      scene: event.text, shot: event.illustration, options: event.choices.slice(0, 2).map(choice => ticketOption(choice, null)),
    })),
  ],
};

const parkReturn: Timeline = {
  id: 'park-next-year', kind: 'life', title: '第二年，汪阿姨没来', author: '魔都人生',
  original: '我去了鱼摊。汪阿姨果然在，正跟人争哪条鱼算大的。中午一桌五个人，只有鱼摊老板没吃到鱼，他把饭吃完就去称虾了。',
  turns: [
    {
      date: '又到礼拜天', place: '人民公园 · 老位置', shot: streetPhoto('people'),
      scene: '相亲角开了半天，那把蓝伞一直没撑起来。唐圆发来两条消息，说这回有个活，顺路还能看间房。汪阿姨也发了，只有四个字「鱼摊见面」。',
      options: [
        { move: '去公园门口找唐圆', after: '她把没喝完的奶茶递给你腾手，从包里抽出两张纸。', next: 1 },
        { move: '去菜场找汪阿姨', after: '你在卖豆腐的摊位借过一下，前面有人拿两只鱼袋比大小。', next: 4 },
      ],
    },
    {
      date: '过了十分钟', place: '公园门口', shot: matchPhoto('bench'),
      scene: '一张是租房地址，一张是招工的排班表。唐圆看了眼手机。房东十一点就要走，社区活动室的试班也快开始了。',
      options: [
        { move: '先去楼上看那间房', after: '你们上到二楼才发现，楼下晒衣服的人就是房东。', next: 2 },
        { move: '先去问活动室怎么排班', after: '唐圆把租房地址折起来。你看她在表上画了个圈，圈的是试班。', next: 3 },
      ],
    },
    ...PARK_RETURN_TICKET_SCENES.map((event, index) => ({
      date: ['上午十一点', '试班之前', '九点零五'][index],
      place: ['公园后街 · 二楼', '街坊活动室', '菜场 · 小黄鱼摊'][index],
      scene: event.text, shot: event.illustration,
      options: (index === 1 ? [event.choices[1], event.choices[2]] : event.choices.slice(0, 2)).map(choice => ticketOption(choice, null)),
    })),
  ],
};

const rentalReturn: Timeline = {
  id: 'rental-second-year', kind: 'life', title: '设备停了，设备费没停', author: '魔都人生',
  original: '我当时签的三千三。续约前排风机坏了三个月，方姐问我要不要找一下旧单据。我拿手机找了十分钟，先翻出来一份楼下的外卖。',
  turns: [
    {
      date: '搬进来一年', place: '莘庄 · 楼梯间', shot: rentalPhoto('room'),
      scene: '方姐在楼梯拐弯处等你，拿着三份续约单。她说二楼换了帘，三楼能换窗。你问涨了多少，她从楼梯上又下来两步，说得先看你上回签的是哪间。',
      options: [
        { move: '我签的是二楼，把旧单子带上', after: '方姐上楼拿了旧钥匙。她看了眼外面，说今天怎么这么安静。', next: 1 },
        { move: '我住三楼，先去看看窗', after: '窗外有人正给梧桐修枝。叶子落了两片在窗台上，方姐把新单放在旁边。', next: 4 },
      ],
    },
    {
      date: '上了半层楼', place: '二楼 · 房门口', shot: rentalPhoto('contract'),
      scene: '方姐翻到第二页。租金底下还有一条。你想起来去年她问过你，要不要等房东回复再签。',
      options: [
        { move: '那天已经把三百划掉了', after: '你从夹层抽出旧合同。方姐看见那条线，才想起来当时用的是她的笔。', next: 2 },
        { move: '当时我照交，单据都还在', after: '你把那几张单据摊开。窗外连一点机器声也听不到。', next: 3 },
      ],
    },
    ...RENEWAL_TICKET_SCENES.map((event, index) => ({
      date: ['签字之前', '隔壁还没开火', '三楼看完窗'][index],
      place: ['二楼 · 桌边', '二楼 · 窗边', '三楼 · 窗台'][index],
      scene: event.text, shot: event.illustration,
      options: event.choices.slice(0, 2).map(choice => ticketOption(choice, null)),
    })),
  ],
};

const [handoverStart, handoverPay] = HANDOVER_TICKET;
const handoverStory: Timeline = {
  id: 'handover-sheet', kind: 'life', title: '交接单上空着一行', author: '魔都人生',
  original: '我当时先把队列修了，没等周宁签。几年后沈经理问谁接过那摊活。我翻到群里一条「收到」，再往上已经搜不到了。',
  turns: [
    {
      date: '刚入职', place: '张江 · 值班桌', scene: handoverStart.text, shot: handoverStart.illustration,
      options: [ticketOption(handoverStart.choices[0], 1), ticketOption(handoverStart.choices[1], 3)],
    },
    {
      date: '隔年 · 发工资那天', place: '张江 · 工位', scene: handoverPay.text, shot: handoverPay.illustration,
      options: handoverPay.choices.slice(0, 2).map(choice => ticketOption(choice, 2)),
    },
    {
      date: '几年后', place: '陆家嘴 · 会议室', shot: workPhoto('reorg'),
      scene: '沈经理把新组织图摊在桌上，四个人只留三个。你把旧交接单放过去。她看见接班人的签名，问你愿不愿意把这个活教给另一个人。',
      options: [
        { move: '原组照做，留一张给接班的人', after: '她把第三张椅子拉回桌边。下午你教新同事接班，写到末尾特地给他留了一行。', next: null },
        { move: '把交接讲完，带离岗单下楼', after: '你把原件叠好。下楼时保安认得你，问明天还来不来，你想了想，说来拿杯子。', next: null },
      ],
    },
    {
      date: '几年后', place: '陆家嘴 · 会议室', shot: workPhoto('reorg'),
      scene: '沈经理把新组织图摊在桌上，四个人只留三个。你打开手机找当时的记录。群里只留下一句「收到」，没写收到的是哪一班。',
      options: [
        { move: '接隔壁组，先问工资怎么算', after: '她把新数字转过来。隔壁组的人来领你，问你有没有多的显示器。', next: null },
        { move: '签离岗单，先把工资算清', after: '你这回把每个数字都抄了一遍。上车时手机响了一下，原组把你移出了值班群。', next: null },
      ],
    },
  ],
};

function lateTurn(event: LifeEvent, date: string, place: string, picks: [string, number | null][]): Turn {
 return {
  date, place, scene: event.text, shot: event.illustration,
  options: picks.map(([id,next]) => ticketOption(event.choices.find(choice => choice.id===id)!,next)),
 };
}

const workRota = laterDaywork({age:46,jobId:'service',flags:[]})!;
const lateWork = (id: string) => laterDaywork({
 age:59, jobId:'service', flags:workRota.choices.find(choice=>choice.id===id)?.effect.setFlags ?? [],
})!;
const warehouseCard: Timeline = {
 id:'warehouse-card', kind:'life', title:'门卡交给下一个', author:'魔都人生',
 original:'我后来换了白班，工资少了一截，回家赶得上车。十三年后去还门卡，才发现我那张排班表还留在柜子里。',
 turns:[
  lateTurn(workRota,'46 岁 · 换班','莘庄 · 仓库',[['day',1],['night',2]]),
  lateTurn(lateWork('day'),'59 岁 · 回仓库','莘庄 · 更衣室',[['teach',end],['leave',end]]),
  lateTurn(lateWork('night'),'59 岁 · 回仓库','莘庄 · 更衣室',[['teach',end],['shift',end]]),
 ],
};

const loanOpening = laterHeir({age:46,flags:[]})!;
const loanDue = laterHeir({age:47,flags:loanOpening.choices[0].effect.setFlags ?? []})!;
const loanLast = (from: LifeEvent, id: string) => laterHeir({
 age:59, flags:from.choices.find(choice=>choice.id===id)?.effect.setFlags ?? [],
})!;
const factoryHandover: Timeline = {
 id:'factory-handover', kind:'life', title:'公司还欠我四万', author:'魔都人生',
 original:'那回我先收了八万，四万留到交接时核。新负责人把付款单和门卡放在一起，我把门卡先递给了她。',
 turns:[
  lateTurn(loanOpening,'46 岁 · 定金到期','陆家嘴 · 会议室',[['lend',1],['cut',4]]),
  lateTurn(loanDue,'47 岁 · 约好的日子','陆家嘴 · 财务桌',[['full',2],['partial',3]]),
  lateTurn(loanLast(loanDue,'full'),'59 岁 · 交接','车间',[['delegate',end],['leave',end]]),
  lateTurn(loanLast(loanDue,'partial'),'59 岁 · 交接','车间',[['collect',end],['later',end]]),
  lateTurn(loanLast(loanOpening,'cut'),'59 岁 · 交接','车间',[['delegate',end],['record',end]]),
 ],
};

const [deposit, checkedDeposit, settledDeposit] = FANG_TICKET_SCENES;
const fangReturn = (event: LifeEvent): Turn => {
 const turn = lateTurn(event,'十几年后','莘庄 · 交钥匙',[['list',end],['teach',end]]);
 return {...turn, options:turn.options.map(option=>({...option,shot:event.illustration}))};
};
const depositStory: Timeline = {
 id:'fang-deposit', kind:'life', title:'房东要扣九百', author:'魔都人生',
 original:'我们先拿了六百，那天车就开了。后来轮到一个小姑娘交押金，方姐把钥匙摊在桌上，让我看看还少哪一把。',
 turns:[
  {
   date:'搬家当天',place:'莘庄 · 楼梯口',scene:deposit.text,shot:deposit.illustration,
   options:[
    {move:'先翻旧招租视频',after:'你拖回门刚打开的那一秒。方姐叫你别动，把声音也开大了一格。',next:1},
    ticketOption(deposit.choices[1],3),
   ],
  },
  {
   date:'车还在楼下',place:'莘庄 · 旧招租视频',scene:contactEvidence(deposit.id)!.text,shot:deposit.illustration,
   options:[ticketOption(deposit.choices[0],2),ticketOption(deposit.choices[1],3)],
  },
  fangReturn(checkedDeposit),
  fangReturn(settledDeposit),
 ],
};

const [queueCup, queued, gaveSeat] = ANFU_CORNER_TICKET;
const queueReturn = (event: LifeEvent): Turn => {
 const turn = lateTurn(event,'后来','安福路 · 门口的折椅',[['tea',end],['lend',end]]);
 return {...turn,options:turn.options.map(option=>({...option,shot:event.illustration}))};
};
const coffeeQueue: Timeline = {
 id:'queue-cup',kind:'life',title:'那杯咖啡替谁排队',author:'魔都人生',
 original:'我排完收了六十。照片后来上了同城榜，里面只有我一只手。再去时，陈恺已经把椅子修好了。',
 turns:[
  lateTurn(queueCup,'那个下午','安福路 · 不急咖啡',[['queue',1],['seat',2]]),
  queueReturn(queued),
  queueReturn(gaveSeat),
 ],
};

const [workerMove, heirMove, workerRevisit, heirRevisit] = RELOCATION_TICKET;
const receiptEnding = (turn: Turn, scene = turn.scene): Turn => ({
 ...turn,scene,options:turn.options.map(option=>({...option,...(option.next===null&&{shot:turn.shot})})),
});
const amount = (value: number) => '¥'+value.toLocaleString('zh-CN');
const warehouseMove: Timeline = {
 id:'move-warehouse',kind:'life',title:'仓库搬走那年',author:'魔都人生',
 original:'我当时在门口等六点二十那班。后来才知道，楼上那张报价单上，还留着另一个办法。',
 turns:[
  {
   date:'36 岁 · 搬仓前',place:'莘庄 · 旧仓门口',shot:relocationPhoto('warehouse'),
   scene:'车还没开。高原在门口发两张排班单，楼上也有两页纸，财务在等家里管事的人签。你先跟哪一边走？',
   options:[
    {move:'跟高原去门口，看排班和工钱',after:'车头停在老门口。高原指了指时间，让你先看看哪张单赶得上。',next:1},
    {move:'上楼看公司要签的预算',after:'老爸把笔推过来。楼下有人敲了两下车窗，问司机今天跑不跑。',next:2},
   ],
  },
  receiptEnding(lateTurn(workerMove,'36 岁 · 排班','莘庄 · 老门口',[['transfer',3],['local',end]]),
   '六点二十从老门口发车。跟去松江，岗位工资按原薪的 '+Math.round(workerMove.choices[0].effect.payRate!*100)+'% 结，回家要换一次车。旧库还有三个月就近收货，按原薪结。高原把两张单各往前递了一点。'),
  receiptEnding(lateTurn(heirMove,'36 岁 · 签预算','莘庄 · 调度室',[['shuttle',4],['close',end]]),
   '老爸把公司的九万块搬仓预算推过来。包半年班车报价 '+amount(RELOCATION_PLANS[0].initial)+'。按期搬完并结清工钱要留 '+amount(RELOCATION_PLANS[2].initial)+'。楼下的人还在等发车时间。'),
  receiptEnding(lateTurn(workerRevisit,'37 岁 · 续车','松江 · 候车棚',[['express',end],['rebate',end]])),
  receiptEnding(lateTurn(heirRevisit,'37 岁 · 核余额','莘庄 · 调度室',[['extend',end],['finish',end]])),
 ],
};

const [forwardedPaper, replacedPaper, foundPaper, repliedPaper] = PARK_FORWARD_TICKET;
const comparePaper = forwardClue(forwardedPaper.id,{flags:[]})!;
const paperClose = (event: LifeEvent, place: string): Turn => ({
 date:'下回见面',place,scene:event.text,shot:event.illustration,
 options:event.choices.map(choice=>({...ticketOption(choice,end),shot:event.illustration})),
});
const forwardedPaperStory: Timeline = {
 id:'paper-forward',kind:'life',title:'相亲群里那张图',author:'魔都人生',
 original:'我先请管理员撤了旧图。下次到公园，汪阿姨把蓝夹子还我，问还要不要让她传话。',
 turns:[
  {
   date:'群里转了几轮',place:'人民公园 · 奶茶店',scene:forwardedPaper.text,shot:forwardedPaper.illustration,
   options:[
    {move:'把群截图和原件放一起',after:'唐圆把手机亮度往上拨了两格，你才看清有房前头多了个自字。',next:1},
    ticketOption(forwardedPaper.choices[0],2),
   ],
  },
  {
   date:'两张摊开',place:'人民公园 · 奶茶店',
   scene:'原件写「上海有房」。群截图写「上海自有房，今晚八点可看房」。'+comparePaper.text,
   shot:forwardedPaper.illustration,options:[ticketOption(forwardedPaper.choices[2],3),ticketOption(forwardedPaper.choices[1],4)],
  },
  paperClose(replacedPaper,'人民公园 · 原来的摊位'),
  paperClose(foundPaper,'公园后街 · 复印店'),
  paperClose(repliedPaper,'公园后街 · 馄饨摊'),
 ],
};

export const CITY_TIMELINES: Timeline[] = [
  {
    id: 'last-train', kind: 'life', title: '末班车开走之前', author: '魔都人生',
    original: '那晚我坐上了末班车。七年后，公司搬去昆山，爸的修鞋摊还在原来的地方。现在路过，他还是把大一码的拖鞋推到我脚下。',
    turns: [
      {
        date: '2017年 · 22岁', place: '江苏路站', shot: archiveShots.station,
        scene: '闸机还有三分钟关。新老板发来地址，明早去张江报到。爸也发了一条，缝鞋机压了手，问你明天能不能替半天。下面跟着一句「算了，侬上班」。',
        options: [
          { move: '上车，明早准时到张江', after: '你在车门边回了个「好」。打完才发现，这个好不知道是回给谁的。', next: 1 },
          { move: '出站，回家接半天摊', after: '爸左手夹着筷子吃泡饭。看你进门，他把右手往桌底下缩了缩。', next: 2 },
        ],
      },
      {
        date: '2024年 · 29岁', place: '张江 · 工位 37', shot: archiveShots.office,
        scene: '公司搬昆山，工资照发，地铁加班车单程九十分钟。你刚算完，组里小周蹲下来问「师傅，你走我也走，行伐？」签字表传到你这儿了。',
        options: [
          { move: '签，和小周一起去昆山', after: '第一个月你们拼车。后来小周嫌油费贵，自己考了驾照。礼拜五，他顺路把你送到爸的摊前。', next: end },
          { move: '把签字表传下去，约小周出去谈', after: '两人借来一张长桌，接了以前看不上眼的小单。头一个月只够交房租，小周把「总经理」的椅子挂闲鱼卖了。', next: end },
        ],
      },
      {
        date: '2024年 · 29岁', place: '愚园路 · 修鞋摊', shot: archiveShots.shoe,
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
        date: '星期日下午两点', place: '人民广场 · 港式茶餐厅', shot: archiveShots.chair,
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
        date: '2026年 · 早上八点五十', place: '外滩 · 轮渡口', shot: archiveShots.pearlFirst,
        scene: '你刚戳开四块钱的柠檬水，东方明珠扫过来一道红光。手机收到两条来自自己的语音。一条说「把杯子给我，别迟到」，另一条说「上船，我这边已经周五了」。今天明明是周一。',
        options: [
          { move: '端着柠檬水上船', after: '船到浦东，售票员把船票撕成两张。一张是今天，另一张是五年后。', next: 1 },
          { move: '照常去公司，顺手带杯柠檬水', after: '你推开会议室，另一个你刚讲完 PPT。老板鼓掌，让你俩分一下这个月的工资。', next: end },
        ],
      },
      {
        date: '2031年 · 星期五', place: '浦东 · 江边小卖部', shot: archiveShots.pearlLater,
        scene: '来接你的那个人穿着你的旧外套。公司去年倒了，TA 在渡口卖柠檬水。收摊前只剩一杯，贴了张便签「带回去给周一的我」。',
        options: [
          { move: '把这杯带回周一', after: '你把杯子放在工位上。坐你隔壁的人一看配方，问你下班有没有空，一起去找个摊位。', next: end },
          { move: '喝掉，留在这里帮忙收摊', after: '对方递给你一卷零钱。你数完才知道，这个宇宙的五块钱能买两张船票。', next: end },
        ],
      },
    ],
  },
  parkStory,
  parkReturn,
  {
    id: 'half-table', kind: 'life', title: '折起来只有半张', author: '魔都人生',
    original: '那天我让收废品的把桌腿带走了。二十一年后，唐圆从桌底撕出半张报纸。我一看，还是那年给旧桌脚垫的。',
    turns: [
      {
        date: '32岁 · 下午四点半', place: '人民广场附近 · 改衣铺', shot: tablePhoto('folded-table'),
        scene: '改衣铺要搬。唐圆拖出一张折桌，说收废品的人五点到。桌板缺了一角，合页也松。她说修好六百八，问你还要不要。',
        options: [
          { move: '凑六百八，修好放楼下', after: '你们把桌子支起来。隔天有人拿它给孩子包书皮，回去时还多留了一卷胶带。', next: 1 },
          { move: '把桌腿卸了，桌板问问有没有人要', after: '收废品的人只拿走了桌腿。唐圆把桌板靠到门后，过了好久才想起来自己还留着。', next: 2 },
        ],
      },
      {
        date: '46岁 · 楼道动工前', place: '街坊活动室 · 门口', shot: tablePhoto('table-inside'),
        scene: '楼道修下水，桌子得挪。街坊活动室刚腾出来，唐圆拿尺量过，塞进去能剩两把椅子。她问要拿来做点什么。',
        options: [
          { move: '周末开个修补台，先修伞', after: '来拿伞的人又带了口锅，说锅把松了，反正你工具都拿出来了。唐圆翻开记账本。', next: 3 },
          { move: '就留把椅子，谁来都能坐', after: '门上没挂牌。楼上有人照样认得这张桌，哪边缺角都不用再问。', next: 3 },
        ],
      },
      {
        date: '53岁 · 礼拜六', place: '街坊活动室 · 窗边', shot: tablePhoto('empty-chair'),
        scene: '唐圆给桌板配了两条腿。你刚把椅子拉出来，楼上有人来问能不能借桌子用半天。她手里是一把断了两根骨的伞。',
        options: [
          { move: '借给她，顺便把伞打开看看', after: '你们研究了半天，先修好了一根。她说明天再来，剩下一根想自己试试。', next: end },
          { move: '椅子给她，我去坐头班船', after: '唐圆追到门口，问头班几点。你们谁也不知道，最后她也跟了过来。', next: end },
        ],
      },
      {
        date: '53岁 · 又一个礼拜六', place: '街坊活动室 · 窗边', shot: tablePhoto('empty-chair'),
        scene: '靠门还空着一张椅子。隔壁新来的年轻人提着伞站了会儿，问周六能不能跟你们学。唐圆把桌角的杯子往里收了收。',
        options: [
          { move: '坐过来，先数伞有几根骨头', after: '她数错了一遍。第三遍你们两个数出来还不一样，唐圆把伞倒过来，掉出一根早断掉的。', next: end },
          { move: '把工具交给她，周六让她开门', after: '她从你手里接过钥匙，问桌角要不要补。唐圆说那个先留着，来过的人都认它。', next: end },
        ],
      },
    ],
  },
  {
    id: 'rental-fine-print', kind: 'life', title: '房租下面那一行', author: '魔都人生',
    original: '我赶着回去搬箱子，直接签了。月底多出来的三百写的是设备费。我晚上去看设备，隔壁炒到十一点，排风机比我先下班。',
    turns: [
      {
        date: '周六 · 傍晚', place: '莘庄 · 二楼', shot: rentalPhoto('room'),
        scene: '房东在楼下按喇叭。方姐说一月三千，把笔往你面前一搁。你刚坐到床边，玻璃抖了一下。桌上那张合同，下面还垫着半页纸。',
        options: [
          { move: '把底下半页抽出来看完', after: '最下面有一行设备维护费，每月三百。你问是哪台设备，方姐朝窗外看了一眼。', next: 1 },
          { move: '拉开窗，问楼上还有没有房', after: '隔壁开始炒晚市。你俩隔着排风机说了两遍，才听清楼上还空着。', next: 2 },
        ],
      },
      {
        date: '五分钟后', place: '二楼 · 桌边', shot: rentalPhoto('talk'),
        scene: '方姐替你拨通房东电话。听到设备费要划掉，楼下又按了一下喇叭。方姐把电话挪开些，说能先付四千，房租按三千写。',
        options: [
          { move: '按这个价签，把修墙日期也写进去', after: '房东问哪面墙。方姐拍了床头那一块。周四师傅来了，进门先把床挪到了窗底下。', next: end },
          { move: '钥匙先还回去，等他把墙修完', after: '过了两天，方姐发来一张照片。墙刷白了，床也换了个方向。照片下面她还补了一句，设备费确实划掉了。', next: end },
        ],
      },
      {
        date: '一层楼之后', place: '莘庄 · 三楼', shot: rentalPhoto('upstairs'),
        scene: '楼上窗户对着树。你拉到底，能听见楼下有人找车钥匙。方姐把钥匙拎起来，报了每月三千六，签约先付五千二。',
        options: [
          { move: '租楼上，搬箱子的时候借她把手', after: '第三趟你们在拐角卡住了。方姐把你箱子翻过来，发现背面还贴着上海南站的行李条。', next: end },
          { move: '先走，等夜里十一点再来听一遍', after: '十一点零五分，排风机停了。楼上有人练了一遍《两只老虎》。你给方姐发了句，明早带我看离地铁远的那间。', next: end },
        ],
      },
    ],
  },
  rentalReturn,
  handoverStory,
  warehouseCard,
  factoryHandover,
  depositStory,
  coffeeQueue,
  warehouseMove,
  forwardedPaperStory,
  {
    id: 'scallion-bill', kind: 'life', title: '隔壁桌的葱油饼', author: '魔都人生',
    original: '我说了句「放回去」，林佳没理我，自己跟隔壁道了歉。散的时候她把餐巾留在账单底下。我过了两天再去找，老板说早擦桌子了。',
    turns: [
      {
        date: '周五 · 刚上菜', place: '莘庄 · 面馆', shot: datePhoto('lin', 'middle'),
        scene: '林佳已经咬了一口。老板端着另一只空盘过来，说这张饼是隔壁桌的。隔壁坐着一大一小。小的踮着脚，正好看见林佳手里的缺口。',
        options: [
          { move: '掏二十八块，请老板给隔壁重做', after: '隔壁收下了新饼，把桌上的辣酱推了过来。林佳问你要了张干餐巾。', next: 1 },
          { move: '举手认错，问隔壁明早能不能赔一张', after: '小孩说行，但要看着师傅现做。林佳问你八点起得来伐。', next: 2 },
        ],
      },
      {
        date: '当天 · 买完单', place: '莘庄 · 桌边', shot: datePhoto('lin', 'parting'),
        scene: '林佳在餐巾上画了个葱油饼，画了两道眉毛。她说右边那道画重了，你刚才掏钱包的时候就皱成这样。',
        options: [
          { move: '把画收好，问下回几点见', after: '她指了指你装餐巾的兜，说下回把这张带来，背面还能画。', next: end },
          { move: '请她签字，拿去冲抵刚才的二十八', after: '她签了个「林老板」。你抬手喊老板，两个人同时答应了。', next: end },
        ],
      },
      {
        date: '周六 · 早上八点', place: '莘庄 · 早点摊', shot: datePhoto('lin', 'return'),
        scene: '锅里最后一张饼跟脸盆差不多大。昨晚的小孩等在窗口，身后还跟着弟弟。林佳接过油纸袋，问你想吃里面那块，还是边上脆的。',
        options: [
          { move: '脆的给他们，咱俩分中间', after: '她答应得很快。走到路口她问，你昨天是不是也把脆的那一口留给她了。', next: end },
          { move: '整张赔给他们，咱俩去吃粢饭团', after: '她点了两个都加脆的。等老板拿糖罐时，她问你下周还起不起得来。', next: end },
        ],
      },
    ],
  },
  PHOTO_SHOP_STORY,
];

export function timelineShot(timeline: Timeline, index: number) {
  return timeline.turns[index]?.shot ?? CITY_TIMELINES.find(story => story.id === timeline.id)?.turns[index]?.shot;
}

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
        return { move: field(choice.move, 32), after: field(choice.after, 160), next, ...validShot(choice.shot) };
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
    const option: Turn['options'][number] = move.pick === 2 ? { move: '我有个别的办法', after: move.note!, next: null } : turn.options[move.pick];
    if (!option) throw new Error('这条走法接不上');
    next = option.next;
    return { turn, option };
  });
  return { steps, next };
}

export function isTicketHash(hash: string) {
  return hash.startsWith('#timeline=') || hash.startsWith('#story=');
}

export function ticketLink(ticket: Ticket) {
  const url = new URL(window.location.pathname, window.location.origin);
  if (!ticket.route?.length) {
    const original = CITY_TIMELINES.find(story => story.id === ticket.timeline.id);
    if (original) {
      const normal = (timeline: Timeline) => JSON.stringify(validateTicket({ version: 1, timeline }).timeline);
      if (original === ticket.timeline || normal(original) === normal(ticket.timeline)) {
        url.hash = 'story=' + original.id;
        return url.toString();
      }
    }
  }
  const bytes = new TextEncoder().encode(JSON.stringify(ticket));
  url.hash = 'timeline=' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return url.toString();
}

export function ticketFromHash(hash: string): Ticket {
  if (hash.startsWith('#story=')) {
    const timeline = CITY_TIMELINES.find(story => story.id === hash.slice('#story='.length));
    if (!timeline) throw new Error('这张票认不出来');
    return { version: 1, timeline };
  }
  const payload = hash.slice('#timeline='.length);
  if (!/^[-_a-zA-Z0-9]{1,22000}$/.test(payload)) throw new Error('链接没收全');
  const bytes = Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  return validateTicket(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}

const STORAGE_KEY = 'modu-life-timeline-tickets';
export function readTickets(): Ticket[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const seen = new Set<string>();
    return Array.isArray(stored) ? stored.slice(0, 36).flatMap(value => {
      try {
        const ticket = validateTicket(value);
        const key = JSON.stringify(ticket);
        if (seen.has(key)) return [];
        seen.add(key);
        return [ticket];
      } catch { return []; }
    }) : [];
  } catch { return []; }
}

export function saveTicket(ticket: Ticket) {
  const entries = readTickets();
  const normalized = validateTicket(ticket);
  const match = JSON.stringify(normalized);
  const updated = [normalized, ...entries.filter(entry => JSON.stringify(entry) !== match)].slice(0, 36);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeTicket(ticket: Ticket) {
  const match = JSON.stringify(validateTicket(ticket));
  const updated = readTickets().filter(entry => JSON.stringify(entry) !== match);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function draftFromEvent(event: LifeEvent, selected: string, result: string, age: number, district: string): Timeline {
  const options = event.choices.filter(choice => choice.id !== selected).slice(0, 2).map(choice => ticketOption(choice, null));
  return {
    id: crypto.randomUUID(), kind: 'life', title: event.title.slice(0, 28), author: '',
    original: result.slice(0, 160),
    turns: [{ date: age + '岁', place: district, scene: event.text.slice(0, 220), ...validShot(event.illustration), options }],
  };
}
