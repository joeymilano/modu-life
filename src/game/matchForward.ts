import { matchPhoto } from './art';
import type { GameState, LifeEvent } from './types';

const forwardId = 'matchmaking-forward';
const replyId = 'matchmaking-forward-revisit';
const located = { category:'romance', district:'people', tag:'相亲角' } as const;
export const MATCH_RELAY = 'match-aunt-relay';
const replaced = 'match-forward-replaced';
const replied = 'match-forward-replied';
const traced = 'match-forward-traced';

type PaperKind = 'address' | 'resume' | 'relay';
const paperKind = (flags: readonly string[]): PaperKind =>
 flags.includes(MATCH_RELAY) ? 'relay' : flags.includes('match-edited') ? 'resume' : 'address';

const papers = {
 address: {
  original: '上海有房。联系方式在纸下边。',
  forward: '上海自有房，今晚八点可看房',
  note: '第一张群截图改了标题，底下连联系方式也一起拍进去了。唐圆翻到最早一条，发图的人说是从公园回来顺手发的。',
 },
 resume: {
  original: '申请社区活动室试班。周末可排，联系方式见第二页。',
  forward: '周末有空，想找个一起安家的',
  note: '截图只留了「周末可排」。原文件第一页的工作申请被裁掉了。唐圆把写着联系方式的第二页扣在桌上。',
 },
 relay: {
  original: '礼拜天九点一刻，公园门口。想联系，先问汪阿姨。',
  forward: '上海有房，周末可看。联系汪阿姨。',
  note: '原件没有住址，也没留你的号码。最早转发那条还带着汪阿姨的摊位名。',
 },
} satisfies Record<PaperKind,{original: string; forward: string; note: string}>;

function forward(kind: PaperKind, later = false): LifeEvent {
 const text = kind==='resume'
  ? '唐圆转来一张群截图。活动室收走的试班简历上了相亲群。对方把「周末可排」剪成了「周末有空」，底下已经有人问打算什么时候结婚。'
  : kind==='relay'
   ? '你当时把号码留给了汪阿姨，纸上也没写门牌。现在她发来一张群截图。有人给照片添了一行「上海有房，周末可看」，已经有两个陌生人来问她开不开门。'
   : '唐圆的群里转来一张你那张纸的照片。「上海有房」添了个「自」字。晚上有个陌生人打电话，问看房要不要先交两百。';
 return {
  ...located,id:forwardId,title:'群里那张图是谁发的',speakerId:'tang',
  illustration:matchPhoto(later?'forward-later':kind==='resume'?'forward-resume':'forward-address'),text,
  choices:[
   {id:'replace',label:'请管理员撤下旧图，只贴我看过的版本',
    hint:kind==='relay'?'还是由汪阿姨转话':kind==='resume'?'更正用途 · 简历只发给活动室':'收回公开联系方式',
    effect:{trust:8,spirit:5,setFlags:[replaced]},
    reply:kind==='resume'
     ? '唐圆把能投出去的那版重新发给活动室。管理员撤下了群里的旧图，问要不要留一句说明。你写的是，这份只用来找班。'
     : '汪阿姨照你写的念给管理员听。对方把旧图撤了，先问你同不同意新图发出。你这回从第一行读到了最后一行。'},
   {id:'reply',label:'我自己回一条，把纸上那句话说清楚',
    hint:'以本人身份回群 · 多留几个认识的人',effect:{face:5,network:8,trust:4,setFlags:[replied]},
    reply:(kind==='resume'?'问什么时候结婚的人先撤回一句，改成问周末几点上班。'
     :kind==='relay'?'两个来问看房的人都收到了回话。汪阿姨接着给你发消息，说早晓得该在纸上画只馄饨。'
     :'你回完，问看房押金的人说自己加错群了。')+'下面又来一条，礼拜天吃馄饨那条还作数伐。'},
   {id:'trace',label:'把两版放在一起，去找最早转图的人',
    hint:'用对照留下来源 · 把改过的那行讲清',effect:{skill:8,trust:8,network:4,setFlags:[traced]},
    reply:'第一条转发的人把原图翻出来。她说拿回来时谁都没多想，你请她在群里把改过的那行也说一遍。后来她把旧图和更正放到了一起。'},
  ],
 };
}

function follow(flags: readonly string[], later = false): LifeEvent {
 if (flags.includes(traced)) return {
  ...located,id:replyId,title:'复印店还剩一摞旧版',speakerId:'aunt',illustration:matchPhoto('forward-copy'),
  text:'汪阿姨在复印店找到一摞当时打印的旧图，最上面还是群里的标题。店里答应换掉。下午还有一摞居民自己拿来的资料等着核，每份发出去前得让本人看一次。老板说你肯留半天，给二百六。',
  choices:[
   {id:'shift',label:'留下核半天，每份先请本人看',hint:'当天到账 ¥260 · 不改现有工作',
    effect:{cash:260,skill:6,trust:7,health:-2},
    reply:'最后一位叔叔把「会烧饭」改成「会烧两样」。老板下工转给你二百六。叔叔走到门口又回来，加了一样葱油拌面。'},
   {id:'note',label:'把原件和更正夹在一起，留给下一班',hint:'交接原件和发过的版本',
    effect:{network:7,trust:8,spirit:4},
    reply:'汪阿姨拿红笔圈了两处，说下回谁要改，先叫那个人自己坐到这张椅子上来。'},
  ],
 };
 if (flags.includes(replied)) return {
  ...located,id:replyId,title:'馄饨那条还作数伐',speakerId:'tang',illustration:matchPhoto(later?'forward-wonton-later':'forward-wonton'),
  text:'群里问馄饨的那个人还在。唐圆把第三只碗往桌边推了推。那人说他不看房，想问你们上次提的社区活动室还招不招人。他从公司出来以后，好几次想开口问都没问成。',
  choices:[
   {id:'bowl',label:'坐下来慢慢讲，再添两碗馄饨',hint:'付 ¥36 · 听完他的事',
    effect:{cash:-36,trust:8,network:9,spirit:5},
    reply:'他讲到第二碗才问起工钱。你拿张餐巾写了班表上能找到哪几项。最后他先拍了餐巾，再说下次这顿归我。'},
   {id:'contact',label:'把报名时间写给他，我就不加碗了',hint:'只转公开的报名时间',
    effect:{network:6,spirit:7},
    reply:'唐圆把那碗往自己面前移了半寸，说你有事先走，我在这儿帮他看看礼拜几不用排那么久。'},
  ],
 };
 return {
  ...located,id:replyId,title:'蓝夹子还给你',speakerId:'aunt',illustration:matchPhoto('forward-stall'),
  text:'汪阿姨把蓝夹子从塑料袋里掏出来。现在有人先来问愿不愿意见面，她才替双方传话。她还留了张没写名字的纸，说你想换个写法，今天就可以换。',
  choices:[
   {id:'relay',label:'这回只留见面时间，号码还是你代转',hint:'继续由汪阿姨牵线',
    effect:{trust:10,network:5,setFlags:[MATCH_RELAY]},
    reply:'她在纸上写礼拜天九点，抬头问地点。你说就这儿。她把那张纸夹到自己那一侧，准备先问问人肯不肯来。'},
   {id:'take',label:'夹子给我，纸留着你下回再用',hint:'把自己的登记收回来',
    effect:{spirit:9,trust:6},
    reply:'你把夹子别到袋口。走到公园外面才发现，它刚好能夹住那张快要掉出来的地铁票。'},
  ],
 };
}

export function parkForward(state: GameState) {
 if (!state.flags.includes('match-listed') && !state.flags.includes('match-edited')) return null;
 const later=state.age>=42;
 if (!state.seenEvents.includes(forwardId)) {
  return {event:forward(paperKind(state.flags),later),message:'唐圆发来一张群截图'};
 }
 const entry=state.journal.find(item=>item.tag===located.tag&&item.title==='群里那张图是谁发的');
 if (!entry || entry.age>=state.age || state.seenEvents.includes(replyId)) return null;
 const event=follow(state.flags,later);
 return {event,message:event.title};
}

export function forwardClue(eventId: string, state: Pick<GameState,'flags'>) {
 if (eventId!==forwardId) return;
 const paper=papers[paperKind(state.flags)];
 return {
  choiceId:'trace',label:'比对原件和群截图',text:paper.note,
  papers:[{label:'原件',value:paper.original},{label:'群截图',value:paper.forward}] as const,
 };
}

export const PARK_FORWARD_TICKET = [
 forward('address'),follow([replaced]),follow([traced]),follow([replied]),
] as const;
