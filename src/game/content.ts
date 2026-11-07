import type { Career, CastMember, District, Goal, OriginCard, OriginSlot } from './types';

export const HOUSING_NAMES = ['合租 / 亲友房', '普通租房', '改善租房', '自有住房'] as const;

export const DISTRICTS: District[] = [
  { id:'bund', name:'外滩', en:'THE BUND', subtitle:'有船就能过江', color:'#3b7475', hotspots:[
    {id:'bund-river',name:'江边长椅',kind:'rest',position:[-7,2],caption:'背后有人在练萨克斯'},
    {id:'bund-photo',name:'四元观景位',kind:'explore',position:[-3,-2],caption:'四块钱一杯，对面塔顶亮了'},
    {id:'bund-ferry',name:'摆渡口',kind:'social',position:[8.75,1.9],caption:'严可下夜班，从这里过江'},
    {id:'bund-date',name:'江风约会',kind:'romance',position:[7,-2],caption:'说好了带件挡风的衣服'},
  ]},
  { id:'anfu', name:'安福路', en:'ANFU ROAD', subtitle:'梧桐底下全是座', color:'#9c7059', hotspots:[
    {id:'anfu-cafe',name:'不急咖啡',kind:'business',position:[-7,2],caption:'陈恺在门口算这个月房租'},
    {id:'anfu-walk',name:'梧桐散步',kind:'romance',position:[-3,-2],caption:'走累了就在邮筒边坐会儿'},
    {id:'anfu-studio',name:'三楼工作室',kind:'career',position:[3,2],caption:'三楼窗户亮着，上去敲门'},
    {id:'anfu-book',name:'转角旧书店',kind:'learn',position:[7,-2],caption:'书上有前任读者的批注'},
  ]},
  { id:'people', name:'人民广场', en:"PEOPLE'S SQUARE", subtitle:'相亲摊摆到树荫里', color:'#687956', hotspots:[
    {id:'people-match',name:'相亲角',kind:'romance',position:[-7,2],caption:'汪阿姨说先别急着填表'},
    {id:'people-job',name:'周二招聘会',kind:'career',position:[-3,-2],caption:'门口有人帮忙改简历'},
    {id:'people-park',name:'公园棋摊',kind:'social',position:[3,2],caption:'顾爷叔又把棋盘支起来了'},
    {id:'people-night',name:'地铁口夜校',kind:'learn',position:[7,-2],caption:'迟到了，从后门进'},
  ]},
  { id:'lujiazui', name:'陆家嘴', en:'LUJIAZUI', subtitle:'写字楼还亮着', color:'#587c80', hotspots:[
    {id:'lujia-office',name:'云端写字楼',kind:'career',position:[-7,2],caption:'沈经理让你带电脑上去'},
    {id:'lujia-party',name:'下班社交局',kind:'social',position:[-3,-2],caption:'有人单独留了个座'},
    {id:'lujia-rent',name:'样板间看房',kind:'housing',position:[3,2],caption:'站在门口也看得见江'},
    {id:'lujia-invest',name:'小本生意会',kind:'business',position:[7,-2],caption:'桌上放着合伙协议'},
  ]},
  { id:'zhangjiang', name:'张江', en:'ZHANGJIANG', subtitle:'门卫认得你的车', color:'#6b8185', hotspots:[
    {id:'zhang-code',name:'深夜研发楼',kind:'career',position:[-7,2],caption:'大厅还能刷卡进'},
    {id:'zhang-class',name:'技能充电站',kind:'learn',position:[-3,-2],caption:'讲师留了最后一排空座'},
    {id:'zhang-pitch',name:'路演小剧场',kind:'business',position:[3,2],caption:'今天轮到新团队上台'},
    {id:'zhang-lawn',name:'午休草坪',kind:'rest',position:[7,-2],caption:'带饭的人都坐在树下'},
  ]},
  { id:'xinzhuang', name:'莘庄', en:'XINZHUANG', subtitle:'地铁到头，家还得走一段', color:'#8c815d', hotspots:[
    {id:'xin-rent',name:'弄堂租房处',kind:'housing',position:[-7,2],caption:'中介说晚上八点还能看'},
    {id:'xin-neighbor',name:'邻里小饭桌',kind:'social',position:[-3,-2],caption:'楼下阿姨叫你带个碗'},
    {id:'xin-rest',name:'小区长椅',kind:'rest',position:[3,2],caption:'长椅上有半张报纸'},
    {id:'xin-street',name:'晚风小吃街',kind:'explore',position:[7,-2],caption:'老板刚把第一笼生煎端出来'},
  ]},
];

export const CAST: CastMember[] = [
  {id:'xia',name:'许小雯',ageOffset:1,title:'建筑助理',district:'anfu',role:'romance',description:'改图改到太晚，周末反倒醒得早。约她吃早饭，比约晚饭容易。',trait:'sincerity',color:'#bb785f',gender:'female'},
  {id:'ning',name:'周宁',ageOffset:2,title:'研发工程师',district:'zhangjiang',role:'romance',description:'消息回得慢。真约了几点，他会把地铁出口也发过来。',trait:'security',color:'#5b8386',gender:'male'},
  {id:'lin',name:'林佳',ageOffset:0,title:'社区插画师',district:'xinzhuang',role:'romance',description:'等菜时会在餐巾上画两笔。画到谁，谁就可以带走。',trait:'humor',color:'#b9914d',gender:'female'},
  {id:'chen',name:'陈恺',ageOffset:3,title:'咖啡店店长',district:'anfu',role:'romance',description:'六点半开门，休息日只想吃一碗辣肉面。',trait:'freedom',color:'#81725a',gender:'male'},
  {id:'qiao',name:'乔敏',ageOffset:1,title:'金融分析师',district:'lujiazui',role:'romance',description:'地铁上背完一章，出站才回微信。约饭给她留个准点。',trait:'ambition',color:'#8c6b88',gender:'female'},
  {id:'yang',name:'杨帆',ageOffset:2,title:'社会工作者',district:'people',role:'romance',description:'谁家漏水总先找他。回消息前，他会先把你的茶添满。',trait:'sincerity',color:'#71846a',gender:'male'},
  {id:'lu',name:'陆嘉',ageOffset:0,title:'乐手兼家教',district:'bund',role:'romance',description:'演完吃烧烤。要帮她卷线，长的放左边。',trait:'freedom',color:'#a05d55',gender:'female'},
  {id:'he',name:'何亮',ageOffset:4,title:'餐饮创业者',district:'xinzhuang',role:'romance',description:'端菜前先问要不要醋。说洗碗免单的时候，手上已经拿着围裙。',trait:'humor',color:'#a87f58',gender:'male'},
  {id:'aunt',name:'汪阿姨',ageOffset:35,title:'相亲角热心人',district:'people',role:'mentor',description:'嘴上查户口，手里却给每个年轻人留了颗糖。',trait:'security',color:'#985c5a',gender:'female'},
  {id:'uncle',name:'顾爷叔',ageOffset:38,title:'退休机修师',district:'people',role:'mentor',description:'认得旧厂房，也愿意学新手机。棋输了会说风太大。',trait:'humor',color:'#65776b',gender:'male'},
  {id:'mother',name:'老妈',ageOffset:28,title:'永远在线的家人',district:'xinzhuang',role:'family',description:'消息开头是吃了伐，结尾常常是别太累。',trait:'security',color:'#aa7a6b',gender:'female'},
  {id:'father',name:'老爸',ageOffset:31,title:'不太会表达的家人',district:'xinzhuang',role:'family',description:'关心都藏在转发和工具箱里。',trait:'sincerity',color:'#768481',gender:'male'},
  {id:'mao',name:'毛小毛',ageOffset:0,title:'第一任室友',district:'xinzhuang',role:'friend',description:'锅碗共享，工资保密，能在你崩溃前先煮好一锅面。',trait:'humor',color:'#b4975f',gender:'male'},
  {id:'tang',name:'唐圆',ageOffset:1,title:'同届毕业生',district:'people',role:'friend',description:'朋友圈很少更新，机会来了总会记得转给你。',trait:'sincerity',color:'#917d98',gender:'female'},
  {id:'gao',name:'高原',ageOffset:5,title:'前同事',district:'lujiazui',role:'rival',description:'不讨厌输，讨厌别人把抢功说成团队合作。',trait:'ambition',color:'#737d93',gender:'male'},
  {id:'boss',name:'沈经理',ageOffset:12,title:'部门负责人',district:'lujiazui',role:'rival',description:'每次说最后改一版，眼神都很诚恳。',trait:'ambition',color:'#75776b',gender:'female'},
  {id:'fang',name:'方姐',ageOffset:15,title:'租房经纪人',district:'xinzhuang',role:'friend',description:'见过太多刚来的人。忙归忙，坏合同会替你划出来。',trait:'security',color:'#a17f58',gender:'female'},
  {id:'wu',name:'吴师傅',ageOffset:20,title:'早餐摊主',district:'xinzhuang',role:'mentor',description:'听过的创业计划比投资人多，最看重有没有回头客。',trait:'sincerity',color:'#a16e51',gender:'male'},
  {id:'yu',name:'余老师',ageOffset:18,title:'夜校讲师',district:'people',role:'mentor',description:'先让人敢问问题，再慢慢讲明白答案。',trait:'freedom',color:'#6c8a83',gender:'female'},
  {id:'fei',name:'费启',ageOffset:4,title:'社交局常客',district:'anfu',role:'rival',description:'认识很多主理人，偶尔忘了店里还有顾客。',trait:'ambition',color:'#987570',gender:'male'},
  {id:'yan',name:'严可',ageOffset:2,title:'护士',district:'bund',role:'friend',description:'夜班结束只想晒晒太阳，不想听成功学。',trait:'security',color:'#6b8f88',gender:'female'},
  {id:'sun',name:'孙阿宝',ageOffset:3,title:'自由摄影师',district:'bund',role:'friend',description:'器材不顶配，但每张照片里都有人。',trait:'freedom',color:'#8d845a',gender:'male'},
  {id:'qi',name:'祁清',ageOffset:6,title:'产品设计师',district:'zhangjiang',role:'friend',description:'能把复杂需求画成一张纸，也会直接说这事做不完。',trait:'sincerity',color:'#777f9b',gender:'female'},
  {id:'song',name:'宋奶奶',ageOffset:45,title:'弄堂老住户',district:'xinzhuang',role:'mentor',description:'记性有时不好，谁帮过她却从来不会忘。',trait:'humor',color:'#967e86',gender:'female'},
];

export function castTitle(person: CastMember, age: number) {
 return person.id === 'tang' && age >= 32 ? '街坊活动室志愿者' : person.title;
}

const card = (slot:OriginSlot,id:string,name:string,rarity:OriginCard['rarity'],subtitle:string,description:string,tag:string,accent:string,effect:OriginCard['effect']):OriginCard=>({slot,id,name,rarity,subtitle,description,tag,accent,effect});
export const ORIGIN_POOLS: Record<OriginSlot,OriginCard[]> = {
 '出身':[
  card('出身','born-rich','富二代','SSR','起跑线是地下车库','家里转了钱，备注是来公司上班。','家里有人','#ad8150',{cash:380000,face:18,network:15,setFlags:['family_rich']}),
  card('出身','born-local','弄堂小囡','SR','邻居比导航好用','认得邻居的猫，也躲不过邻居的问候。','本地熟人','#687b66',{cash:18000,network:20,setFlags:['local']}),
  card('出身','born-migrant','沪漂毕业生','R','一个箱子，两万块钱','地图还没认全，招聘软件已经刷熟了。','从零开局','#62838b',{cash:12000,spirit:14,skill:5,setFlags:['new_arrival']}),
  card('出身','born-scholar','奖学金常客','SR','绩点够高，工资另谈','成绩单够漂亮，第一次谈工资还是手心出汗。','学习快','#756f92',{cash:18000,skill:24,face:-7,setFlags:['scholar']}),
  card('出身','born-suburb','郊区通勤王','R','闹钟比全家都早','地铁上能补觉、背单词，还能认出每个急刹。','耐力好','#8c8a57',{cash:16000,health:12,skill:7,setFlags:['commuter']}),
  card('出身','born-return','海归待业中','SR','时差倒好了，工作还没','外语流利，回家被问工作时只会微笑。','跨文化','#9b796a',{cash:50000,skill:16,face:8,spirit:-8,setFlags:['returnee']}),
  card('出身','born-trade','小店接班人','R','会算毛利，不会叫融资','家里说店以后给你。你想先看看别的路。','生意经','#a38256',{cash:30000,skill:10,network:10,setFlags:['shop_family']}),
  card('出身','born-artist','艺考幸存者','R','作品集比行李箱重','审美在线，余额经常离线。','有作品','#9a6e67',{cash:8000,skill:18,spirit:8,setFlags:['artist']}),
 ],
 '家底':[
  card('家底','fund-home','家里有套房','SSR','房产证在老妈抽屉里','房子不用租，家庭群可没有退群键。','有房可住','#b18b53',{cash:20000,housing:3,network:5,setFlags:['own_home']}),
  card('家底','fund-frozen','副卡被冻结','SR','余额不等于可用余额','家里说，先证明你能养活自己。','钱有条件','#93675d',{cash:-10000,spirit:12,setFlags:['card_frozen']}),
  card('家底','fund-savings','三万元存款','R','银行卡里还有三万','够你缓一缓，缓多久要自己算。','小有积蓄','#73876c',{cash:30000}),
  card('家底','fund-debt','背着助学债','N','毕业证和还款表一起到','毕业证领到了，还款提醒也准时到了。','还要还债','#7e8592',{cash:-6000,skill:12,spirit:8,setFlags:['student_debt']}),
  card('家底','fund-room','亲戚空房间','R','便宜，但有一点热闹','租金不贵，晚归要经过三次关心。','低房租','#897b62',{cash:10000,housing:0,network:8,setFlags:['relative_room']}),
  card('家底','fund-plain','普通家庭托底','R','月底没钱可以打电话','老妈说撑不住就回来，房间没动过。','有人接住','#ae7f69',{cash:16000,spirit:14,setFlags:['family_support']}),
  card('家底','fund-lucky','旧藏意外升值','SR','小时候乱买的，长大救命','别急着叫投资眼光，先找个靠谱买家。','一笔活钱','#8f7851',{cash:80000,face:5,setFlags:['lucky_collection']}),
  card('家底','fund-alone','靠自己攒的钱','R','一万八，自己攒的','账户余额一万八。再少一块都得问你。','自主权','#638582',{cash:18000,spirit:18,network:-5,setFlags:['self_made']}),
 ],
 '天赋':[
  card('天赋','talent-mouth','嘴上有点东西','SR','尴尬到你这里会拐弯','迟到半小时，能聊到对方忘了看表。','会说话','#a56b55',{face:22,network:10,setFlags:['silver_tongue']}),
  card('天赋','talent-code','动手能力强','SR','比起解释，你先做一个','打印机坏了找你，网页打不开也找你。','解决问题','#5f8289',{skill:24,health:5,setFlags:['maker']}),
  card('天赋','talent-listen','听得进人话','R','记得住别人说过什么','朋友上个月说不吃香菜，你这次还记得。','会倾听','#7f8b72',{network:15,trust:8,setFlags:['listener']}),
  card('天赋','talent-fit','充电特别快','R','睡一觉，又能再来','体力好是本钱，别全拿去加班。','好体质','#8b975e',{health:24,spirit:8,setFlags:['resilient']}),
  card('天赋','talent-taste','审美太在线','SR','看一眼就知道哪里不对','也可能一眼看中超预算的那件。','有审美','#98788a',{skill:16,face:15,setFlags:['good_taste']}),
  card('天赋','talent-count','账算得明白','R','小数点不会骗你','你知道便宜和划算不是一回事。','懂预算','#827b51',{cash:8000,skill:14,setFlags:['budget_mind']}),
  card('天赋','talent-kind','能把人叫齐','SR','群里发话，总有人回','群里喊一声吃夜宵，十分钟凑出一桌。','有人缘','#9c7d59',{network:24,setFlags:['connector']}),
  card('天赋','talent-calm','关键时刻不慌','R','出事先把水关了','别人还在猜责任，你已经找到总阀。','稳得住','#69827b',{spirit:20,health:8,setFlags:['calm']}),
 ],
 '牵绊':[
  card('牵绊','tie-care','家里需要照护','R','医院挂号你最熟','家里看病、取药，排班表上得给自己留空。','家庭责任','#a17b69',{cash:-4000,network:10,setFlags:['care_family']}),
  card('牵绊','tie-demand','爸妈规划大师','SR','你的履历，他们有下一版','每次视频通话都像开季度会议。','期待很满','#8e736f',{cash:18000,spirit:-10,setFlags:['family_pressure']}),
  card('牵绊','tie-friend','有个靠谱发小','R','一句出来，真的会出来','他不一定懂你在忙什么，但记得你爱吃什么。','老朋友','#77896c',{network:18,spirit:8,setFlags:['old_friend']}),
  card('牵绊','tie-pet','家有一只猫','R','下班有人等，房租另说','下班一开门，它先看你，再看空碗。','有猫的人','#a28d6c',{cash:-3000,spirit:15,setFlags:['cat']}),
  card('牵绊','tie-work','家族生意有坑','SR','周末回家，顺便开会','你想出去闯，家里正好缺一个会做表的人。','隐形加班','#8f7756',{cash:22000,skill:8,spirit:-8,setFlags:['family_business']}),
  card('牵绊','tie-partner','异地对象在线','R','消息很多，见面很少','每天聊到没电，见面还要先抢高铁票。','远方有人','#9b7482',{network:8,spirit:5,setFlags:['long_distance']}),
  card('牵绊','tie-free','家里很开明','SR','你决定，想好就行','家里只问钱够不够，不替你填志愿。','自己决定','#75898c',{spirit:20,setFlags:['open_family']}),
  card('牵绊','tie-neighbor','邻里都认得你','R','谁家灯坏了，会敲你门','有点忙，但回家路上总有人招呼。','社区熟脸','#8d8e66',{network:20,health:-3,setFlags:['community_root']}),
 ],
 '秘密':[
  card('秘密','secret-title','履历有一行水分','SR','字是真的，意思略微放大','每次别人问细节，你就很想换个话题。','待核实','#ad6f59',{face:15,skill:-5,setFlags:['cv_lie']}),
  card('秘密','secret-shy','面试就紧张','R','会做，讲不出有多会','练习能救你，装镇定有时也能顶一会儿。','需要热身','#7c8598',{skill:12,face:-12,setFlags:['interview_shy']}),
  card('秘密','secret-dream','想偷偷转行','R','招聘软件偷偷换了行业','白天做报表，晚上偷偷学剪片。','另有打算','#8c7b9a',{spirit:12,skill:8,setFlags:['career_dream']}),
  card('秘密','secret-poor','朋友圈很有钱','SR','镜头外，正在算优惠券','照片里端着香槟，拍完赶末班地铁。','人设负担','#a48061',{cash:-5000,face:20,setFlags:['rich_persona']}),
  card('秘密','secret-money','其实存了不少','SR','旧外套里，余额挺新','出去吃饭只点套餐，卡里悄悄躺着七万。','低调存款','#71896c',{cash:70000,face:-6,setFlags:['quiet_saver']}),
  card('秘密','secret-talent','藏着一个拿手活','R','同事还没见过你上台','年会一开嗓，同事的筷子全停了。','隐藏技能','#a47570',{skill:15,spirit:10,setFlags:['hidden_talent']}),
  card('秘密','secret-local','上海话讲得磕绊','N','本地人，也不是语音包','你听得懂爷叔，爷叔未必听得惯你。','洋泾浜','#778782',{face:-6,spirit:10,setFlags:['dialect_learner']}),
  card('秘密','secret-kind','悄悄帮过一个人','SSR','名字没留，事情有人记得','很多年后，有人可能认出你。','善意伏笔','#ac915c',{network:15,spirit:8,setFlags:['quiet_kindness']}),
 ],
};

export const CAREERS: Career[] = [
 {id:'creative',name:'创意与设计',entry:'设计助理',salary:7600,ranks:['设计助理','独立设计师','创意负责人','合伙人'],thresholds:[0,35,60,82],color:'#a16c5b',description:'改到最终版，甲方想看第一版。'},
 {id:'tech',name:'技术研发',entry:'初级工程师',salary:10500,ranks:['初级工程师','资深工程师','技术负责人','首席工程师'],thresholds:[0,40,65,87],color:'#5e8790',description:'白天写代码，晚上查谁写的代码。'},
 {id:'finance',name:'金融与咨询',entry:'分析助理',salary:10000,ranks:['分析助理','项目顾问','业务总监','管理合伙人'],thresholds:[0,40,67,88],color:'#677d83',description:'Excel开十八个窗口，午饭开一个饭团。'},
 {id:'service',name:'城市服务',entry:'门店伙伴',salary:6500,ranks:['门店伙伴','值班主管','区域店长','运营负责人'],thresholds:[0,30,55,78],color:'#8c9264',description:'顾客说找你们领导，你就是领导。'},
 {id:'public',name:'公共与社区',entry:'项目专员',salary:7200,ranks:['项目专员','项目骨干','社区负责人','专业顾问'],thresholds:[0,32,57,80],color:'#6b8872',description:'阿姨的事办完了，爷叔又来了。'},
 {id:'freelance',name:'自由职业',entry:'接单新人',salary:6800,ranks:['接单新人','稳定合作方','独立工作室','行业专家'],thresholds:[0,33,58,83],color:'#8e7692',description:'上班时间自由，催款时间全天。'},
 {id:'business',name:'小店经营',entry:'小店主',salary:7000,ranks:['小店主','回头客熟店','双店经营者','口碑品牌主理人'],thresholds:[0,35,60,85],color:'#a18a5f',description:'白天当主理人，晚上自己拖地。'},
 {id:'trade',name:'销售与贸易',entry:'业务助理',salary:8000,ranks:['业务助理','客户经理','业务合伙人','独立经营者'],thresholds:[0,35,62,84],color:'#99775d',description:'客户说下周签，下周又说下周。'},
];

export const GOALS: Goal[] = [
 {id:'wealth',name:'攒点钞票',subtitle:'先把退路攒出来',description:'多挣钱，少破财，年底看看账户还剩多少。'},
 {id:'love',name:'谈场恋爱',subtitle:'认真喜欢，慢慢兑现',description:'约会、相处，看看最后能不能一起过。'},
 {id:'craft',name:'混出名堂',subtitle:'做出自己认的东西',description:'学点东西，把职称和工资往上挪一挪。'},
 {id:'free',name:'过得自在',subtitle:'不再解释为什么',description:'少熬夜，少受气，给自己留点时间。'},
 {id:'community',name:'交几个朋友',subtitle:'走到哪都有人招呼',description:'串串门，搭把手，混成街坊熟脸。'},
];
