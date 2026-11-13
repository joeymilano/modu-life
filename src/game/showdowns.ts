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
  18: {title:'开门前，票卖了两遍', intro:'费启把自己的海报贴在你们的门上。陆嘉试完音出来，门口两个人手里捏着同一个座号。', goal:'带观众进场，拿下首演',
   proof:'找房东拿原订场单', verify:'把两摞票按出票时间分开', promise:'答应毛小毛，退票从门票里先扣', recruit:'请陆嘉把乐队叫回来', backup:'让毛小毛开隔壁的门',
   expose:'当众验票，撤掉费启的海报', rally:'带上乐队，让观众从侧门进', win:'第一首歌响了。门口贴的是你们的名字。', partial:'陆嘉唱完了。剩下几张重号票，散场后你得一张张退。', loss:'费启开了门。陆嘉拔掉自己的线，把下一次排练地址发给你。'},
  23: {title:'周五晚八点，谁的场', intro:'费启把半年的周五都印进宣传单。房东没说话，毛小毛把预约簿翻回上一页。', goal:'保住整季的周五档',
   proof:'带走签过字的预约联', verify:'请房东核对日期和定金', promise:'给毛小毛留一晚自己排节目', recruit:'让陆嘉带原来的三支乐队来', backup:'借隔壁的周六场',
   expose:'按原约把周五排期上墙', rally:'带三支乐队签联合排期', win:'房东把周五的钥匙交给你。费启先走了，海报一张没带。', partial:'你拿到了周六的短场。周五，还要再抢。', loss:'周五全归费启。陆嘉把她自己的节目单留给你。'},
  38: {title:'有人在量你的招牌', intro:'费启把场子写进转让书。买家连门头尺寸都量了，陆嘉还在里面带人试音。', goal:'保住演出经营权',
   proof:'找房东拿原租约', verify:'核对转让书上的授权页', promise:'答应毛小毛保住店员的班', recruit:'请陆嘉带演出方来签确认', backup:'预留轮渡口的小剧场',
   expose:'请买家当面撤掉场地那一页', rally:'让演出方集体转签', win:'卷尺收回去了。今晚的演出照常开，买家问能不能买张票。', partial:'招牌没留下，节目转去轮渡口。', loss:'费启交了钥匙。陆嘉最后一个下台，自己把音箱抱了出来。'},
  57: {title:'最后一晚，钥匙给谁', intro:'费启带着收购价坐在门口。陆嘉把年轻乐手领到你们中间。毛小毛问，还照老样子排吗？', goal:'决定下一任主理人',
   proof:'取出当年的共同经营约定', verify:'核对乐手和店员的续约签名', promise:'给毛小毛保留公共场次', recruit:'请陆嘉带新主理人上台', backup:'把备用演出合同交给年轻人',
   expose:'让收购方按旧约退出', rally:'把排期和钥匙交给新团队', win:'台上有人接过钥匙。你给自己留了第一排一张票。', partial:'你留下一半场次。年轻人的头一场还是这里。', loss:'费启签了收购书。年轻乐手在门外问你，下周还来看他们吗？'},
 },
 worker: {
  18: {title:'最后一班，少算七小时', intro:'赵正把没签字的工时单推进窗。司机老孙已经打着火，吴师傅往你手里塞了一张复写联。', goal:'结清这班工钱或拿到下一班',
   proof:'留下门禁原始工时', verify:'把跨零点那段跟车单对齐', promise:'答应吴师傅，先结全班的钱', recruit:'请老孙把当班的人叫齐', backup:'问西门还有没有班车',
   expose:'让会计按原记录重结', rally:'带齐一车人签下一班', win:'车没空着走。吴师傅让你把新名单收好，下回还用。', partial:'先补了一部分。吴师傅把欠的那页折了个角。', loss:'车开了，工资栏还空着。吴师傅替你存下那张复写联。'},
  23: {title:'班表上少了三个名字', intro:'赵正拿到了新班表，把三个人换成自家兄弟。老孙还没签。吴师傅把第一车的钥匙放在桌上。', goal:'给原班人马抢回发车权',
   proof:'取上周签过字的旧班表', verify:'让调度核过两车的交接时间', promise:'给吴师傅留老班组的座位', recruit:'按站点把老孙的一车人排齐', backup:'留一台六点二十发的车',
   expose:'让调度当面按原单排车', rally:'把名单和钥匙递给老孙', win:'老孙打了两声喇叭。赵正那组还在等调度回电话。', partial:'一半人留了下来。吴师傅把空位先写成待补。', loss:'赵正的人上了第一车。吴师傅把旧名单揣进兜里。'},
  38: {title:'新仓的第一车', intro:'旧仓关门，赵正给财务递了一张合并工时。老孙说里面有两趟他没跑过。', goal:'保住班费和新仓的夜线',
   proof:'从老孙车里取出行车联', verify:'让财务逐车勾掉冒领班次', promise:'给吴师傅先结夜班欠款', recruit:'排齐老孙的卸货组和发车组', backup:'在西门加一趟短驳',
   expose:'把实际工时和假汇总一起递上去', rally:'带原班组跑新仓首趟', win:'第一车准点卸完，补款也到了。门口挂上了你们的车牌号。', partial:'账结了一半，短驳还能跑。', loss:'赵正接了新仓。司机仍把少算的那几趟留在车里。'},
  57: {title:'下一把车钥匙', intro:'赵正回来收最后一条线，想让他侄子签。吴师傅抬手把钥匙从桌边往回拨了一寸。', goal:'让这条线交到班组手里',
   proof:'取出班组历年的接班约定', verify:'让车队核准名单和资质', promise:'把吴师傅带过的新人编进表', recruit:'让老孙找齐接班的司机', backup:'留一条不并线的短驳',
   expose:'让车队按原约签给班组', rally:'把钥匙和头班名单交给接班人', win:'接班的人试了下钥匙。吴师傅伸手把副驾驶门拉开。', partial:'你保住了短驳。班组有一条路能接着跑。', loss:'合同归赵正。吴师傅把旧表交给你，说明早一起去吃面。'},
 },
 heir: {
  18: {title:'西岸首宴，谁坐主位', intro:'周骁已经在台上谢赞助商。沈经理拦下换座牌的人，母亲把未拆的签约袋递给你。', goal:'拿回主办权和赞助',
   proof:'拆开母亲带来的签约原件', verify:'把原件和订金一并交给赞助方', promise:'先承诺结清沈经理的团队尾款', recruit:'请方岚把赞助人带到临江桌', backup:'让沈经理打开临江包厢',
   expose:'切大屏，亮出原签约人', rally:'把话筒拿到临江桌，自己开席', win:'赞助人端着杯子换了桌。周骁放下话筒，沈经理问主位的名字怎么写。', partial:'临江桌开了席，赞助合同还在周骁手上。', loss:'周骁签走赞助。沈经理把你原订的包厢钥匙塞回你手里。'},
  23: {title:'谁签西岸的独家', intro:'周骁把同一档卖给了两家。沈经理摆下两份价单，方岚已经把其中一家请进电梯。', goal:'拿到下季独家主办权',
   proof:'收好两份独家协议', verify:'请两家财务对同一档期', promise:'替沈经理保住团队的全年档期', recruit:'让方岚把两位签约人请到一起', backup:'另锁一处临江档期',
   expose:'让两家看原件，当面改签', rally:'带团队和赞助人换桌签新约', win:'两份独家撤掉一份。新合同落在你的桌上。', partial:'档期保住了。方岚让你月底前再给一份预算。', loss:'周骁收走排期。沈经理带着还没签字的名单来找你。'},
  38: {title:'谁在卖你的会客厅', intro:'周骁把展厅和项目打包挂牌。买家问钥匙什么时候交，沈经理把自己的那串放回兜里。', goal:'留住会客厅和项目',
   proof:'拿出会客厅经营权原件', verify:'请买方核实挂牌里那页授权', promise:'给沈经理签团队留任承诺', recruit:'请方岚带签约客户过来', backup:'开备用场地接待到场客户',
   expose:'让买家撤掉你的资产', rally:'带客户转场，签自己的排期', win:'挂牌文件撤了一页。签约结束后，沈经理开了你那瓶酒。', partial:'项目签了，场地仍得谈。沈经理先把下周的门卡给你。', loss:'周骁带买方走正门。方岚从侧门出来，把她那份客户表留给你。'},
  57: {title:'今晚以后，谁做东', intro:'周骁把新主理人的位子写在收购书上。母亲把筷子放下，沈经理已经领着年轻团队进来了。', goal:'选定西岸会客厅的下一任',
   proof:'请财务带来当年的经营权协议', verify:'把交接名单和签字权逐项核过', promise:'给沈经理留团队股份', recruit:'请方岚叫下一任主理人坐下', backup:'留一桌长期交给独立团队',
   expose:'当席签下自己的交接名单', rally:'让下一任先开席，现场完成交接', win:'主桌换了人。你坐到靠窗那把椅子上，母亲把小排转给你。', partial:'团队接了一层。以后谁管整栋，还得再谈。', loss:'周骁接过主位。沈经理问你还留不留靠窗的那一桌。'},
 },
 system: {
  18: {title:'交付只认一个名字', intro:'两张订单同时亮起。顾桥已经替你填了收款人，许舟拿着货，说只交给能认出原单的人。', goal:'把第一份长期结算凭证拿到手',
   proof:'调出首单签收存根', verify:'跟周闻核对收款人和提交时间', promise:'答应周闻把交付人的那份写进单', recruit:'请许舟把签收人带上楼', backup:'存一份离线签收单',
   expose:'按原派单提交结算', rally:'让交付人共同签署新凭证', win:'你的手机收到结算。顾桥的界面还停在等待确认。', partial:'双方分开结款。你的那一联凭证还在。', loss:'顾桥先落了款。许舟把离线地址写在纸背面。'},
  23: {title:'名单上多了一个收款人', intro:'顾桥把共同账户按在桌上。许舟看了半天，问里面怎么连自己的名字都没有。', goal:'拿到独立的任务入口',
   proof:'调首单的原始签名', verify:'让周闻核验新加的共同账户', promise:'给交付人单列佣金', recruit:'请许舟找齐实际交付人', backup:'留一个可离线签收的入口',
   expose:'用首单原签名拒绝绑定', rally:'按交付名单重开收款入口', win:'系统把共同账户划掉了。新入口只认你的签名。', partial:'旧账户还在，但你留住了一条独立接单路径。', loss:'顾桥拿到共同收款权。周闻把日志地址发给你。'},
  38: {title:'迁移前的最后三笔', intro:'顾桥开了旧入口，三笔钱正往同一个账号转。周闻指着进度条，让你先确定哪些真的交过货。', goal:'迁走自己的订单和结算权',
   proof:'取三笔订单的真实交付记录', verify:'让周闻逐笔比对接单号', promise:'补给交付人旧账的分成', recruit:'请许舟让收货人逐笔签回', backup:'导出一份离线任务队列',
   expose:'拦下假订单，按原账迁移', rally:'带签过字的订单启用新入口', win:'三笔款各自到账。顾桥的旧链接先失效了。', partial:'钱只找回来一部分，离线队列还接得到下一单。', loss:'旧入口关停。许舟给你写了几个还能联系上的号码。'},
  57: {title:'最后一单，交给谁', intro:'顾桥带着空白交接单到便利店。许舟把纸按住，周闻说现在签下去，这个入口以后只认这一份。', goal:'决定下一任接单人',
   proof:'拿来第一次交付的原凭证', verify:'结清旧入口最后的未付款', promise:'给周闻留公开查询和更正权', recruit:'请许舟带下一个接单人来', backup:'把离线联系单留在柜台',
   expose:'清账后亲手签交接', rally:'让下一个接单人当场签名', win:'最后一笔旧账结清。柜台上另一部手机亮了。', partial:'原入口熄了，接单人的号码还挂在便利店。', loss:'顾桥签走旧入口。你把自己的号码写在交付人那一联上。'},
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
