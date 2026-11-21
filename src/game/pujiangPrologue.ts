import type { PujiangRoute } from './pujiangTypes';

interface FirstMeeting {
 id: string;
 label: string;
 reply: string;
 gesture: string;
 memory: string;
 nextYear: string;
}

interface Parting {
 id: 'stay' | 'prepare';
 label: string;
 line: string;
 gesture: string;
}
interface Prologue {
 titleLines: [string,string];
 routeName: string;
 clock: string;
 entrance: string;
 question: string;
 offer: string;
 offerAction: string;
 destination: string;
 partings: [Parting, Parting];
 place: string;
 time: string;
 photo: string;
 alt: string;
 title: string;
 personId: string;
 speaker: string;
 role: string;
 line: string;
 setup: string;
 choices: [FirstMeeting, FirstMeeting];
}

export const PROLOGUE_PENDING = 'pj-prologue-pending';

export const PROLOGUES: Record<PujiangRoute, Prologue> = {
 arrival: {
  titleLines:['纸板上写着', '你的名字'], routeName:'初到上海', clock:'18:00', entrance:'火车晚了四十分钟。出站口，有人踮着脚举起你的名字。纸板底下露出半只饭盒，盒盖都让蒸汽顶歪了。你把箱子放下，叫了一声通信时才用过的名字：「小毛？」', question:'信上讲，白球鞋，一只箱子。刚刚有个人两样都对，我追出去半条街。饿了伐？', offer:'八点开唱。陆嘉托我守门，怕人拿去年的票混进去。我偏偏最想听她唱第一首。', offerAction:'去江边的车进站了。小毛把家门钥匙给你，自己摸了摸空口袋。票夹还压在饭盒底下。', destination:'去江边小礼堂',
  partings:[
   {id:'stay', label:'进门我替你收票，你去听第一首。', line:'那我可当真了。她排了一个月，我在门口，连头一句都没听全过。', gesture:'毛小毛把票夹交给你，又回头教你认了一遍存根。'},
   {id:'prepare', label:'借我一张空票，我把两边的门画下来。', line:'东边这扇要往里推。外面写了个「拉」，新来的人都在那儿使劲。', gesture:'你在票背补了一支箭头。到了礼堂，你已经知道从哪边带人进场。'},
  ],
  place:'上海站 · 南广场', time:'傍晚六点', photo:'/art/prologue/arrival-place.webp', alt:'傍晚的上海站和出站的人群',
  title:'纸板上写着你的名字', personId:'mao', speaker:'毛小毛', role:'和你合租的人',
  line:'总算接着了。面给你留着呢。',
  setup:'你跟毛小毛合租了莘庄的一间房。租钱已经寄过，今天才头一回碰面。广场上有个同龄人，举的纸板缺了个角，名字倒写得一笔一画。他把纸板一翻，背后印着今晚的演出票。八点开门，他得赶回江边收票。',
  choices:[
   {id:'ticket',label:'看看他拿什么票做了接站牌',reply:'你看，头一批只印了五十张。陆嘉说票卖光了才敢喊她姆妈来听。你这张算我请。',gesture:'他把接站牌翻了个面。一个姑娘抱着吉他，名字印在最下角。',memory:'毛小毛用陆嘉的演出票接你，你收下了那张票。',nextYear:'陆嘉这回印票，把背面留白了。「给小毛写接人的名字。」'},
   {id:'bowl',label:'接过他的饭盒，两个人分着吃',reply:'蛋归你。我在锅边站一天，闻闻都饱了。哎，你慢点，下面还有口汤。',gesture:'面已经坨了。他拿筷子从中间划开，把荷包蛋推到你这边。',memory:'接站那天，你和毛小毛在广场上分过一盒面。',nextYear:'陆嘉带来一个洗干净的饭盒。「小毛说，这回面和汤分开装，省得又坨了。」'},
  ],
 },
 worker: {
  titleLines:['借你', '半副手套'], routeName:'日结工', clock:'16:40', entrance:'兜里七百八十块，借住的床明早就得还。头一回来做日结，窗口只扔出一双手套。站你前头的人接了，一只留给自己，一只递过来。', question:'新来的？姓吴。头一天别跟人比快，这里的木箱子会咬手。', offer:'末班车一走，宿舍就收名单。我想再看一眼，我那张床还在不在。你呢？', offerAction:'汽笛隔墙响了两声。他侧着身让一车木箱过去，手在腰上扶了一把。', destination:'去看仓门口的名单',
  partings:[
   {id:'stay', label:'我陪你看名单。车来了，我替你喊住。', line:'你嗓门大不大？司机耳朵背。算了，咱俩一道喊。', gesture:'他往旁边挪了半个身位，给你留出一起看名单的地方。'},
   {id:'prepare', label:'我先把南门那批货拢好，省得临走找。', line:'粉笔在窗台上。箱角朝外，天再黑你也找得着。', gesture:'你把南门的箱子留在最外一排。轮到夜班，有一趟来回可以省下。'},
  ],
  place:'莘庄 · 仓库门房', time:'下午交班前', photo:'/art/prologue/worker-place.webp', alt:'莘庄仓库的交接现场',
  title:'借你半副手套', personId:'wu', speaker:'吴师傅', role:'带你上第一班的老工友',
  line:'右手那只好，递箱子用得着。',
  setup:'今天是你头一回到仓库做日结。身上七百八，借住的床明早到期。门房只发了一双手套，领你进班的吴师傅分了你一只。转身教你认箱号时，他另一只手一直扶着腰。窗外的班车按了两声喇叭。',
  choices:[
   {id:'glove',label:'把有衬里的那只手套换给他',reply:'我这手粗，戴哪只都一样。你过来，这儿有根线头，挂在钉子上要吃亏的。',gesture:'吴师傅接过有衬里的手套，先替你把另一只的线头打了个结。',memory:'第一班，你和吴师傅一人戴了一只手套。',nextYear:'吴师傅给你捎来一双新手套。两只都齐，他特意让你数。'},
   {id:'mark',label:'蹲下来，跟他认第一只箱子的货号',reply:'摸到了伐？有圈的去南门。天再暗，手指头也认路。',gesture:'他让你闭眼摸了一下箱角。粉笔印底下，果然还有一道刻痕。',memory:'吴师傅教你摸箱角的粉笔印，认南门的货。',nextYear:'新班的人找不到南门那批货。吴师傅把粉笔递给你，让你教这一次。'},
  ],
 },
 heir: {
  titleLines:['门廊里的', '十七号'], routeName:'顶级富二代', clock:'18:30', entrance:'母亲头一回带你见饭店的采购主任。席快开了，她却把你留在门廊等一个人。转门外，一只旧皮箱卡在了地毯边上。', question:'我姓沈，给你家做灯。十七号退了两趟。要是嫌它亮，我换个灯罩就行。可他们连张纸条都不肯写。', offer:'你母亲叫你坐主桌吧？等会儿要是散了席，可就又没人肯看这盏灯了。', offerAction:'开席铃响了。她拂掉箱面上的雨珠，采购主任已经进了厅。', destination:'走进宴会厅',
  partings:[
   {id:'stay', label:'我陪你等。灯试完了，我们一起吃口热的。', line:'那好。待会儿我说急了，你替我慢慢问。', gesture:'沈经理从箱里拿出试灯的手套，递了一只给你。'},
   {id:'prepare', label:'我去找个插座，等人出来就能试。', line:'挑床头那么高的。站着觉得顺手的开关，躺着可未必。', gesture:'你跟领班借来接线板。今晚有人要试样灯，当场就能亮。'},
  ],
  place:'锦江饭店 · 门廊', time:'晚宴开席前', photo:'/art/prologue/heir-place.webp', alt:'锦江饭店门廊下停着一辆车',
  title:'门廊里的十七号', personId:'boss', speaker:'沈经理', role:'替你家做样灯的人',
  line:'当心，十七号在里面。',
  setup:'母亲头一回带你来见家里的客户，叫你到门廊接个人。沈经理脚边搁着只旧箱子，里面是给饭店做的床头灯。转门里的服务员已经来请过两回了，她还在把一张薄薄的退样单往箱扣里塞。',
  choices:[
   {id:'case',label:'替沈经理提箱子，让她腾出手',reply:'箱把磨手，当心。你这样一提，我倒有手把搭扣系好了。',gesture:'你提起旧箱子。手柄上缠的布已经磨得发亮。',memory:'第一次见客户，你替沈经理提着那只缠了布的样品箱。',nextYear:'沈经理给箱子配了新搭扣。她掰给你听，咔哒一声，这回一个人也拎得稳了。'},
   {id:'slip',label:'替她扶住箱盖，读一读退样单',reply:'「十七号，重送。」这是第二张了。哪怕写个「太亮」，我们也好知道改哪儿。',gesture:'你扶住箱盖。两张退样单的纸边都软了，理由一栏一样空着。',memory:'进宴会厅以前，你和沈经理一起读过十七号灯的退样单。',nextYear:'沈经理这回在单子上多画了一栏，专给住客写哪里不好用。'},
  ],
 },
 system: {
  titleLines:['雨先打湿了', '送货单'], routeName:'系统流', clock:'19:50', entrance:'你照着招工启事找到小礼堂。侧门响了三下。开门一看，送货的姑娘两手护着小车，刚才是拿鞋跟敲的门。', question:'我叫许舟。电池在底下，线在上面。你是来收货的吧？这张单子快泡成纸浆了。', offer:'听见没？台里又断了一下。待会儿真黑了，我得认得出谁能接这车货。', offerAction:'墙里的吉他声停了一拍。雨水顺着她手里的钥匙，滴到水泥地上。', destination:'推开礼堂侧门',
  partings:[
   {id:'stay', label:'我就在门边。你喊一声，我就应。', line:'那我喊你名字。黑灯瞎火的，「喂」一声谁知道在叫哪个。', gesture:'许舟照着你的名字念了一遍，把单子折好收进口袋。'},
   {id:'prepare', label:'先把备用电池挪到门边，伸手就能摸着。', line:'记住，矮箱子是满的。高的那箱我要带回去充。', gesture:'你把矮箱放在门轴旁。灯暗下去时，那只提手就在你脚边。'},
  ],
  place:'江边小礼堂 · 侧门', time:'开演前十分钟', photo:'/art/prologue/system-place.webp', alt:'雨夜里停在小礼堂侧门的货车',
  title:'雨先打湿了送货单', personId:'pj-xu', speaker:'许舟', role:'今晚给礼堂送货的司机',
  line:'搭把手。门槛有点高。',
  setup:'你应了礼堂贴的招工启事，今晚头一回做场务。头一件差事是接货。侧门台阶上，许舟独自护着车上的电池和电线，雨沿着油布往鞋里淌。隔着一道墙，有人在试唱，唱到一半，扩音器里咔了一声。',
  choices:[
   {id:'tarp',label:'先扯住油布，让她把货推进檐下',reply:'再高一点……好！我跑这一路，就怕电池还没送到，先泡坏了。',gesture:'你拉起油布。许舟把小车推进檐下，两个人的左肩都湿了一片。',memory:'许舟记得第一晚那场雨，是你替她拉住了油布。',nextYear:'许舟把干毛巾往你这边一扔：「上回拉油布，害你淋了半边。」'},
   {id:'receipt',label:'把送货单垫在门板上，替她签收',reply:'写正楷吧。上个月有一张签得像条鱼，我跑了三趟才结到运费。',gesture:'你拿门板垫着，把自己的名字一笔一画写清楚。她等墨干了才折。',memory:'许舟送来的第一车货，收货一栏是你亲笔签的。',nextYear:'许舟还留着第一次送货的底联。她把新单往旁边一放，两处收货人的笔迹一样。'},
  ],
 },
};

export function rememberedMeeting(flags: readonly string[], route: PujiangRoute) {
 return PROLOGUES[route].choices.find(choice => flags.includes('pj-prologue-'+choice.id));
}

export function openingScene(route: PujiangRoute, flags: readonly string[]) {
 const story = PROLOGUES[route];
 const first = rememberedMeeting(flags, route);
 const second = story.partings.find(choice => flags.includes('pj-prologue-' + route + '-' + choice.id));
 const page = second ? 'departure' : flags.includes('pj-prologue-offer') ? 'offer' :
  first ? 'reply' : flags.includes('pj-prologue-talk') ? 'question' : 'entrance';
 const pages = [
  {id:'entrance', line:story.line, action:story.entrance},
  {id:'question', line:story.question, action:''},
  {id:'reply', line:first?.reply ?? '', action:first?.gesture ?? '', choice:first?.label},
  {id:'offer', line:story.offer, action:story.offerAction},
  {id:'departure', line:second?.line ?? '', action:second?.gesture ?? '', choice:second?.label},
 ];
 const index = pages.findIndex(item => item.id === page);
 return {story, page, first, second, current:pages[index], history:pages.slice(0, index + 1)};
}
