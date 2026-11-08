import type { DistrictId, GameState, LifeEvent } from './types';

export const CORNER_DISTRICTS = ['bund','anfu','people','lujiazui','zhangjiang','xinzhuang'] as const;
const returns = ['anfu','lujiazui','xinzhuang'] as const;
type ReturnDistrict = (typeof returns)[number];
export type CornerPhoto = DistrictId | `${DistrictId}-prop` | `${ReturnDistrict}-return`;
export const cornerPhoto = (key: CornerPhoto) => '/art/corners/'+key+'.webp';
export const CORNER_STILLS = [
 ...CORNER_DISTRICTS.map(id=>`${id}-prop` as const),
 ...returns.map(id=>`${id}-return` as const),
];

export const CORNER_OBJECTS: Record<DistrictId,{ label: string; point: [number,number] }> = {
 bund:{label:'栏杆上的蓝伞',point:[61.3,69.3]},
 anfu:{label:'折椅上的咖啡',point:[49,63.1]},
 people:{label:'棋桌上的红钟',point:[66.9,55]},
 lujiazui:{label:'纸箱上的工牌',point:[66.7,66.5]},
 zhangjiang:{label:'门口的万用表',point:[61.5,55.4]},
 xinzhuang:{label:'楼道里的电表',point:[64.1,47.3]},
};

const cornerId = (district: DistrictId, later = false) => 'street-corner-'+district+(later?'-return':'');
const scene = (district: DistrictId,speakerId: string,title: string,text: string,choices: LifeEvent['choices'],later = false): LifeEvent => ({
 id:cornerId(district,later), district,speakerId,title,text,choices,
 category:'social',tag:'街角见闻',
 illustration:cornerPhoto(later?`${district as ReturnDistrict}-return`:`${district}-prop`),
});

const bund = scene('bund','yan','蓝伞只过一趟江',
 '摆渡口的栏杆上绑了把蓝伞，伞骨已经断了一根。严可说，这是附近几个常上夜班的人放的。下雨谁先到谁拿，第二天从对岸带回来。她刚用过，这回还的时候才发现线头散了。',
 [
  {id:'repair',label:'花二十八修伞，今晚放回栏杆',hint:'付 ¥28 · 伞留在渡口',effect:{cash:-28,trust:9,spirit:5},
   reply:'修伞的人顺手缠紧了木柄。严可把伞拴好，说下回别绑死了，雨大了真的解不开。'},
  {id:'carry',label:'把伞带给对岸等船的人',hint:'跟严可一起走一趟',effect:{trust:5,network:7},
   reply:'对岸有人认得伞，从包里拿出一根皮筋，把伞骨拢起来。你上回坐这趟船，没留意过他。'},
 ]);
const anfu = scene('anfu','chen','那杯咖啡替谁排队',
 '折椅上有杯没拆封的咖啡，门口还有六个人。陈恺说有人出六十，让你替他在这排一趟，等拍照的人来了，把杯子举一下就行。椅子本来是给隔壁修鞋爷叔歇脚的，他正隔着马路往这儿看。',
 [
  {id:'queue',label:'接这单，等他们拍完再收工',hint:'到手 ¥60 · 花一格行动',effect:{cash:60,face:5,spirit:-3,setFlags:['corner-anfu-queue']},
   reply:'他们拍了三遍，说队形再松一点才自然。钱倒是结得快。陈恺问要不要续杯，你说这杯都还没轮到喝。'},
  {id:'seat',label:'把咖啡拿下来，请爷叔坐',hint:'椅子留给隔壁的修鞋爷叔',effect:{trust:8,spirit:7,setFlags:['corner-anfu-seat']},
   reply:'爷叔坐下问，一杯多少钱。陈恺说这杯是人家的，你那杯不要钱。爷叔说那给我倒热水，别糟蹋咖啡。'},
 ]);
const people = scene('people','uncle','棋还没下，评论先到了',
 '顾爷叔刚把红钟摆正，旁边一只手机就凑了过来。直播间有人让他让一车，说老爷叔让点才好看。对面坐的阿姨把杯子挪到镜头外，问自己的脸是不是已经拍进去了。',
 [
  {id:'crop',label:'先问阿姨，再把镜头压到只拍棋盘',hint:'直播留着，脸出画',effect:{skill:6,network:5,trust:4},
   reply:'镜头压下来，弹幕只看得见一双手。阿姨三步吃了对面的车，主播找不到顾爷叔表情，只好自己说了一声好。'},
  {id:'move',label:'把棋桌往树底下挪，继续下',hint:'棋摊暂时离开镜头',effect:{trust:8,spirit:7},
   reply:'走之前顾爷叔不忘按停红钟。到树底下，阿姨自己把钟按下去，说现在算你的时间。'},
 ]);
const lujia = scene('lujiazui','gao','工牌写的是谁',
 '纸箱上挂着一张蓝色工牌，高原问你愿不愿意帮楼上的展会搬半天展架。对接人说现在就能发三百，剩下一百八等主办方对账。高原手里还有一张临时用工单，只是工钱一栏空着。',
 [
  {id:'sign',label:'先把四百八写上，再进门搬货',hint:'当日 ¥480 · 花体力把活做完',effect:{cash:480,health:-6,skill:4,trust:6,setFlags:['corner-lujia-signed']},
   reply:'最后一箱出楼时，对接人还要等财务。你把用工单递给他看了一眼。等到闸机口，四百八到了。'},
  {id:'go',label:'先跟高原进去，今天先拿三百',hint:'现在 ¥300 · 另有 ¥180 待结',effect:{cash:300,health:-3,network:6,setFlags:['corner-lujia-owed']},
   reply:'三百到了。群里弹出「已全部结清」，高原看了你一眼，把那句话截下来发给你。'},
  {id:'pass',label:'把招人的工钱拍下来，再问工友',hint:'今天不接活',effect:{network:8,trust:4,setFlags:['corner-lujia-pass']},
   reply:'一个工友问写没写搬完的时间。你把纸翻过来，背面一行都没有，顺手把对接人的电话也拍了。'},
 ]);
const zhangjiang = scene('zhangjiang','qi','防呆要防谁',
 '祁清拿万用表确认柜门已经断电。公司想在楼下放个共用工具柜，贴纸一共画了六步。她说评审全是自己人，都说看得懂。现在缺个头一回来的，照着贴纸取把螺丝刀。',
 [
  {id:'trial',label:'照着贴纸操作，卡在哪儿就停哪儿',hint:'测试费 ¥120 · 留下一次真实试用',effect:{cash:120,skill:8,trust:7},
   reply:'你卡在第二步，柜门开了半边。她把「轻拉」划掉，去楼下问保洁阿姨平时会怎么说。回来只写了一个「掀」。'},
  {id:'swap',label:'找个第一次用的人，你在旁边记',hint:'帮祁清再找一位测试者',effect:{network:7,skill:5,trust:4},
   reply:'物业师傅看了半天，先问螺丝刀借了算哪个部门的。祁清把这个问题记在了贴纸最前面。'},
 ]);
const xin = scene('xinzhuang','song','二号表还在走',
 '楼道口贴了张纸，这个月多出九十块电费，说一楼两户平摊。宋奶奶从窗口看二号表，想起自家那天跳闸，楼道灯照旧亮着。她准备下楼交钱，口袋里正好揣了四十五。',
 [
  {id:'pay',label:'先替她垫四十五，请物业留一张收条',hint:'先付 ¥45 · 把钱留在账上',effect:{cash:-45,trust:6,setFlags:['corner-xin-advance']},
   reply:'收钱的人原来只带了二维码，回办公室找来一张旧收据。宋奶奶折起来，夹在她自己的电费单背后。'},
  {id:'ask',label:'让物业叫电工，先别动谁家的闸',hint:'今天先请人来确认',effect:{network:6,trust:5,setFlags:['corner-xin-ask']},
   reply:'电工赶来时已经快吃晚饭了，抄下了两块表的读数。宋奶奶塞给他一只橘子，说不用上楼找我，查完往窗口喊。'},
  {id:'show',label:'把旧记录和表号发给物业，当面对一遍',hint:'把两次读数交给物业 · 今天不用垫钱',effect:{skill:7,trust:8,setFlags:['corner-xin-proof']},
   reply:'物业翻出维修单，楼道灯当时接在了公用的二号表，跟宋奶奶家用的表隔着一位数。九十块撤了单，楼里终于有人问灯坏了找谁。'},
 ]);

const first: Record<DistrictId,LifeEvent> = {bund,anfu,people,lujiazui:lujia,zhangjiang,xinzhuang:xin};

function anfuReturn(flags: readonly string[]) {
 const stood = flags.includes('corner-anfu-queue');
 return scene('anfu','chen','椅子修好，谁先坐',
  (stood?'你上回排的那条队后来还上了同城榜。陈恺把照片放大，找了半天只找出你一只手。':'那天请爷叔坐过以后，陈恺就把椅子留在门口。爷叔收摊时会顺手给他搬进去。')+
  '椅子的一条腿修好了，他把两只杯子拿出来，说这回有人真要坐了。',
  [
   {id:'tea',label:'留下喝一杯，椅子先给爷叔',hint:'这回没人催你起身',effect:{trust:7,spirit:9},
    reply:'爷叔今天带了修鞋摊的小凳，正好三个人。外面又有人来问哪儿排队，陈恺指了指空出来的座。'},
   {id:'lend',label:'把椅子搬回鞋摊，下次再喝',hint:'帮爷叔把椅子搬过去',effect:{trust:5,network:8},
    reply:'爷叔在凳脚垫了张对折的小票，说这回稳了。陈恺让他下回拿个木楔来换，省得下雨又泡软。'},
  ],true);
}
function lujiaReturn(flags: readonly string[]) {
 const owed=flags.includes('corner-lujia-owed');
 const signed=flags.includes('corner-lujia-signed');
 return scene('lujiazui','gao','这回把最后一笔画掉',
  owed?'高原把你们当初的截图转给了主办方。对接人今天来退工牌，账上还差你一百八，问你能不能一起把另外两位临工的名字核出来。'
   :signed?'对接人还记得那张写了四百八的用工单。楼上又要办展，高原拿了份新版给你看，这次工钱印在最上头。'
   :'高原还留着你发来的照片。新版用工单添了下班时间。他拿着纸到楼下，说上回真有人为这行多等了两个钟头。',
  owed?[
   {id:'all',label:'把人和钱一起核清，再领自己的一百八',hint:'补齐 ¥180 · 顺手帮两位工友对账',effect:{cash:180,trust:8,skill:5,removeFlags:['corner-lujia-owed']},
    reply:'三个人都收到了钱。高原说幸好那位工友群昵称还没改，你说还有一个改了，刚才打的是他家里电话。'},
   {id:'mine',label:'先结自己的一百八，把记录留给高原',hint:'补齐 ¥180 · 其余交给高原',effect:{cash:180,spirit:5,removeFlags:['corner-lujia-owed']},
    reply:'到账后你把截图发给高原。临走看到他还坐在石凳上，正跟一个人确认卡号最后四位。'},
  ]:[
   {id:'write',label:'再给工钱加一行到账时间',hint:'跟高原把单子补完整',effect:{skill:7,trust:6},
    reply:'对接人改完拿着问，一小时写具体到哪一分钟。高原说写下工前，别又让人站在门口等财务。'},
   {id:'pass',label:'把写好的单子发给上回那个工友',hint:'让工友先知道这次怎么结',effect:{network:9,trust:4},
    reply:'工友看完问还有几个名额，说他要带个人来。你给他圈了领工牌的地方。'},
  ],true);
}
function xinReturn(flags: readonly string[]) {
 const paid=flags.includes('corner-xin-advance');
 const proof=flags.includes('corner-xin-proof');
 return scene('xinzhuang','song','楼道灯这回归谁管',
  (paid?'物业核清了两块表，那四十五块今天退。宋奶奶把当时的收条摊平，纸都软了。'
   :proof?'你们上回拍下来的表号还贴在物业底账上。宋奶奶用手指比了比，说这次连门牌也写上了。'
   :'电工查完后，把楼道灯和住户的线路分开了。宋奶奶怕新来的不知道，喊你来看新贴的纸。')+
  '开关还在原来那面墙上，灯已经亮了。',
  [
   {id:'leave',label:paid?'收回四十五，给邻居留张联系电话':'把物业电话贴在开关边上',
    hint:paid?'退回 ¥45 · 留下物业电话':'帮邻居留个能打通的电话',
    effect:{cash:paid?45:0,network:7,trust:6,removeFlags:['corner-xin-advance']},
    reply:'宋奶奶把号码念了一遍。你问她背下来干吗。她说以前楼道太暗，看纸要打手电，有些事一时还改不过来。'},
   {id:'lamp',label:paid?'把退的四十五留给楼里买灯泡':'和宋奶奶试一次灯，再把收条收好',
    hint:paid?'退款转给楼里备灯泡 · 个人余额不变':'下次坏了就照这张单找人',
    effect:{trust:9,spirit:6,removeFlags:['corner-xin-advance']},
    reply:'你按了两遍开关，转身发现宋奶奶在往上走。她回头说亮了就走呀，你还站那儿等什么。'},
  ],true);
}
const second = {anfu:anfuReturn,lujiazui:lujiaReturn,xinzhuang:xinReturn};

export function streetCorner(state: GameState) {
 if (state.pendingYearEvent || state.ended || state.actions <= 0) return;
 const district=state.district;
 const opening=first[district];
 if (!state.seenEvents.includes(opening.id)) return opening;
 if (state.seenEvents.includes(cornerId(district,true)) || !Object.hasOwn(second,district)) return;
 const last=state.journal.find(entry=>entry.tag===opening.tag&&entry.title===opening.title);
 if (last && last.age < state.age) return second[district as ReturnDistrict](state.flags);
}

export function replayCorner(state: GameState,id: string) {
 const event=streetCorner(state);
 return event?.id===id?event:null;
}

export function cornerCount(state: GameState) {
 return CORNER_DISTRICTS.filter(district=>state.seenEvents.includes(first[district].id)).length;
}

export function cornerCashDue(state: GameState) {
 return state.flags.includes('corner-lujia-owed')?180:0;
}

export function cornerEvidence(eventId: string) {
 if (eventId!==xin.id) return;
 return {choiceId:'show',label:'翻一下箱门内侧的记录',
  text:'内侧夹着上次维修的纸，公用灯接在尾号 020 的二号表上。宋奶奶那张单是 021。你把两个号码念给她听，她说照片发我一份，这次我自己留着。'};
}

export const ANFU_CORNER_TICKET = [anfu,anfuReturn(['corner-anfu-queue']),anfuReturn(['corner-anfu-seat'])] as const;
