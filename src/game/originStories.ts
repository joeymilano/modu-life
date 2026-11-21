import { openingPhoto } from './art';
import { ARRIVAL_STORIES, type OpeningStory } from './arrivalStories';
import type { GameState } from './types';

export const LOAN_INSTALLMENT = 4800;
export const LOAN_DUE = 'opening-loan-due';

const stories: OpeningStory[] = [
 {
  cards: ['born-rich', 'fund-frozen'], message: '亲戚群里都在传你被断供了',
  teaser: '副卡冻着，手上只有 ¥24,000。亲戚群在看笑话。',
  event: {
   id: 'origin-garage', title: '昨天晒游艇，今天进地库', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'father', illustration: openingPhoto('garage'),
   text: '亲戚群还在转发你上个月晒的游艇照，配字：「听说家里把他卡断了，看笑话咯。」地库里，老爸坐在挡车墩上，车钥匙和一张排班表一起推过来：「外头都说你养废了。钥匙可以拿——名字先填了。周六仓库缺人，你去不去？」',
   choices: [
    { id: 'sign', label: '把名字填上 · 去公司做销售助理',
     reply: '你在排班表上签了字，笔按得很重。老爸把钥匙收回去：「仓库停车一天六十，坐地铁。」下午人事把你拉进群——群名片得自己改，没人知道你是谁家的孩子。',
     effect: { job: 'trade', trust: 8, skill: 3 } },
    { id: 'deliver', label: '只替他送这趟 · 工钱当天结',
     reply: '你搬完回来，工装后背全湿了。八百块转账先到，配一句：「下回只借车，停车费自己付。」看笑话的亲戚不会知道这八百是怎么挣的。',
     effect: { cash: 800, network: 4, health: -3 } },
    { id: 'leave', label: '把钥匙还给他 · 我自己挣',
     reply: '你把钥匙和表都推了回去。走到闸机口，手机亮了一下：「箱子还拖得动伐？」你没回，把袖子挽了起来。',
     effect: { spirit: 10, skill: 5, face: -3 } },
   ],
  },
 },
 {
  cards: ['born-local', 'secret-local'], message: '爷叔当众问你：侬是上海人伐',
  teaser: '楼里停水，有人质疑你不会讲上海话。',
  event: {
   id: 'origin-dialect', title: '上海小囡不会讲上海话？', category: 'social', district: 'people',
   tag: '开局插曲', speakerId: 'uncle', illustration: openingPhoto('dialect'),
   text: '楼道群里炸了锅：明早八点停水，几位老人不看文字通知。有人接了句「让三楼那个录啊，从小住这楼的」，紧跟着一条阴阳怪气：「他？上海话讲得比我孙子还烂，装的吧。」顾爷叔把手机推过棋盘，红键已经按下。全楼都在等这条录音。',
   choices: [
    { id: 'practice', label: '让爷叔一句一句带 · 录到能听懂',
     reply: '第三遍他把自己的咳嗽也录了进去。群里回了条「晓得了」，那个说装的人也点了赞。爷叔翻过棋盘：「来，吃侬一只炮。」',
     effect: { skill: 8, network: 5, trust: 6 } },
    { id: 'plain', label: '用普通话报准时间 · 再挨家敲门',
     reply: '四楼奶奶说听懂了，让你顺带记一下她那只旧水壶漏不漏。你试了试，壶不漏，就是盖子装反了。敲完最后一户，那句「装的」再没人提。',
     effect: { network: 10, trust: 5, health: -2 } },
    { id: 'trade', label: '手机教会爷叔 · 请他自己录',
     reply: '爷叔发进群的第一条没声音，第二条他说得又慢又响，末了添一句「小囡帮我按的键」。顺手，他把你手边的棋吃掉了。',
     effect: { skill: 4, spirit: 8, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-artist', 'secret-title'], message: '祁清当众点开了源文件的图层',
  teaser: '简历写你主导项目。对方正好有源文件。',
  event: {
   id: 'origin-portfolio', title: '图层右边的名字不是你', category: 'career', district: 'zhangjiang',
   tag: '开局插曲', speakerId: 'qi', illustration: openingPhoto('portfolio'),
   text: '面试间里还有两个候场的。祁清把文件翻到图层页——你简历上写着「主导整套方案」，她点开的刚好是同学画的那层，原作者名字就挂在图层右边。她抬眼，声音不大，候场的都听见了：「这一块，你从哪儿开始想的？」',
   choices: [
    { id: 'credit', label: '当面改简历 · 把同学名字补上',
     reply: '你拿过自己的简历，当场把那行划掉，补上同学的名字。她把那页往后翻，找到两张你画的草稿：「那就谈这两张。」走的时候她问你能不能留一份改过的简历——诚实的那份。',
     effect: { skill: 8, trust: 9, face: -2, removeFlags: ['cv_lie'] } },
    { id: 'demo', label: '从空白文件做一遍 · 当场给她看', reply: '你把她的时间借了半小时。屏幕上白板一块块长出来，候场的人没走，都在看。',
     effect: { health: -4 },
     check: { stat: 'skill', threshold: 54, success: { job: 'creative', face: 7, removeFlags: ['cv_lie'] },
      failure: { skill: 6, spirit: -3 }, successText: '她看完让你把原作者补上，再问下周一能不能来上班。候场的两位没再进来。',
      failureText: '第二块图没排完。她把屏幕关掉：「有空带一张从头到尾是你做的来。」没人再看你。' } },
    { id: 'small', label: '说清分工 · 问今天有没有小活能接',
     reply: '你把分工一笔笔讲清，哪块是谁的、你做了什么。她把一张歪了两毫米的价目表发给你，改完到账六百五——顺手把那个图层的同学也拉进了群。',
     effect: { cash: 650, network: 6, skill: 3 } },
   ],
  },
 },
 {
  cards: ['fund-debt', 'secret-money'], message: '柜员把存折余额念得全场都听见',
  teaser: '没人知道你攒了七万，除了柜台这一位。',
  event: {
   id: 'origin-bank', title: '她问你这点钱存着做什么', category: 'social', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('bank'),
   text: '你把助学贷款的单子从存折里抽出来，这一期四千八。柜员看了眼余额，顺口问了句「就这点还分开存」，声音不大，后面排队的人都听见了。老妈的电话偏在这时打来：「侬在外面手头紧伐？妈给你转点。」存折里那七万，家里没人知道。',
   choices: [
    { id: 'pay', label: '先还这一期 ¥4,800 · 给她回电话',
     reply: '扣款短信先到。老妈听完只说：「那我给侬寄袋米。」你说公寓没电饭煲，她问那你这两天吃的是啥。七万的事，你一个字没提。',
     effect: { cash: -LOAN_INSTALLMENT, spirit: 9, trust: 6 } },
    { id: 'plan', label: '按原定日期还 · 年底扣 ¥4,800',
     reply: '你在日历上记好两笔，先回了电话。老妈以为你还在排队，叮嘱你别在窗口跟人抢位置。挂了电话，你把存折塞回包最里层。',
     effect: { skill: 8, spirit: 3, setFlags: [LOAN_DUE] } },
    { id: 'home', label: '先给家里 ¥2,400 · 年底照还', hint: '年底再扣助学贷款 ¥4,800',
     reply: '老妈看到转账愣了半天：「侬哪来的钱？」你说攒的。她没再问，只叮嘱留够房租。十来分钟电话一半在算菜价。那笔钱她最后收了，你的秘密还在存折里。',
     effect: { cash: -2400, trust: 12, network: 4, setFlags: [LOAN_DUE] } },
   ],
  },
 },
 {
  cards: ['fund-room', 'tie-pet'], message: '亲戚当着老妈的面说：猫和人只能留一个',
  teaser: '亲戚让你先住。猫从包里伸了只爪。',
  event: {
   id: 'origin-cat', title: '猫和人，只能留一个', category: 'housing', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('cat'),
   text: '老妈来帮你收空房，毛巾刚放到门边，亲戚的声音从屋里传出来，当着一层楼邻居的面：「房子白住已经不错了，还带只猫来？我对猫毛过敏，要么猫走，要么人走。」老妈的脸挂不住了。你还没开口，猫先从拉链缝里叫了一声——像替你答了。',
   choices: [
    { id: 'rent', label: '当场收拾行李 · 自己租房 ¥2,800',
     reply: '你把猫包拎起来就走，头也没回。老妈在楼道里追上你，眼圈红了。房子换到地铁再往外两站，第一晚猫在新房巡了一圈，回来还是睡你那只箱子——你们俩，都不欠谁的。',
     effect: { cash: -2800, housing: 1, spirit: 10, health: -3 } },
    { id: 'friend', label: '这周寄放朋友家 · 我每天去喂',
     reply: '朋友发来照片，猫已经躺到他枕头上了。你说周末来接，他问能不能周日再来。住下了，但那句「要么猫走」，你记住了。',
     effect: { network: 9, trust: 5, health: -5 } },
    { id: 'room', label: '陪老妈找隔开的房间 · 先讲清规矩',
     reply: '老妈拉着你俩坐下，把话摊开讲：房间隔开、天天除毛、纸箱封好。亲戚腾了楼下那间带独立门的屋。第二天他拿了个空纸盒过来：「听见里头一直有人拆东西——给它玩的。」',
     effect: { spirit: 6, trust: 10, skill: 4 } },
   ],
  },
 },
];

export function openingStory(cardIds: readonly string[], seen: readonly string[] = []): OpeningStory | undefined {
 const combinations = stories.filter(story => story.cards.every(id => cardIds.includes(id)));
 const available = combinations.length ? combinations : ARRIVAL_STORIES;
 return available.find(story => !seen.includes(story.event.id) && story.cards.every(id => cardIds.includes(id)));
}

export function openingLead(state: GameState) {
 if (state.age !== 18 || state.pendingYearEvent || state.ended) return undefined;
 return openingStory(state.origins, state.seenEvents);
}
