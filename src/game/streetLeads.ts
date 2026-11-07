import { firstNightLead } from './firstNight';
import type { GameState, LifeEvent } from './types';

interface StreetLead {
  message: string;
  event: LifeEvent;
  available: (state: GameState) => boolean;
}

const leads: StreetLead[] = [
  {
    message: '房东发来了墙面的照片',
    available: s => s.age >= 20 && s.age <= 31 && s.housing < 3,
    event: {
      id: 'street-lease', title: '这道印子是旧的', category: 'housing', district: 'xinzhuang',
      illustration: '/art/after-hours/keys.webp', tag: '租房',
      text: '退租当天，房东拍了张墙面的照片，说要从押金里扣三百。毛小毛把手机递过来。搬进来那天他拍过视频，可那面墙刚好被纸箱挡住了。',
      choices: [
        { id: 'settle', label: '认这三百 · 今天把账结了', effect: { cash: -300, spirit: 5 },
          reply: '你拿到剩下的押金，约的车正好到了。上车前，毛小毛拍了张空屋的照片发给你。' },
        { id: 'find', label: '翻搬家照片 · 把时间对一遍', effect: { skill: 5, spirit: -3 },
          reply: '照片是房东自己拍的，挂在最早那条招租里。你把链接发过去。他过了十分钟回，说三百一起退。' },
      ],
    },
  },
  {
    message: '沈经理把会议改成了单聊',
    available: s => s.age >= 25 && s.age <= 39 && s.jobId !== null && !['business', 'freelance'].includes(s.jobId),
    event: {
      id: 'street-reorg', title: '名单上只剩一格', category: 'career', district: 'lujiazui', speakerId: 'boss',
      illustration: '/art/after-hours/lujiazui.webp', tag: '工作',
      text: '沈经理把门带上。两个人的活，下月只留一个人做。你可以留下接周末值班，也可以拿公司这次谈好的离职补助。她的电脑还停在值班表那一页。',
      choices: [
        { id: 'stay', label: '留下 · 把周末值班写进排班表', effect: { health: -8, skill: 8, trust: 5 },
          reply: '她当面把值班次数写了上去。周六一早你刷卡进门，保洁阿姨认出你，问今天也算工作日啊。' },
        { id: 'leave', label: '签字离开 · 领 ¥12,000', effect: { job: 'unemployed', cash: 12000, spirit: 8 },
          reply: '办完交接，楼下便利店的店员问你还要不要攒咖啡印花。你把那张差一格的卡送给了后面的人。' },
      ],
    },
  },
  {
    message: '老妈改了两次复诊时间',
    available: s => s.age >= 32 && s.age <= 53,
    event: {
      id: 'street-clinic', title: '早上七点的号', category: 'social', district: 'people', speakerId: 'mother',
      illustration: '/art/after-hours/station.webp', tag: '家里',
      text: '老妈把挂号短信转给你，又撤回了。她在电话里说认得路，去了才知道还要从自助机上取号。你的工作群也在问，早会的文件谁带。',
      choices: [
        { id: 'go', label: '请半天假 · 到医院门口等她', effect: { trust: 12, spirit: 5, network: -2 },
          reply: '老妈拿了两只茶叶蛋。一个她在等叫号时吃了，另一个塞给你，让你带去上班。' },
        { id: 'call', label: '帮她叫车 · 到了给你打电话', effect: { cash: -160, trust: 4, network: 2 },
          reply: '你开完会听到她留的语音。她说号已经取了，旁边有个阿姨也是一个人，她们在聊哪家粢饭团好吃。' },
      ],
    },
  },
  {
    message: '楼下早点摊贴了转让',
    available: s => s.age >= 40 && s.age <= 59 && s.cash >= 6000 && s.jobId !== 'business',
    event: {
      id: 'street-breakfast', title: '炉子跟摊一起转', category: 'business', district: 'xinzhuang', speakerId: 'he',
      illustration: '/art/after-hours/kitchen.webp', tag: '生意',
      text: '何亮掀开盖炉子的塑料布。老板要回老家，连桌椅一起转六千。有人隔着卷帘门问明天还出摊吗。何亮看了你一眼，把那句话留给你答。',
      choices: [
        { id: 'buy', label: '出 ¥6,000 接摊 · 明天照常开', effect: { cash: -6000, job: 'business', network: 12, health: -6 },
          reply: '第一天你把一笼包子蒸过了。那个隔着门问话的客人来了，接过袋子说下次火小点，他明天还来。' },
        { id: 'refer', label: '介绍个接手的人 · 帮老板看合同', effect: { trust: 8, skill: 4 },
          reply: '接手的小夫妻头一周手忙脚乱。原老板已经回乡，还每天早上六点在群里问油烧热没有。' },
      ],
    },
  },
];

export function streetLead(state: GameState) {
  if (state.pendingYearEvent || state.ended) return null;
  return firstNightLead(state) ?? leads.find(lead =>
    !state.seenEvents.includes(lead.event.id) && lead.available(state)
  ) ?? null;
}
