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
  cards: ['born-rich'], message: '亲戚都等着看你回来能干啥',
  teaser: '车钥匙有了。后备厢里还有一张工牌。',
  event: {
   id: 'origin-arrival-rich', title: '工牌和车钥匙，只能拿一个', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'father', illustration: openingPhoto('arrival-rich'),
   text: '家庭饭局刚散，亲戚的话还飘在楼道里：「读回来还不是靠他爸。」地库里，老爸把车钥匙压在样品箱上，下面垫着张工牌：「车随便用，先用这三箱样品换。今晚送货，仓库门口在修路。」他看了眼你的鞋，等着你开口。',
   choices: [
    { id: 'badge', label: '工牌也拿走，明天我去报到', hint: '入职销售与贸易',
     reply: '工牌照片还是高中拍的。老爸说拍新的得找人事，转头把人事拉进家庭群——没解释一句。群里看笑话的亲戚，这回安静了。',
     effect: { job: 'trade', skill: 4, trust: 8 } },
    { id: 'drop', label: '只送货，这一趟单独算', hint: '跑腿费 ¥1,200',
     reply: '三箱搬完，老爸转来一千二，备注写着「比叫车贵」。钱是你自己挣的——这句话，比给谁看都有用。',
     effect: { cash: 1200, network: 4, health: -3 } },
    { id: 'metro', label: '钥匙留下，我坐地铁', hint: '自己找工作',
     reply: '你走到闸机前，他把修路那段的位置发了过来。你说我坐地铁。他回：晓得。又问，侬那边雨停了没。楼道里那些话，你们谁都没提。',
     effect: { spirit: 9, skill: 4 } },
   ],
  },
 },
 {
  cards: ['born-local'], message: '张阿姨堵在楼道口：这箱子不是我家的',
  teaser: '楼道堵了，快递上的名字全被雨水泡花了。',
  event: {
   id: 'origin-arrival-local', title: '一家一个「张」，谁也不认', category: 'social', district: 'anfu',
   tag: '开局插曲', speakerId: 'uncle', illustration: openingPhoto('arrival-local'),
   text: '顾爷叔搬了把凳子堵在弄堂口，送错的箱子泡得只剩一个「张」字。整条弄堂四家姓张，四楼张阿姨当场放话：「我今朝啥也没买，勿要赖到我头上。」顾爷叔把箱子往你怀里一塞：「侬从小住这楼，侬来断。」',
   choices: [
    { id: 'knock', label: '搬开凳子，沿门牌挨家问', hint: '多认几户街坊',
     reply: '你挨家问到最后一户——箱里是楼下张爷叔买的鞋。大家都记得他穿四十二，只有他自己买了四十一。张阿姨在旁边看完全程：「后生可以额。」',
     effect: { network: 12, trust: 6, health: -3 } },
    { id: 'group', label: '发楼栋群，谁认得来领', hint: '今天少跑几层楼',
     reply: '两分钟后，爷叔在群里转发了你的照片：「谁家个箱子放弄堂口？」你一抬头，他就坐在你旁边，手机还没放下。',
     effect: { network: 5, skill: 4, spirit: 6 } },
    { id: 'shelf', label: '问小卖部能不能代放，给箱子腾个位置',
     reply: '店主留了最下面一格。你把箱子放进去，他说：行，以后谁家要寄鞋，也来我这边称一下。弄堂口总算通了。',
     effect: { network: 7, trust: 4, skill: 6 } },
   ],
  },
 },
 {
  cards: ['born-migrant'], message: '招聘会上有人伸手收六百块「岗前费」',
  teaser: '有个摊位先问你交不交钱。隔壁饭店等人帮忙。',
  event: {
   id: 'origin-arrival-migrant', title: '先交六百，还是先干活', category: 'career', district: 'people',
   tag: '开局插曲', speakerId: 'tang', illustration: openingPhoto('arrival-migrant'),
   text: '唐圆把领来的表翻到背面，最后一栏赫然印着「岗前费 ¥600」。她当场质问谁收，桌后的人眼皮都不抬：「不交就下一位。」后面排队的往前挤。隔壁饭店摊位的人探过头来喊：今晚缺个接单的，先问你会不会数桌号。',
   choices: [
    { id: 'shift', label: '去饭店试班，问清一天多少钱', hint: '入职城市服务 · 今晚另结 ¥280',
     reply: '你一晚上记错一桌号，老板转来二百八：「明早能准点来伐？」他把最容易混的两张桌号抄在纸上塞给你。没让你先交一分钱。',
     effect: { job: 'service', cash: 280, health: -4, skill: 4 } },
    { id: 'desk', label: '拿着收费单去问会务台',
     reply: '会务台请你把单子留下，半小时后那张桌子就空了。收钱的人走得很快，临走还把免费的中性笔数了一遍。排在后面的几个人，朝你点了点头。',
     effect: { network: 9, face: 4, trust: 6 } },
    { id: 'next', label: '不排了，跟唐圆去投下一场',
     reply: '你们在路口分了一张葱油饼。唐圆看了你的简历，圈出一句她自己看不懂的话——你读第二遍，发现你也没看懂。两个人笑完，接着改。',
     effect: { skill: 9, spirit: 7, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-scholar'], message: '学员等着看你这个高材生的笑话',
  teaser: '六点五十九，学员都到了，幕布上只有蓝屏。',
  event: {
   id: 'origin-arrival-scholar', title: '研究生连投影都接不上？', category: 'learn', district: 'people',
   tag: '开局插曲', speakerId: 'yu', illustration: openingPhoto('arrival-scholar'),
   text: '开课前一分钟，幕布还是蓝屏。前排有人小声嘀咕：「研究生嘛，纸上功夫。」五十七岁的老学员把老花镜架好，就等你出丑。余老师从抽屉里捞出一把线，不紧不慢：「以前那根，长得也差不多。」',
   choices: [
    { id: 'staff', label: '合上电脑，抓白板开讲', hint: '入职公共与社区',
     reply: '你抄起白板笔直接开讲，字写得比幻灯片还大。散场时那位老学员把白板抄错的一列当场指出来，余老师把下期排班递给你：「正缺一个敢不用投影的。」',
     effect: { job: 'public', skill: 5, trust: 6 } },
    { id: 'cable', label: '去隔壁借线，照原计划上课', hint: '代课费 ¥500',
     reply: '线借来了，课一秒没耽误。课后余老师把五百打给你。嘀咕的那位走到门口回头：「下趟还讲伐？」',
     effect: { cash: 500, network: 6, skill: 5 } },
    { id: 'real', label: '投影先放着，让每人打开自己算不清的表',
     reply: '半堂课都在给楼里的团购算尾款，没人再看那块蓝屏。你回去把课件删了三页，第一张换成「到底谁还没付」。',
     effect: { skill: 10, spirit: 4, trust: 7 } },
   ],
  },
 },
 {
  cards: ['born-suburb'], message: '老妈在六点二十的班车前买了两袋早饭',
  teaser: '一份工在三站外，一份要坐到过江。她两袋早饭都买了。',
  event: {
   id: 'origin-arrival-suburb', title: '多一千五，就要多过一次江', category: 'career', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('arrival-suburb'),
   text: '两份工作摆在眼前，老妈把两袋早饭都买了——她也拿不定主意。门店缺人，六千五一月，三站就到；过江那家做销售，八千。她隔着栏杆把早饭递过来：「多的一千五，是拿时间和脚力换的。侬自己定。」',
   choices: [
    { id: 'near', label: '就近上班，晚饭回来吃', hint: '城市服务 · ¥6,500/月',
     reply: '第一天下班你还赶上买菜。老妈把你的饭端出来，说热早了，原本还给你留了锅。两袋早饭，今天总算吃完了一袋。',
     effect: { job: 'service', spirit: 7, trust: 6 } },
    { id: 'far', label: '去过江那家，多挣一千五', hint: '销售与贸易 · ¥8,000/月 · 每年多耗体力和心气',
     reply: '回来那趟你站了七站才有座，家里饭还在锅里。老妈发来一张闹钟照片：明天还是这个点伐？你没回，把钱数了第二遍。',
     effect: { job: 'trade', health: -4, spirit: -2, skill: 4, setFlags: [LONG_COMMUTE] } },
    { id: 'wait', label: '早饭收下，等离得近的下一份',
     reply: '她把两袋都塞给你。旁边常坐这班车的爷叔问你找什么活，临下车真给你指了个招工窗口——这条线上的事，他都知道。',
     effect: { network: 9, skill: 5, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-return'], message: 'HR把你的中英文简历叠在了一起',
  teaser: '同一段实习，两版写的职位不一样。',
  event: {
   id: 'origin-arrival-return', title: '这段实习，两版简历两个职务', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'gao', illustration: openingPhoto('arrival-return'),
   text: '高原把你的中英文简历叠在一起，同一段实习，中文写「助理」，英文写着 Coordinator——听着像个部门。他敲了敲那行：「外面都在传海归变海待。这个职务，到底管几个人？」旁边还坐着两个候场的。',
   choices: [
    { id: 'trade', label: '当场改掉职务名，给他看一封客户邮件', hint: '入职销售与贸易',
     reply: '你把职务名划掉，把做过的邮件翻出来。他把邮件转给做外贸的同事，对方回得很快：下周能不能来？候场的两位被请去了另一间。',
     effect: { job: 'trade', skill: 6, trust: 6 } },
    { id: 'translate', label: '先替他们改一封，按件算', hint: '翻译费 ¥900',
     reply: '九百到账，三个人在群里问能不能顺带看看合同。「海待」这两个字，从今天起没人再提。',
     effect: { cash: 900, face: 5, network: 4 } },
    { id: 'short', label: '删掉职务名，留下两条做过的事',
     reply: '简历少了半页。高原看完推回来：「这版，我终于知道面试该问你哪件事了。」',
     effect: { skill: 9, spirit: 5, trust: 4 } },
   ],
  },
 },
 {
  cards: ['born-trade'], message: '隔壁开了家连锁生煎，爷叔在门口等开门',
  teaser: '卷帘门抬到一半。外面有人问你们今天开不开。',
  event: {
   id: 'origin-arrival-trade', title: '隔壁连锁店，今天也开张', category: 'business', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'wu', illustration: openingPhoto('arrival-trade'),
   text: '街对面新开的连锁生煎今天敲锣，音响里循环着「开业全场五折」。吴师傅把卷帘门抬到一半就停了手，订货本放在门槛上：馅料商明早送，一批两千六，签不签，今天得定。门外爷叔弯下腰往里看：「侬屋里厢今天开伐？我就认侬这只味道。」',
   choices: [
    { id: 'open', label: '签了，明早我来开门', hint: '备料 ¥2,600 · 开始经营小店',
     reply: '对面的锣敲了一整天，爷叔还是站在你这边排队。他买了四个，吃完说馅比上次小一点。吴师傅把秤推给你：「这句也要记进账——对面再吵，秤不能歪。」',
     effect: { cash: -2600, job: 'business', skill: 7, trust: 8 } },
    { id: 'one', label: '先卖完这半天，长单晚点签', hint: '今天分到 ¥850',
     reply: '对面的五折把人流截走一半，老客还是绕进来。卖完最后一锅，吴师傅把八百五塞进你外套。爷叔问明天还开伐，你说今晚先去看个面试。',
     effect: { cash: 850, network: 6, health: -4 } },
    { id: 'book', label: '把账交接清楚，再去找自己的工作',
     reply: '你把馅料的旧单价一笔笔翻给他看。他没说接不接班，只问侬有没有空，帮他存个新号码——对面的采购，刚开价挖人。',
     effect: { skill: 8, spirit: 5, trust: 6 } },
   ],
  },
 },
 {
  cards: ['born-artist'], message: '店主拿隔壁的报价压你：人家只要三百',
  teaser: '第一份付钱的活，是把价目表往左挪两毫米。',
  event: {
   id: 'origin-arrival-artist', title: '隔壁报价三百，你敢开六百五', category: 'career', district: 'zhangjiang',
   tag: '开局插曲', speakerId: 'qi', illustration: openingPhoto('arrival-artist'),
   text: '祁清用尺子比过：印店门口那张价目表，主图歪了两毫米。店主把手机推过来，屏幕上是隔壁打印店的报价：「人家改一张三百，傍晚就好。」祁清把样纸压在你手边，只问一句：侬这回，打算怎么开价。',
   choices: [
    { id: 'fix', label: '六百五，改完当面收钱', hint: '修稿费 ¥650',
     reply: '你量完尺寸当场改完，把排版原理讲了两分钟。六百五到账。店主收起那部手机，又把去年那张也摊开：「不印，就想听侬讲讲它哪里歪。」',
     effect: { cash: 650, skill: 5, face: 5 } },
    { id: 'credit', label: '价格少一点，样稿能放进作品集', hint: '修稿费 ¥420',
     reply: '你给成稿拍了照。祁清问要不要把歪的那张也放上去。你想了想，传了两张，中间夹一把尺——贵的那三百，是道理的价钱。',
     effect: { cash: 420, skill: 9, network: 5 } },
    { id: 'offer', label: '连同后面几版一起谈，问他们招不招人', hint: '用本事争取设计助理',
     reply: '你没还价，当场把下一版摆了出来——三百块的那种，做不出这一版。',
     effect: { health: -3 },
     check: { stat: 'skill', threshold: 47, success: { job: 'creative', face: 7, trust: 6 },
      failure: { skill: 8, cash: 420 }, successText: '她合上作品集：「下周有张更难的，侬来伐？」店主把隔壁的报价删了。',
      failureText: '她说这次先算改稿，四百二打过来了：「下趟，把时间也一起报给阿拉。」' } },
   ],
  },
 },
];
