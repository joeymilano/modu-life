import { rentalPhoto } from './art';
import type { EventChoice, GameState, LifeEvent } from './types';

const baseRent = 3000;
const equipmentFee = 300;
const downstairsRent = baseRent + equipmentFee;
const upstairsRent = 3600;
const contractFee = 6000;
const activeLease = 'rental-xinzhuang-active';
const closedLease = 'rental-xinzhuang-closed';
const feeRead = 'rental-fee-read';
const repairWritten = 'rental-wall-written';
const rentalTag = '莘庄看房';
const negotiationTitle = '笔先别递过去';
const money = (value: number) => '¥' + value.toLocaleString('zh-CN');
const firstYearQuote = (fee: number, rent: number) =>
 '先付 ' + money(fee) + ' · 月租 ' + money(rent) + ' · 首年共 ' + money(fee + rent * 12);

export const RENTAL_CLUES = [
 { id: 'wall', bit: 1, label: '墙角', x: 16, y: 31,
  title: '刚刷的那一块',
  detail: '手指贴上去是凉的。墙漆边鼓了一串小泡，床头刚好挨着这面墙。',
  evidence: '要修渗水，可以写进合同。', alt: '床边刚刷过的墙漆沿着潮湿的边缘起了泡' },
 { id: 'contract', bit: 2, label: '合同', x: 78, y: 77,
  title: '月租底下还有一行',
  detail: '方姐刚才报了月租。把合同翻到第二页，看看哪一项每个月还要再付。',
  evidence: '设备维护费每月再付 ¥300。签约费单算。', alt: '旧木桌上的两页合同、黑笔和蓝牌钥匙' },
 { id: 'window', bit: 4, label: '窗外', x: 63, y: 42,
  title: '排风机刚起转',
  detail: '窗只拉开一条缝，锅铲声就进来了。方姐说隔壁要炒到十一点，楼上高一层，窗对着树。',
  evidence: '楼上还空着，可以问价。', alt: '窄巷对面正在转动的厨房排风机' },
] as const;

export const ALL_RENTAL_CLUES = RENTAL_CLUES.reduce((mask, clue) => mask | clue.bit, 0);

export const RENTAL_CONTRACT_LINES = [
 { id: 'rent', label: '第一条 · 房屋租金', terms: money(baseRent) + '／月', note: '这是方姐报过的三千。再往下看。' },
 { id: 'signing', label: '第三条 · 签约费', terms: money(contractFee) + '，签字时一次付清', note: '这一笔只在签字时付，不抵房租。' },
 { id: 'equipment', label: '第六条 · 设备维护费', terms: money(equipmentFee) + '／月，随房租一并收取', note: '每个月实际要交 ¥3,300。让方姐把这一行划掉。' },
 { id: 'keys', label: '第七条 · 钥匙', terms: '交付一套，退租时归还', note: '钥匙要还。这一条没多收钱。' },
] as const;

export function closeRentalLease(flags: string[]) {
 if (!flags.includes('rental_checked') || flags.includes(closedLease)) return flags;
 return [...flags.filter(flag => flag !== activeLease && flag !== feeRead && flag !== repairWritten), closedLease];
}

export function rentalNegotiation(evidence: number): LifeEvent {
 const [wall, contract, window] = RENTAL_CLUES.map(clue => Boolean(evidence & clue.bit));
 const choices: EventChoice[] = [];
 const signed = { housing: 1, setFlags: ['rental_checked', activeLease], removeFlags: [closedLease] };
 if (contract) {
  choices.push({
   id: 'amend', label: wall ? '划掉设备费，渗水也写进去' : '划掉设备费再签',
   hint: firstYearQuote(4000, baseRent),
   effect: { ...signed, cash: -4000, leaseRent: baseRent, skill: 5, spirit: wall ? 6 : 2, trust: 5,
    setFlags: [...signed.setFlags, feeRead, ...(wall ? [repairWritten] : [])] },
   reply: wall
    ? '方姐划掉三百块那行，把签约费改成四千。她让房东把修墙的日子写下来，自己拍了一份。夜里还是听得见排风机。'
    : '方姐把签约费改成四千，设备费那行划了两道。你付完钱才发现，房间最贵的设备其实在窗外。',
  });
 } else if (wall) {
  choices.push({
   id: 'repair', label: '先写清楚哪天修墙，再签',
   hint: '先付 ¥6,000',
   effect: { ...signed, cash: -contractFee, leaseRent: downstairsRent, skill: 3, spirit: 3, trust: 3,
    setFlags: [...signed.setFlags, repairWritten] },
   reply: '墙是周四来修，房东在日期旁边签了字。月底方姐把账单发过来，三千的房租底下，还有三百的设备费。',
  });
 }
 if (window) {
  choices.push({
   id: 'upstairs', label: '换楼上那间',
   hint: firstYearQuote(5200, upstairsRent),
   effect: { ...signed, cash: -5200, leaseRent: upstairsRent, health: 5, spirit: 10, trust: 3 },
   reply: '楼上钥匙拧了两下才开。你把窗拉到底，只有梧桐叶响。楼下那张合同留在了方姐包里，这间每月三千六。',
  });
 }
 choices.push({
  id: 'sign', label: '按原合同签',
  hint: contract ? firstYearQuote(contractFee, downstairsRent) + '（含设备费）' : '先付 ¥6,000',
  effect: { ...signed, cash: -contractFee, leaseRent: downstairsRent, health: -6, spirit: -5,
   setFlags: [...signed.setFlags, ...(contract ? [feeRead] : [])] },
  reply: '你把签约费转了。搬进去那晚，排风机响到十一点。月底房东收三千三，说多出来那三百就在合同第二页。',
 }, {
  id: 'leave', label: '把钥匙还给方姐',
  hint: '保留现在的住处',
  effect: { setFlags: ['rental_checked'], skill: 4, spirit: 3, network: 2, trust: 3 },
  reply: '方姐把钥匙挂回那串钥匙上，问你明早有空伐。她说还有间离地铁远两站，早上去，至少能看清窗外。',
 });
 return {
  id: 'rental-xinzhuang', title: negotiationTitle, category: 'housing', tag: rentalTag,
  district: 'xinzhuang', speakerId: 'fang', illustration: rentalPhoto('talk'),
  text: '房东在楼下按了两回喇叭。方姐把手机反扣，替你把合同往回拉了一点。「有哪行要改，现在讲。」',
  rentalEvidence: evidence, choices,
 };
}

const renewalTag = '莘庄续约';
const renewalPrefix = 'rental-renewal-';
type Renewal = 'fee' | 'fan' | 'tree';

function renewal(kind: Renewal, title: string, text: string, choices: EventChoice[]): LifeEvent {
 return {
  id: renewalPrefix + kind, title, text, choices, category: 'housing', tag: renewalTag,
  district: 'xinzhuang', speakerId: 'fang', illustration: rentalPhoto(`renew-${kind}`),
 };
}

const moveUpstairs: EventChoice = {
 id: 'upstairs', label: '搬楼上 · 窗对着树',
 hint: '签约付 ¥5,200 · 之后月租 ¥3,600',
 reply: '方姐把楼上的钥匙给你。晚上十一点你开了窗，先听见有人骑车回家。那辆车拐弯时响了一下铃。',
 effect: { cash: -5200, leaseRent: upstairsRent, health: 5, spirit: 7, trust: 4 },
};

function downstairsFee(wallFixed: boolean) {
 return renewal('fee', '划掉的三百又回来了',
  (wallFixed ? '床头那面墙是照着合同上的日子修好的。' : '床头那面墙又起了两个小泡。') +
  ' 方姐把新旧两份续约单叠起来。设备费那行在旧的上面被划掉了，新单上又印了一遍。她问你，这次要她先拿笔，还是先拿手机。', [
   { id: 'copy', label: '把签过的那一页翻出来',
    hint: '月租保持 ¥3,000',
    reply: '她把两页拍给房东。房东回了一条语音，说文件是从电脑里直接打出来的。过了会儿他又发一条，说那就按签过的来。',
    effect: { trust: 8, skill: 6 } },
   { id: 'paint', label: '接受新报价 · 换遮光帘，把墙补完',
    hint: '新月租 ¥3,300',
    reply: '方姐把换帘和补墙都写进去。新帘拉上，墙角终于干了。炒晚饭的声音还在，至少房里能先睡一会儿。',
    effect: { leaseRent: downstairsRent, spirit: 7, health: 3 } },
   moveUpstairs,
  ]);
}

function downstairsFan(savedPage: boolean) {
 const refund = savedPage ? equipmentFee * 3 : 0;
 return renewal('fan', '设备停了，设备费没停',
  '隔壁的排风机停了三个月，设备费还在收。方姐推开窗让你听，楼下老板在数还剩几只煤气罐。' +
  (savedPage ? ' 签字那天你留过这一条，三张账单也都找得到。' : ' 你翻了一圈，只找到每月的转账，里头没分哪笔是设备费。'), [
   { id: 'stop', label: savedPage ? '把三个月账单摊开 · 退 ¥900' : '把新约上的设备费划掉',
    hint: '新月租 ¥3,000',
    reply: savedPage
     ? '方姐把三张账单拍在一起。对方先转了三百，隔了半分钟又补六百，备注写得比合同还短，就一个「退」。'
     : '这几个月的账对不出来。方姐把新合同拉到桌边，当着房东的面划掉了以后每月那三百。',
    effect: { cash: refund, leaseRent: baseRent, skill: 6, trust: 5 } },
   { id: 'keep', label: '按原价续 · 请他们把窗缝封一下',
    hint: '月租保持 ¥3,300',
    reply: '方姐买来一卷密封条，贴到一半发现窗还是关不严。她把剩下那截留下，说修东西的人下回记得先量长度。',
    effect: { spirit: 4, health: 3, trust: 4 } },
   moveUpstairs,
  ]);
}

function upstairsRenewal() {
 return renewal('tree', '楼上也有一张新报价',
  '窗外有人给梧桐修枝。方姐把两张报价放在窗台上。楼下租客刚走，房东肯把那间降回三千。楼上写着三千九，补一句可以换一扇合得严的窗。', [
   { id: 'match', label: '拿空着的二楼比价 · 按原价续',
    hint: '月租保持 ¥3,600 · 旧窗照用',
    reply: '房东算了下楼下空了多少天，松口按原价。方姐把旧窗用木楔垫住，问你冬天还记不记得这是往哪边拔。',
    effect: { skill: 6, trust: 6, spirit: 3 } },
   { id: 'upgrade', label: '让他把新窗写进去 · 接受涨价',
    hint: '新月租 ¥3,900',
    reply: '换窗那天，工人把旧玻璃往楼下抬。你收走窗台那两片叶子，回来试了两次，新窗真的能合上。',
    effect: { leaseRent: 3900, health: 6, spirit: 6 } },
   { id: 'downstairs', label: '回二楼 · 每月留六百在手上',
    hint: '签约付 ¥4,000 · 之后月租 ¥3,000',
    reply: '床换了个方向，窗外的排风机也停了。住回楼下的头一晚，你没听见机器，倒听清了隔壁点了几份鳝丝。',
    effect: { cash: -4000, leaseRent: baseRent, skill: 5, spirit: -2 } },
  ]);
}

export function rentalRenewal(state: GameState): LifeEvent | undefined {
 if (state.ended || state.pendingYearEvent || state.actions <= 0 || state.district !== 'xinzhuang' ||
     state.housing !== 1 || state.flags.includes(closedLease) || state.seenEvents.some(id => id.startsWith(renewalPrefix))) return;
 // Older saves already record the signing scene and rent, but have no active lease flag.
 if (!state.flags.includes(activeLease) && !state.seenEvents.includes('rental-xinzhuang')) return;
 const signed = state.journal.find(entry => entry.tag === rentalTag && entry.title === negotiationTitle);
 if (!signed || signed.age >= state.age) return;
 if (state.leaseRent === baseRent) return downstairsFee(state.flags.includes(repairWritten) || signed.text.includes('把修墙的日子写下来'));
 if (state.leaseRent === downstairsRent) return downstairsFan(state.flags.includes(feeRead));
 if (state.leaseRent === upstairsRent) return upstairsRenewal();
}

export function isRentalRenewal(id: string) {
 return id.startsWith(renewalPrefix);
}

export const RENEWAL_TICKET_SCENES = [downstairsFee(true), downstairsFan(true), upstairsRenewal()] as const;
