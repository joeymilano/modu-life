import { calendarYear } from './calendar';
import { openingPhoto } from './art';
import { heirClassYear, staffBedRent, workerClassYear } from './classLives';
import { livesInPenthouse, PENTHOUSE_FEE } from './heirConcierge';
import { HEIR_CAPITAL_TIER, HEIR_PERSONAL_CASH, heirTerms } from './heirCapital';
import { HEIR_WEST_BUND, heirStoryPhoto, westBundSecondYear } from './heirStory';
import { isSystemLife, SYSTEM_CASH, periodSystemOpening, systemPhoto, systemSecondYear } from './systemStory';
import { dramaPhoto, OPENING_ALLIES, OPENING_DRAMA, OPENING_PROOF, withOpeningRecord } from './openingStakes';
import { laterDaywork, laterHeir } from './lifeYears';
import { warehouseHeirYear, warehouseWorkerYear } from './relocation';
import type { Effect, EventChoice, GameState, LifeEvent } from './types';

export const DAYWORK = 'daywork-start';
export const DAYWORK_DUE = 'daywork-due';
export const DAYWORK_REMAINDER = 'daywork-remainder';
export const DAYWORK_TEMP = 'daywork-temporary';
export const HEIR = 'heir-start';
export const FAMILY_HOME = 'heir-family-home';
export const FAMILY_PAY = 'heir-family-pay';
const HEIR_TRIAL = 'heir-pilot';
const HEIR_ORDER = 'heir-order';
const HEIR_HANDOVER = 'heir-handover';
const DAYWORK_KITCHEN = 'daywork-first-kitchen';
const DAYWORK_WEST = 'daywork-first-west';
export const DAYWORK_PAY = 780;
export const HEIR_PAY_RATE = 1.25;
export const PROJECT_BUDGET = 800000;

export const LIFE_STARTS = [
 {
  id: 'daywork', seed: 'SH-SHIFT', cash: 780, place: '莘庄', title: '日结工', line: '赵正撕了报名单角：名字划掉，铺位没侬份',
  text: '兜里七百八十块，一只滚进雨里的旧皮箱。夜里最后一车货，你一个人卸。',
  cards: ['born-daywork', 'fund-thin', 'talent-code', 'tie-free', 'secret-kind'],
  photo: openingPhoto('daywork-gate'),
 },
 {
  id: 'heir', seed: 'SH-HEIR', cash: HEIR_PERSONAL_CASH, place: '陆家嘴', title: '顶级富二代', line: '周骁霸了主位：「备餐口给你加张折凳」',
  text: '满座推杯换盏，没人晓得六千万上午刚进你的中行存折。母亲把原版主东请帖塞进了你掌心。',
  cards: ['born-heir', 'fund-family', 'talent-count', 'tie-demand', 'secret-kind'],
  photo: heirStoryPhoto('family'),
 },
 {
  id:'system',seed:'SH-SYSTEM',cash:SYSTEM_CASH,place:'外滩',title:'系统流',line:'首单悬赏八万，面板却把主导权判给了顾桥',
  text:'外滩暴雨夜，你刚帮许舟把电瓶抬进廊下，顾桥拿伞尖指路让你滚去后门——整栋楼啪地断了电。',
  cards:['born-system','fund-system','talent-code','tie-free','secret-kind'],
  photo:systemPhoto('phone'),
 },
] as const;

export type LifeStart = (typeof LIFE_STARTS)[number];

export function lifeStartProfile(ids: readonly string[]) {
 return LIFE_STARTS.find(start => ids.includes(start.cards[0]));
}

export function validLifeStartHand(ids: readonly string[]) {
 const profile = LIFE_STARTS.find(start => start.cards.slice(0,2).some(id => ids.includes(id)));
 return !profile || profile.cards.every(id => ids.includes(id));
}


const option = (id: string, label: string, reply: string, effect: Effect, hint?: string): EventChoice =>
 ({id,label,reply,effect,hint});

function year(id: string, title: string, text: string, choices: EventChoice[], scene: 'daywork-gate' | 'daywork-pay' | 'heir-keys' | 'heir-board'): LifeEvent {
 const worker = scene.startsWith('daywork-');
 return {
  id: 'life-start-' + id, title, text, choices, category: 'year', tag: worker ? '日结工' : '顶级富二代',
  district: worker ? 'xinzhuang' : 'lujiazui', speakerId: worker ? 'wu' : 'father',
  illustration: openingPhoto(scene),
 };
}

const firstShift = year('daywork-first', '床位只续到明天',
 '吴师傅拿手指在台账上给你划了两行。今天装卸，收工就转二百二。冷库连做三天，三天齐了才结七百八。厨房那头缺洗碗的，能按月做，可第一笔要等到月底。你的床位只交了今晚。', [
  option('today','先接今天的装卸班','二百二在闸机口到账。你把续床的那笔钱先圈出来。吴师傅问你晚饭吃了没，说剩的饭盒还能热。',{cash:220,health:-5,trust:6},'今天到账 ¥220'),
  option('later','接冷库三天，留好班次记录','最后一天手套脱下来还是湿的。群里的考勤表却少了一天，说是要「再核一遍」。你截了图，把三天进门的时间写在截图上——这张纸，将来要替你说话。',{health:-8,skill:5,setFlags:[DAYWORK_DUE]},'今天 ¥0 · 待结班费 ¥780'),
  option('kitchen','先去厨房，试着做满一个月','店里给你匀了一顿晚饭。收工后你把工资日存进日历，再算还要续几次床。下个月排班表上，终于有了你的名字。',{job:'service',cash:-180,health:-4,skill:5},'添鞋和工装 ¥180 · 门店岗位 ¥6,500/月'),
 ], 'daywork-gate');

const shiftOpening: LifeEvent = {
 ...firstShift,title:'行李先扔出了门房',objective:'今晚拿到工钱，保住床位',illustration:dramaPhoto('shift'),
 text:'赵正把装卸单的角撕了，纸屑弹到你胸口：「外地人，也配挑班？床位到期就滚。」他一脚把你的行李箱踢出门房，几个等着接活的人都在看。吴师傅把另一张单压在台账底下递过来——西门替班，二百二当晚结；厨房也还收人。',
 choices:firstShift.choices.map(choice=>choice.id==='today'?{
  ...choice,label:'去西门替班，工钱当场结',reply:'西门领班当面把二百二拍进你手心。赵正看到出库单上的签名，脸沉下来，把你叫回门房——他想弄清楚，谁给你开的门。',
  effect:{...choice.effect,setFlags:[DAYWORK_WEST]},
 }:choice.id==='later'?{
  ...choice,label:'咽下这口气，接冷库三天',reply:'冷库三天做完，手套能拧出水。赵正在群里只报了两天，还想扣你床位的钱。吴师傅把三次进门的原件拍给你：「财务还没关灯，去把这页纸拍在桌上。」',
 }:{...choice,label:'不挣他的钱，去厨房做满月',effect:{...choice.effect,setFlags:[DAYWORK_KITCHEN]}}),
};

const shiftShowdown: LifeEvent = {
 ...year('daywork-showdown','西门还差一个签字',
  '赵正把西门的实结单攥在手里，当着领班的面咬定最后一车算他那组，还回头瞪你：「临时工的签名，也配进台账？」吴师傅指了指闸机。出库时间和司机都对得上，领班正要把明天的排班贴出去。',[
   option('receipt','把出库联拍在领班桌上','领班照着存根念了一遍，你的名字没错。赵正伸手要抢，领班把纸按住。门房把这次实结的复写联也给了你。',withOpeningRecord({skill:7,face:7},OPENING_PROOF),'留下出库原件'),
   option('crew','把司机和同班的人请过来','司机放下对讲机走过来：「那车就是他装的，我看了一路。」围观的人不再帮腔。第二天排班一贴，原班的人直接在门口等你。',withOpeningRecord({network:9,spirit:6},OPENING_ALLIES),'有工友愿意作证'),
   option('paid','只签实做的工时，回去续床','你把实结单收好，绕过门口的白板去续床。赵正在背后放话，下回有你好看。吴师傅发来一个号码：以后不用等他安排。',{spirit:8,trust:5}),
  ],'daywork-pay'),
 category:'explore',objective:'把自己的工时留在实结单上',illustration:dramaPhoto('shift'),
};

function shiftReckoning(state: GameState): LifeEvent {
 if (state.flags.includes(DAYWORK_WEST)) return shiftShowdown;
 const kitchen = state.flags.includes(DAYWORK_KITCHEN);
 return {
  ...shiftShowdown,title:kitchen?'他连你的送餐单都要抢':'赵正要收走考勤原件',
  objective:kitchen?'保住下月排班':'留下这三班的凭证',
  text:kitchen?'厨房刚贴了下月班表，赵正把你的名字圈掉，说这几天往西门送餐的全算他那组，还撂话：「一个洗碗的，也配上排班表？」他让领班照着改。领班没动笔，先问你手上有几张送餐回执。'
   :'冷库的账暂时对过，赵正换了副面孔来收原件：「名单留一份就够，纸放你那儿算什么，想造反？」吴师傅把当班司机叫了过来。司机盯着他，问你要把哪一份留在自己手里。',
  choices:shiftShowdown.choices.map((choice,index)=>({
   ...choice,label:(kitchen?['把送餐回执贴在排班表上','叫取餐的人来认签名','只接我那几班，别替我填名字']:
    ['拿走有签名的那份考勤','请同班的人各留一份','先去续床，考勤拍下来'])[index],
   reply:(kitchen?[
    '领班从第一张对到最后一张，把赵正画的圈一个个擦了。围观的人没散，你拿走回执，排班还是你签过的那份。',
    '取餐的人堵在门口认回执：「这几趟都是他送的，我天天见。」领班让赵正把改过的表自己收走。没人再帮他说话。',
    '你把能到的日期逐个勾掉。第二天再去看，新表上没有一个班是别人替你签的。',
   ]:[
    '赵正来拿时，吴师傅指了指墙边的复写纸：「原件在这，你也收得走？」你带走那份有签名的，财务说留着，下回还能对。',
    '三个人各拍了一份。赵正问是谁传出去的，门口没人再抢着回答。',
    '你先把床位续上，回去把截图放到最上面。吴师傅又发来门房的号码，让你别删。',
   ])[index],
  })),
 };
}

const shiftPay = year('daywork-pay', '三天都在，表上只有两天',
 '考勤表漏了最后一晚，白纸黑字，差你二百六。吴师傅把纸和手机并排放着，门禁群的截图上有你第三次进门的时间。对方打起官腔：「表上没写，就按表来。要不，先签两天的收款单？」', [
  option('records','把三天进门时间都发过去','截图一张张甩过去，人事自己又调了一遍记录——门禁不会说谎。七百八补齐了，群里另一个人问截图怎么找，你把步骤原样发了一遍。',{cash:DAYWORK_PAY,network:7,skill:5,removeFlags:[DAYWORK_DUE]},'拿齐 ¥780'),
  option('close','先领两天，把第三天的记录留着','对方只肯按两天算。你拿了五百二，回去先续床，把剩下那一天记进账本——账不怕长，就怕没记。',{cash:520,spirit:3,setFlags:[DAYWORK_REMAINDER],removeFlags:[DAYWORK_DUE]},'现在到账 ¥520 · 余款仍可追'),
  option('position','拿着考勤去找仓库主管','主管让人把漏的那天补上，又问你会不会做盘点。你下周去门店的收货岗，第一次有人把工资日写在纸上，白纸黑字。',{cash:DAYWORK_PAY,job:'service',skill:6,health:-5,removeFlags:[DAYWORK_DUE]},'拿齐 ¥780 · 入职城市服务'),
 ], 'daywork-pay');

const shiftBed = year('daywork-bed', '今晚睡哪，先定下来',
 '床位要重新登记，房东在门口就一句话：「钱到，床位到。」吴师傅在门口等你，他知道一个少转两趟车的收货岗。今天也还有活，先装卸再谈，下工能拿三百。', [
  option('position','去见收货岗的人，先看清工资日','对方把日班和夜班分开写了，几号发钱写在第一行。你选了日班，底下有人拿笔算，从这儿回床位要多久。',{job:'service',skill:5,trust:7}),
  option('today','先做一班，把眼前的住处续上','三百到了。你没买新的耳机，先把最短能续的几晚交上。早班的闹钟改晚了二十分钟。',{cash:300,health:-5,spirit:5,removeFlags:[DAYWORK_TEMP]}),
  option('learn','拿排班去零工站问问还有什么活','工作人员帮你把会盘点和会装卸分开写。你在等车时收到一条收货岗的面试消息，这回没让你先买课。',{skill:9,network:6}),
 ], 'daywork-gate');

const remainingPay = year('daywork-remainder', '还差最后一天',
 '前两天的五百二已经拿到了，第三天的二百六还挂着。吴师傅把交接记录从台账里翻了出来，纸都发脆了，字还清楚。新的日班也在等你过去，两边今天都能办，但得决定先去哪里。', [
  option('collect','先拿记录对第三天的工钱','交接的人还记得你。核完那张纸，二百六转进来了。你把账本上那一行划掉——划掉的那一下，比到账短信还痛快。',{cash:260,skill:5,removeFlags:[DAYWORK_REMAINDER]},'余款 ¥260 到账'),
  option('job','先去新店报到，把旧单交给吴师傅','你赶上了新店的点名。吴师傅后来把第三天也核上了，隔了几天才把转账截图发来，配了一句：早就讲过，纸在钱就在。',{cash:260,job:'service',trust:8,health:-4,removeFlags:[DAYWORK_REMAINDER]},'入职城市服务 · 余款 ¥260 入账'),
  option('leave','去找新班，那笔先到此为止','你把截图收进一个文件夹。那笔没再催，新店的排班倒是当天就发下来了。',{job:'service',spirit:6,removeFlags:[DAYWORK_REMAINDER]},'入职城市服务 · 放弃余款 ¥260'),
 ], 'daywork-pay');

const workerThird = year('daywork-next', '工钱要按哪张纸算',
 '吴师傅要把旧考勤本收起来，先问你要不要把自己的那页拍走——当年赵正们撕过角的单子，最后都是这本账替人说话。新店把排班和工资单都发手机，有个工友刚来，找不到那张写着工资日的通知。', [
  option('keep','把旧账留好，也带他找一遍','工友把截图存进收藏。晚上又发来一条，问名字拼错会不会影响打钱。你让他明天上班先去改——被人划掉名字的滋味，你替他记着呢。',{network:9,skill:6,trust:6}),
  option('change','拿着班次记录，问问白天的岗位','店里肯按月排你白班了。你重新抄了公交到站时间，排在闹钟上面。',{job:'service',health:6,skill:4}),
  option('finish','先把今天的班结了，晚上留给自己','今天这班结了二百六。你不接临时加的那趟，第一次有空把行李箱里没晾干的衣服拿出来。',{cash:260,spirit:8,health:3}),
 ], 'daywork-pay');

const firstKeys = year('heir-first', '钥匙和账户分开',
 '老爸把房卡推过来。江边那套房是家里租的，房租和约定的日常账单每月最多代付一万八，刷不了转账。你的个人账户归你。桌上另一叠是公司采购单，老爸问你想不想跟着做。', [
  option('keys','房卡先收下，我去外面找工作','你拍了下物业的报修号码。老爸把采购单压回去，问面试是几点，楼下司机等不等你。',{spirit:6,network:5,trust:3},'保留家里代付 · 自己找工作'),
  option('floor','去公司，从仓库和销售做起','财务把你加进工资群。第一天同事把样品拿错了，在群里问谁认识老板家的孩子。你在后面回，我就是，你先发单号。',{job:'trade',skill:7,trust:7},'公司工资单 · 家里代付继续'),
  option('leave','钥匙还回去，我自己租','搬家公司问旧房的车库怎么进，你说不用进了，两只箱子从大厅抬。老爸晚上还是问了新地址，说到家了打个字。',{cash:-6600,housing:1,spirit:10,skill:4,removeFlags:[FAMILY_HOME,FAMILY_PAY]},'押金及搬运 ¥6,600 · 以后自己付房租'),
 ], 'heir-keys');

const westBundOpening: LifeEvent = {
 ...firstKeys, title:'六千万到账', illustration:heirStoryPhoto('family'),
 objective:'拿着原件赴宴，当众抢回主位',
 text:'家庭群炸了：大舅发长文要周骁接手西岸，说你「连自己都养不活」。你随即被移出酒会筹备群，周骁发来主位试灯照：「别来了，厨房给你留了传菜的位子。」手机一震——到账 ¥60,000,000。老爸只回一句：「今晚拿不回主位，明天你大舅就划掉你族谱议席。」老妈在恒隆等你，爷爷的签约原件在她包里。',
 choices:firstKeys.choices.map(choice => choice.id === 'keys' ? {
  ...choice,label:'去恒隆找老妈，盛装赴局',reply:'老妈回了四个字：「行头备好了。」照片上两只包并排摆着，底下压着那张印你名字的请帖——周骁今晚要当众作废的那张。',hint:'家里代付公寓账单',
 } : choice.id === 'floor' ? {
  ...choice,label:'签下仓库入职单，酒会自己做东',reply:'财务发来仓配公司的入职单。你一笔一划签了名：这份工是自己挣的，不是等谁施舍。合上笔，回老妈一句「我这就到恒隆」。',
 } : {
  ...choice,label:'房卡退回去，今晚我自己赢',reply:'你把房卡留在玄关，拖着自己那只旧行李出门。老爸在身后看了一眼，没拦。他在等你空手进门，还是带着主位回来。',
 }),
};

const ninetiesHeirOpening:LifeEvent = {
 ...westBundOpening,title:'今晚锦江饭店见',illustration:'/art/era/jinjiang-1992.webp',objective:'拿请帖原件赴宴，开席前抢回主位',
 text:'大舅托人带话进家里：西岸该交给骁儿管，你「读书读傻了，上不得台面」。周骁跟着打来电话，座牌全排好了，还假客气：「你挨着我坐，靠厨房那桌也热闹。」桌上是家里给你的存折。老爸把话撂下：「今晚主位拿不回来，明天你大舅就改族谱。」母亲在锦江饭店，手上还有一张没改过的请帖。',
 choices:westBundOpening.choices.map(choice=>choice.id==='keys'?{
  ...choice,label:'去锦江找母亲，原装赴局',reply:'母亲在门口等你，一句话：「衣服熨好了，请帖在妈手里。」那张没改过的请帖，今晚就是你的底气。',
 }:choice.id==='floor'?{
  ...choice,label:'签下入职单，今晚我做东',reply:'你在人事科签了名字，字写得很稳。下楼先找公用电话，让饭店把话筒留着——等会儿有人要当众改口。',
 }:{...choice,label:'钥匙留下，我自己赴宴',reply:'父亲把钥匙收回抽屉，没再劝。他只说了一句：散场要是晚了，叫司机等你。'}),
};

const board = year('heir-board', '八十万签给谁',
 '大舅的电话直接打进了采购部：「骁儿介绍的供应商，谁敢压着不签？」那份八十万的单子摊在桌上，供应商是周骁找的，车间主管私下说有一条线今年根本用不上。老爸把笔搁在单子上：「公司不是你大舅家开的。这一单，你来定。」', [
  option('pilot','先做小批试单，让车间验收','财务把大单撤下来，先给车间留一批样机。周骁只回了个「行」，转头就到大舅那儿告状。晚上车间主管发来一段短视频：机器真的跑了起来。',{skill:10,trust:4,setFlags:[HEIR_TRIAL]},'公司先试单 · 个人账户 ¥0'),
  option('order','按原单推进，我去盯交付','供应商马上发了交货日期——他们比你还急，大舅在后面催款。车间主管把空出来的位置量了一遍，说第二批到了先放哪儿，你也给句话。',{job:'trade',network:9,health:-5,trust:5,setFlags:[HEIR_ORDER]},'公司采购 ¥'+PROJECT_BUDGET.toLocaleString('zh-CN')+' · 个人账户 ¥0'),
  option('outside','让采购走会签，我不替任何人拍板','财务把两本账留在桌上。你下楼时撞见周骁，他压低声音：「表弟，给个准话，大家脸上都好看。」你报了采购办公室的座机。他愣了一下——大舅的名号，第一次没吓住人。',{spirit:7,skill:6,face:-3},'继续由公司采购负责'),
 ], 'heir-board');

export function heirBoardVisit(state: GameState): LifeEvent | undefined {
 if (!state.flags.includes(HEIR_WEST_BUND) || state.age<19 || state.age>=25 || state.pendingYearEvent || state.ended || state.actions<=0) return;
 const scene = !state.seenEvents.includes(board.id) ? board : boardThird(state);
 if (state.seenEvents.includes(scene.id)) return;
 return {...scene,category:'business',illustration:heirStoryPhoto('boardroom')};
}

function boardThird(state: GameState) {
 const ordered = state.flags.includes(HEIR_ORDER);
 const trial = state.flags.includes(HEIR_TRIAL);
 const opening = ordered
  ? '第二批设备到了，工位还没腾出来。仓库说再占一个月要加钱——供应商有恃无恐，大舅在背后放了话。你当时答应盯交付，群里现在每条消息都带着你的名字，也带着你大舅的影子。'
  : trial
   ? '小批样机测完了，车间留下两台。供应商把剩下那批的价格发过来，话里有话：「按原数走，你们家那位长辈也好交代。」财务等你说要买多少。'
   : '你没在采购单上签字，单子最后卡在了会签。大舅在饭桌上阴阳怪气，说你「连个名都不敢担」。新来的经理把会签记录给你看，问你还愿不愿意跟着看下半年怎么排产。';
 return year('heir-review','账上那一笔还没完',opening,[
  option('take','跟车间一起把这批收完','你在验收记录上写了实测数量，财务按记录付款，一台多的都没让过。下班时老爸问你签了几张，你说今天写得最多的两个字，是退回。',{job:'trade',skill:10,trust:6,health:-4,setFlags:[HEIR_HANDOVER]}),
  option('hand','把决定交给负责的人，记录留档','主管把验收要求贴回工位。你后来再去，已经没有人等你来才肯开机器——这盘棋不在桌上，在每个人心里。',{skill:7,network:6,spirit:5}),
  state.flags.includes(FAMILY_PAY)
   ? option('own','往后把自己的账自己付','你把续租单改成自己的号码。老爸在家庭群里问改完了没。你回：改了。这回物业催钱，直接找我——大舅想说谁的闲话，让他打这个号。',{spirit:9,removeFlags:[FAMILY_PAY]},'租约继续 · 账单改成自己付')
   : option('own','把采购交接清楚，退出这个群','车间把你移出了采购群，大舅安插的人却一个没进来。主管单独发来一句：有事还能打电话。你把他的号码存了下来。',{spirit:9,network:4}),
 ],'heir-board');
}

const heirReview = year('heir-role', '工牌还是公司那张',
 '当年你跟着车间验收，如今大舅逢人就说「那孩子早被家里放弃了」。今天公司要找人接交付，老爸没开口，财务先把岗位职责和工资单翻到你面前。加薪走公司账户，一分不多；设备怎么花，还得按流程。', [
  option('manager','把职责写进合同，接下交付','你把只写了「协助」的那一条划掉，请财务把要负责的三件事写全。谁再传你被除名，这份合同就是回击。改好的工资单先发给了你，家庭群里没有。',{job:'trade',payRate:HEIR_PAY_RATE,skill:8,health:-4},'岗位基础工资上浮 25%'),
  option('salary','照旧做，把今年这笔奖金结清','财务说年初谈的是六万，问你分几次领。你说一次，到账后把工资单和家里那本账分开存——大舅爱怎么讲怎么讲，钱是自己挣的。',{cash:60000,trust:5,spirit:4},'公司发个人奖金 ¥60,000'),
  option('pass','岗位交给车间的人，我手上的活先做完','主管本来已经把东西收进抽屉，听完又拿出一叠记录。你们坐下来，把他要接的那部分一件一件划出来——位置可以给，规矩不能丢。',{skill:7,network:9,spirit:7}),
 ], 'heir-board');

export function dayworkLead(state: GameState): {message: string; event: LifeEvent} | undefined {
 if(state.storyEdition===2&&state.age===18)return;
 if (!state.flags.includes(DAYWORK)) return undefined;
 const pending = state.flags.includes(DAYWORK_DUE) ? shiftPay : state.flags.includes(DAYWORK_REMAINDER) ? remainingPay : undefined;
 if (pending && !state.seenEvents.includes(pending.id)) return {
  message: pending === shiftPay ? '最后一天的考勤没算进去' : '吴师傅找到了第三天的交接记录',
  event: { ...pending, category: 'career' },
 };
 if (state.age===18 && state.actions>0 && state.flags.includes(OPENING_DRAMA) &&
     state.seenEvents.includes(firstShift.id) && !state.seenEvents.includes(shiftShowdown.id)) {
  return {message:'跟赵正当面把账对清',event:shiftReckoning(state)};
 }
 if (state.age < 21 || state.jobId || state.cash >= 4200) return undefined;
 const id = 'life-start-extra-' + state.age;
 if (state.seenEvents.includes(id)) return undefined;
 const event: LifeEvent = {
  id, category: 'career', district: 'xinzhuang', speakerId: 'wu', tag: '临时班',
  illustration: openingPhoto('daywork-gate'), title: '今天还有一个班',
  text: '吴师傅发来两张单。临时分拣收工结二百二。另一张是门店的收货岗，工资每月固定一天发，得先去见领班。',
  choices: [
   option('shift','做完这班，工钱今晚结','二百二到了。你顺路把床位续了几晚，这回钥匙不用每天还。',{cash:220,health:-5},'当晚到账 ¥220'),
   option('fixed','拿着旧考勤，去见门店领班','领班看完让你挑个上班时间。你把排班和发钱那天都拍下来，先看哪个月发第一笔。',{job:'service',skill:4},'入职城市服务'),
   option('wait','让他帮忙留意日班','吴师傅问你最迟几点能到。你查了首班公交，把时间发给他，这回把换乘也算进去了。',{network:5,spirit:5}),
  ],
 };
 return {message:'吴师傅发来两张招工单',event};
}

export function lifeStartYear(state: GameState) {
 if(state.storyEdition===2&&(state.age<=19||isSystemLife(state)))return;
 if (isSystemLife(state)) {
  if (state.age===18) return periodSystemOpening(state);
  if (state.age===19) return systemSecondYear(state);
 }
 if (state.flags.includes(DAYWORK)) {
  if (state.age === 18) {
   if(calendarYear(state)<2000)return {...shiftOpening,illustration:'/art/era/shift-1992.webp',
    choices:shiftOpening.choices.map(choice=>({...choice,reply:choice.reply.replace('在群里只报了两天','在白板上只写了两天')}))};
   return state.flags.includes(OPENING_DRAMA)?shiftOpening:firstShift;
  }
  if (state.age === 19) return state.flags.includes(DAYWORK_DUE) ? shiftPay : state.flags.includes(DAYWORK_REMAINDER) ? remainingPay :
   state.flags.includes(DAYWORK_TEMP) ? {...shiftBed,text:'去年的床位没能续上。吴师傅把你的行李先寄在门房，问你今天想先见收货岗的人，还是先接一班日结。'} : shiftBed;
  if (state.age === 20) return state.flags.includes(DAYWORK_REMAINDER) ? remainingPay : workerThird;
  return workerClassYear(state) ?? warehouseWorkerYear(state) ?? laterDaywork(state);
 }
 if (state.flags.includes(HEIR)) {
  const westBund = state.flags.includes(HEIR_WEST_BUND);
  if (state.age === 18 && westBund) return calendarYear(state)<2001?ninetiesHeirOpening:westBundOpening;
  if (state.age === 18) return state.flags.includes(HEIR_CAPITAL_TIER) ? {
   ...firstKeys,
   illustration:heirStoryPhoto('family'),
   text:'老爸把房卡推过来。陆家嘴那套江景服务公寓月租五万五，房租、物业和约定的账单每月最多代付八万。你查了眼自己的账户，六千万还在。桌上另一叠是公司采购单，老爸问你想不想跟着做。',
  } : firstKeys;
  if (state.age === 19) return westBund ? westBundSecondYear(state) : {...board,illustration:heirStoryPhoto('boardroom')};
  if (!westBund && state.age === 20) return {...boardThird(state),illustration:heirStoryPhoto('boardroom')};
  if (state.age === 25 && state.flags.includes(HEIR_HANDOVER)) return heirReview;
  return heirClassYear(state) ?? warehouseHeirYear(state) ?? laterHeir(state);
 }
}

export function outstandingShiftPay(state: GameState) {
 if (state.flags.includes(DAYWORK_DUE)) return DAYWORK_PAY;
 return state.flags.includes(DAYWORK_REMAINDER) ? 260 : 0;
}

export function lifeStartRent(state: GameState, ordinaryRent: number, shared: boolean) {
 if (livesInPenthouse(state)) return shared ? Math.round(PENTHOUSE_FEE * .6) : PENTHOUSE_FEE;
 if (state.flags.includes(FAMILY_HOME) && state.housing === 2) {
  const rent=heirTerms(state).rent;
  return shared ? Math.round(rent * .6) : rent;
 }
 if (state.flags.includes(DAYWORK) && state.housing === 0) return state.flags.includes(DAYWORK_TEMP) ? 900 : staffBedRent(state) ?? 1050;
 return ordinaryRent;
}

export function lifeStartHousing(state: GameState): string | undefined {
 if (livesInPenthouse(state)) return '陆家嘴江景顶层 · 自有';
 if (state.flags.includes(FAMILY_HOME) && state.housing === 2) {
  if(calendarYear(state)<2001)return state.flags.includes(FAMILY_PAY)?'家里的花园公寓':'花园公寓 · 自付';
  return state.flags.includes(FAMILY_PAY) ? '家里租的江景房' : '江景房 · 自付';
 }
 if (state.flags.includes(DAYWORK) && state.housing === 0) return state.flags.includes(DAYWORK_TEMP) ? '临时落脚' : staffBedRent(state) !== undefined ? '仓配宿舍' : '短租床位';
}
