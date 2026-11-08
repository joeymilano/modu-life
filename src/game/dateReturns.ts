import { datePhoto } from './art';
import { dateAnswer, dateAnswerEffect, dateTableChoice, hasDated } from './dates';
import { CAST } from './content';
import type { Effect, EventChoice, GameState, LifeEvent } from './types';

type Beat = [label: string, reply: string, effect: Effect];
type ReturnScene = {
 title: string;
 text: string;
 date: Beat;
 friend: Beat;
 help: Beat;
 leave: Beat;
};

const returns: Record<string, ReturnScene> = {
 xia: {
  title: '一杯甜，一杯咸',
  text: '早饭铺刚开门，许小雯已经坐下了。她买了两杯豆浆，自己那杯忘了是哪种。上回被汤打湿的坡道图，现在摊在平板上。她拿勺子比了比转弯的地方，问你敢不敢说实话。',
  date: ['喝完一起去现场量一遍', '你俩轮流按住卷尺。小雯抄完尺寸，问礼拜天能不能还是七点。你说九点，她这回真改了闹钟。', { trust: 11, attraction: 12 }],
  friend: ['把纸杯推开，帮她看看这个弯', '你说绕不过去。她拿勺子再走了一遍，把标红的地方加宽了十公分。', { trust: 10, skill: 4 }],
  help: ['听她讲完，豆浆先替她尝一口', '你说这杯是咸的。她把手伸过来，喝完才想起来那杯本来就是给你的。', { trust: 7, spirit: 6 }],
  leave: ['说我接下来一阵都不约了', '她把豆浆盖压紧了，问你路上要不要带走。图纸被她拖回桌子中央。', { spirit: 3 }],
 },
 ning: {
  title: '绿灯只剩六秒',
  text: '周宁买了两个饭团，在远一点的地铁口等你。走到天桥下，他口袋里又响了。离末班地铁还有八分钟。他没拿定主意，先把两个饭团都塞给你。',
  date: ['找个能坐的地方，今天晚点回去', '他给同事留了句明早处理。坐下时他选了朝江的那边，把靠风口的位子留给自己。', { trust: 9, attraction: 14, cash: -48 }],
  friend: ['把热的那个给他，陪他走到闸机', '他隔着栏杆举了下饭团，说下次走近的那个口。你说近的那个口早关了，他拿出手机重新看地图。', { trust: 11, network: 3 }],
  help: ['先问是不是又发错了正式服', '「没，问我外卖筷子在哪。」他回完那条，把整个群静音了。', { trust: 8, spirit: 5 }],
  leave: ['趁还有车，各自回去吧', '你把另一个饭团递回去。他进站后又出来一次，原来走反了。', { spirit: 2 }],
 },
 lin: {
  title: '第一口算谁的',
  text: '林佳隔着油纸给你看，今天这张葱油饼有脸盆那么大。老板说店里只剩这一张，排你们后头的小孩踮起脚看了半天。林佳拿着那张画过饼的餐巾，问先切哪边。',
  date: ['买下来，给后头的小孩留两块', '老板给了四个袋子。你们一路分到弄堂口，手里只剩半块。林佳拿笔把餐巾上的脸画成了两个。', { cash: -36, attraction: 14, trust: 9 }],
  friend: ['请老板切开，跟后头那位分一分', '小孩拿走一块最脆的。林佳看了一眼自己的那块，问人家想不想再换一次。', { network: 6, trust: 10 }],
  help: ['让小孩先买，咱俩去隔壁吃粢饭团', '她抓起餐巾就跟你走。隔壁问要不要加糖，她说要两份脆的，还是把你那份先递给你。', { trust: 7, spirit: 7 }],
  leave: ['你先吃，我以后就不来约了', '她把画翻到没沾油的一面，替你把最后一块包上。', { spirit: 3 }],
 },
 chen: {
  title: '菜场七点钟',
  text: '陈恺早到了。你找到他时，他正蹲在年糕摊边上。蓝色推车有个轮子卡住了，摊主等着把货拉进去。他先递给你一杯豆浆，再问你有没有两块钱硬币。',
  date: ['拿硬币当螺丝刀，修完陪他把菜买了', '螺丝松开时滚进了菜叶底下。你们蹲着找了两分钟，陈恺说下礼拜这时候要不再来一趟。', { skill: 4, trust: 11, attraction: 11 }],
  friend: ['替摊主推一段，回来请他吃年糕', '摊主少收了两块。陈恺用那两块钱买了袋葱，说中午煮面，咖啡机今天归别人管。', { network: 5, trust: 10 }],
  help: ['去卖锁的摊上借把真螺丝刀', '修车用了半分钟，还工具花了十分钟。卖锁的坚持把他去年修好的一把锁给你看。', { skill: 7, network: 4, trust: 4 }],
  leave: ['把零钱给他，说自己以后不约了', '他还给你一块钱，让你留着坐车。年糕摊的秤这时候才亮起来。', { spirit: 2 }],
 },
 qiao: {
  title: '考完先吃小笼',
  text: '乔敏把考场里用的笔收回帆布包。你正想问考得怎么样，她抢先问了句「醋放不放姜」。刚端上来的笼屉还在冒热气，她把手机往包底又推了推。',
  date: ['先吃，不急着聊成绩', '吃到第五只时她自己开口，说有一题答错了。你问什么时候出分，她说等出分那天，再一起吃六只。', { trust: 13, attraction: 12 }],
  friend: ['说下次考试也给她留个座', '她从包里拿出一张折了几道的准考证，说先把这回的收好。你帮她把醋换成没姜的。', { trust: 11, spirit: 5 }],
  help: ['问她考完最想把哪本书送人', '她笑了，报了一本书的全名。旁边一桌有人抬头，说自己正好在准备这门。', { network: 7, trust: 6 }],
  leave: ['趁开口容易，把以后不再约说清楚', '她点了头。到门口她才把手机拿出来，先把今天的付款记录收好。', { spirit: 3 }],
 },
 yang: {
  title: '一把伞有点偏',
  text: '小区门厅外突然下雨。杨帆拿了两把伞，打开红的才发现断了一根骨。他把没坏的往你这边一递。上回报修的那户还亮着灯，楼道里这次没人叫他。',
  date: ['一起撑好的，走远一点去吃饭', '一路过去他右边袖子全湿了。进店时你把伞往他手里一塞，他说下次换他走里边。', { trust: 11, attraction: 12, cash: -68 }],
  friend: ['把好伞拿去接门口淋雨的小孩', '你们等小孩刷了楼门再回来。他用坏伞挡了一会儿风，回去的路上一直拿它当拐杖。', { network: 8, trust: 9 }],
  help: ['借门卫一段胶布，先把伞骨固定住', '门卫给了你一卷。杨帆撕下一小段，剩下的放回原处，还顺手把歪掉的门牌贴正了。', { skill: 5, trust: 7 }],
  leave: ['把伞还给他，说下次就先不约了', '他看了眼雨，还是把好的放在你那边，说挂回门厅就行。', { spirit: 3 }],
 },
 lu: {
  title: '写了姓的那瓶水',
  text: '陆嘉在台侧拿着两瓶水，瓶盖上有一小块写了你姓的胶带。后门有个观众等着合照，老板刚把音箱推出去堵住了半条过道。陆嘉问你要不要等她收完再走。',
  date: ['留到她收完，再一起去吃夜宵', '你们把最后一只箱子推回去，夜宵摊还没收。她把下一场演出的票翻到背面，给你写了个时间。', { attraction: 14, trust: 12, cash: -52 }],
  friend: ['给合照的人让路，顺手把线卷好', '陆嘉拍完照蹲下来跟你一起卷。卷到最后一根，她把你那瓶水从音箱顶上够下来。', { trust: 11, network: 5 }],
  help: ['问她今天那首歌为什么少唱了一句', '她说忘词了。你说以为那是特地空的一拍，她咧嘴笑了，说下次还这么唱。', { spirit: 7, trust: 8 }],
  leave: ['水拿上，跟她说下次不用留了', '她把另一瓶留给了收音箱的人。你走到路口，那张胶带还贴着。', { spirit: 3 }],
 },
 he: {
  title: '醋就在手边',
  text: '何亮把一碗猪肝面推过来。醋摆在你这边，他自己连筷子都没拿。说是请你吃，账本却摊在旁边，页脚写着同一斤猪肝炒了三回的用量。',
  date: ['分他半碗，问打烊以后还要不要见', '他终于拿了筷子。两个人夹到同一片猪肝，他松了手，说打烊后想吃点自己不会做的。', { attraction: 13, trust: 12 }],
  friend: ['帮他盲尝一轮，哪个好吃就说哪个', '你选了第二碗。他盯着账本看了会儿，承认第二碗是他妈炒的。', { skill: 5, trust: 11 }],
  help: ['问这碗成本多少，算算敢不敢上菜单', '他把煤气也算上了。你没想到一碗面能算这么久，最后倒是把你这碗算成了免费的。', { skill: 6, trust: 7 }],
  leave: ['说以后就当普通客人', '他合上账本。临走给你抓了两颗薄荷糖，跟给前面一桌的一样。', { spirit: 3 }],
 },
};

type TableEcho = { line: string; option?: Beat };
const tableEchoes: Record<string, readonly [TableEcho,TableEcho,TableEcho]> = {
 xia: [
  {line:'她今天把图放到桌子最里边，主动给你腾了半张。'},
  {line:'她翻出你拍的那张图。你以为她要放大尺寸，她先指了指右下角那颗葱花。',
   option:['用上次的照片对一下新尺寸','你把照片放大给她看。她把卷尺递过来，说走之前想借你一只手。',{skill:7,trust:9}]},
  {line:'她把平板斜靠在杯子上。见你往这边看，才问今天这张图可以摊开伐。'},
 ],
 ning: [
  {line:'饭团袋里有两包花生。他说上回那碗面有人拌过，放凉也没坨。'},
  {line:'他把你上次提过的那个表情设成了快捷回复。今天真试了一回。',
   option:['请他当面看看发出去没有','消息发错群了。周宁盯了两秒没撤，反而把饭团拆开了。你们后来笑到错过一趟车。',{trust:9,spirit:8}]},
  {line:'他这次把回滚怎么做写在便签上。翻到最后一句，发现还是写长了。'},
 ],
 lin: [
  {line:'她把排在后头的小孩叫住，说这次先问清楚，再下嘴。',
   option:['问小孩要哪一块，再请老板切','小孩挑中间。老板问要切多大，林佳比了半天，最后还是让他自己划了一下。',{network:8,trust:10}]},
  {line:'她说老板一看是你们俩，先问今天是不是又要自首。',
   option:['跟老板说今天两个人一起排队','老板把油纸多扯了一张，说好，今天轮到小孩监督。她把自己那块交给小孩挑。',{network:9,trust:8}]},
  {line:'你刚想把油纸翻个面，她先按住盘子，说上次也有人动过这个念头。'},
 ],
 chen: [
  {line:'他递豆浆时特地先翻了个面。袋子后面写着少糖，他说这回递的单没错。'},
  {line:'他开口本来想讲摊主卖的豆子，讲出两个字自己停了，转头问你想不想吃年糕。'},
  {line:'菜篮旁边还有一小瓶辣油。他说今天买了一瓶，省得又剩半碟。',
   option:['先替他拿辣油，再找摊主借工具','你们修完车，辣油忘在摊上。陈恺跑回去找，顺手买了三块年糕，给摊主留了一块。',{skill:6,trust:9}]},
 ],
 qiao: [
  {line:'她今天把书放得很远，说桌上的时间还可以再多留几分钟。'},
  {line:'她把上次打包时留的那个干净餐盒带来了。袋子上的结还是她自己打的。',
   option:['把留的那几只装进去，等她慢慢吃','她吃完才打开手机，看了一眼时间，又给你倒了一杯茶。',{trust:10,spirit:6}]},
  {line:'老板刚说小笼要等，她就问等多久，说具体点，她好把下一班车记下来。'},
 ],
 yang: [
  {line:'上回那位报修的邻居在门口认出你，说排水管换了，楼下这周没再滴。'},
  {line:'物业的人从门里探出头，问上次给他指路的是不是你们。杨帆还记得那张便签贴哪儿。'},
  {line:'门厅那边又有人叫他。杨帆问你今天愿不愿意一起过去，听完再走。',
   option:['先把伞搁在这儿，跟他去听两句','那户已经修好了。人家只是拿了袋枇杷想道谢。你们在门里分了几个，出去时雨小了。',{trust:9,network:7}]},
 ],
 lu: [
  {line:'她把一根长线扔到你脚边，卷得挺圆。靠插头那头贴了块胶带，写了个小小的长字。',
   option:['认出那根长线，帮她把它单独收好','陆嘉把新线放另一边，说下次上台要是还有人接错，就换你在台侧指挥。她递过来那瓶水，盖子已经拧松了。',{trust:11,skill:5}]},
  {line:'台下有人试着带拍。陆嘉从音箱后探头，先找你刚才站的地方。'},
  {line:'她说上次那半首别往外发。说完还是把水递给了你。',
   option:['当着她的面删掉那段视频','她等你锁上屏才说，下次有能录的她会先告诉你。你们把台侧那两瓶水喝完了。',{trust:10,spirit:4}]},
 ],
 he: [
  {line:'有人在隔壁喊老板。何亮稳稳地坐着，拿筷子敲了敲你的碗。'},
  {line:'他把一张单子夹进账本，上回隔壁要的荷包蛋还写在背面。',
   option:['把那张加蛋单拿出来，今天真加一个','他给你煎了两个。算钱时又把一个划掉，说那一个记在上回那桌。',{trust:10,spirit:6}]},
  {line:'账本底下夹着那张白饭小票。他说留着提醒自己，外面一碗白饭敢收多少。'},
 ],
};

export function returnDate(state: GameState, personId: string): LifeEvent | undefined {
 const story = returns[personId];
 const id = `date-return-${personId}`;
 const answer = dateAnswer(state, personId);
 if (!story || !hasDated(state, personId) || answer === 'left' || state.seenEvents.includes(id)) return undefined;
 const withFriend = answer === 'friends';
 const waiting = answer === 'waiting';
 const index = dateTableChoice(state, personId);
 const echo = index === undefined ? undefined : tableEchoes[personId]?.[index];
 const choice = (id: string, [label, reply, effect]: Beat, extra?: Effect): EventChoice => {
  const combined = { ...effect, ...extra };
  const cost = -(combined.cash ?? 0);
  return { id, label, reply, effect: combined, ...(cost > 0 && { hint: '这趟你付 ¥' + cost }) };
 };
 return {
  id, title: story.title, text: story.text + (echo ? '\n' + echo.line : ''), category: 'romance', speakerId: personId,
  illustration: datePhoto(personId, 'return'), district: CAST.find(person => person.id === personId)?.district,
  tag: withFriend ? '朋友见面' : waiting ? '还没定下来' : '再见一面',
  choices: [
   withFriend ? choice('friend', story.friend) : waiting ? {...choice('friend',story.friend,dateAnswerEffect(personId,'friends')),hint:'以后按朋友相处'} :
    choice('date', story.date, { commitment: 5, romanticInvitation: true, ...dateAnswerEffect(personId, 'again') }),
   echo?.option ? choice('memory', echo.option) : choice('help', story.help),
   choice('leave', story.leave, { love: false, ...dateAnswerEffect(personId, 'left') }),
  ],
 };
}
