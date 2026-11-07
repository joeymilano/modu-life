import { openingPhoto } from './art';
import { LONG_COMMUTE } from './employment';
import type { LifeEvent } from './types';

export type OpeningStory = {
 cards: readonly string[];
 message: string;
 teaser: string;
 event: LifeEvent;
};

export const ARRIVAL_STORIES: OpeningStory[] = [
 {
  cards: ['born-rich'], message: '老爸让你下楼拿车',
  teaser: '车钥匙有了。后备厢里还有一张工牌。',
  event: {
   id: 'origin-arrival-rich', title: '车和工牌都在楼下', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'father', illustration: openingPhoto('arrival-rich'),
   text: '车钥匙压在样品箱上，下面还挂着张工牌。老爸问你今晚用不用车。用的话，先把三箱样品送去仓库。他看了眼你的鞋，说仓库门口在修路。',
   choices: [
    { id: 'badge', label: '工牌也拿走，明天我去报到', hint: '入职销售与贸易',
     reply: '工牌上的照片还是你高中拍的。老爸说拍新的得找人事，随后把人事拉进了家庭群。',
     effect: { job: 'trade', skill: 4, trust: 8 } },
    { id: 'drop', label: '只送货，这一趟单独算', hint: '跑腿费 ¥1,200',
     reply: '三箱搬完，老爸转来一千二。你谢完发现这笔钱有备注，写的是「比叫车贵」。',
     effect: { cash: 1200, network: 4, health: -3 } },
    { id: 'metro', label: '钥匙留下，我坐地铁', hint: '自己找工作',
     reply: '你走到闸机前，他把修路那段的位置发来了。你说我坐地铁。他回，晓得，问你那边雨停了没有。',
     effect: { spirit: 9, skill: 4 } },
   ],
  },
 },
 {
  cards: ['born-local'], message: '顾爷叔问这只箱子是谁的',
  teaser: '楼道堵了，快递上的名字全被雨水泡花了。',
  event: {
   id: 'origin-arrival-local', title: '门牌都认得，快递认不出', category: 'social', district: 'anfu',
   tag: '开局插曲', speakerId: 'uncle', illustration: openingPhoto('arrival-local'),
   text: '顾爷叔搬了把凳子堵在门口。送错的箱子上只剩一个「张」字，整条弄堂有四家姓张。他让你猜，你刚要说四楼，四楼的张阿姨在背后说她今天没买东西。',
   choices: [
    { id: 'knock', label: '搬开凳子，沿门牌挨家问', hint: '多认几户街坊',
     reply: '你问到最后一户，箱里是楼下张爷叔买的鞋。大家都记得他穿四十二，只有他自己买了四十一。',
     effect: { network: 12, trust: 6, health: -3 } },
    { id: 'group', label: '发楼栋群，谁认得来领', hint: '今天少跑几层楼',
     reply: '过了两分钟，爷叔在群里转发了你的照片，问谁把快递放在那里的。你抬头，他就坐你旁边。',
     effect: { network: 5, skill: 4, spirit: 6 } },
    { id: 'shelf', label: '问小卖部能不能代放，给箱子腾个位置',
     reply: '店主留了最下面一格。你把箱子放进去，他说行，以后谁家要寄鞋，也来我这边称一下。',
     effect: { network: 7, trust: 4, skill: 6 } },
   ],
  },
 },
 {
  cards: ['born-migrant'], message: '唐圆在招聘会出口朝你招手',
  teaser: '有个摊位先问你交不交钱。隔壁饭店等人帮忙。',
  event: {
   id: 'origin-arrival-migrant', title: '工作还没找着，先排了两个队', category: 'career', district: 'people',
   tag: '开局插曲', speakerId: 'tang', illustration: openingPhoto('arrival-migrant'),
   text: '唐圆把领来的表翻到背面，最后一栏是六百块岗前费。她问谁收，桌后的人说下一位。隔壁饭店摊位的人喊，今晚缺一个接单的，先问你会不会数桌号。',
   choices: [
    { id: 'shift', label: '去饭店试班，问清一天多少钱', hint: '入职城市服务 · 今晚另结 ¥280',
     reply: '你一晚上记错一桌号。收工前老板转来二百八，问明天能不能准点来。他把最容易搞错的两张桌贴在纸上给你。',
     effect: { job: 'service', cash: 280, health: -4, skill: 4 } },
    { id: 'desk', label: '拿着收费单去问会务台',
     reply: '会务台请你把单子留下。那桌的人收得很快，走之前还把免费送的中性笔数了一遍。',
     effect: { network: 9, face: 4, trust: 6 } },
    { id: 'next', label: '不排了，跟唐圆去投下一场',
     reply: '你们在路口分了一张葱油饼。唐圆看了你的简历，圈出一句自己看不懂的话。你读第二遍，发现你也没看懂。',
     effect: { skill: 9, spirit: 7, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-scholar'], message: '余老师问你会不会接投影',
  teaser: '六点五十九，学员都到了，幕布上只有蓝屏。',
  event: {
   id: 'origin-arrival-scholar', title: '绩点再高也得找转接头', category: 'learn', district: 'people',
   tag: '开局插曲', speakerId: 'yu', illustration: openingPhoto('arrival-scholar'),
   text: '余老师请你来夜校讲讲怎么做表。第一个到的学员五十七岁，刚在前排放好老花镜。你接上电脑，幕布上写着无信号。余老师从抽屉里捞出一把线，说以前那根长得也差不多。',
   choices: [
    { id: 'staff', label: '先用白板讲，问夜校还缺不缺人', hint: '入职公共与社区',
     reply: '那位学员散场回来，把白板抄错的一列指出来。余老师把下一期的排班递给你，说正缺一个敢用白板的人。',
     effect: { job: 'public', skill: 5, trust: 6 } },
    { id: 'cable', label: '去隔壁借线，照原计划上课', hint: '代课费 ¥500',
     reply: '隔壁借了线，顺手借走你原来那根。课后余老师把五百打给你。你问能不能晚点拿回线，她说先问那边还用不用。',
     effect: { cash: 500, network: 6, skill: 5 } },
    { id: 'real', label: '让每个人打开自己算不清的那张表',
     reply: '半堂课都在给楼里的团购算尾款。你回去把课件删了三页，第一张换成「到底谁还没付」。',
     effect: { skill: 10, spirit: 4, trust: 7 } },
   ],
  },
 },
 {
  cards: ['born-suburb'], message: '老妈站在六点二十那班车前',
  teaser: '一份工在三站外，一份要坐到过江。她两袋早饭都买了。',
  event: {
   id: 'origin-arrival-suburb', title: '过江那份多一千五', category: 'career', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('arrival-suburb'),
   text: '老妈把早饭隔着栏杆递过来。站外的门店缺人，一个月六千五，三站就到。过江那家做销售，八千，按平常的点回家，你那份饭得盖锅里热一次。',
   choices: [
    { id: 'near', label: '就近上班，晚饭回来吃', hint: '城市服务 · ¥6,500/月',
     reply: '第一天下班你还赶上买菜。老妈把你的饭端出来，说热早了，原本还给你留了锅。',
     effect: { job: 'service', spirit: 7, trust: 6 } },
    { id: 'far', label: '去过江那家，多挣一千五', hint: '销售与贸易 · ¥8,000/月 · 每年多耗体力和心气',
     reply: '回来那趟你站了七站才有座。家里饭还在锅里。老妈发来一张闹钟照片，问你明天还是这个点伐。',
     effect: { job: 'trade', health: -4, spirit: -2, skill: 4, setFlags: [LONG_COMMUTE] } },
    { id: 'wait', label: '早饭收下，等离得近的下一份',
     reply: '她把两袋都塞给你。旁边常坐这班车的人问你找什么活，临下车还真给你指了个招工窗口。',
     effect: { network: 9, skill: 5, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-return'], message: '高原把你的中英文简历叠一起',
  teaser: '同一段实习，两版写的职位不一样。',
  event: {
   id: 'origin-arrival-return', title: '你那个英文职务到底管啥', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'gao', illustration: openingPhoto('arrival-return'),
   text: '高原看了半天，指着英文版问，这个职位有几个人归你管。你说一个也没有。他笑了，把自己的简历翻过来，说那我们俩写得差不多。',
   choices: [
    { id: 'trade', label: '改成做过的事，给他看一封客户邮件', hint: '入职销售与贸易',
     reply: '他把邮件转给做外贸的同事。对方回得很快，先问你下周能不能来，再问那封邮件最后一句到底算不算客气。',
     effect: { job: 'trade', skill: 6, trust: 6 } },
    { id: 'translate', label: '先替他们改一封，按件算', hint: '翻译费 ¥900',
     reply: '九百到账，三个人在群里问能不能顺带看看合同。你把收款截图发了一次，群里安静了一会儿。',
     effect: { cash: 900, face: 5, network: 4 } },
    { id: 'short', label: '删掉职务名，留下两条做过的事',
     reply: '简历少了半页。高原看了眼，说这一版他终于知道面试该问你哪件事。',
     effect: { skill: 9, spirit: 5, trust: 4 } },
   ],
  },
 },
 {
  cards: ['born-trade'], message: '吴师傅把订货本放到门槛上',
  teaser: '卷帘门抬到一半。外面有人问你们今天开不开。',
  event: {
   id: 'origin-arrival-trade', title: '卷帘门还差半截', category: 'business', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'wu', illustration: openingPhoto('arrival-trade'),
   text: '吴师傅把卷帘门抬到一半，腾出手找你签那张订货单。馅料商明早送，一批两千六。你说还想看看别的工作。门外的爷叔弯下腰问，生煎今天几点出。',
   choices: [
    { id: 'open', label: '先订一批料，明早我来开门', hint: '备料 ¥2,600 · 开始经营小店',
     reply: '第二天爷叔还在原地。他买了四个，吃完说馅比上次小一点。吴师傅在后面把秤推给你，说这一句也得记进账。',
     effect: { cash: -2600, job: 'business', skill: 7, trust: 8 } },
    { id: 'one', label: '先卖完这半天，长单晚点签', hint: '今天分到 ¥850',
     reply: '卖完最后一锅，吴师傅把八百五塞进你的外套。爷叔问明天还来吗，你说我今晚先去看个面试。',
     effect: { cash: 850, network: 6, health: -4 } },
    { id: 'book', label: '把账交接清楚，再去找自己的工作',
     reply: '你把馅料的旧单价翻给他看。他没说接不接班了，问你有没有空帮他存一个新号码。',
     effect: { skill: 8, spirit: 5, trust: 6 } },
   ],
  },
 },
 {
  cards: ['born-artist'], message: '祁清拿着尺子等你改那张纸',
  teaser: '第一份付钱的活，是把价目表往左挪两毫米。',
  event: {
   id: 'origin-arrival-artist', title: '两毫米，算不算一单', category: 'career', district: 'zhangjiang',
   tag: '开局插曲', speakerId: 'qi', illustration: openingPhoto('arrival-artist'),
   text: '祁清用尺子比了一下。印店门口那张价目表，主图歪了两毫米。店主说不急，傍晚就要印。她把样纸递过来，问你这回打算怎么开价。',
   choices: [
    { id: 'fix', label: '接这单，改完当面收钱', hint: '修稿费 ¥650',
     reply: '六百五到账。店主走到门口又回来，把去年那张也摊到桌上。你问这张还印伐，他说不印，想听你说它哪里歪。',
     effect: { cash: 650, skill: 5, face: 5 } },
    { id: 'credit', label: '价格少一点，样稿能放进作品集', hint: '修稿费 ¥420',
     reply: '你给成稿拍了照。祁清问要不要把歪的那张也放上去。你想了一下，传了两张，中间夹一把尺。',
     effect: { cash: 420, skill: 9, network: 5 } },
    { id: 'offer', label: '连同后面几版一起谈，问他们招不招人', hint: '用本事争取设计助理',
     reply: '你当场把下一版也摆了出来。',
     effect: { health: -3 },
     check: { stat: 'skill', threshold: 47, success: { job: 'creative', face: 7, trust: 6 },
      failure: { skill: 8, cash: 420 }, successText: '她合上作品集，说下周就有一张更难的，你来不来？',
      failureText: '她说这次先算改稿，四百二打过来了。下次把时间也一起报给她。' } },
   ],
  },
 },
];
