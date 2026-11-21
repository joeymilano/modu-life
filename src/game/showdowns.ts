import type { CampaignRoute } from './campaignScript';

export const SHOWDOWN_AGES = [18, 23, 38, 57] as const;
export type ShowdownAge = typeof SHOWDOWN_AGES[number];
export const SHOWDOWN_ROUTES = ['arrival', 'worker', 'heir', 'system'] as const;
export const SHOWDOWN_NAMES: Record<CampaignRoute, string> = {
 arrival: '初到上海', worker: '日结工', heir: '顶级富二代', system: '系统流',
};
export type Move = 'proof' | 'verify' | 'misread' | 'promise' | 'recruit' | 'backup' | 'expose' | 'rally' | 'walk';
type SetupMove = Exclude<Move, 'expose' | 'rally' | 'walk'>;
type FinishMove = Exclude<Move, SetupMove>;
export type Verdict = 'win' | 'partial' | 'loss';

interface Cast {
 rival: string;
 ally: string;
 broker: string;
}
export const SHOWDOWN_CAST: Record<CampaignRoute, Cast> = {
 arrival: {rival:'费启', ally:'毛小毛', broker:'陆嘉'},
 worker: {rival:'赵正', ally:'吴师傅', broker:'老孙'},
 heir: {rival:'周骁', ally:'沈经理', broker:'方岚'},
 system: {rival:'顾桥', ally:'工程师周闻', broker:'交付人许舟'},
};
interface Scene {
 title: string;
 intro: string;
 goal: string;
 /** Physical things in play, in the same order as their action buttons. */
 proof: string;
 verify: string;
 promise: string;
 recruit: string;
 backup: string;
 expose: string;
 rally: string;
 win: string;
 partial: string;
 loss: string;
}

const script: Record<CampaignRoute, Record<ShowdownAge, Scene>> = {
 arrival: {
  18: {title:'开门前，票卖了两遍', intro:'费启把自家海报直接盖在你们门上，票口摆开：「同价，我送酒。」陆嘉试完音出来，门口两个人捏着同一个座号吵起来。今晚这一场，谁开门谁就是主办。', goal:'带观众进场，拿下首演',
   proof:'找房东拿原订场单', verify:'把两摞票按出票时间分开', promise:'答应毛小毛，退票从门票里先扣', recruit:'请陆嘉把乐队叫回来', backup:'让毛小毛开隔壁的门',
   expose:'当众验票，撤掉费启的海报', rally:'带上乐队，让观众从侧门进', win:'出票时间一亮，重号的那摞没人再抢。第一首歌响了，门口贴回你们的名字——费启的海报，被他自己的票客踩在了脚下。', partial:'陆嘉唱完了。剩下几张重号票，散场后你得一张张退——名字保住了，账要认。', loss:'费启开了门。陆嘉拔掉自己的线，把下一次排练地址发给你：「场子是他的，歌是阿拉的。」'},
  23: {title:'周五晚八点，谁的场', intro:'费启把半年的周五全印进自己的宣传单，还在群里放话：「预约簿？写字谁不会。」房东两边都不想得罪，沉默着。毛小毛把预约簿翻回上一页，拍在桌上。', goal:'保住整季的周五档',
   proof:'带走签过字的预约联', verify:'请房东核对日期和定金', promise:'给毛小毛留一晚自己排节目', recruit:'让陆嘉带原来的三支乐队来', backup:'借隔壁的周六场',
   expose:'按原约把周五排期上墙', rally:'带三支乐队签联合排期', win:'定金流水一对，房东把周五的钥匙交给你。费启那句「写字谁不会」，成了群里的笑话——他先走了，一屋子海报一张没带。', partial:'你拿到周六的短场。周五，还要再抢——但乐队跟你签了下一季。', loss:'周五全归费启。陆嘉把她自己的节目单留给你：「排期会被抢走，节目抢不走。」'},
  38: {title:'有人在量你的招牌', intro:'费启绕过你直接谈了转让，买家连门头尺寸都量上了。费启抱着胳膊：「谈生意是男人的事，你们排练的让一让。」陆嘉还在里面带人试音，音箱没关。', goal:'保住演出经营权',
   proof:'找房东拿原租约', verify:'核对转让书上的授权页', promise:'答应毛小毛保住店员的班', recruit:'请陆嘉带演出方来签确认', backup:'预留轮渡口的小剧场',
   expose:'请买家当面撤掉场地那一页', rally:'让演出方集体转签', win:'授权页空着的那个签字栏，让买家收回了卷尺。「这场演出的主人还没签字。」今晚照常开演，买家临走问了一句：能买张票伐？', partial:'招牌没留下，节目转去轮渡口——台还在，场就还在。', loss:'费启交了钥匙。陆嘉最后一个下台，自己把音箱抱了出来：「这个，他买不走。」'},
  57: {title:'最后一晚，钥匙给谁', intro:'费启带着收购合同坐在门口，三十多年了，他还想赢最后一次：「价位我出，牌子归我。」陆嘉把年轻乐手领到你们中间。毛小毛问：还照老样子排伐？', goal:'决定下一任主理人',
   proof:'取出当年的共同经营约定', verify:'核对乐手和店员的续约签名', rally:'把排期和钥匙交给新团队', expose:'让收购方按旧约退出',
   promise:'给毛小毛保留公共场次', recruit:'请陆嘉带新主理人上台', backup:'把备用演出合同交给年轻人',
   win:'续约签名一页页翻过去，收购方按了旧约退出。台上有人接过钥匙，你给自己留了第一排一张票——这张票，费启出多少价都不卖。', partial:'你留下一半场次。年轻人的头一场还是这里，牌子先不交。', loss:'费启签了收购书。年轻乐手在门外问：下周还来看阿拉伐？你说来——看的是人，不是他的场子。'},
 },
 worker: {
  18: {title:'最后一班，少算七小时', intro:'赵正把没签字的工时单从窗口推进来：「跨零点的算昨天，昨天结过了——不服去告。」司机老孙已经打着火，吴师傅往你手里塞了一张复写联，压低声音：白纸黑字，就在这页。', goal:'结清这班工钱或拿到下一班',
   proof:'留下门禁原始工时', verify:'把跨零点那段跟车单对齐', promise:'答应吴师傅，先结全班的钱', recruit:'请老孙把当班的人叫齐', backup:'问西门还有没有班车',
   expose:'让会计按原记录重结', rally:'带齐一车人签下一班', win:'门禁时间和跟车单一对，会计把那行划掉了：「跨零点，算工时。」车没空着走，赵正的窗口再没开过。吴师傅让你收好新名单——下回还用。', partial:'先补了一部分。吴师傅把欠的那页折了个角：「留着，角没展平，账就没完。」', loss:'车开了，工资栏还空着。吴师傅替你存下那张复写联：「纸在，钱就在。他会懂这个道理的。」'},
  23: {title:'班表上少了三个名字', intro:'赵正拿着新班表进调度室，三个老班的名字划掉，换上自家兄弟，还撂话：「谁有意见，连班一起交出来。」老孙捏着笔没签。吴师傅把第一车的钥匙放在桌上，看着你。', goal:'给原班人马抢回发车权',
   proof:'取上周签过字的旧班表', verify:'让调度核过两车的交接时间', promise:'给吴师傅留老班组的座位', recruit:'按站点把老孙的一车人排齐', backup:'留一台六点二十发的车',
   expose:'让调度当面按原单排车', rally:'把名单和钥匙递给老孙', win:'交接时间一对，新表根本排不通。调度当着赵正的面按原单排车，老孙打了两声喇叭——他安插的人，还在等调度回电话。', partial:'一半人留了下来。吴师傅把空位先写成「待补」两个字，贴在赵正看得见的地方。', loss:'赵正的人上了第一车。吴师傅把旧名单揣进兜里：「车能换人，路换不掉。」'},
  38: {title:'新仓的第一车', intro:'旧仓关门，赵正给财务递了张合并工时——两趟他没跑过的车，全算在他那组头上。他还笑着拍老孙的车门：「数据时代，谁跑的不重要，系统里是谁的就是谁的。」', goal:'保住班费和新仓的夜线',
   proof:'从老孙车里取出行车联', verify:'让财务逐车勾掉冒领班次', promise:'给吴师傅先结夜班欠款', recruit:'排齐老孙的卸货组和发车组', backup:'在西门加一趟短驳',
   expose:'把实际工时和假汇总一起递上去', rally:'带原班组跑新仓首趟', win:'行车联一张张摊开，同编号的两趟车对不上号。财务逐车勾掉冒领班次，第一车准点卸完，补款到账——「系统里是谁的」，从今天改成了「是谁跑的」。', partial:'账结了一半，短驳还能跑。老孙把那几联贴在驾驶室里。', loss:'赵正接了新仓。司机仍把少算的那几趟行车联留在车里——纸在，账迟早要认。'},
  57: {title:'下一把车钥匙', intro:'赵正回来收最后一条线，合同推到桌子中间，给他侄子留好了签字栏：「时代变了，老师傅，让位吧。」吴师傅没说话，只抬手把车钥匙从桌边往回拨了一寸。', goal:'让这条线交到班组手里',
   proof:'取出班组历年的接班约定', verify:'让车队核准名单和资质', promise:'把吴师傅带过的新人编进表', recruit:'让老孙找齐接班的司机', backup:'留一条不并线的短驳',
   expose:'让车队按原约签给班组', rally:'把钥匙和头班名单交给接班人', win:'接班约定翻到最后一页，夜间交接资格那栏，小杨盖着章，赵正侄子那栏空着。车队按原约签给班组——「让位」这两个字，他留给了自己。', partial:'你保住了短驳。班组有一条路能接着跑，灯火不熄。', loss:'合同归赵正。吴师傅把旧表交给你，说明早一起去吃面——输一场不输规矩，面照吃。'},
 },
 heir: {
  18: {title:'西岸首宴，谁坐主位', intro:'周骁已经在台上举杯谢赞助商，座牌换成了鎏金的：「主位的人正在路上——某位买不起请帖的，就别等了。」满堂目光扫过来。沈经理拦下你要换座牌的手。母亲把未拆的签约袋递到你怀里，只说了两个字：上屏。', goal:'拿回主办权和赞助',
   proof:'拆开母亲带来的签约原件', verify:'把原件和订金一并交给赞助方', promise:'先承诺结清沈经理的团队尾款', recruit:'请方岚把赞助人带到临江桌', backup:'让沈经理打开临江包厢',
   expose:'切大屏，亮出原签约人', rally:'把话筒拿到临江桌，自己开席', win:'大屏切出原件，产权栏的名字亮在全场背后。赞助人端着杯子换了桌，周骁捏着话筒站在「买不起请帖」那句话里。沈经理小跑过来问：主位的名字，怎么写？', partial:'临江桌开了席，赞助合同还在周骁手上——但全场的敬酒，都往你这桌来。', loss:'周骁签走赞助。沈经理把你原订的包厢钥匙塞回你手里：「原件还在，就还有下一场。」'},
  23: {title:'谁签西岸的独家', intro:'周骁把同一个档期卖给两家，收了两份定金，还各自放话「独家」。两家的人今天同时到场。沈经理摆下两份价单不敢出声，方岚已经把其中一家请进了电梯。', goal:'拿到下季独家主办权',
   proof:'收好两份独家协议', verify:'请两家财务对同一档期', promise:'替沈经理保住团队的全年档期', recruit:'让方岚把两位签约人请到一起', backup:'另锁一处临江档期',
   expose:'让两家看原件，当面改签', rally:'带团队和赞助人换桌签新约', win:'两家财务当面一对——同一档期，两份「独家」。到账那份生效，周骁那份成了废纸，他收定金的手，这回伸不回来了。新合同落在你的桌上。', partial:'档期保住了。方岚让你月底前再给一份预算——盯着他的人，不止你一个。', loss:'周骁收走排期。沈经理带着还没签字的名单来找你：「名单在，场子就还能回来。」'},
  38: {title:'谁在卖你的会客厅', intro:'周骁背着大舅的信托把展厅和项目打包挂牌，买家问钥匙什么时候交。他当众摊牌：「这层楼迟早姓周，早交晚交的事。」沈经理把自己那串钥匙悄悄放回兜里——他还没决定帮谁。', goal:'留住会客厅和项目',
   proof:'拿出会客厅经营权原件', verify:'请买方核实挂牌里那页授权', promise:'给沈经理签团队留任承诺', recruit:'请方岚带签约客户过来', backup:'开备用场地接待到场客户',
   expose:'让买家撤掉你的资产', rally:'带客户转场，签自己的排期', win:'授权页上没有你的签字，买家当场撤单：「我不买有争议的楼。」挂牌文件撤了一页，签约结束，沈经理开了你那瓶酒——钥匙，他早就想还了。', partial:'项目签了，场地仍得谈。沈经理先把下周的门卡给你：「这扇门，我先认原主人。」', loss:'周骁带买方走正门。方岚从侧门出来，把她那份客户表留给你：「客户认人。楼会回来的。」'},
  57: {title:'今晚以后，谁做东', intro:'周骁把「新主理人」四个字写在收购书上，笔都替对方备好了——这是他最后一场。母亲把筷子放下。沈经理已经领着年轻团队站在门口，等一句话。', goal:'选定西岸会客厅的下一任',
   proof:'请财务带来当年的经营权协议', verify:'把交接名单和签字权逐项核过', promise:'给沈经理留团队股份', recruit:'请方岚叫下一任主理人坐下', backup:'留一桌长期交给独立团队',
   expose:'当席签下自己的交接名单', rally:'让下一任先开席，现场完成交接', win:'章程翻到那页：经营交接由在任主理人签字。周骁有报价，没有签名——他的收购书递了三十年，还是差这一个名字。主桌换了人，你坐到靠窗那把椅子上，母亲把小排转给你。', partial:'团队接了一层。以后谁管整栋，还得再谈——但姓什么，定下了。', loss:'周骁接过主位。沈经理问你还留不留靠窗那桌。你留了——位置在，就还坐得回来。'},
 },
 system: {
  18: {title:'交付只认一个名字', intro:'两张订单同时亮起，收款人一栏已被顾桥填好自己的名字。他冲你晃了晃手机：「先到先得，系统教的。」许舟抱着货站在中间，只说了一句：我只交给认得出原单的人。', goal:'把第一份长期结算凭证拿到手',
   proof:'调出首单签收存根', verify:'跟周闻核对收款人和提交时间', promise:'答应周闻把交付人的那份写进单', recruit:'请许舟把签收人带上楼', backup:'存一份离线签收单',
   expose:'按原派单提交结算', rally:'让交付人共同签署新凭证', win:'签收时间一秒不差——你的凭证先出七分钟。结算进了你的账户，顾桥的界面还停在「等待确认」。他说的「先到先得」，系统替你应了。', partial:'双方分开结款。你的那一联凭证还在，下一单还认它。', loss:'顾桥先落了款。许舟把离线地址写在纸背面：「线上归他，交情归你。」'},
  23: {title:'名单上多了一个收款人', intro:'顾桥把共同账户的申请按在桌上，笑得客气：「合作嘛，六四分——我六，你四，别嫌少。」许舟凑近看了半天，问了一句：这里面怎么连阿拉做交付的名字都没有？', goal:'拿到独立的任务入口',
   proof:'调首单的原始签名', verify:'让周闻核验新加的共同账户', promise:'给交付人单列佣金', recruit:'请许舟找齐实际交付人', backup:'留一个可离线签收的入口',
   expose:'用首单原签名拒绝绑定', rally:'按交付名单重开收款入口', win:'首单存根一调——共同账户是交付之后七分钟才加的。系统把共同账户划掉，新入口只认你的签名。顾桥的「六四分」，少的那四成里没有一分是他的。', partial:'旧账户还在，但你留住了一条独立接单路径——路是自己的，就不怕绕。', loss:'顾桥拿到共同收款权。周闻把日志地址发给你：「日志删不掉，账就在。」'},
  38: {title:'迁移前的最后三笔', intro:'顾桥撬开旧入口，三笔钱正往同一个账号转。他隔着屏幕摊手：「迁移嘛，总有人快，总有人慢——你猜谁慢？」周闻指着进度条，让你先确定哪些真的交过货。', goal:'迁走自己的订单和结算权',
   proof:'取三笔订单的真实交付记录', verify:'让周闻逐笔比对接单号', rally:'带签过字的订单启用新入口', expose:'拦下假订单，按原账迁移',
   promise:'补给交付人旧账的分成', recruit:'请许舟让收货人逐笔签回', backup:'导出一份离线任务队列',
   win:'交付记录 A18 亮出来，排队清单里的 A16 根本没签过收。三笔款各自到账，顾桥的旧链接先失效了——「快慢」这场，输给了一页签收联。', partial:'钱只找回来一部分，离线队列还接得到下一单。', loss:'旧入口关停。许舟给你写了几个还能联系上的号码：「入口会关，人不会。」'},
  57: {title:'最后一单，交给谁', intro:'顾桥带着空白交接单坐在便利店门口，账号停了，当年围着他转的人一个没来。他把纸推过来：「帮我签了——钱你拿。」许舟把纸按住。周闻说，现在签下去，这个入口以后只认这一份。', goal:'决定下一任接单人',
   proof:'拿来第一次交付的原凭证', verify:'结清旧入口最后的未付款', promise:'给周闻留公开查询和更正权', recruit:'请许舟带下一个接单人来', backup:'把离线联系单留在柜台',
   expose:'清账后亲手签交接', rally:'让下一个接单人当场签名', win:'旧账逐笔结清，最后一笔对应许舟的签收联——空白编号那一栏，谁也填不了。交接签好，柜台上另一部手机亮了。顾桥看了很久：「原来单是这么结的。」', partial:'原入口熄了，接单人的号码还挂在便利店——灯还亮着，就还有人接单。', loss:'顾桥签走旧入口。你把自己的号码写在交付人那一联上——他还记得这个号码是谁先挣来的。'},
 },
};

const checks: Record<CampaignRoute, Record<ShowdownAge, readonly [string, string, string]>> = {
 arrival: {
  18:['闸机还认原出票时间。C06 的两张票分别印于 18:20 和 19:54，后印的那张留着退款。','18:20 的 C06 留座','19:54 的 C06 留座'],
  23:['预约联写着周五 20:00，已付定金。费启的海报印的是周五 19:30。','把 20:00 写回周五','把 19:30 写回周五'],
  38:['租约写明「承租方单独签字」。转让页只有物业章，演出方的签字栏空着。','把空着的授权栏给买家看','请买家再看一眼物业章'],
  57:['共同经营约定要求在职成员签字。续约联上老场务和新乐手都签了，收购方的联只签了费启。','交在职成员签过的续约联','交费启签过的收购联'],
 },
 worker: {
  18:['门禁 18:02 入、次日 01:14 出。排班表写的是当日 18:02 至 24:00。','补上零点后的工时','把零点后的工时划掉'],
  23:['第一车 06:20 出发。新表把三个人排到了 06:35 才能交接的站点。','把 06:35 的三人调回原站点','按新表让三人 06:35 上第一车'],
  38:['尾号 307 的车只跑了两趟。赵正的第三趟跟第二趟用了同一个交接编号。','划掉重复交接号','把两趟都留在赵正的单上'],
  57:['这条夜线要求夜间交接资格。吴师傅的名单里，小杨那栏盖了章，赵正的侄子那栏还是空的。','把小杨列为夜线接班人','把赵正的侄子列为夜线接班人'],
 },
 heir: {
  18:['银行回单尾号 4921 和你原件的订金编号一致。周骁那份只有宴会确认号。','让赞助方对回单尾号 4921','让赞助方查宴会确认号'],
  23:['两份独家覆盖同一个周六。方岚说合同从到账生效。上午那家的订金到了，周骁那份没有回单。','把已经到账的合同递给双方','按周骁那份暂未到账的合同走'],
  38:['挂牌清单包括场地和活动排期。买方只拿到了活动排期授权，场地授权页没签。','保留排期，剔除场地一页','把两页作为同一份授权'],
  57:['章程规定经营交接由在任主理人签字。周骁有场地报价，没有在任主理人的签名。','要求核对主理人签名','按场地报价直接交接'],
 },
 system: {
  18:['签收记录在 23:11 完成，尾号 0816。顾桥的那份尾号 0818，23:18 才生成。','用 0816 的签收联结算','用 0818 的补录联结算'],
  23:['首单存根只绑定了实际交付人。共同账户在交付之后七分钟才被加进系统。','按交付时的单人收款签名','按事后生成的共同账户'],
  38:['交付记录有 A13、A15、A18。旧入口排队的是 A13、A15、A16。','把 A16 换成有签收的 A18','照旧入口清单迁移'],
  57:['交接要求旧账全部销掉。未付款那笔对应许舟的签收联，顾桥的单只写了空白编号。','按许舟的签收联结清尾款','按空白编号提交交接'],
 },
};

export interface Showdown {
 route: CampaignRoute;
 age: ShowdownAge;
 /** One entry per completed round. Replaying the entries reconstructs the scene. */
 moves: Move[];
 backup: boolean;
 angle?: 'terms' | 'floor';
 nineties?: boolean;
}
export interface ShowdownView {
 scene: Scene;
 cast: Cast;
 round: number;
 options: {id: Move; label: string; hint?: string}[];
 recent: string[];
 assets: string[];
 verdict?: Verdict;
 score?: number;
 scorecard?: {label: string; points: number}[];
 ally: boolean;
 reserve: boolean;
}

export function createShowdown(route: CampaignRoute, age: ShowdownAge, backup = false, angle?: Showdown['angle'], nineties = false): Showdown {
 return {route, age, moves: [], backup, angle, ...(nineties&&{nineties})};
}

export const showdownAftermath = (route:CampaignRoute,age:ShowdownAge,verdict:Verdict) => script[route][age][verdict];

export function showdownView({route, age, moves, backup, angle, nineties}: Showdown): ShowdownView {
 const written=script[route][age];
 const scene = nineties&&route==='heir' ? {...written,
  title:age===18?'锦江饭店，谁坐主位':'谁签下一季的独家',
  intro:age===18?'周骁已经拿起话筒在谢宾客。沈经理拦下换座牌的人，母亲把未拆的签约袋递给你。':written.intro,
  expose:age===18?'请经理念原件上的签约人':written.expose,
 } : nineties&&route==='system' ? {...written,
  intro:age===18?'机房的屏幕同时跳出两张订单。顾桥往收款栏填上了自己的名字。许舟把货放回柜台，要先看原单。':written.intro,
  win:age===18?'针式打印机吐出一张收款凭证。顾桥那台机器还在响。':written.win,
 } : written;
 const cast = SHOWDOWN_CAST[route];
 const [clue, correct, wrong] = checks[route][age];
 const {rival, ally, broker} = cast;
 let proof = false, verified = false, disputed = false, promise = false, joined = false, reserve = backup;
 let verdict: Verdict | undefined;
 let recent = angle === 'terms'
  ? [rival+'已经递出自己的报价。'+broker+'要看原件。']
  : angle === 'floor' ? [rival+'把门口的人叫到了自己那边。'+ally+'还没答应。'] : [];
 for (const move of moves) {
  switch (move) {
   case 'proof':
    proof = true;
    recent = [scene.proof+'。', rival+(angle === 'terms'?'催对方先签，要求原件也得当场核验。':'叫人收走原先约好的公开位置。'), clue];
    break;
   case 'verify':
    verified = true;
    recent = [scene.verify+'。', rival+'拿出自己那份副本。', broker+'把两份并排摆好，指着只有原件上才有的签字。'];
    break;
   case 'misread':
    disputed = true;
    recent = [wrong+'。',rival+'顺手把你选的那一联压进自己的文件夹。',broker+'收回了笔。「这个我没法签。」'];
    break;
   case 'promise':
    promise = true;
    recent = [scene.promise+'。', rival+'出价让'+ally+'先走。', ally+'让他等一等，转头问你还差谁。'];
    break;
   case 'recruit':
    joined = promise || reserve;
    recent = [scene.recruit+'。', rival+'把条件加了一项。', joined
     ? ally+'把手里的安排递给'+broker+'。'+broker+'站到了你这边。'
     : ally+'收起了名单。'+broker+'说，先把人的安排落实，再喊我。'];
    break;
   case 'backup':
    reserve = true;
    recent = [scene.backup+'。', rival+'抢下原来的位置。', ally+'把新地址发给'+broker+'，后者回了句「收到」。'];
    break;
   case 'expose':
    verdict = proof && (verified || (reserve && !disputed && angle !== 'terms')) ? 'win' : proof || reserve ? 'partial' : 'loss';
    recent = [scene.expose+'。', rival+'要求等他那份也摆出来。', scene[verdict]];
    break;
   case 'rally':
    verdict = joined ? 'win' : reserve || promise ? 'partial' : 'loss';
    recent = [scene.rally+'。', rival+'叫住走到一半的人。', scene[verdict]];
    break;
   case 'walk':
    verdict = reserve ? 'partial' : 'loss';
    recent = [rival+'抢先落笔。', scene[verdict]];
    break;
  }
 }
 const round = moves.length + 1;
 const labels: Record<SetupMove, string> = {proof:scene.proof, verify:correct, misread:wrong, promise:scene.promise, recruit:scene.recruit, backup:scene.backup};
 const setup = (Object.keys(labels) as SetupMove[]).filter(move => !moves.includes(move) && ((move !== 'verify' && move !== 'misread') || proof) && (move !== 'backup' || !reserve));
 if (proof && (SHOWDOWN_AGES.indexOf(age)%2===1 || angle==='floor')) {
  const a=setup.indexOf('verify'), b=setup.indexOf('misread');
  if(a>=0&&b>=0)[setup[a],setup[b]]=[setup[b],setup[a]];
 }
 const finish: Record<FinishMove, string> = {expose:scene.expose, rally:scene.rally, walk:reserve?'启用备用方案':'先保住手里的东西'};
 const hints: Record<Move, string> = {
  proof:'拿到原件', verify:'当场核验', misread:'当场核验', promise:'让'+ally+'有理由留下',
  recruit:promise||reserve?'争取'+broker:'对方要先看你的安排', backup:'留一条退路',
  expose:verified||(proof&&reserve&&!disputed&&angle!=='terms')?'条件齐了':'原件和公开核验条件还没凑齐',
  rally:joined?'有人会跟你走':'还没有人公开站在你这边',
  walk:reserve?'保住一部分':'这场让给对方',
 };
 const ids: Move[] = verdict ? [] : round < 3 ? setup : ['expose','rally','walk'];
 const assets = [proof&&'原件',verified&&'核验通过',promise&&'给'+ally+'的承诺',joined&&broker+'到场',reserve&&'备用方案'].filter((item):item is string=>Boolean(item));
 const scorecard = verdict && [
  {label:'主目标',points:verdict==='win'?60:verdict==='partial'?35:10},
  {label:'副目标 · 核验原件',points:verified?20:0},
  {label:'兑现承诺',points:promise&&joined&&verdict!=='loss'?15:0},
  {label:'备用方案',points:reserve?5:0},
 ];
 return {scene,cast,round,options:ids.map(id=>({id,label:id in labels?labels[id as SetupMove]:finish[id as FinishMove],hint:hints[id]})),
  recent,assets,verdict,scorecard,score:scorecard?.reduce((sum,item)=>sum+item.points,0),ally:joined,reserve};
}

export function playShowdown(showdown: Showdown, move: string): Showdown {
 const option = showdownView(showdown).options.find(item=>item.id===move);
 if (!option) throw new Error('这一步现在走不了。');
 return {...showdown,moves:[...showdown.moves,option.id]};
}

export function validateShowdown(raw: unknown): Showdown {
 if (!raw || typeof raw !== 'object') throw new Error('任务记录读不出来。');
 const {route,age,moves,backup,angle,nineties} = raw as Showdown;
 if (!SHOWDOWN_ROUTES.includes(route) || !SHOWDOWN_AGES.includes(age) || !Array.isArray(moves) || moves.length>3 ||
     typeof backup!=='boolean' || (nineties!==undefined&&typeof nineties!=='boolean') || (angle!==undefined&&angle!=='terms'&&angle!=='floor')) throw new Error('任务记录读不出来。');
 return moves.reduce((state,move)=>playShowdown(state,move),createShowdown(route,age,backup,angle,nineties));
}
