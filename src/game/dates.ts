import type { CastMember, Effect, GameState } from './types';
import { CAST } from './content';

type Answer={label:string;reply:string;points:number;cost?:number; intent?:'date'|'friend'|'leave'};
export type Question={text:string;answers:Answer[]};
const firstDates:Record<string,Question>={
 xia:{text:'许小雯发来消息，图还没改完，可能要晚半小时。',answers:[
  {label:'我先吃点，给你打包一份',reply:'“要辣的，别放香菜。你怎么知道我没吃饭？”',points:2},
  {label:'我在楼下那家面馆等你',reply:'她发来一个位置，还圈出了不用排队的后门。',points:0},
  {label:'改天也行，你空了提前说',reply:'“好，我忙完就跟你讲。”她又补了一个抱歉的表情。',points:2}]},
 ning:{text:'周宁放下手机，说刚修好一个问题，又出了三个。',answers:[
  {label:'先吃饭，电脑又不会饿',reply:'他笑了一下，把手机扣在桌上。',points:2},
  {label:'那你把电脑带来，边改边约',reply:'“这样也算约会？”他看了看旁边空着的座位。',points:0},
  {label:'我也下班了，今天谁都别提工作',reply:'“好。我知道前面有家蛮好吃的。”',points:0}]},
 lin:{text:'林佳翻了两页菜单，问今天能不能让她当一回顾客。',answers:[
  {label:'你点，我负责吃完',reply:'“那我要点两份甜品，先讲好。”',points:0},
  {label:'我看了十篇攻略，照我的来',reply:'她合上菜单，问你来之前是不是还做了张表。',points:0},
  {label:'可以，我今天也只带了嘴',reply:'“那洗碗的时候我先跑。”她笑着把菜单推过来。',points:2}]},
 chen:{text:'陈恺看见你选的咖啡店，问休息日能不能换个地方。',answers:[
  {label:'可这家的豆子真的很特别',reply:'“我知道，上周就是我给他们调的磨。”',points:0},
  {label:'那吃面去，葱油的还是辣肉的',reply:'“辣肉。终于有人不问我豆子哪里来的了。”',points:2},
  {label:'你挑一家，别让我猜了',reply:'他转身就走，回头确认你跟上没有。',points:0}]},
 qiao:{text:'乔敏把复习资料塞进包，说今天最多只能待一个小时。',answers:[
  {label:'吃完送你到地铁口',reply:'她看了眼表，说那现在先点菜。',points:0},
  {label:'下次你考完，我们吃顿大的',reply:'“讲好了。别到时候只记得发个表情包。”',points:2},
  {label:'考证哪有约会重要',reply:'“对我蛮重要的。”她把包拉好，放到旁边。',points:0}]},
 yang:{text:'杨帆刚坐下，社区群里又开始找他。',answers:[
  {label:'你先回，我看看菜',reply:'他回完把手机调了静音，说下次保证不带群出来。',points:2},
  {label:'约会还工作，你到底忙不忙',reply:'“忙。所以我今天特地腾了晚上。”',points:0},
  {label:'出什么事了，要搭把手伐',reply:'“楼下漏水，我只要帮他们找到物业电话。”',points:2}]},
 lu:{text:'陆嘉说周末临时多了一场演出，原定的见面得改。',answers:[
  {label:'你演完我们吃夜宵',reply:'她发来后台出口的位置，又补了句想吃烧烤。',points:0},
  {label:'我去台下，结束了你来找我',reply:'“好，别站最前面拍我鼻孔。”',points:2},
  {label:'那把演出推了，先陪我',reply:'“临时改我会提前说，推演出不行。”',points:0}]},
 he:{text:'何亮端详菜单，说这家的锅气还没他家后厨大。',answers:[
  {label:'你先尝一口，再写差评',reply:'他夹了一筷子，说还行，先放过。',points:0},
  {label:'贵总有贵的道理',reply:'他指着三十八块的白米饭，半天没接话。',points:0},
  {label:'那去你家，老板给打折伐',reply:'“报我名字，洗碗免单。”',points:2}]}
};

function parting(text: string, invite: string, yes: string, friends: string, bye: string): Question {
 return { text, answers: [
  { label: invite, reply: yes, points: 2, intent: 'date' },
  { label: '做朋友，以后有空再坐坐', reply: friends, points: 0, intent: 'friend' },
  { label: '送到这里就好', reply: bye, points: 0, intent: 'leave' },
 ] };
}

const scenes: Record<string, { middle: Question; end: Question; date: string; uncertain: string }> = {
 xia: {
  middle: { text: '热汤刚端上来，她把图纸往回抽。纸角湿了一块，偏偏是她改了三遍的坡道。', answers: [
   { label: '把干的餐巾递过去，腾半张桌', reply: '她把图压在筷架底下，顺手在纸背画给你看轮椅怎么过。', points: 2 },
   { label: '先拍张照，糊了也能照着描', reply: '她没想到你会先保住尺寸，说回去真用得上。', points: 2 },
   { label: '把图收了，吃饭哪能还谈工作', reply: '她卷得太快，纸角又折了一道。', points: 0 },
  ] },
  end: parting('她把没吃完的面打包。走到门口，又问你礼拜天是不是也醒得早。', '约周日早饭，迟到的人买豆浆', '她问甜的还是咸的，先替你记在手机里。', '她把设计展的地址发给你，叫你路过就进去。', '她把图纸换到没湿的那只手上，朝你挥了下。'),
  date: '她发来一个七点的闹钟截图。你问她早饭几点吃，她说闹钟是给你看的。',
  uncertain: '她说要看看周末的排班。后来发来的那张图，纸角的水印还在。',
 },
 ning: {
  middle: { text: '手机扣在桌上震了三次。他瞄了一眼，说上线的人把测试服当成了正式服。', answers: [
   { label: '先回他们，面我替你拌一下', reply: '他回了两行字，把通知关了，说这次真下班了。', points: 2 },
   { label: '给他们发个表情，等面凉了再说', reply: '他笑出了声，还是伸手把手机拿起来。', points: 1 },
   { label: '看看多少钱，要不要赔', reply: '他解释了半天回滚，面已经结成了一团。', points: 0 },
  ] },
  end: parting('出门两边都有地铁口。他问要不要从远一点的那个走。', '走远一点，下回也走这条', '他把地图收起来了，过马路时提醒你那段绿灯特别短。', '他说下次带你去园区食堂，周四的红烧肉靠谱。', '他等你过了闸机，才往另一个口走。'),
  date: '他把远一点的出口在地图上标了星，说这周五从这里走。',
  uncertain: '到家他发了一张地铁口的照片，圈出一段你们刚才走错的路。',
 },
 lin: {
  middle: { text: '老板端上一盘葱油饼，说隔壁桌点的。林佳已经咬了一口，停在半空。', answers: [
   { label: '那就买下来，再给隔壁点一份', reply: '她举着那块饼喊隔壁等一下，说她刚把证据吃了。', points: 2, cost: 28 },
   { label: '我也咬一口，这下两个人都有份', reply: '她忍着笑，把老板叫来结了这盘的钱。', points: 2, cost: 28 },
   { label: '放回去，反过来谁也看不出', reply: '她把盘子往自己面前拖了一寸，没让你伸手。', points: 0 },
  ] },
  end: parting('她把餐巾翻过来，画了一个长得像你的葱油饼。', '下回去找家饼更大的', '她把画塞给你，说下次见面拿这个认人。', '她说画可以带走，下次给你画一张正脸。', '她折起餐巾，给老板留在了账单底下。'),
  date: '她把餐巾上的画拍了下来。「下次我就带这个。你带零钱。」',
  uncertain: '她把葱油饼画发给了你。你存图时，发现文件名叫「第一个咬的人」。',
 },
 chen: {
  middle: { text: '面还没来，隔壁有人认出陈恺，端着杯子过来问他最近流行哪种豆。', answers: [
   { label: '说他今天休息，把面单递给那位', reply: '陈恺憋住笑，等人走远才说你刚递的是加面单。', points: 2 },
   { label: '听听你平时怎么给人选', reply: '他说了两个产区，接着问能不能让他先吃一口。', points: 0 },
   { label: '等他们聊完，再给你加点辣', reply: '他把辣油推回来一半，说刚才差点又上了班。', points: 2 },
  ] },
  end: parting('门口贴着早市时间。他看了半天，说自己开店前很久没逛过。', '找个不开门的早上，一起去早市', '他拿笔把休息日圈出来，说你挑摊，他带零钱。', '他给你指了个卖年糕的摊位，说周三去得早还有热的。', '他站在店门口发了会儿呆，才想起自行车停哪。'),
  date: '他给早市那天留了空，还问你几点算早。你说七点，他把刚打的「六点半」删掉了。',
  uncertain: '他把早市地址发来了，说万一你自己先去，别从菜摊那头进。',
 },
 qiao: {
  middle: { text: '乔敏的手机亮了，提醒还有二十五分钟。服务员恰好说主菜要再等半小时。', answers: [
   { label: '换两样快的，你还赶得上地铁', reply: '她把书从包里拿出来压住菜单，说这次算没白背时间管理。', points: 2 },
   { label: '我去问能不能打包，先把账结了', reply: '她拎着袋子算了下，能赶上车，还能带半份回去。', points: 2 },
   { label: '都点了，临时改什么', reply: '她没再看表，倒是把书包背到了肩上。', points: 0 },
  ] },
  end: parting('她在进站前停了一下，说考场附近好像有家挺好的店。', '等你考完去吃，时间你来定', '她把考试日期发给你，说别在开考前发「加油」。', '她说等出分了告诉你，能不能庆祝再说。', '她点点头，刷闸机前又看了眼表。'),
  date: '她把考场附近那家店存成了「考完再说」。名字也发给了你。',
  uncertain: '她在回家路上发了店名。考试那天过了几小时，消息才回到你这儿。',
 },
 yang: {
  middle: { text: '物业电话终于找到了。杨帆把手机放下，楼下那个来报修的邻居恰好经过窗边。', answers: [
   { label: '请他坐一会儿，先讲清谁家漏水', reply: '邻居讲完就走。杨帆在便签上写了门牌，给你把凉茶换成热的。', points: 2 },
   { label: '给他指物业的门，咱俩先吃', reply: '杨帆朝窗外比了比方向，终于动了筷子。', points: 2 },
   { label: '躲一下，假装没看见', reply: '杨帆还是站起来了。回座位时他忘了刚才聊到哪。', points: 0 },
  ] },
  end: parting('出门时他把物业便签翻了个面，问你平时哪天比较空。', '下回就我们俩，周五行伐', '他说周五有空，低头把「有空」改成了具体的七点。', '他问你愿不愿意来社区吃顿饭，楼里有人做酒酿。', '他陪你等了会儿车，把外套拉链拉到了顶。'),
  date: '他回家确认了排班，给你发了「周五七点」。这次没补一句「到时候看」。',
  uncertain: '他发来周五的排班，说得等另一位同事确认。你没把那晚排满。',
 },
 lu: {
  middle: { text: '音箱接上电却没声。陆嘉蹲在插排边，台下第一个观众已经买了两瓶水。', answers: [
   { label: '我去找根备用线，你先试别的口', reply: '她接过线，把第一声响留给你听，拨了一下最低的那根弦。', points: 2 },
   { label: '帮你跟台下说稍等，水先喝一口', reply: '她隔着线堆比了个拇指，你这才看见她一直没喝水。', points: 2 },
   { label: '让台下随便拍，出点事故才有流量', reply: '她拔掉那根松的线，让你先别拍。', points: 0 },
  ] },
  end: parting('最后一首弹完，陆嘉把线卷好，外面只剩一家烧烤摊亮着。', '走，吃完约下一场', '她扛起包，说这回可以站第一排，手机拿低一点就行。', '她发了演出表，说有空来听，带朋友也行。', '她把最短的那根线塞回包里，送你走到楼梯口。'),
  date: '陆嘉把下一场的地址发过来，问你姓怎么写。你问干吗，她说怕后台那群人又把水拿错。',
  uncertain: '她发来一小段录音，末尾是收线声。她说下场时间还没定。',
 },
 he: {
  middle: { text: '隔壁桌叫老板来算账。何亮习惯性站了起来，想起今天自己也是客人。', answers: [
   { label: '坐好，今天你的工作是吃面', reply: '他坐回去，把热腾腾的第一口让给了你。', points: 2 },
   { label: '你去吧，待会儿让老板给你发工钱', reply: '他把纸巾往肩上一搭，学店里伙计应了声「来嘞」。', points: 2 },
   { label: '顺便让他给这桌也打个折', reply: '他把纸巾拿下来，说这家又不是他家开的。', points: 0 },
  ] },
  end: parting('面吃完了。他翻手机找出一张新菜照片，问你是不是敢吃猪肝。', '敢，下回你掌勺，我带醋', '他说醋店里有，叫你带空肚子。', '他说那有新菜时叫你来试，不用给面子。', '他把那张照片又看一眼，说回去还得再试一次。'),
  date: '他给你留了个靠厨房的位子。「进来别看菜单。醋我给你放好。」',
  uncertain: '他发了一张后厨的照片，说今晚又排上了队。猪肝还在菜单上。',
 },
};

const firstDateMemories: Record<string, [flag: string, line: string][]> = {
 lu: [
  ['night-recorded-song', '陆嘉把你录的那段发过来。「下次剥橘子离话筒远点。」周末的演出又改了时间，她问你这回还有空伐。'],
  ['night-heard-last-song', '陆嘉问上次那首歌你听到哪一句了。你刚要回，她又发来一条，说周末的演出提前一小时。'],
  ['night-saved-box', '陆嘉从包里滚出两个有疤的橘子，说这次可别落在轮渡口。周末演出又临时改了时间。'],
 ],
 he: [
  ['night-took-rota', '何亮一坐下，差点又问你周六几点来。他把菜单转过来，改问三十八块一碗的白饭够买几斤米。'],
  ['night-offer', '何亮认出你来了。「蓝围裙还挂着呢。」他坐下把菜单转过来，指给你看三十八块一碗的白饭。'],
 ],
};

export function romanceQuestions(person: CastMember, flags: string[]): Question[] {
 const scene = scenes[person.id];
 const original = firstDates[person.id];
 const memory = firstDateMemories[person.id]?.find(([flag]) => flags.includes(flag));
 return [memory ? { ...original, text: memory[1] } : original, scene.middle, scene.end];
}

const DATE_ANSWERS = ['again', 'waiting', 'friends', 'left'] as const;
export type DateAnswer = typeof DATE_ANSWERS[number];
const dateFlag = (personId: string, answer: DateAnswer) => `date-${personId}-${answer}`;

export function dateAnswer(state: GameState, personId: string): DateAnswer | undefined {
 const stored = DATE_ANSWERS.find(answer => state.flags.includes(dateFlag(personId, answer)));
 if (stored) return stored;
 const name = CAST.find(person => person.id === personId)?.name;
 const scene = scenes[personId];
 if (!name || !scene) return undefined;
 // The previous version kept the parting reply in the journal without storing an answer flag.
 const last = state.journal.slice().reverse().find(entry => entry.title === `和${name}见一面`);
 const intent = scene.end.answers.find(answer => answer.reply === last?.text)?.intent;
 if (intent === 'friend') return 'friends';
 if (intent === 'leave') return 'left';
 return undefined;
}

export function dateAnswerEffect(personId: string, answer: DateAnswer): Effect {
 return {
  setFlags: [dateFlag(personId, answer)],
  removeFlags: DATE_ANSWERS.filter(value => value !== answer).map(value => dateFlag(personId, value)),
 };
}

export function finishDate(person: CastMember, answer: Answer, score: number, cost: number): { effect: Effect; text: string } {
 const scene = scenes[person.id];
 if (answer.intent === 'friend') return {
  effect: { cash: -cost, trust: 4 + score * 2, network: 4, spirit: 3, ...dateAnswerEffect(person.id, 'friends') },
  text: answer.reply,
 };
 if (answer.intent === 'leave') return { effect: { cash: -cost, trust: score, spirit: 1, ...dateAnswerEffect(person.id, 'left') }, text: answer.reply };
 const mutual = score >= 5;
 return {
  effect: { cash: -cost, trust: score * 3 - 2, attraction: score * 4 - 5, commitment: mutual ? 4 : 0, spirit: score >= 4 ? 6 : -2,
   romanticInvitation: true, ...dateAnswerEffect(person.id, mutual ? 'again' : 'waiting') },
  text: mutual ? scene.date : scene.uncertain,
 };
}
