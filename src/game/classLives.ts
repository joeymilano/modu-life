import { openingPhoto } from './art';
import type { EventChoice, GameState, LifeEvent } from './types';
import { LONG_COMMUTE, NIGHT_WORK } from './workFlags';

export const STAFF_BED = 'xinzhuang-staff-bed';
const STOCK = 'logistics-shares-held';
const SHADOW = 'logistics-shareholder-observer';
const roomRate = 800;
const privateRate = 1050;
const sharePrice = 240000;
const saleProceeds = 210000;
export const LOGISTICS_SHARE_PERCENT = 6;
const distribution = 1200000;
const dividend = 57600;
const movingGrant = 750;
const yuan = (amount: number) => '¥'+amount.toLocaleString('zh-CN');

export const holdsLogisticsShares = (state: Pick<GameState, 'flags'>) => state.flags.includes(STOCK);
export function staffBedRent(state: Pick<GameState, 'age' | 'housing' | 'flags'>) {
 return state.age <= 22 && state.housing === 0 && state.flags.includes(STAFF_BED) ? roomRate : undefined;
}

const event = (shot: Parameters<typeof openingPhoto>[0], worker: boolean, title: string, text: string, choices: EventChoice[]): LifeEvent => ({
 id:'life-start-class-'+shot, title, text, choices, category:'year',
 district:worker?'xinzhuang':'bund', speakerId:worker?'wu':'father',
 tag:worker?'莘庄 · 仓配宿舍':'外滩 · 家里公司的账', illustration:openingPhoto(shot),
});

const workerBed = event('worker-bed',true,'床位和工牌一起领',
 '吴师傅带你看了仓库后面的四人间。下铺的人怕夜里吵，把电水壶搬到了走廊。仓配公司的白班有一个缺，住这里一个月八百，本期签到明年。外头短租床位一千零五十，什么时候去都能问。',
 [
  {id:'staff',label:'接白班，领宿舍门卡',hint:'床位 ¥800/月 · 白班按岗位基础薪资发',
   effect:{housing:0,job:'service',payRate:1,health:4,setFlags:[STAFF_BED],removeFlags:[NIGHT_WORK,LONG_COMMUTE]},
   reply:'吴师傅让你先试下门卡。回去收行李的时候，你把早班闹钟往后拨了半小时。'},
  {id:'private',label:'去短租点租床，手头的活照做',hint:'短租床位 ¥1,050/月 · 工作照旧',
   effect:{housing:0,spirit:5},
   reply:'你给短租房的管理员发了条消息。晚上回来晚了，室友给你留了盏灯，问新宿舍能不能带电饭锅。你说没问。'},
  {id:'shift',label:'只接这周的盘货，干完再找',hint:'三班结 ¥840 · 工作和住处照旧',
   effect:{cash:840,health:-6,skill:4},
   reply:'最后一箱贴错了库位。你和吴师傅把单重抄一遍，收款的时候，食堂已经在收桌子。'},
 ]);

function workerNotice(renewed = false) {
 return event('worker-notice',true,renewed?'门卡还能刷一年':'下个月房租谁出',
  renewed
   ? '续租的通知贴出来了。今年那笔宿舍补贴还在。下铺的人让你把门卡拿去更新，他试了两次，旧卡只能刷到周五。'
   : '走廊里贴了张单子。公司不续宿舍补贴，现有住户可以搬回短租点。有人已经去问新开的夜班，吴师傅在纸背记下还住在这儿的名字，说每人七百五的搬家补助，得一起去确认名单。',
  renewed ? [
   {id:'renew',label:'去更新门卡',reply:'你把两张卡一起带去。下铺的人下工回来，先拎着菜去试了试门。',effect:{}},
   {id:'move',label:'搬回原来的短租点',reply:'室友帮你把箱子推到门口。这回你留下了他的号码。',effect:{}},
  ] : [
   {id:'private',label:'自己续床，手头的活照做',hint:'自付床位 ¥1,050/月 · 工作照旧',
    effect:{spirit:6,removeFlags:[STAFF_BED]},
    reply:'你把床位续在自己名下。吴师傅下班陪你走了一趟，把两个点之间哪条路有灯指给你。'},
   {id:'night',label:'接夜班，把床位差价挣回来',hint:'自付床位 ¥1,050/月 · 夜班按岗位工资的 120% 发',
    effect:{job:'service',payRate:1.2,health:-5,setFlags:[NIGHT_WORK],removeFlags:[STAFF_BED,LONG_COMMUTE]},
    reply:'交接的时候，你把白班留的那半杯水倒了。六点收工，回去得等下铺洗漱完才能睡。'},
   {id:'grant',label:'和工友一起去核补助名单',hint:'一次到账 '+yuan(movingGrant)+' · 此后床位 ¥1,050/月',
    effect:{cash:movingGrant,network:6,spirit:-3,removeFlags:[STAFF_BED]},
    reply:'名单少了一个上夜班的。你们等人事把名字添上才签字。七百五是分开转的，吴师傅在群里让大家各查各的卡。'},
  ]);
}

const equityOffer = event('heir-equity',false,'这回要用你自己的卡',
 '晚饭订在江边，司机已经到了。财务说还要占你十分钟。家里一位股东想退出仓配子公司，六个点，二十四万。爸说可以让你旁听股东会，买不买都行。财务把那位股东的转让协议递给你，这几年他也只找到这一个买家。',
 [
  {id:'buy',label:'拿自己的二十四万接下股权',hint:'个人支出 '+yuan(sharePrice)+' · 持有 '+LOGISTICS_SHARE_PERCENT+'% 股权',
   effect:{cash:-sharePrice,skill:6,setFlags:[STOCK]},
   reply:'财务让你在付款人一栏签全名。爸问楼下还等不等，你说等一会儿，你要自己把汇款回单存好。'},
  {id:'observe',label:'先去听会，自己的钱先留着',hint:'受邀旁听 · 没有表决权和分红',
   effect:{skill:7,network:4,setFlags:[SHADOW]},
   reply:'下一次开会，助理给你加了把椅子。签到表传过来，爸把它接过去，说这张你不用签。'},
  {id:'pass',label:'这家公司我先不掺和',hint:'个人存款照旧 · 不入股',
   effect:{spirit:7},
   reply:'你把两页纸叠好推回去。爸到楼下才问晚饭还去不去，订位用的是他的名字。'},
 ]);

const shareholderVote = event('heir-vote',false,'差你手里这六票',
 '财务算出这次能分一百二十万。两套方案，一套现在分，仓库宿舍的补贴到期就停。一套把钱留在公司，续宿舍补贴，也留一点周转。赞成续租的股东有四十八票，要分的有四十六票。爸让你看自己面前那张。',
 [
  {id:'pay',label:'投给分红，宿舍补贴到期就停',hint:'个人分红实际到账 '+yuan(dividend)+' · 股权保留',
   effect:{cash:dividend,face:3},
   reply:'分红方案过了。两周后钱打到了自己的账户。那天财务还发了另一封邮件，宿舍停补贴的通知要赶在月底前贴出去。'},
  {id:'keep',label:'把钱留在公司，续一年宿舍',hint:'今天个人到账 ¥0 · 股权保留',
   effect:{skill:6,network:6},
   reply:'续租过了。仓库的人问门卡用不用换，财务把负责续卡的号码发过去。爸把杯里的茶喝完，没再提晚饭。'},
  {id:'sell',label:'接受老股东的报价，卖掉这六个点',hint:'股权转让实际到账 '+yuan(saleProceeds)+' · 此后没有表决权',
   effect:{cash:saleProceeds,spirit:7,removeFlags:[STOCK]},
   reply:'你提前办完了转让。二十一万到账，比买的时候少了三万。会后纪要转来时，表决栏里已经没有你的名字。'},
 ]);

const observerVote = {...event('heir-vote',false,'椅子给你留了',
 '财务发的是旁听邀请。桌上两套方案，要么现在分一百二十万，要么留钱续宿舍补贴。爸把茶杯往旁边移了移，给你腾出放笔记本的位置。他那张表决单仍压在杯子底下。',
 [
  {id:'ask',label:'请财务把调价后每张床的账摆出来',hint:'可以提问 · 个人到账 ¥0',
   effect:{skill:8,trust:4},
   reply:'财务去拿了住户名单。刚才急着散会的人把外套放下了，等她把一张床每月差多少算完。'},
  {id:'visit',label:'先去莘庄，看完宿舍再回话',hint:'去仓库见住户 · 个人到账 ¥0',
   effect:{network:7,skill:4},
   reply:'你到的时候正好换班。吴师傅把自己的门卡递给你，指了指门口几只箱子，说有几个已经开始收拾了。'},
  {id:'leave',label:'听完就走，让签字的人作决定',hint:'个人到账 ¥0',
   effect:{spirit:6},
   reply:'你下楼时司机问还是不是去江边。你说等等，有条语音还没听完。是财务在讲这张表抄送给谁。'},
 ]),id:'life-start-class-heir-observer'};

export function workerClassYear(state: GameState) {
 if (state.age === 21) return workerBed;
 if (state.age === 22 && staffBedRent(state) !== undefined) return workerNotice();
}

export function heirClassYear(state: GameState) {
 if (state.age === 21) return equityOffer;
 if (state.age === 22) {
  if (holdsLogisticsShares(state)) return shareholderVote;
  if (state.flags.includes(SHADOW)) return observerVote;
 }
}

export function classPaper(eventId: string) {
 switch(eventId) {
  case workerBed.id: return {title:'住宿登记', rows:[['公司床位',yuan(roomRate)+'/月'],['短租床位',yuan(privateRate)+'/月']]};
  case 'life-start-class-worker-notice': return {title:'住户通知', rows:[['现有床位',yuan(roomRate)+'/月'],['短租床位',yuan(privateRate)+'/月'],['一次性搬家补助',yuan(movingGrant)]]};
  case equityOffer.id: return {title:'股权转让单', rows:[['个人出资',yuan(sharePrice)],['仓配公司股权',LOGISTICS_SHARE_PERCENT+'%']]};
  case shareholderVote.id: return {title:'股东会资料', rows:[['公司拟分配',yuan(distribution)],['你持有的股权',LOGISTICS_SHARE_PERCENT+'%'],['通过分红方案后，你实收',yuan(dividend)]]};
  case observerVote.id: return {title:'旁听席', rows:[['公司拟分配',yuan(distribution)],['表决与分红','由现有股东行使']]};
 }
}

export const STAFF_BED_TICKET = {workerBed, workerNotice:workerNotice(), workerRenewal:workerNotice(true), shareholderVote};
