import { workPhoto } from './art';
import { monthlySalary, NIGHT_WORK } from './employment';
import type { GameState, LifeEvent } from './types';

const officeJobs = new Set(['tech', 'finance', 'creative', 'trade']);
const ownBusiness = new Set(['freelance', 'business']);
const money = (value: number) => '¥' + value.toLocaleString('zh-CN');
const lostJob = { job: 'unemployed', setFlags: ['work-break'] };

function reorganization(state: GameState): LifeEvent {
 const severance = monthlySalary(state) * 2;
 return {
  id: 'work-year-reorg', category: 'year', title: '四个人，三把椅子', tag: '工作变动',
  text: '会议室门关上了。沈经理把一张新组织图推到你手边。原来四个人的组，图上只有三个框。她指了指隔壁组的空位，又从文件下面抽出一份离岗单。',
  speakerId: 'boss', district: 'lujiazui', illustration: workPhoto('reorg'),
  choices: [
   { id: 'transfer', label: '去隔壁组，先保住这份工作', hint: '继续在岗，月薪减 12%',
    reply: '沈经理替你把第一场会约在下午。隔壁组的人指了张空桌，问你有没有多的显示器。', effect: { payRate: .88, network: 5, spirit: -2 } },
   { id: 'argue', label: '拿出项目记录，争取留在原组', hint: '谈成保原薪，谈不成调岗降薪 25%',
    reply: '你把只有你接过的三件事列了出来。沈经理看完，去隔壁打了个电话。', effect: { spirit: -3 },
    check: { stat: 'skill', threshold: 58, success: { face: 7 }, failure: { payRate: .75, spirit: -4 },
     successText: '她回来问你能不能把第三件也教给别人。工资单照旧。', failureText: '她把隔壁的空位留给你了。工资那一栏少了四分之一。' } },
   { id: 'leave', label: '拿离岗补贴，留半年找下家', hint: `${money(severance)} 入账，原岗位结 3 个月工资`,
    reply: '你把桌上的马克杯装进电脑包。下楼刷门禁时，保安还习惯性说了句「明天见」。', effect: { ...lostJob, cash: severance, spirit: -4 } },
  ],
 };
}

const nightShift: LifeEvent = {
 id: 'work-year-shift', category: 'year', title: '排班表最后一格', tag: '工作变动',
 text: '吴师傅把排班表夹在板子上。最晚一格没填，旁边有人用铅笔画了个问号。他问你要不要接这格，也说可以只做白班，收入按工时减。',
 speakerId: 'wu', district: 'xinzhuang', illustration: workPhoto('shift'),
 choices: [
  { id: 'late', label: '我接晚班，白天再补觉', hint: '恢复或保留全薪，以后每年多耗身体和心气',
   reply: '你把名字填上。这个月见到最多的街坊成了早点摊老板，每次你买的都是收摊后那口热的。', effect: { payRate: 1, health: -9, spirit: -6, network: 3, setFlags: [NIGHT_WORK] } },
  { id: 'day', label: '白班做到五点，晚上的事换人', hint: '按八成发薪，留出休息时间',
   reply: '吴师傅找人补上晚班。你五点零四走出来，看见平时到家才灭的那几扇窗还亮着。', effect: { payRate: .8, health: 8, spirit: 5, removeFlags: [NIGHT_WORK] } },
  { id: 'leave', label: '把钥匙交出去，先歇一阵', hint: '离岗半年，原岗位结 3 个月工资',
   reply: '吴师傅把你的名字从表上擦掉，又在纸角写了个号码。「真想回来，先打这个，别在群里问。」', effect: { ...lostJob, health: 10, network: 5 } },
 ],
};

const contract: LifeEvent = {
 id: 'work-year-invoice', category: 'year', title: '下周付款，又是下周', tag: '工作变动',
 text: '合同上写着下个月结款。对方在电话里说可以今天结，前提是以后都按新价走。你翻到账本前一页，上次他说「就改这一次」，也是礼拜五。',
 illustration: workPhoto('invoice'),
 choices: [
  { id: 'discount', label: '先收钱，把下个月顶过去', hint: '马上收 ¥5,000，之后按原价八成结',
   reply: '到账通知响得比他说话快。你先付掉房租，接着把账本上的报价划掉一行。', effect: { cash: 5000, payRate: .8, spirit: -1 } },
  { id: 'terms', label: '把报价拆开，账期和交付一起谈', hint: '谈成保价，谈不成降到八五折',
   reply: '你发了两份数字，先付一半就先做一半。对方隔了十分钟打过来。', effect: { skill: 3 },
   check: { stat: 'skill', threshold: 61, success: { cash: 1800, payRate: 1 }, failure: { payRate: .85, spirit: -4 },
    successText: '他在电话里算了一遍，同意先把启动款打来。', failureText: '启动款没谈下来。你少接了一块活，账上只剩八五折。' } },
  { id: 'walk', label: '暂停接单，把手里的尾款追完', hint: '空出半年，保留此前 3 个月收入',
   reply: '你把新合同关了。等旧款的人问你下个月能不能先排上，你这回先回了收款账号。', effect: { ...lostJob, health: 6, skill: 4 } },
 ],
};

const afterHours: LifeEvent = {
 id: 'work-year-overtime', category: 'year', title: '群里还有谁在线', tag: '工作变动',
 text: '保洁已经收过一趟垃圾，工位只剩两台电脑还亮着。沈经理拿来一张支援表，说以后每周得有人接夜里的消息。她问你是继续带这摊，还是把工作量和工资一起降下来。',
 speakerId: 'boss', district: 'lujiazui', illustration: workPhoto('overtime'),
 choices: [
  { id: 'stay', label: '我继续带，夜间消息我接', hint: '恢复或保留全薪，以后每年多耗身体和心气',
   reply: '群里很快多了个新头衔。周日半夜第一个艾特你的人，问的是周一开会用哪个链接。', effect: { payRate: 1, health: -10, spirit: -7, face: 6, setFlags: [NIGHT_WORK] } },
  { id: 'reduce', label: '少带一摊，晚上关通知', hint: '月薪按八成发，身体和心气回升',
   reply: '你当着她的面把夜间提醒关掉了。第二天早上八点再看，问会议链接的人已经自己找到了。', effect: { payRate: .8, health: 8, spirit: 7, removeFlags: [NIGHT_WORK] } },
  { id: 'contract', label: '转自由职业，试试接那份外包', hint: '换岗，年末分别结算两份收入',
   reply: '第一次给前同事报工时，你把当晚那些顺手回掉的消息也加了进去。对方看了会儿，说可以。', effect: { job: 'freelance', skill: 5, spirit: 5 } },
 ],
};

const returnToWork: LifeEvent = {
 id: 'work-year-return', category: 'year', title: '从一杯豆浆开始', tag: '再找工作',
 text: '前同事把两杯豆浆放在窗边。他说手上有个小单，只够两个人做三个礼拜。他还认识街口的店长，店里也在找人。他把联系方式写在一张干的纸上，免得你又把它压在杯子底下。',
 illustration: workPhoto('return'),
 choices: [
  { id: 'take', label: '先接小单，这回收启动款', hint: '开始接单，¥1,400 先到账',
   reply: '他当场转了钱。你把第一周要交的东西写在信封背面，等老板来收杯子时又读了一遍。', effect: { job: 'freelance', cash: 1400, skill: 5 } },
  { id: 'shop', label: '去街口的店试两天，再决定', hint: '进入城市服务，门店工资年底结',
   reply: '店长让你先坐下来吃早饭。第一天你记住了两桌客人的要求，第三桌不吃的葱你还得再问。', effect: { job: 'service', network: 4, spirit: 5 } },
  { id: 'practice', label: '小单先不接，借他的旧项目练一遍', hint: '继续找工作，保留三格年度行动',
   reply: '他给你发了份以前返工过的文件。你看了一上午，终于知道自己上次面试漏讲了哪一步。', effect: { skill: 9, network: 5 } },
 ],
};

export function workYearEvent(state: GameState): LifeEvent | undefined {
 if (!state.jobId) {
  return state.flags.includes('work-break') && !state.seenEvents.includes(returnToWork.id) ? returnToWork : undefined;
 }
 if (state.age === 33 && officeJobs.has(state.jobId)) return reorganization(state);
 if (state.age !== 45) return undefined;
 if (officeJobs.has(state.jobId)) return afterHours;
 return ownBusiness.has(state.jobId) ? contract : nightShift;
}
