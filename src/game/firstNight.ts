import type { DistrictId, EventChoice, GameState, LifeEvent } from './types';

import { streetPhoto, type StreetPhoto } from './art';

function scene(id: string, art: StreetPhoto, title: string, text: string, choices: Omit<EventChoice, 'id'>[], district?: DistrictId, speakerId?: string): LifeEvent {
  return {
    id: 'first-night-' + id, title, text, choices: choices.map((choice, i) => ({ ...choice, id: String(i + 1) })),
    district, speakerId, category: district ? 'explore' : 'year', tag: district ? '今晚的事' : '来沪第一年',
    illustration: streetPhoto(art),
  };
}

const arrival = scene('arrival', 'station', '出站前的三条消息',
  '上海南站。雨刮到扶梯底下，行李箱有个轮子不转了。手机一亮，三个人都在等你回话。', [
    { label: '回毛小毛 · 房间先帮我留着', hint: '莘庄有间转租房，九点前看房',
      reply: '毛小毛发来楼栋号，又补一条语音。「先别付钱。他跟我说的是两千，跟你说的是多少？」', effect: { setFlags: ['night-room'] } },
    { label: '回何亮 · 今晚我来顶班', hint: '安福路的面馆临时缺人，当天结',
      reply: '何亮说后厨有件围裙，蓝色的。他停了停，又说别穿白鞋。你低头看了一眼。', effect: { setFlags: ['night-shift'] } },
    { label: '回陆嘉 · 箱子我帮你送', hint: '外滩有趟跑腿，她腾不出手',
      reply: '陆嘉给你转了二十块地铁钱。她说蓝箱子上有个橘子贴纸，真拿错了也先别打开。', effect: { cash: 20, setFlags: ['night-ferry'] } },
  ]);

const room = scene('keys', 'first-night-room', '两把钥匙',
  '毛小毛坐在楼梯上，膝盖上摊着合同。房东指着左边那把钥匙，说阳台算半间房。毛小毛把另一把捡起来。「小间门锁是好的。我们可以一人住一间。」', [
    { label: '跟毛小毛合住 · 先交 ¥1,800',
      reply: '你们一人转了一千八。屋里只有一把椅子，毛小毛把装电饭煲的纸箱翻过来，坐在上面吃面。', effect: { cash: -1800, housing: 1, spirit: 9, trust: 12, setFlags: ['night-shared'] } },
    { label: '请他把合同拍下来 · 今天先别付',
      reply: '毛小毛拍到第三页，房东把合同抽走了。下楼时，毛小毛问你能不能陪他去街口打个电话。', effect: { skill: 5, trust: 6, setFlags: ['night-refused'] } },
  ], 'xinzhuang', 'mao');

const shift = scene('till', 'first-night-shift', '账上少两份面',
  '最后一桌走了。何亮数了两遍钱，少六十八。送餐的小姑娘已经穿上雨衣，说明早有课。何亮把菜单递给你，让你看看哪桌漏了。', [
    { label: '翻收银小票 · 让她先回去',
      reply: '两份面挂在六号桌。何亮看了眼时间，把你那份工钱多算了半小时。「周末也来伐？」', effect: { cash: 320, skill: 4, trust: 7, health: -4, setFlags: ['night-offer'] } },
    { label: '先找何亮结工钱 · 明天再对账',
      reply: '何亮从围裙兜里数出二百二。穿雨衣的姑娘拿着两把伞等在门口，问你走哪个方向。', effect: { cash: 220, network: 4, setFlags: ['night-met-courier'] } },
  ], 'anfu', 'he');

const ferry = scene('box', 'first-night-ferry', '箱底开了',
  '纸箱一提就漏了底，橘子滚下坡道。你收到陆嘉发的「船要开了」，抬头一看，她已经跑下来，蹲在路边够一只橘子。闸机那边开始催了。', [
    { label: '先捡橘子 · 下一班船再走',
      reply: '有三个被车压了。陆嘉等到下一班，把剩下的装进鼓包。「这袋给我爸的。你要不要挑个好的？」', effect: { trust: 13, cash: 100, setFlags: ['night-saved-box'] } },
    { label: '先去追船 · 到了再买一袋',
      reply: '你买了同样大小的一袋。陆嘉拿起一个看了看，说她爸挑橘子喜欢挑有疤的。她还是把跑腿钱转给你了。', effect: { cash: 60, skill: 3, setFlags: ['night-replaced-box'] } },
  ], 'bund', 'lu');

const roomEnd = scene('room-end', 'keys', '冰箱上的欠条',
  '毛小毛用冰箱贴压着两张水电单。他把自己的那份叠起来。「下礼拜发工资。这几天能不能先借我一千？」', [
    { label: '借他 ¥1,000 · 让他自己写还款日',
      reply: '毛小毛把星期五写成了周五，又划掉写了日期。周五晚上，他把钱和一盒盐水鸭一起放到桌上。', effect: { cash: -1000, trust: 12, network: 4 } },
    { label: '这笔钱先留着 · 问问能不能晚几天付',
      reply: '房东答应让他下周补上。回家路上，毛小毛买了两个茶叶蛋，一个塞给你，一个带回去配面。', effect: { trust: 4, skill: 5 } },
  ], undefined, 'mao');

const shiftEnd = scene('shift-end', 'kitchen', '何亮排了张班表',
  '何亮把班表贴到后厨门上。周末两天都有你的名字，工资比上次说的多一点。他按住纸角，等你开口。', [
    { label: '接下来 · 以后按这张表排班',
      reply: '你用店里的笔签了名。何亮拿掉桌上那把散架的椅子，说明天给你找把好的。', effect: { job: 'service', trust: 7 } },
    { label: '只接临时班 · 周末留给自己',
      reply: '何亮擦掉名字，结清上次垫的夜宵钱。后来他缺人，还是先问你当天有没有空。', effect: { cash: 480, network: 6 } },
  ], undefined, 'he');

const ferryEnd = scene('ferry-end', 'ferry', '一袋有疤的橘子',
  '陆嘉把你叫到摆渡口。她爸寄来一袋橘子，个个有疤。她一边分，一边问你星期天有没有空，她演出缺个人帮忙搬音箱。', [
    { label: '去帮忙 · 留到最后一首',
      reply: '搬完音箱，陆嘉把你带到台侧。最后一首她弹错了一个和弦，下台第一句问你听出来没有。', effect: { network: 6, trust: 12, attraction: 5 } },
    { label: '这回去不了 · 把橘子分给她一半',
      reply: '她把自己的那半袋递还给你。「我爸一寄就是十斤。帮我吃两个也算帮忙。」', effect: { spirit: 7, trust: 3 } },
  ], undefined, 'lu');

const missed = scene('missed', 'station', '那条语音过期了',
  '换手机时翻到来上海第一天的聊天。那条语音已经点不开了。对方的头像还在，你盯着输入框看了一会儿。', [
    { label: '问问后来怎么样了',
      reply: '对方回了条十几秒的语音。末尾风很大，你只听清了「有空过来坐坐」。', effect: { network: 5 } },
    { label: '先把号码存下来',
      reply: '你打了两个字又删掉，最后给这个号码填了个备注。', effect: { spirit: 3 } },
  ]);

const routes = [
  { flag: 'night-room', event: room, followup: roomEnd, message: '毛小毛还在楼下等' },
  { flag: 'night-shift', event: shift, followup: shiftEnd, message: '何亮把围裙找出来了' },
  { flag: 'night-ferry', event: ferry, followup: ferryEnd, message: '陆嘉把箱子放在轮渡口' },
];

export const FIRST_NIGHT_FLAG = 'first_night_v2';

export function firstNightLead(state: GameState) {
  if (state.age !== 18 || state.pendingYearEvent || !state.flags.includes(FIRST_NIGHT_FLAG)) return null;
  return routes.find(route => state.flags.includes(route.flag) && !state.seenEvents.includes(route.event.id)) ?? null;
}

export function firstNightYear(state: GameState): LifeEvent | undefined {
  if (!state.flags.includes(FIRST_NIGHT_FLAG)) return undefined;
  if (state.age === 18) return arrival;
  if (state.age !== 19) return undefined;
  const route = routes.find(route => state.flags.includes(route.flag));
  if (!route) return undefined;
  if (!state.seenEvents.includes(route.event.id)) return { ...missed, speakerId: route.event.speakerId };
  // The follow-up remembers the choice, not just the location.
  if (route.event === room && state.flags.includes('night-refused')) return {
    ...roomEnd, title: '毛小毛找了另一间', text: '毛小毛发来新地址。房东肯月付，他自己住一间还是有点吃力，问你愿不愿意借他一千周转。',
  };
  if (route.event === shift && state.flags.includes('night-met-courier')) return {
    ...shiftEnd, title: '围裙还挂着', text: '穿雨衣的姑娘把你拉进面馆的群。她说要回学校了，何亮问她能不能请你来接周末的班。',
  };
  if (route.event === ferry && state.flags.includes('night-replaced-box')) return {
    ...ferryEnd, title: '要挑有疤的', text: '陆嘉拍来一张橘子的照片。她说她爸这次终于吃到了对的那种。星期天她有场演出，问你能不能搭把手。',
  };
  return route.followup;
}
