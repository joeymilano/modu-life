import { lifeYearsPhoto } from './art';
import { relocationBudget, remembersWarehouseBus } from './relocation';
import { NIGHT_WORK } from './workFlags';
import type { Effect, EventChoice, GameState, LifeEvent } from './types';

const DAY_SHIFT = 'daywork-later-day';
const NIGHT_SHIFT = 'daywork-later-night';
const HEIR_LENT = 'heir-loan-120000';
const HEIR_PARTIAL = 'heir-loan-40000';
const HEIR_CUT = 'heir-cut-purchase';
const HEIR_REPAID = 'heir-loan-repaid';
const loanFlags = [HEIR_LENT, HEIR_PARTIAL];
const fullLoan = 120000;
const partialLoan = 40000;
const endTag = '最后一站';

const yuan = (cash: number) => '¥' + cash.toLocaleString('zh-CN');

const choice = (id: string, label: string, reply: string, effect: Effect, hint?: string): EventChoice =>
 ({id,label,reply,effect,hint});

function later(id: string, title: string, text: string, choices: EventChoice[], shot: Parameters<typeof lifeYearsPhoto>[0]): LifeEvent {
 const work = shot.startsWith('daywork-');
 return {
  id: 'life-start-' + id,
  title,text,choices,
  category: 'year',
  district: work ? 'xinzhuang' : 'lujiazui',
  tag: shot.endsWith('-final') ? endTag : work ? '排班' : '家里公司的账',
  illustration: lifeYearsPhoto(shot),
 };
}

export function laterDaywork(state: Pick<GameState,'age'|'jobId'|'flags'>) {
 if (state.age === 46) return later(
  'daywork-rota','夜班表上又是你',
  (state.jobId === 'service'
   ? '新排班贴上去了，连续四周都是夜班。你把手套晾在水池边。领班过来问，愿不愿意换到白天收货，工资少些，回去还能赶上最后一趟公交。'
   : '以前那家仓库换了领班。他翻出你的号码，问还愿不愿意回来带几个人。白班做收货，夜班多点钱。他把两张排班表都拍了过来。') +
  (remembersWarehouseBus(state)?'想起当年去松江那班车，你先问清楚晚班怎么回家。':''),
  [
   choice('day','去白天收货，少拿一些','早班第一个来的也是个老面孔。你教他先看批次，再数箱数。收工出来天还亮着，你第一次在这条街上买到了刚出锅的菜。',{job:'service',payRate:.85,health:8,spirit:4,setFlags:[DAY_SHIFT],removeFlags:[NIGHT_SHIFT,NIGHT_WORK]},'按岗位工资的 85% 结 · 白班'),
   choice('night','接夜班，把加的工钱写清楚','你在排班上签了字，特地把夜班那栏拍下来。回来时小区门口已经有人买早点，你揣着热豆浆上楼。',{job:'service',payRate:1.2,health:-5,setFlags:[NIGHT_SHIFT,NIGHT_WORK],removeFlags:[DAY_SHIFT]},'按岗位工资的 120% 结 · 夜班'),
   choice('pass','先别排我，把两张表发给找班的工友','工友没问你挑哪张，先问从哪一站换车。你把最早那班公交的时间发给他。',{network:8,skill:4,spirit:5}),
  ], 'daywork-mid');
 if (state.age !== 59) return undefined;
 const remembered = state.flags.includes(DAY_SHIFT)
  ? '新领班翻到你带白班那阵留下的表。他照着画了同样的三栏，字倒比你写得大。'
  : state.flags.includes(NIGHT_SHIFT)
   ? '夜班有个人认出你，说以前早上交班，你总在最后一栏写下一班要从哪件货查起。'
   : '你进门先问工钱是怎么结的。年轻人把发薪日从手机里翻出来，拿给你看。';
 return later('daywork-final','门卡交给下一个',
  '旧仓库把两间更衣室打通了，门房请你来认认柜子里留下的东西。柜门内侧有道浅浅的刻痕，你年轻时用钥匙试过几次才打开。' + remembered,[
   choice('teach','带新人走一遍，工资日也讲清楚','你没让他死记柜号，先带他从公交站走进来。到门口你等他刷了一次卡，确定能进去，才把门让开。',{network:11,skill:4}),
   choice('shift','再帮半天，把工钱今天结掉','两百六在下工前到了。你把手机举给旁边的人看。他翻了会儿自己的，说他的也到了，你们一起走到站牌下。',{cash:260,health:-3,spirit:6},'当天下工结 ¥260'),
   choice('leave','把旧钥匙还了，今天留给自己','门房试了一下，说这把早换过锁了。你把它放进盒子，转去车站对面吃面。店里有人问要不要带走，你说坐这儿吃。',{health:6,spirit:10}),
  ], 'daywork-final');
}

export function familyLoanOwed(state: Pick<GameState,'flags'>) {
 if (state.flags.includes(HEIR_PARTIAL)) return partialLoan;
 return state.flags.includes(HEIR_LENT) ? fullLoan : 0;
}

export function laterHeir(state: Pick<GameState,'age'|'flags'>) {
 if (state.age === 46) return later('heir-loan','这笔从谁的卡走',
  '一笔货款还没收回来，设备定金却到期了。财务把公司账户和你的账本分开放。' +
  (relocationBudget(state)?'你认出公司那本。上回搬仓的报价也夹在里面，边上还有车队的回单。':'') +
  '你可以借十二万给公司周转，也可以让采购改期。车间主管坐在旁边，说哪一批东西可以先不买。',[
   choice('lend','用个人账户借十二万，写清还款日','转账从你自己的卡里扣。财务另记了一笔公司欠你的款，把日期抄给你。老爸下意识说家里的钱，财务让他把付款人姓名念了一遍。',{cash:-fullLoan,network:7,skill:6,setFlags:[HEIR_LENT]},'个人付出 '+yuan(fullLoan)+' · 公司欠款单列'),
   choice('cut','把采购分两批，先让财务排账','车间把不急用的设备从这批划掉。供应商来过两趟，第三趟才把新交货期写在单子上。',{skill:9,network:4,spirit:4,setFlags:[HEIR_CUT]},'个人账户不动'),
   choice('delegate','请财务和车间会签，我只听结果','会议室空了半小时。两人回来时把意见写成了两张，车间那张正反面都用上了。',{network:7,skill:7,spirit:6},'个人账户不动'),
  ],'heir-mid');
 const owed = familyLoanOwed(state);
 if (state.age === 47 && owed === fullLoan) return later('heir-due','还款日到了',
  '公司回了一笔货款，财务把你那笔借款翻出来。今天全还，你的卡里能收回十二万，但设备下一批得再往后排。车间的人没替你作主，留了两张表就出去了。',[
   choice('full','按约全收回来','十二万打到你自己卡里。财务把那一行勾掉，下一批设备改了交期。你去跟车间说的时候，发现他们已经在重新排人。',{cash:fullLoan,face:-3,removeFlags:loanFlags,setFlags:[HEIR_REPAID]},'个人到账 '+yuan(fullLoan)),
   choice('partial','先收八万，余下四万另约交接时核对','八万到了，你当面把剩下的数念了一遍。财务说好，把日期和那四万一起写到下一张纸上。',{cash:fullLoan-partialLoan,network:5,setFlags:[HEIR_PARTIAL],removeFlags:[HEIR_LENT]},'个人到账 ¥80,000 · 公司仍欠 ¥40,000'),
   choice('extend','同意把十二万续留到交接时','你把新的约定收进自己的文件夹。手机没有到账通知。老爸问要不要一起走，你说我还得再把这页拍一遍。',{network:8,skill:4},'今天到账 ¥0 · 公司仍欠 ¥120,000'),
  ],'heir-mid');
 if (state.age !== 59) return undefined;
 const remembered = owed
  ? '那笔周转款还在账上，公司欠你 ' + yuan(owed) + '。接手的人把付款单和交接本分开放，先问你这笔要怎么结。'
  : state.flags.includes(HEIR_REPAID)
   ? '财务把那张已经结清的周转单夹在后面。你翻到付款人一栏，自己的名字还在。'
   : state.flags.includes(HEIR_CUT)
    ? '主管指了指最里面那台设备。那就是当年你让采购晚一批下单的那台，现在还在用。'
    : '接手的主管在最后一格留了位置。你看了眼签字栏，她把笔往自己那边移了一点。';
 return later('heir-final','签字的人换了',
  '车间还开着机。新负责人把交接本摊在折叠桌上，你手里那张门卡摸起来比新卡薄。' + remembered,
  owed ? [
   choice('collect','先把个人借款结清，再交门卡','付款到账后，你把门卡交给了她。你们走到门口，她拿卡试了一次，门响了。',{cash:owed,skill:5,removeFlags:loanFlags,setFlags:[HEIR_REPAID]},'个人到账 '+yuan(owed)),
   choice('waive','这笔留给公司，双方把数写清','你在文件上把那笔借款结掉。你的账户没进钱。新负责人站起来前又看了一眼数，自己把纸收进柜子。',{network:10,spirit:6,removeFlags:loanFlags},'放弃收回 '+yuan(owed)),
   choice('later','先交门卡，欠款照原记录走','你把债和交接分开办。出门时手机没有到账提示，欠款仍挂在账上。',{spirit:8,network:5},'今天到账 ¥0 · 公司仍欠 '+yuan(owed)),
  ] : [
   choice('delegate','把门卡交给她，以后由她签','你刷卡带她走了一圈。出来时她伸手接过去，说下回你来，记得在门房登记。你说行，先告诉我从哪儿进。',{network:9,skill:7}),
   choice('record','留个电话，有事再来一趟','她把你的号码写在旧记录最后一页。你顺手指了指每一页下面的经手人，说以后先找他们，找不到再打这个。',{skill:5,network:8}),
   choice('leave','东西收好，今天晚饭不在公司吃','你在门厅等电梯。财务问要不要叫车，你说不用。下楼后你走了一段，以前这条路都是从车窗里看。',{spirit:10,health:5}),
  ],'heir-final');
}

export function lifeYearsAlbumPhoto(state: GameState) {
 if (state.seenEvents.includes('life-start-daywork-final')) return lifeYearsPhoto('daywork-final');
 if (state.seenEvents.includes('life-start-heir-final')) return lifeYearsPhoto('heir-final');
}
