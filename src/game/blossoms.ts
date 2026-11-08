import type { DistrictId, GameState, LifeEvent } from './types';

export const BLOSSOMS_STILLS = ['huanghe-dinner','hu-ge-street','tang-yan-street'] as const;
export const blossomsPhoto = (shot: (typeof BLOSSOMS_STILLS)[number]) => '/art/blossoms/'+shot+'.webp';
const banquet = 'blossoms-booked-banquet';
const receipt = 'blossoms-kept-deposit';
const toast = 'blossoms-small-toast';
const meetup = (id:string, district:DistrictId, title:string, shot:Parameters<typeof blossomsPhoto>[0], text:string, choices:LifeEvent['choices']):LifeEvent =>
 ({id:'blossoms-'+id,district,title,illustration:blossomsPhoto(shot),text,choices,category:'social',tag:id==='hu'||id==='tang'?'街头偶遇 · 虚构':'黄河路'});

const dinner = meetup('dinner','people','功先庆哪一桩','huanghe-dinner',
 '黄河路上，何亮叫你来帮一桌外送对账。第一单送到了，订金也收了，客人说尾款周五转。隔壁包间在喊「经常庆功，就能成功」。老板娘已经拿着菜单出来了，问你们要不要也摆一桌。',
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
 ]);

function afterDinner(state: Pick<GameState,'flags'>) {
 const booked=state.flags.includes(banquet);
 const small=state.flags.includes(toast);
 return meetup('cash','people','这回真到账了','huanghe-dinner',
  (booked?'庆功宴已经吃了，司机把合照发在群里，靠墙那位是来替班的。':
   small?'上次碰杯的水印还留在纸上。何亮说，今天这杯要等手机响了再开。':
    '老板娘还记得你们没点菜，见你进门就把账本递过来了。')+
  '客人把尾款结了。何亮和你对过金额，说你跑单那份是六百。刚才客人又问，下周能不能照原样来一单。',
  [
   {id:'settle',label:'收六百，下一单仍按这张单的办法走',hint:'跑单收入到账 ¥600 · 下一单照旧对账',
    effect:{cash:600,network:5,skill:4},
    reply:'你先存了到账的截图，才回下周可以。何亮看你把日子写上了，也拿过笔补了收货时间。'},
   {id:'toast',label:'六百收下，这回请送货的人喝一杯',hint:'跑单收入 ¥600 · 饮料支出 ¥36',
    effect:{cash:564,spirit:8,network:4},
    reply:'司机说他一会儿还要开车，你把酒换成了三瓶桔子汽水。何亮开第一瓶时溅了一袖子，旁边人扯了张纸递给他。'},
  ]);
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
  if (unseen(dinner)) return {message:'黄河路有人叫你去庆功',event:dinner};
  if (state.flags.some(flag=>[banquet,receipt,toast].includes(flag))) {
   const event=afterDinner(state);
   if (unseen(event)) return {message:'何亮说尾款到了',event};
  }
 }
 if (state.district==='bund' && unseen(hu)) return {message:'桥头门洞有人往里让',event:hu};
 if (state.district==='anfu' && unseen(tang)) return {message:'弄堂口在叫二十八号',event:tang};
}

export const BLOSSOMS_TICKET = [dinner,afterDinner({flags:[toast]}),afterDinner({flags:[banquet]}),hu,tang] as const;
