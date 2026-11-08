import type { DistrictId, GameState, LifeEvent } from './types';

export const BLOSSOMS_STILLS = [
 'huanghe-dinner', 'hu-ge-street', 'tang-yan-street',
 'huanghe-table-young', 'huanghe-table-midlife', 'huanghe-table-senior',
 'huanghe-menu', 'huanghe-small-ledger', 'huanghe-banquet-bill', 'huanghe-soda-end',
] as const;
export const blossomsPhoto = (shot: (typeof BLOSSOMS_STILLS)[number]) => '/art/blossoms/'+shot+'.webp';
const banquet = 'blossoms-booked-banquet';
const receipt = 'blossoms-kept-deposit';
const toast = 'blossoms-small-toast';
const sharedTable = 'blossoms-shared-table';
const meetup = (id:string, district:DistrictId, title:string, shot:Parameters<typeof blossomsPhoto>[0], text:string, choices:LifeEvent['choices']):LifeEvent =>
 ({id:'blossoms-'+id,district,title,illustration:blossomsPhoto(shot),text,choices,category:'social',tag:id==='hu'||id==='tang'?'街头偶遇 · 虚构':'黄河路'});

const dinner = meetup('dinner','people','功先庆哪一桩','huanghe-table-young',
 '第一单送到了，尾款要等周五。隔壁包厢有人喊「经常庆功，就能成功」。何亮摸了摸兜，老板娘把菜单夹推过来。「小包厢还空一间。你们几位？」',
 [
  {id:'small',label:'点两瓶汽水，庆第一单送到了',hint:'你出 ¥16 · 把下次的事先写在纸上',
   effect:{cash:-16,spirit:6,setFlags:[toast]},
   reply:'何亮把两只杯子推到桌当中，碰了一下。你用湿杯底压住单子，叫他把周五几点结钱也写上。'},
  {id:'banquet',label:'订包厢，叫一起干活的人都来',hint:'先付包间订金 ¥680 · 尾款还没到',
   effect:{cash:-680,face:9,network:5,setFlags:[banquet]},
   reply:'帮你们送最后一趟的司机本来要走。何亮把他叫回来，说晚上也来。老板娘把定金回单塞进你口袋。'},
  {id:'wait',label:'先对单，钱到了再坐下来吃',hint:'今天先留着这笔钱',
   effect:{skill:6,setFlags:[receipt]},
   reply:'老板娘把菜单收回去，转手给你们拿了两杯热水。何亮把付款日写进手机，当场给客人发了一份。'},
  {id:'hall',label:'拼大堂那桌，叫司机坐一会儿',hint:'¥48 · 四瓶汽水，一碟葱油蚕豆',
   effect:{cash:-48,network:7,spirit:3,setFlags:[sharedTable]},
   reply:'司机把钥匙放到桌上，说只能坐十分钟。何亮给他倒了杯汽水，问最后一趟到底等了多久。他说四十分钟，单子上没写。'},
 ]);

export function blossomsClue(eventId: string) {
 if (eventId !== dinner.id) return;
 return {
  label:'翻开菜单夹', choiceId:'hall',
  text:'背面夹了张纸。大堂还能拼四个位，四瓶汽水加一碟葱油蚕豆，一共 ¥48。老板娘说靠门的，开车那位走起来也方便。',
  photo:{src:blossomsPhoto('huanghe-menu'),alt:'翻开的旧菜单夹，背面压着一张手写价单'},
 };
}

function afterDinner(state: Pick<GameState,'flags'>) {
 const booked=state.flags.includes(banquet);
 const small=state.flags.includes(toast);
 const shared=state.flags.includes(sharedTable);
 return meetup('cash','people','这回真到账了',booked?'huanghe-banquet-bill':'huanghe-small-ledger',
  (booked?'庆功宴已经吃了。你先给的六百八抵了餐费，桌上另一张账单是何亮垫的。司机在群里问，下回等货的时间能不能写进单里。':
   small?'上次碰杯的水印还留在纸上。何亮把开瓶器放到桌边，说手机响了再用。':
   shared?'上回拼桌，司机只坐了十分钟。今天他把车停在门口，探头问下张单能不能写上等货费。':
    '老板娘看你们来了，把靠窗那张桌子擦了一遍。何亮把周五结账的聊天翻出来。')+
  '客人把尾款结了。何亮先把你跑单那份六百转过来。客人问，下礼拜能不能再送一趟。',
  [
   {id:'settle',label:'收六百，先把下张单写清楚',hint:'跑单收入 ¥600 · 重写下次的送货单',
    effect:{cash:600,network:5,skill:4},
    reply:booked||shared?'你把等货费另起一行，发给客人看。对方回了个「知道了」。司机又补了一句，来货前先打电话。':
     '你先存了到账的截图，才回下周可以。何亮看你把日子写上了，也拿过笔补了收货时间。'},
   {id:'toast',label:'六百收下，这回请送货的人喝一杯',hint:'跑单收入 ¥600 · 饮料支出 ¥36',
    effect:{cash:564,spirit:8,network:4},
    reply:'司机一会儿还得开车，你叫老板娘拿了三瓶桔子汽水。何亮开早了，汽水冒上来，他下意识用刚写好的单子去擦。你把单子抢回来，塞给他一张餐巾纸。'},
  ]);
}

export function blossomsEndingPhoto(event: LifeEvent, choiceId: string) {
 if (event.id !== 'blossoms-cash') return;
 return choiceId === 'toast' ? blossomsPhoto('huanghe-soda-end') : event.illustration;
}

const hu = meetup('hu','bund','外滩拐角碰到胡歌','hu-ge-street',
 '从外白渡桥那头往回走，有一家人正往窄窄的门洞里让。旁边穿深色夹克的人也跟着退了半步。你认出来是胡歌。一个学生把手机举到一半，才发现后面有人推婴儿车。',
 [
  {id:'hello',label:'等推车过去，过去打个招呼',effect:{spirit:6},
   reply:'你说晚上好，他也回了句晚上好。学生反倒先把手机放下，帮推车的人把门扶住了。'},
  {id:'space',label:'扶住门，让推车先过去',effect:{network:5,spirit:4},
   reply:'车轮过了石槛。你松手时才发现，他在门的另一头也扶着，等一家人走开才往江边去。'},
  {id:'walk',label:'点下头，继续去江边',effect:{spirit:2},
   reply:'到江边才想起来可以拍张照。眼前倒是正好有船过，你把手机拿出来，拍了船。'},
 ]);

const tang = meetup('tang','anfu','唐嫣也在等这一锅','tang-yan-street',
 '安福路拐进小弄堂，窗口在叫二十八号。前面戴围巾的人往兜里摸号码，转身时你认出了唐嫣。窗口师傅问排骨要不要剪，她还没听清，后面的客人已经小声喊了句汪小姐。',
 [
  {id:'hello',label:'等她拿到餐，再说一声喜欢《繁花》',effect:{spirit:7},
   reply:'她笑着点了下头。你刚想说第二句，窗口喊二十九号，你和她一起往旁边让了让。'},
  {id:'ticket',label:'叫号了，指一下她手里那张票',effect:{network:4,spirit:4},
   reply:'她把号码递过去。窗口师傅问了一遍，她这回听清了，伸出两根手指比给师傅看。'},
  {id:'own',label:'别打扰，等自己的那份',effect:{spirit:3},
   reply:'她拎着袋子往弄堂外走了。轮到你时，老板问你的剪不剪，你说剪，回去懒得找剪刀。'},
 ]);

export function blossomsLead(state: GameState) {
 if (state.ended || state.pendingYearEvent || state.actions <= 0 || state.age < 21) return;
 const unseen=(event:LifeEvent)=>!state.seenEvents.includes(event.id);
 if (state.district==='people') {
  if (unseen(dinner)) {
   const shot=state.age>=53?'huanghe-table-senior':state.age>=32?'huanghe-table-midlife':'huanghe-table-young';
   return {message:'黄河路有人叫你去庆功',event:{...dinner,illustration:blossomsPhoto(shot)}};
  }
  if (state.flags.some(flag=>[banquet,receipt,toast,sharedTable].includes(flag))) {
   const event=afterDinner(state);
   if (unseen(event)) return {message:'何亮说尾款到了',event};
  }
 }
 if (state.district==='bund' && unseen(hu)) return {message:'桥头门洞有人往里让',event:hu};
 if (state.district==='anfu' && unseen(tang)) return {message:'弄堂口在叫二十八号',event:tang};
}

export const BLOSSOMS_TICKET = [dinner,afterDinner({flags:[toast]}),afterDinner({flags:[banquet]}),hu,tang] as const;
