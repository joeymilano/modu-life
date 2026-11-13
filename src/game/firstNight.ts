import { calendarYear, SHANGHAI_STATION_1992 } from './calendar';
import type { DistrictId, EventChoice, GameState, LifeEvent } from './types';

import { arrivalPhoto, streetPhoto, type StreetPhoto } from './art';
import { arrivalDrama, arrivalDramaFinale, arrivalDramaThread, arrivalDramaVisit } from './arrivalDrama';
import { OPENING_ALLIES, OPENING_DRAMA, OPENING_PROOF } from './openingStakes';

function scene(id: string, art: StreetPhoto, title: string, text: string, choices: Omit<EventChoice, 'id'>[], district?: DistrictId, speakerId?: string): LifeEvent {
  return {
    id: 'first-night-' + id, title, text, choices: choices.map((choice, i) => ({ ...choice, id: String(i + 1) })),
    district, speakerId, category: district ? 'explore' : 'year', tag: district ? '今晚的事' : '来沪第一年',
    illustration: streetPhoto(art),
  };
}

const arrival = scene('arrival', 'first-night-arrival', '出站前的三条消息',
  '箱子有个轮子不转。你在南站出口踢了两脚，手机先震了三下。', [
    { label: '回毛小毛 · 房间先帮我留着', hint: '莘庄那间九点前能看。侬出站了伐？', senderId: 'mao',
      reply: '先别转钱。我在三号楼。房东说两千，刚又说阳台算半间，侬上来自己听。', effect: { setFlags: ['night-room'] } },
    { label: '回何亮 · 今晚我来顶班', hint: '今晚缺个人。来就给你留一碗，工钱今天结。', senderId: 'he',
      reply: '从前门进，别敲后门。蓝围裙给你留了。还有，别穿白鞋。', effect: { setFlags: ['night-shift'] } },
    { label: '回陆嘉 · 箱子我帮你送', hint: '你晚上去外滩吗？我爸的橘子还在码头。', senderId: 'lu',
      reply: '转你二十块坐地铁。蓝胶带，橘子贴纸。拿错了也先别拆，上回我爸那箱是咸肉。', effect: { cash: 20, setFlags: ['night-ferry'] } },
  ]);

const room = scene('keys', 'first-night-room', '两把钥匙',
  '毛小毛坐在楼梯上，膝盖上摊着合同。房东指着左边那把钥匙，说阳台算半间房。毛小毛把另一把捡起来。「小间门锁是好的。我们可以一人住一间。」', [
    { label: '跟毛小毛合住 · 先交 ¥1,800',
      reply: '你们一人转了一千八。屋里只有一把椅子，毛小毛把装电饭煲的纸箱翻过来，坐在上面吃面。', effect: { cash: -1800, housing: 1, spirit: 9, trust: 12, setFlags: ['night-shared'] } },
    { label: '请他把合同拍下来 · 今天先别付',
      reply: '毛小毛拍到第三页，房东把合同抽走了。下楼时，毛小毛问你能不能陪他去街口打个电话。', effect: { skill: 5, trust: 6, setFlags: ['night-refused'] } },
    { label: '先不签 · 出 ¥160 请人来修锁',
      reply: '锁匠顺手修了大门。毛小毛在楼下等你，说租房没谈成，倒把整层楼的人都认识了。', effect: { cash: -160, trust: 10, network: 6, setFlags: ['night-refused'] } },
  ], 'xinzhuang', 'mao');

const shift = scene('till', 'first-night-shift', '账上少两份面',
  '最后一桌走了。何亮数了两遍钱，少六十八。送餐的小姑娘已经穿上雨衣，说明早有课。何亮把菜单递给你，让你看看哪桌漏了。', [
    { label: '留下来逐桌对 · 让她先走',
      reply: '账对完，门口只剩你俩。何亮多算了你半小时工钱，说下回把晚饭也一起算上。', effect: { cash: 320, skill: 4, trust: 7, health: -4, setFlags: ['night-offer'] } },
    { label: '先找何亮结工钱 · 明天再对账',
      reply: '何亮从围裙兜里数出二百二。穿雨衣的姑娘拿着两把伞等在门口，问你走哪个方向。', effect: { cash: 220, network: 4, setFlags: ['night-met-courier'] } },
    { label: '对取餐号 · 把重打的那张划掉',
      reply: '何亮拿计算器按了三遍。没少钱。他给你二百六，又把计算器推过来，问你周六来不来。', effect: { cash: 260, skill: 7, trust: 8, setFlags: ['night-offer'] } },
  ], 'anfu', 'he');

const ferry = scene('box', 'first-night-ferry', '箱底开了',
  '纸箱一提就漏了底，橘子滚下坡道。你收到陆嘉发的「船要开了」，抬头一看，她已经跑下来，蹲在路边够一只橘子。闸机那边开始催了。', [
    { label: '先捡橘子 · 下一班船再走',
      reply: '有三个被车压了。陆嘉等到下一班，把剩下的装进鼓包。「这袋给我爸的。你要不要挑个好的？」', effect: { trust: 13, cash: 100, setFlags: ['night-saved-box'] } },
    { label: '先去追船 · 到了再买一袋',
      reply: '你买了同样大小的一袋。陆嘉拿起一个看了看，说她爸挑橘子喜欢挑有疤的。她还是把跑腿钱转给你了。', effect: { cash: 60, skill: 3, setFlags: ['night-replaced-box'] } },
    { label: '用打包带兜住箱子 · 一起赶船',
      reply: '你们一人拽一头，刚好上船。陆嘉给你六十块，挑出最丑的一个橘子，说这个归你，甜的。', effect: { cash: 60, trust: 11, spirit: 8, setFlags: ['night-saved-box'] } },
  ], 'bund', 'lu');

const roomEnd = scene('room-end', 'first-night-room-bill', '冰箱上的欠条',
  '毛小毛用冰箱贴压着两张水电单。他把自己的那份叠起来。「下礼拜发工资。这几天能不能先借我一千？」', [
    { label: '借他 ¥1,000 · 让他自己写还款日',
      reply: '他把借条贴回冰箱，去厨房把你那份泡面也煮了。面里有个蛋，他说冰箱里剩最后一个。', effect: { cash: -1000, trust: 12, network: 4, setFlags: ['night-fronted-bill'] } },
    { label: '这笔钱先留着 · 问问能不能晚几天付',
      reply: '房东答应让他下周补上。回家路上，毛小毛买了两个茶叶蛋，一个塞给你，一个带回去配面。', effect: { trust: 4, skill: 5 } },
    { label: '先垫 ¥300 · 水电单贴在冰箱上',
      reply: '他把三百转给房东，水电单也没撕。从那天起他出门关空调都要喊一声，你在屋里替他看一眼。', effect: { cash: -300, trust: 8, spirit: 3 } },
  ], undefined, 'mao');

const shiftEnd = scene('shift-end', 'first-night-shift-rota', '何亮排了张班表',
  '何亮把班表贴到后厨门上。周末两天都有你的名字，工资比上次说的多一点。他按住纸角，等你开口。', [
    { label: '接下来 · 以后按这张表排班',
      reply: '你用店里的笔签了名。何亮拿掉桌上那把散架的椅子，说明天给你找把好的。', effect: { job: 'service', trust: 7, setFlags: ['night-took-rota'] } },
    { label: '只接临时班 · 周末留给自己',
      reply: '何亮擦掉名字，结清上次垫的夜宵钱。后来他缺人，还是先问你当天有没有空。', effect: { cash: 480, network: 6 } },
    { label: '想去大店试试 · 请他帮我打个电话',
      reply: '何亮打给以前的领班，就说了一句「这人账对得比我快」。周一你去人家店里，领班先拿了本账让你看。', effect: { skill: 6, network: 8 } },
  ], undefined, 'he');

const ferryEnd = scene('ferry-end', 'first-night-ferry-oranges', '一袋有疤的橘子',
  '陆嘉把你叫到摆渡口。她爸寄来一袋橘子，个个有疤。她一边分，一边问你星期天有没有空，她演出缺个人帮忙搬音箱。', [
    { label: '去帮忙 · 留到最后一首',
      reply: '搬完音箱，陆嘉把你带到台侧。最后一首她弹错了一个和弦，下台第一句问你听出来没有。', effect: { network: 6, trust: 12, attraction: 5, setFlags: ['night-heard-last-song'] } },
    { label: '这回去不了 · 把橘子分给她一半',
      reply: '她把自己的那半袋递还给你。「我爸一寄就是十斤。帮我吃两个也算帮忙。」', effect: { spirit: 7, trust: 3 } },
    { label: '周日得上班 · 我帮你借辆推车',
      reply: '你去问码头的老板借了辆车。演完她把车还回去，车筐里剩两只橘子，压着一张手写的下场演出单。', effect: { network: 5, trust: 8 } },
  ], undefined, 'lu');

const roomViewing = scene('room-end', 'first-night-room-viewing', '毛小毛找了另一间',
  '毛小毛试了三遍门锁，确认钥匙拔得下来。他说这回房东肯月付，两人合租的话，一人先出一千二。门后还有一只电饭煲没拆，他问你现在住的地方怎么样。', [
    { label: '这次一起租 · 先付 ¥1,200',
      reply: '你们把名字一前一后签在合同上。毛小毛拿来两把钥匙，这回先让你挑。', effect: { cash: -1200, housing: 1, trust: 12, setFlags: ['night-shared-later'] } },
    { label: '我先不搬 · 帮他把合同再看一遍',
      reply: '他划掉那条「退租须提前两个月」。房东看完也签了。你要走时，毛小毛问借不借用一下你的手机，他想给家里拍个屋子全景。', effect: { skill: 7, trust: 7 } },
    { label: '先把锁换了 · 我出 ¥160',
      reply: '锁匠下楼以后，毛小毛把备用钥匙递给你。「万一我又把自己锁在外头。」你接过来，说这回可别放门垫下面。', effect: { cash: -160, trust: 10 } },
  ], undefined, 'mao');

const shiftHandover = scene('shift-end', 'first-night-shift-handover', '围裙还挂着',
  '那晚在门口等你的姑娘，把你拉进了面馆的群。她下周回学校，何亮把一件洗过的围裙放到台上，说你要愿意，周末两个班都能接。她低头看了下手机，问你今晚能不能先替她收一次摊。', [
    { label: '接她的周末班 · 以后照表来',
      reply: '何亮在群里改了排班。她把围裙递给你，说下班从后门走，钥匙在左边兜里。你伸手一摸，先摸出来两颗薄荷糖。', effect: { job: 'service', trust: 7, setFlags: ['night-took-rota'] } },
    { label: '只替今晚 · 收工拿 ¥380',
      reply: '十点半打烊。她发消息说车已经开了，问你店里门口那桶水倒了没有。你说刚倒，过了会儿才发现自己还坐在凳子上。', effect: { cash: 380, network: 6, health: -3 } },
    { label: '这周排不开 · 帮何亮问问夜校同学',
      reply: '同学第二天就来试工，何亮问能不能把那张三个人的排班表贴一个月。他终于可以连休两天了。', effect: { network: 9, trust: 5 } },
  ], undefined, 'he');

const ferryGig = scene('ferry-end', 'first-night-ferry-gig', '要挑有疤的',
  '陆嘉从演出后门探出头。她把一只有疤的橘子搁在音箱旁，说是她爸让她给你的。音箱比她想的沉，门口那截台阶还湿着。里面已经有人在试鼓。', [
    { label: '抬进去 · 留下来帮她录最后一首',
      reply: '散场后她听了一遍录音，先听到你剥橘子的声音。她把手机还给你，说发她一份，开头那几秒也留着。', effect: { trust: 12, attraction: 5, spirit: 6, setFlags: ['night-recorded-song'] } },
    { label: '先帮她搬完 · 今天得赶末班车',
      reply: '陆嘉把橘子塞进你外套兜里，跑回去试音。你到闸机口才收到她转来的二十块，说是这回真拿去坐车。', effect: { cash: 20, trust: 5 } },
    { label: '去借个坡板 · 门槛别硬抬',
      reply: '隔壁修车的大哥拖了块木板过来。音箱推进去没磕着，他倒在后门站着听完了整首歌。', effect: { skill: 5, network: 7, trust: 5 } },
  ], undefined, 'lu');

const missed = scene('missed', 'station', '那条语音过期了',
  '换手机时翻到来上海第一天的聊天。那条语音已经点不开了。对方的头像还在，你盯着输入框看了一会儿。', [
    { label: '问问后来怎么样了',
      reply: '对方回了条十几秒的语音。末尾风很大，你只听清了「有空过来坐坐」。', effect: { network: 5 } },
    { label: '先把号码存下来',
      reply: '你打了两个字又删掉，最后给这个号码填了个备注。', effect: { spirit: 3 } },
  ]);

const routes = [
  {
    flag: 'night-room', event: room, followup: roomEnd, alternate: { flag: 'night-refused', event: roomViewing },
    message: '毛小毛还在楼下等',
    inbox: {
      photo: streetPhoto('inbox-room'), alt: '旧门锁上的钥匙，和刚收拾出来的小房间',
      note: '拍照用了广角。你到门口就晓得了。', go: '去莘庄看房',
    },
    clue: { label: '试试门锁', text: '门缝塞了片硬纸。毛小毛一拔，门就锁不上了。他抬着门把手，叫你先别松。' },
  },
  {
    flag: 'night-shift', event: shift, followup: shiftEnd, alternate: { flag: 'night-met-courier', event: shiftHandover },
    message: '何亮把围裙找出来了',
    inbox: {
      photo: streetPhoto('inbox-shift'), alt: '后厨凳子上挂着蓝围裙，台上放着一碗葱油拌面',
      note: '先吃面。你饿着肚子，等会儿找零容易多给。', go: '去安福路顶班',
    },
    clue: { label: '摊开两张小票', text: '两张都打了两碗面，取餐号也一样。第二张底下多印了两个字，补打。' },
  },
  {
    flag: 'night-ferry', event: ferry, followup: ferryEnd, alternate: { flag: 'night-replaced-box', event: ferryGig },
    message: '陆嘉把箱子放在轮渡口',
    inbox: {
      photo: streetPhoto('inbox-ferry'), alt: '轮渡口栏杆边，有只缠蓝胶带的纸箱',
      note: '蓝胶带那只。阿叔帮我挪到栏杆边了。', go: '去轮渡口拿橘子',
    },
    clue: { label: '翻一下箱底', text: '箱子底下压着根旧打包带。你扯了一下，没断。两边各拽一头，能把箱底兜住。' },
  },
];

export function firstNightThread(senderId: string, dramatic = false, nineties = false) {
  const route = routes.find(item => item.event.speakerId === senderId);
  const update = dramatic ? arrivalDramaThread(senderId) : undefined;
  if(nineties&&route) return {...route.inbox,
   note:{mao:'房东也管外滩的场子，签字单在钥匙底下。',he:'两张小票是同一桌。带上原件，别给费启。',lu:'我和乐队在轮渡口。纸箱蓝胶带，别拿错。'}[senderId]??route.inbox.note,
   go:update?.go??route.inbox.go,district:route.event.district};
  return route && { ...route.inbox, ...(update&&{note:update.note,go:update.go}), district: route.event.district };
}

export function firstNightClue(eventId: string) {
  return routes.find(route => route.event.id === eventId)?.clue;
}

export const FIRST_NIGHT_FLAG = 'first_night_v2';

export function hasSharedWithMao(state: GameState) {
  return state.flags.some(flag => flag === 'night-shared' || flag === 'night-shared-later' || flag === 'roommates_0');
}

export function firstNightLead(state: GameState) {
  if (state.age !== 18 || state.pendingYearEvent || state.ended || state.actions<=0 || !state.flags.includes(FIRST_NIGHT_FLAG)) return null;
  const route = routes.find(item => state.flags.includes(item.flag));
  if (!route) return null;
  const dramatic = state.flags.includes(OPENING_DRAMA);
  if (!state.seenEvents.includes(route.event.id)) {
    return dramatic ? {message:arrivalDramaThread(route.event.speakerId!).message,event:arrivalDramaVisit(route.event)} : route;
  }
  return dramatic ? arrivalDramaFinale(state,route.flag==='night-room'?'毛小毛':route.flag==='night-shift'?'何亮':'陆嘉') ?? null : null;
}

export function firstNightYear(state: GameState): LifeEvent | undefined {
  if (!state.flags.includes(FIRST_NIGHT_FLAG)) return undefined;
  const dramatic = state.flags.includes(OPENING_DRAMA);
  if (state.age === 18) {
   const event=dramatic?arrivalDrama(arrival):arrival;
   if(calendarYear(state)<2000)return {...event,title:'上海站的三张字条',
    text:'1992 年。你把车票攥在手里走出上海站。费启托人带话，说今晚的试场归他了。等你的三个人各留了一张字条。',
    illustration:SHANGHAI_STATION_1992,
    choices:event.choices.map((choice,i)=>({...choice,
     reply:['毛小毛把楼号和门牌抄在纸背面。「房东十点走。侬先上来。」','何亮把小票折进围裙兜。「我在安福路。票我替你留一张。」','陆嘉的字写得歪。「码头碰头。乐队和票都还在。」'][i],
    })),
   };
   return {...event,illustration:arrivalPhoto(state.appearance)};
  }
  if (state.age !== 19) return undefined;
  const route = routes.find(route => state.flags.includes(route.flag));
  if (!route) return undefined;
  if (!state.seenEvents.includes(route.event.id)) return { ...missed, tag: '隔年再见', speakerId: route.event.speakerId };
  const followup = state.flags.includes(route.alternate.flag) ? route.alternate.event : route.followup;
  const district = followup === ferryGig ? 'anfu' : route.event.district;
  const carry = !dramatic?'':state.flags.includes(OPENING_PROOF)?'你从包里摸到那晚退回来的预约单。费启又在群里问，下一场谁来签。'
    :state.flags.includes(OPENING_ALLIES)?'那晚来过的人又在问下次什么时候开门。费启也在群里，这回没人先问他。':'';
  return { ...followup, district, tag: '隔年再见',text:carry?followup.text+carry:followup.text };
}
