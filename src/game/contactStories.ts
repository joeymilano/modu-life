import { contactPhoto, type ContactShot } from './art';
import type { DistrictId, EventChoice, GameState, LifeEvent } from './types';

type ContactId = 'wu' | 'fang' | 'boss';
type ContactStory = { message: string; event: LifeEvent };

const districts: Record<ContactId, DistrictId> = {wu:'xinzhuang', fang:'xinzhuang', boss:'lujiazui'};
const firstEvent: Record<ContactId, ContactShot> = {wu:'wu-regulars', fang:'fang-deposit', boss:'boss-reference'};
const secondEvent: Record<ContactId, ContactShot> = {wu:'wu-corner', fang:'fang-handover', boss:'boss-night-class'};
const titles: Record<ContactShot, string> = {
 'wu-regulars':'最后一早要不要开门', 'wu-corner':'新店往里走两百米',
 'fang-deposit':'谁先拍下这道划痕', 'fang-handover':'钥匙要两个人一起拍',
 'boss-reference':'推荐信写谁的名字', 'boss-night-class':'讲一个当年做砸的项目',
};
const eventId = (shot: ContactShot) => 'contact-' + shot;

function scene(person: ContactId, shot: ContactShot, message: string, text: string, choices: EventChoice[]): ContactStory {
 return {
  message,
  event: {
   id:eventId(shot), title:titles[shot], text, choices, category:'social', tag:'老熟人',
   district:districts[person], speakerId:person, illustration:contactPhoto(shot),
  },
 };
}

function wu(state: GameState, returning: boolean): ContactStory {
 if (returning) {
  const oldShift = state.flags.includes('contact-wu-shift');
  return scene('wu','wu-corner','吴师傅说有只碗要还你',
   (oldShift
    ? '那回你陪他开完最后一早。收摊前写的地址还贴在旧窗口，字晒得差不多了。有人循着那张纸，吃新店吃了好多年。'
    : '那回你们先把预付的钱退了。有人隔了好几个月才找到新店，进门第一句还是，豆浆别放糖。') +
   '吴师傅今天没围围裙。他掀开报纸，拿出一只没豁口的搪瓷碗，问你还记不记得。',
   [
    {id:'eat',label:'就用这只碗，吃了再走',hint:'留在巷口吃顿早饭',effect:{health:4,spirit:8,trust:7},
     reply:'学徒端出两碗。吴师傅刚要说豆浆太淡，想了想，去拿糖罐子自己加。'},
    {id:'leave',label:'碗留在店里，有人坐下就用',hint:'把碗交给接手的人',effect:{network:7,trust:5},
     reply:'学徒把碗放在最外头。后面的人进来，指着它说，还是给我用这只吧。'},
   ]);
 }
 return scene('wu','wu-regulars','吴师傅问你还起不起得来',
  '店面要交还，后天的新地址还没人认得。吴师傅数着本子上的预付早点，有七个人还没吃完。他想明天再开一早，等常来的都认了新地址再搬。灶上还能腾出一口锅，他问你六点能不能到。',
  [
   {id:'shift',label:'六点来帮忙，下工当面结',hint:'到账 ¥260 · 体力 −5',effect:{cash:260,health:-5,trust:8,setFlags:['contact-wu-shift']},
    reply:'你端完最后一碗，把地址写大了贴在原窗口。吴师傅把二百六转给你。有人嫌字丑，倒是第一个拍了照。'},
   {id:'refund',label:'先给这七个人退钱，明天关门搬',hint:'钱由摊上退 · 你帮忙挨个打电话',effect:{network:6,trust:6},
    reply:'最后一个是用现金交的，吴师傅让他明天来取。对方问钱能不能留在新店，吴师傅说你先拿回去，吃过再交。'},
  ]);
}

function fang(state: Pick<GameState,'flags'>, returning: boolean): ContactStory {
 if (returning) {
  const checked = state.flags.includes('contact-fang-check');
  return scene('fang','fang-handover','方姐还留着一串老钥匙',
   (checked
    ? '方姐还留着你们对出旧划痕的那张图。她后来交钥匙都让两边拿手机拍一份，这次来接钥匙的是当时那个租客的女儿。'
    : '当年那位租客拿回了六百，剩下三百没再追。方姐自己把这件事写在钥匙本末页。今天的新租客刚要把押金转过去，她让人先等一等。') +
   '她把钥匙摆到点交单上，问你还能不能看出少了哪一把。',
   [
    {id:'list',label:'对上门牌和钥匙，现场各留一份',hint:'花一格行动把这次交接做完',effect:{skill:6,trust:7,network:4},
     reply:'小姑娘试开了两遍。走前她把点交单发给方姐，说等我退房那天，咱俩都别换手机。'},
    {id:'teach',label:'让新租客试着自己点交',hint:'把记录的办法教给下一位',effect:{trust:5,spirit:7},
     reply:'她自己拍完照，还找出少抄的一把信箱钥匙。方姐从包底翻出来，笑说差点要重跑一趟。'},
   ]);
 }
 const rented = state.flags.includes('rental_checked');
 return scene('fang','fang-deposit','方姐发来一块地板的照片',
  (rented ? '方姐记得你来找她看过房，把手机递给你。' : '方姐把你叫到楼梯口，说你以前碰到过押金说不清的事。') +
  '这位租客搬进来那天只拍了客厅，照片里挡着两只纸箱。房东要扣九百换地板。车已停在楼下，租客还差这一笔去交新房押金。',
  [
   {id:'check',label:'把招租视频和交房照片对一遍',hint:'查原始时间 · 租客等对账',effect:{skill:7,trust:9,setFlags:['contact-fang-check']},
    reply:'招租视频拍进了那道划痕。方姐把原视频发过去，房东最后把九百都转了。租客上车才想起，自己还没看司机车牌。'},
   {id:'settle',label:'先拿六百，写明双方今天结清',hint:'租客今天拿回 ¥600 · 余款不再追',effect:{spirit:5,trust:4},
    reply:'租客点完收款就下楼了。方姐把那三百写在经手人一栏边上，才把钥匙装回袋里。'},
  ]);
}

function boss(state: GameState, returning: boolean): ContactStory {
 if (returning) {
  const credited = state.flags.includes('contact-boss-credit');
  return scene('boss','boss-night-class','沈经理问你还认不认得那张表',
   (credited
    ? '你们当年把两个人的名字都写进了推荐信。沈经理后来拿那一页教人怎么写交接，资料上两行名字还在。'
    : '那封信当年只写了你。沈经理后来讲起那件事，学生问另一个经手人在哪儿，她回去翻了原件。') +
   '她现在带一班夜课，今晚正讲改项目排期。她把旧表夹在讲义里，问你能不能留一节，讲讲最后是怎么收场的。',
   [
    {id:'teach',label:'留一节课，把返工那一段也讲了',hint:'今晚的课酬 ¥600',effect:{cash:600,skill:5,trust:8,health:-2},
     reply:'有人抄走了你画错的那一版，说回去给组长看。课后沈经理把六百块转给你，还发了张报销单问抬头。'},
    {id:'lend',label:'把旧表借给她，下周再来听',hint:'今天不用上台',effect:{network:6,trust:5,spirit:6},
     reply:'下楼前她发来教室号码。你让她把白板拍一张过来，最好是还没擦的那张。'},
   ]);
 }
 const split = state.seenEvents.includes('street-reorg');
 return scene('boss','boss-reference','沈经理带了两版推荐信',
  (split ? '那次名单只剩一格，沈经理一直留着你们交接的文件。' : '沈经理换了部门，收走最后一箱资料时翻到了你们一起做的项目。') +
  '她说可以给你留封推荐信。第一版把整项都算在你头上，第二版分了工，连那个早就离职的同事也写进去了。人事还等她发扫描件。',
  [
   {id:'credit',label:'把同事名字留着，我认我做的那半',hint:'请她保留分工 · 多一个旧同事的联络',effect:{network:9,trust:7,setFlags:['contact-boss-credit']},
    reply:'她让你看最后一遍。晚上那个同事发来一张他保存的旧排期，说我的名字终于没被拼错。'},
   {id:'send',label:'先发简版，我赶今晚的投递',hint:'用现成那版 · 今天拿到推荐信',effect:{face:8,trust:4},
    reply:'你在地铁里收到了扫描件。附件刚好一页，点开两次都不用往下滑。'},
  ]);
}

const stories = {wu, fang, boss};
const contactIds = Object.keys(stories) as ContactId[];

function knowsContact(state: GameState, person: ContactId) {
 if (state.relationships[person]?.met) return true;
 return person === 'fang' && (state.flags.includes('rental_checked') || state.seenEvents.includes('street-lease'));
}

export function contactStory(state: GameState, personId?: string): ContactStory | undefined {
 if (state.pendingYearEvent || state.ended || state.actions <= 0 || state.age < 36) return;
 for (const person of contactIds) {
  if ((personId && personId !== person) || !knowsContact(state,person)) continue;
  const returning = state.seenEvents.includes(eventId(firstEvent[person]));
  if (returning !== (state.age >= 53) || state.seenEvents.includes(eventId(secondEvent[person]))) continue;
  return stories[person](state,returning);
 }
}

export function replayContactStory(state: GameState, id: string): LifeEvent | null {
 const person = contactIds.find(person => id === eventId(firstEvent[person]) || id === eventId(secondEvent[person]));
 if (!person) return null;
 const event = contactStory(state,person)?.event;
 return event?.id === id ? event : null;
}

export function contactEvidence(eventId: string) {
 if (eventId !== 'contact-fang-deposit') return;
 return {
  choiceId: 'check',
  label: '翻方姐手机里的旧招租',
  text: '视频是上一个租客退房那天拍的。镜头扫到门背后，地板上已经有一道白印。视频底下还挂着房东当时发的那句「明天能入住」。',
 };
}

export const FANG_TICKET_SCENES = [
 fang({flags:['rental_checked']},false).event,
 fang({flags:['contact-fang-check']},true).event,
 fang({flags:[]},true).event,
] as const;

export function contactStoryMemory(state: GameState, personId: string) {
 const person = contactIds.find(id => id === personId);
 if (!person) return;
 const firstTitle = titles[firstEvent[person]], secondTitle = titles[secondEvent[person]];
 return state.journal.slice().reverse().find(entry => entry.tag === '老熟人' && (entry.title === firstTitle || entry.title === secondTitle));
}
