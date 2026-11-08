import { handoverPhoto, workPhoto } from './art';
import { employmentOf, NIGHT_WORK, WORK_HANDOVER_PENDING, WORK_HANDOVER_PROOF } from './employment';
import type { DistrictId, GameState, LifeEvent } from './types';

type Handover = {
 title: string;
 district: DistrictId;
 speakerId: string;
 text: string;
 note: string;
 written: [label: string, reply: string];
 finish: [label: string, reply: string];
 defer: [label: string, reply: string];
};

const stories: Record<string, Handover> = {
 creative: {
  title: '「最终版」底下还有一版', district: 'zhangjiang', speakerId: 'qi',
  text: '祁清把两张打样摊开。印厂收到的文件少了七毫米，下午就要开机。群里有三份叫「最终版」的文件，她问你手里哪份能印。',
  note: '印厂签过的那张打样单',
  written: ['停一会儿，写清印厂该用哪份', '印厂师傅在两张纸上都签了名，一张写作废，一张才送去开机。祁清把你这次多留的一段时间也记在了单上。'],
  finish: ['把七毫米补回去，先让机器开起来', '版补回来了。师傅把第一张递给你，你翻过来看，纸上只有机器打的时间。'],
  defer: ['请发文件的人来确认，我只送对的那份', '对方说找不到电脑。祁清把两张纸夹在一起，让你陪她再等十分钟。你倒是赶上了回去那班车。'],
 },
 tech: {
  title: '凌晨两点，标题写着「可忽略」', district: 'zhangjiang', speakerId: 'ning',
  text: '周宁把手机搁在两台电脑中间。昨晚响了两次，第二次还把订单卡住了。群里说已经处理，交接单上却连几点响的都没填。',
  note: '值班交接单上补过的时间',
  written: ['把两次告警的时间和接班人写上', '周宁等你写完，才把自己的名字也签上去。签完他问，你刚才那段时间是不是也算轮班。'],
  finish: ['先把队列恢复，再把手机调成震动', '订单重新动了。你们叫了两碗面，吃到一半他摸了摸桌上的手机，发现一直震的是隔壁人的。'],
  defer: ['让原值班人签完，我接下一班', '原值班人赶回来补了记录。你把充电线借给他，临走他问能不能先借到下礼拜。'],
 },
 finance: {
  title: '两张小票，同一趟车', district: 'lujiazui', speakerId: 'boss',
  text: '沈经理把两张六十八块的车票翻过来。出发时间只差一分钟，车牌号一样。表上写着两个人各打了一辆。',
  note: '附过两张车票的对账单',
  written: ['把两张都夹上，写清只报一趟', '报销单过了。沈经理把另一张票订在背面，说留着吧，下回同一辆车再来，也认得出来。'],
  finish: ['先把重复的删掉，赶上这批报销', '钱赶在五点发了。隔壁问怎么少了一笔，你让他看了眼车牌。他想起来了，说那天确实是一起走的。'],
  defer: ['把票退回去，请坐车的人自己填', '两张票转了一圈，又夹在同一只信封里回来。这次写了一个人的名字。'],
 },
 service: {
  title: '关店了，账上还差六十', district: 'xinzhuang', speakerId: 'wu',
  text: '吴师傅翻了三遍收银机。六号桌分开付过，收银台只打了一张。你们对着已经叠好的椅子，数当时到底有几个人。',
  note: '钉在收班单上的六号桌小票',
  written: ['找齐两张小票，钉在收班单上', '第二张小票在围裙里。吴师傅说你也把关店时间写上，一共晚走了多久，这次店里算。'],
  finish: ['翻一遍付款记录，先把账对平', '差的六十正好是另一个人付的。你对完才想起来汤还在后厨，吴师傅已经把两碗端出来了。'],
  defer: ['把差额留在交接栏，请白班再核', '早班把差额找回来了。吴师傅下次给你留了个装散票的小盒，盒盖是坏的。'],
 },
 public: {
  title: '先关总阀，再问谁来修', district: 'people', speakerId: 'yang',
  text: '杨帆接过那张报修单。楼上、楼下都说自己没漏水，楼道已经摆了两个盆。单上最清楚的一栏，是谁把地拖干净的。',
  note: '写了关阀时间的报修交接单',
  written: ['问到总阀在哪，把关阀时间记下来', '师傅问你们为什么不把两户号码都抄上。杨帆把单翻过来，说需要找人的时候，先打我这个。'],
  finish: ['先去借梯子，让师傅把水止住', '水止住以后，两户一起把盆拿走了。杨帆看看表，说你晚下班半小时，先去吃点东西。'],
  defer: ['先把盆挪稳，叫白班和物业一起上门', '第二天两个盆都干了，钥匙在物业。杨帆发来张照片，照片里还有一个盆，是楼上顺手送的。'],
 },
 freelance: {
  title: '一张图要裁出两张', district: 'bund', speakerId: 'sun',
  text: '孙阿宝摊开两张样片。对方订的是横图，交货前才说手机竖着看也要放得下。再做一版，不知道该算修改还是加单。',
  note: '签了两种尺寸的交付单',
  written: ['把两种尺寸都写在单上，再动手', '对方先问能不能只写一张。孙阿宝把那张竖版举到手机旁边，他看了看，最后自己添了一个勾。'],
  finish: ['把竖版也裁好，今晚一起发', '对方秒回了「收到」。十分钟以后又问，方的能不能也来一张。孙阿宝把这条先标成了未读。'],
  defer: ['先交原来那张，留出明天的时间再问', '横版发出去了。第二天对方把竖图的尺寸发来，顺带问了一句是不是要另报价。'],
 },
 business: {
  title: '订八十份，来取六十份', district: 'xinzhuang', speakerId: 'he',
  text: '何亮把蒸笼盖掀开一条缝。下单的人昨天订八十，今早说车上只坐六十个，问多的能不能都算没做。火已经开了。',
  note: '签过实做份数的提货单',
  written: ['把八十份写上，问剩的二十怎么拿', '对方说先提六十，剩下的午饭回来取。何亮让他在本子上把这个「回来」也写成几点。'],
  finish: ['先让车走，剩下二十份摆到门口卖', '还剩四盒时，一个刚下班的人全买了，说带回去给早班的人。他挑的是底最脆的那盒。'],
  defer: ['先交六十，余下的别急着起锅', '那边中午真的来问。何亮说要再等一笼的时间，对方这回问清了几分钟。'],
 },
 trade: {
  title: '单子上是八箱，地上只有六箱', district: 'lujiazui', speakerId: 'gao',
  text: '高原在仓库门口数到第六个纸箱。对方说单子先签，剩下两箱明早补。他把笔递给你，问你今天的车还等不等。',
  note: '双方都写了实收六箱的签收单',
  written: ['在单上写实收六箱，双方各留一张', '司机说本子上没那一栏。高原把背面翻给他看，背面很大，四个字够写。'],
  finish: ['先把六箱装走，缺的两箱明早再来', '你们赶上了车。第二天来的还是同一个司机，他看见你先举了两根手指。'],
  defer: ['让仓库先查一遍，我改下一趟车', '那两箱在另一扇门边。高原发来照片，问司机已经走了吗。你站在站台上给他回了一张。'],
 },
};

const startPrefix = 'work-start-';
const payrollPrefix = 'work-payroll-';
const startTag = '第一次交接';
const payrollTag = '对账';

function firstHandover(job: string, story: Handover, sinceAge: number, late = false): LifeEvent {
 return {
  id: startPrefix + job + '-' + sinceAge, title: story.title,
  text: story.text + (late ? ' 排班表上，今晚轮值那格已经填了你的名字。' : ''),
  tag: startTag, category: 'career', district: story.district, speakerId: story.speakerId,
  illustration: handoverPhoto(job),
  choices: [
   { id: 'record', label: story.written[0], reply: story.written[1], hint: '留一份签过字的交接记录',
    effect: { skill: 6, trust: 6, spirit: -2, setFlags: [WORK_HANDOVER_PROOF], removeFlags: [WORK_HANDOVER_PENDING] } },
   { id: 'finish', label: story.finish[0], reply: story.finish[1], hint: '工作先收尾 · 多耗一点体力',
    effect: { skill: 5, network: 5, health: -5, trust: 3, removeFlags: [WORK_HANDOVER_PENDING] } },
   { id: 'defer', label: story.defer[0], reply: story.defer[1], hint: '按点走 · 留给下一班处理',
    effect: { health: 3, spirit: 5, skill: 2, removeFlags: [WORK_HANDOVER_PENDING] } },
  ],
 };
}

function payroll(job: string, story: Handover, sinceAge: number): LifeEvent {
 const contract = job === 'freelance' || job === 'business';
 const extra = contract ? 600 : 380;
 const money = '¥' + extra.toLocaleString('zh-CN');
 return {
  id: payrollPrefix + job + '-' + sinceAge, title: contract ? '那一笔没抄到账上' : '工资单少了一班',
  text: (contract ? '对方结完第一笔钱，说都是照单付的。你翻到' : '工资单发下来了，补贴那一栏是空的。你翻到') +
   story.note + '。上面有日期，还有经手人的名字。你把新旧两份并在一起，发现漏的是' + (contract ? '一笔加单。' : '交接那一班。'),
  tag: payrollTag, category: 'career', district: story.district, speakerId: story.speakerId,
  illustration: workPhoto(contract ? 'settlement' : 'payroll'),
  choices: [
   { id: 'claim', label: '把两份单据发过去 · 补 ' + money,
    reply: '对方查了半天，问你单据怎么还在。钱到账时他已经把新表也发过来了，你把原件叠好收回去。',
    effect: { cash: extra, skill: 4, trust: 4, spirit: -3 } },
   { id: 'keep', label: '这笔先算了 · 下次发前一起对',
    reply: '你们约好下次关账前看一遍。原件还在你这儿，刚好能压住桌上那张总往下掉的纸。',
    effect: { spirit: 6, network: 3, trust: 6 } },
   { id: 'half', label: '今天只收一半 · 原件我留着',
    reply: '对方说一半今天能批。你收了这笔，说剩下算了，发你一份改过的表就行。',
    effect: { cash: extra / 2, spirit: 3, trust: 3 } },
  ],
 };
}

export function workHandover(state: GameState): LifeEvent | undefined {
 if (!state.jobId || state.pendingYearEvent || state.ended || state.actions <= 0) return;
 const story = stories[state.jobId];
 if (!story) return;
 const { sinceAge } = employmentOf(state);
 const id = startPrefix + state.jobId + '-' + sinceAge;
 if (state.flags.includes(WORK_HANDOVER_PENDING) && !state.seenEvents.includes(id)) {
  return firstHandover(state.jobId, story, sinceAge, state.flags.includes(NIGHT_WORK));
 }
 if (state.flags.includes(WORK_HANDOVER_PROOF) &&
     !state.seenEvents.includes(payrollPrefix + state.jobId + '-' + sinceAge) &&
     state.journal.some(entry => entry.tag === startTag && entry.title === story.title && entry.age >= sinceAge && entry.age < state.age)) {
  return payroll(state.jobId, story, sinceAge);
 }
}

export function isWorkHandover(id: string) {
 return id.startsWith(startPrefix) || id.startsWith(payrollPrefix);
}

export const HANDOVER_TICKET = [firstHandover('tech', stories.tech, 18), payroll('tech', stories.tech, 18)] as const;
