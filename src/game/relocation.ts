import type { EventChoice, GameState, LifeEvent } from './types';
import { LONG_COMMUTE, NIGHT_WORK } from './workFlags';

export const RELOCATION_SHOTS = ['warehouse','worker-opening','worker-return','heir-opening','heir-return'] as const;
type RelocationShot = (typeof RELOCATION_SHOTS)[number];
export const relocationPhoto = (shot: RelocationShot) => '/art/relocation/'+shot+'.webp';

const transfer = 'warehouse-transfer';
const local = 'warehouse-local';
const inventory = 'warehouse-inventory';
const shuttleRebate = 2400;
const inventoryPay = 840;
const transferRate = 1.12;
export const RELOCATION_CAP = 90000;
export const RELOCATION_PLANS = [
 {id:'shuttle',label:'包半年班车',initial:72000,renewal:18000},
 {id:'local',label:'留三个月收货点',initial:36000,renewal:24000},
 {id:'close',label:'搬仓当周结清',initial:18000,renewal:12000},
] as const;
type Plan = (typeof RELOCATION_PLANS)[number];
const planFlag = (plan: Plan) => 'warehouse-company-'+plan.id;
const extended = 'warehouse-company-extended';
const closed = 'warehouse-company-closed';
const yuan = (amount: number) => '¥'+amount.toLocaleString('zh-CN');

export function relocationBudget(state: Pick<GameState,'flags'>) {
 const plan = RELOCATION_PLANS.find(item=>state.flags.includes(planFlag(item)));
 if (!plan) return;
 const extra = state.flags.includes(extended) ? plan.renewal : 0;
 return {plan,extra,remaining:RELOCATION_CAP-plan.initial-extra,closed:state.flags.includes(closed)};
}

const event = (shot: RelocationShot, speakerId: string, title: string, text: string, choices: EventChoice[]): LifeEvent => ({
 id:'life-start-move-'+shot,speakerId,title,text,choices,category:'year',district:'xinzhuang',tag:'仓库搬迁',
 illustration:relocationPhoto(shot),
});

const workerOpening = event('worker-opening','gao','六点二十这班车',
 '旧仓门口多了一辆试跑的班车。高原说，仓库搬去松江，新班从这里六点二十发车。工资高一截，路上多出不少时间。门边还有张单，旧库的收货点留三个月，正缺个人。实在不想换岗，最后三天也有人付钱请你盘货。',
 [
  {id:'transfer',label:'跟去松江，先坐一趟六点二十的车',hint:'接收货岗 · 岗位工资 ×1.12 · 通勤更累',
   effect:{job:'service',payRate:transferRate,health:-3,trust:6,setFlags:[transfer,LONG_COMMUTE],removeFlags:[NIGHT_WORK]},
   reply:'去的时候，车开到新仓门口。晚上回莘庄还得换一次。你把闹钟往前拨了四十分钟，高原把新工资发过来，又问，回程在哪儿换车记得伐。'},
  {id:'local',label:'留在莘庄，先接旧库收货',hint:'接本地收货岗 · 按岗位原薪结',
   effect:{job:'service',payRate:1,spirit:7,trust:7,setFlags:[local],removeFlags:[NIGHT_WORK,LONG_COMMUTE]},
   reply:'第一辆来收货的车开惯了原门，你站出去招了两次手。下工还赶上理发店开着，你把帽子摘下来才想起，今天不用赶班车。'},
  {id:'inventory',label:'只盘最后三天，干完当面结',hint:'一次到账 '+yuan(inventoryPay)+' · 保持现在的工作',
   effect:{cash:inventoryPay,skill:6,network:6,setFlags:[inventory]},
   reply:'你把空托盘也数了一遍。收工转账八百四，车还在院里装最后一批货。高原问剩下那盒粉笔你要不要，你拿了一支。'},
 ]);

function workerReturn(state: Pick<GameState,'flags'|'jobId'>) {
 const flags=state.flags;
 if (flags.includes(transfer)&&flags.includes(LONG_COMMUTE)&&state.jobId==='service') {
  return event('worker-return','gao','班车还停老门口吗',
   '去年跟仓去了松江。如今厂里换承包方，高原拿来两张单。一路直达的车只接早班。继续原来的线路，可以补去年自付的两千四，但回程还是得换一次。工资单这回没改。',
   [
    {id:'express',label:'改乘直达车，先把回程时间定下来',hint:'保留工资 · 去掉这份长通勤的消耗',
     effect:{health:5,spirit:6,trust:6,removeFlags:[LONG_COMMUTE]},
     reply:'上车以后司机让你们自己定下车点。有人说能不能停菜场后门。你看了一眼表，正好还能买菜。'},
    {id:'rebate',label:'照旧转车，把两千四的补贴领了',hint:'一次到账 '+yuan(shuttleRebate)+' · 原通勤照旧',
     effect:{cash:shuttleRebate,trust:4},
     reply:'补贴到了以后你把手机放回兜里。晚车开进站，坐旁边的人照旧把靠窗那一位留给你。'},
   ]);
 }
 return event('worker-return','gao','门口还有一块旧招牌',
  (flags.includes(local)?'旧收货点做完三个月就撤了。高原把新的近处收货名单送来，说熟客现在不用跑到松江。'
   :flags.includes(transfer)?'你后来没再跟那辆车。高原从柜里拿出一页旧单，让你看看当时跑过的那条线怎么写。'
   :'去年盘完货，高原把你画的那一道粉笔印留在了门框上。新公司接手前，还有人按老地址来取一件小货。')+
  '今天剩半车东西待发，他问你要不要留下帮一趟。',
  [
   {id:'help',label:'帮忙发完这半车，今天的工钱今天结',hint:'一次到账 ¥280 · 保持现在的工作',
    effect:{cash:280,health:-3,trust:7},
    reply:'最后一单贴错了门牌，你跟司机在院里对到天暗。两百八响了一声，高原说这声总比电话好听。'},
   {id:'list',label:'把地址和交接人写下来，我今天有事',hint:'留下联系人 · 不改现在的工作',
    effect:{network:9,spirit:5},
    reply:'高原把那行电话写到旧招牌背后，说下回有人跑错，总还有个电话能问。'},
  ]);
}

const company = (plan: Plan, label: string, reply: string, effect: EventChoice['effect']): EventChoice => {
 return {id:plan.id,label,reply,effect:{...effect,setFlags:[planFlag(plan)]},
  hint:'公司支出 '+yuan(plan.initial)+' · 余 '+yuan(RELOCATION_CAP-plan.initial)+' · 个人余额不变'};
};
const heirOpening = event('heir-opening','father','车开出去之前签哪张',
 '旧仓要腾空。老爸把九万块搬仓预算写在一页纸最上面，放到你面前。公司可以包半年班车，也可以保留一个就近收货点，或者按日期搬完，留钱结工钱。楼下已经有人来问，明年还能不能在老门口上车。',
 [
  company(RELOCATION_PLANS[0],'公司包半年班车，把发车点写清楚','账从公司走。你没先签，跑去问早班最远的那个人从哪儿过来。首班原来写的六点十分。你回来改成了六点二十。',{skill:7,network:7,trust:5}),
  company(RELOCATION_PLANS[1],'旧库留三个月收货，先把订单接住','你签下旧库的一小块地方。第一车来领货的人把车停在原来的门口，送货员下来先问，招牌怎么还没换。',{skill:9,network:5,trust:6}),
  company(RELOCATION_PLANS[2],'按原日子搬，先把工钱结清','旧库最后一盏灯关得很晚。你没叫办公室催走，留着等两张收款单回传。钱付出去以后，财务才把设备搬运单装进档案袋。',{face:5,skill:6,trust:6}),
 ]);

function heirReturn(budget: NonNullable<ReturnType<typeof relocationBudget>>) {
 const {plan,remaining}=budget;
 const detail = {
  shuttle:{
   text:'半年的班车快到期了。早班有人搬到了新仓附近，还有几个人靠这辆车。车队这次只能按月续，临时多开一班要一万八。',
   label:'续最后一个月，让早班的人把住处定好',
   reply:'司机把最后一天写到车窗上。那几个人看到日期就开始互相问房子，后来有两家租到了同一条街。'},
  local:{
   text:'收货点三个月到了，房东愿意再给两个月。账上还有五万四，但旧店的人到这领东西确实方便。老爸让你再去看一次现场，别光看纸上的车次。',
   label:'再留两个月，把来取货的人通知到',
   reply:'你把最后取货日写在门口。一个跑错过三次的司机今天准时来，卸完问以后打哪个电话。'},
  close:{
   text:'仓库已经搬完，工钱也结了。还有几笔临时补货，车间问要不要自己做最后一周的分拣。把运输和工时写进单子，要一万二。',
   label:'加开一周日班，把用工和运输一起签',
   reply:'工时和运费写在两张单上。最后一车走掉以后，老爸把两张签字都夹好，问你要不要顺路去吃碗面。'},
 }[plan.id];
 return event('heir-return','father','把剩下那栏也签掉',
  detail.text+' 这是公司的余款，财务等你签字。',
  [
   {id:'extend',label:detail.label,reply:detail.reply,
    hint:'公司支出 '+yuan(plan.renewal)+' · 余 '+yuan(remaining-plan.renewal)+' · 个人余额不变',
    effect:{skill:6,network:7,trust:6,setFlags:[extended,closed]}},
   {id:'finish',label:'到期就结束，先通知还在用的人',
    hint:'公司余 '+yuan(remaining)+' · 个人余额不变',
    effect:{skill:5,spirit:7,trust:5,setFlags:[closed]},
    reply:'你没让财务只发个到期通知。交接时留了两个电话，有人今天就打过来，问旧门口还找不找得到人。'},
  ]);
}

export function warehouseWorkerYear(state: Pick<GameState,'age'|'flags'|'jobId'>) {
 if (state.age===36) return workerOpening;
 if (state.age===37 && [transfer,local,inventory].some(flag=>state.flags.includes(flag))) return workerReturn(state);
}

export function warehouseHeirYear(state: Pick<GameState,'age'|'flags'>) {
 if (state.age===36) return heirOpening;
 const budget=relocationBudget(state);
 if (state.age===37 && budget && !budget.closed) return heirReturn(budget);
}

export function remembersWarehouseBus(state: Pick<GameState,'flags'>) {
 return state.flags.includes(transfer);
}

export const RELOCATION_TICKET = [
 workerOpening, heirOpening,
 workerReturn({flags:[transfer,LONG_COMMUTE],jobId:'service'}),
 heirReturn(relocationBudget({flags:[planFlag(RELOCATION_PLANS[0])]})!),
] as const;
