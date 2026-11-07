import { openingPhoto } from './art';
import type { GameState, LifeEvent } from './types';

type OpeningStory = {
 cards: readonly [string, string];
 message: string;
 teaser: string;
 event: LifeEvent;
};

export const LOAN_INSTALLMENT = 4800;
export const LOAN_DUE = 'opening-loan-due';

const stories: OpeningStory[] = [
 {
  cards: ['born-rich', 'fund-frozen'], message: '老爸在地库等你还车钥匙',
  teaser: '副卡冻着，手上只有 ¥24,000。老爸在地库等你。',
  event: {
   id: 'origin-garage', title: '车能开，卡刷不出', category: 'career', district: 'lujiazui',
   tag: '开局插曲', speakerId: 'father', illustration: openingPhoto('garage'),
   text: '老爸坐在地库的挡车墩上。你说副卡刷不出来，他把车钥匙和一张排班表一起递过来。钥匙可以拿，名字得先填。公司周六还缺个去仓库的人。',
   choices: [
    { id: 'sign', label: '把名字填上 · 去公司做销售助理',
     reply: '老爸把钥匙收回去，说仓库停车一天六十，坐地铁吧。下午公司人事把你加进群，先让你把周六能到的时间写进去。',
     effect: { job: 'trade', trust: 8, skill: 3 } },
    { id: 'deliver', label: '只替他送这趟 · 工钱当天结',
     reply: '你回来得晚，老爸已经把八百转过来了。手机又亮了一下，他问下回只借车的话，停车费能不能你自己付。',
     effect: { cash: 800, network: 4, health: -3 } },
    { id: 'leave', label: '把钥匙还给他 · 我先找自己的活',
     reply: '老爸把两样东西都收进兜里。你走到闸机前收到一条消息，他问你刚来那只箱子还拖得动伐。',
     effect: { spirit: 10, skill: 5, face: -3 } },
   ],
  },
 },
 {
  cards: ['born-local', 'secret-local'], message: '顾爷叔把录音键递到你手边',
  teaser: '邻居让你用上海话录一条停水通知。',
  event: {
   id: 'origin-dialect', title: '侬再讲一遍', category: 'social', district: 'people',
   tag: '开局插曲', speakerId: 'uncle', illustration: openingPhoto('dialect'),
   text: '顾爷叔把手机推过棋盘。明早八点停水，楼里有几位老人不看群文字。大家说侬从小住这里，来录条上海话。他按下了红键，你脑子里第一个冒出来的词是「那个」。',
   choices: [
    { id: 'practice', label: '让爷叔一句一句带 · 录到能听懂',
     reply: '第三遍他把自己的咳嗽也录进去了。隔壁阿姨听完回了个「晓得了」，又问棋下完没有，要不要回来吃饭。',
     effect: { skill: 8, network: 5, trust: 6 } },
    { id: 'plain', label: '用普通话报准时间 · 再挨家敲门',
     reply: '四楼奶奶说听懂了，让你顺带记一下她那只旧水壶漏不漏。你试了试，壶不漏，就是盖子装反了。',
     effect: { network: 10, trust: 5, health: -2 } },
    { id: 'trade', label: '手机教会他 · 请他自己录',
     reply: '爷叔发进群的第一条没声音。第二条他说得比你想的还慢，顺手把你手边的棋吃掉了。',
     effect: { skill: 4, spirit: 8, trust: 5 } },
   ],
  },
 },
 {
  cards: ['born-artist', 'secret-title'], message: '祁清点开了你作品集里的源文件',
  teaser: '简历写你主导项目。对方正好有源文件。',
  event: {
   id: 'origin-portfolio', title: '这一层是谁画的', category: 'career', district: 'zhangjiang',
   tag: '开局插曲', speakerId: 'qi', illustration: openingPhoto('portfolio'),
   text: '祁清把文件翻到图层那一页。你简历上那行写的是「主导整套方案」。她点开的刚好是同学画的那一层，名字还在图层右边。「这一块，你从哪儿开始想的？」',
   choices: [
    { id: 'credit', label: '当面改简历 · 把同学名字补上',
     reply: '她把那页往后翻，找到两张你画的草稿。她说那我们就谈这两张。你走的时候，她问能不能留一份改过的简历。',
     effect: { skill: 8, trust: 9, face: -2, removeFlags: ['cv_lie'] } },
    { id: 'demo', label: '从空白文件做一遍 · 当场给她看', reply: '你借了她半小时。',
     effect: { health: -4 },
     check: { stat: 'skill', threshold: 54, success: { job: 'creative', face: 7, removeFlags: ['cv_lie'] },
      failure: { skill: 6, spirit: -3 }, successText: '她看完让你把原作者补上，再问下周一能不能来上班。',
      failureText: '第二块图没排完。她把屏幕关掉，说有空再带一张从头到尾是你做的来。' } },
    { id: 'small', label: '说清分工 · 问今天有没有小活能接',
     reply: '她把一张歪了两毫米的价目表发给你。改完对方转了六百五，顺手把那个图层的同学也加进了群。',
     effect: { cash: 650, network: 6, skill: 3 } },
   ],
  },
 },
 {
  cards: ['fund-debt', 'secret-money'], message: '还款单和存折夹在同一页',
  teaser: '没人知道你攒了七万，除了柜台这一位。',
  event: {
   id: 'origin-bank', title: '存折和还款单都在这儿', category: 'social', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('bank'),
   text: '你把助学贷款的单子从存折里抽出来。这一期四千八。柜员问今天要不要直接扣，老妈的电话也来了，她说你在外面手头紧，想给你转点钱。',
   choices: [
    { id: 'pay', label: '先还这一期 ¥4,800 · 给她回电话',
     reply: '扣款短信先到。老妈听你讲完，说那我给你寄一袋米吧。你说公寓没电饭煲，她问那你这两天吃的是啥。',
     effect: { cash: -LOAN_INSTALLMENT, spirit: 9, trust: 6 } },
    { id: 'plan', label: '按原定日期还 · 年底扣 ¥4,800',
     reply: '你在日历上记好两笔，先回了老妈的电话。她以为你还在排队，说晚点再打也行，别在窗口跟人抢位置。',
     effect: { skill: 8, spirit: 3, setFlags: [LOAN_DUE] } },
    { id: 'home', label: '先给家里 ¥2,400 · 年底照还', hint: '年底再扣助学贷款 ¥4,800',
     reply: '老妈看见转账，问你留够房租没有。你们打了十来分钟电话，一半时间在算菜价。那笔钱她最后收了。你的还款单还夹在存折里，年底照扣。',
     effect: { cash: -2400, trust: 12, network: 4, setFlags: [LOAN_DUE] } },
   ],
  },
 },
 {
  cards: ['fund-room', 'tie-pet'], message: '空房钥匙在门口，猫包先别放下',
  teaser: '亲戚让你先住。猫从包里伸了只爪。',
  event: {
   id: 'origin-cat', title: '行李可以，猫另算', category: 'housing', district: 'xinzhuang',
   tag: '开局插曲', speakerId: 'mother', illustration: openingPhoto('cat'),
   text: '老妈来帮你收空房。她把毛巾放在门边，刚要开猫包，屋里传来亲戚的声音，说他对猫毛过敏。你还没开口，猫先从拉链缝里叫了一声。',
   choices: [
    { id: 'rent', label: '找间能养猫的房 · 先交 ¥2,800',
     reply: '你把房子换到地铁再往外两站。搬进去第一晚，猫在新房巡了一圈，回来还是睡你那只箱子。',
     effect: { cash: -2800, housing: 1, spirit: 10, health: -3 } },
    { id: 'friend', label: '这周寄放朋友家 · 我每天去喂',
     reply: '朋友发来照片。猫已经躺到他枕头上了。你说周末来接，他问能不能周日再来，周六他要拍几张照片。',
     effect: { network: 9, trust: 5, health: -5 } },
    { id: 'room', label: '陪老妈找隔开的房间 · 先讲清怎么打扫',
     reply: '亲戚腾了楼下那间。它有独立的门，你把除毛滚筒放在门外。第二天他拿了个空纸盒过来，说听见里面一直有人拆东西。',
     effect: { spirit: 6, trust: 10, skill: 4 } },
   ],
  },
 },
];

export function openingStory(cardIds: readonly string[], seen: readonly string[] = []): OpeningStory | undefined {
 return stories.find(story => !seen.includes(story.event.id) && story.cards.every(id => cardIds.includes(id)));
}

export function openingLead(state: GameState) {
 if (state.age !== 18 || state.pendingYearEvent || state.ended) return undefined;
 return openingStory(state.origins, state.seenEvents);
}
