import { dateScenePhoto } from './art';
import { CAST } from './content';
import { FAMILY_HOME, FAMILY_PAY, lifeStartRent } from './lifeStarts';
import type { GameState, LifeEvent } from './types';

type Plan = 'shared' | 'standing';
const sharedPrefix = 'shared-home-', standingPrefix = 'standing-date-';
export const STANDING_DATE_MONTHLY_COST = 120;
export const householdFlag = (person: string, plan: Plan) => (plan === 'shared' ? sharedPrefix : standingPrefix) + person;

export function householdPlan(state: GameState): Plan | undefined {
 if (!state.partnerId) return;
 if (state.housing > 0 && state.flags.includes(householdFlag(state.partnerId, 'shared'))) return 'shared';
 if (state.flags.includes(householdFlag(state.partnerId, 'standing'))) return 'standing';
}

export function clearHousehold(flags: string[]) {
 return flags.filter(flag => !flag.startsWith(sharedPrefix) && !flag.startsWith(standingPrefix));
}

export function housingPayment(housing: number, leaseRent: number | undefined, shared: boolean) {
 const base = leaseRent ?? ([1800, 3300, 5500, 1000][housing] || 1800);
 return shared ? Math.round(base * .6) : base;
}

type Scene = { title: string; text: string; shared: string; standing: string; wait: string };
const scenes: Record<string, Scene> = {
 xia: {
  title: '窗边还剩半张桌',
  text: '许小雯把图纸卷起来，窗边露出半张桌。她说可以腾给你，手却还按在桌上的尺上。你问礼拜天几点起，她说七点，想了想又说，先定这张桌子归谁。',
  shared: '你们把桌子转了九十度。插座变得谁都够不着，小雯去楼下买了个拖线板，回来先插了你那边。',
  standing: '她把礼拜天早上改到九点，选了家豆浆铺。你刚要点头，她把新闹钟给你看了一眼。',
  wait: '你帮她把尺压回图纸角。临走她问，下回能不能把你自己的图也带来。',
 },
 ning: {
  title: '钥匙放哪儿不响',
  text: '周宁坐在门口，把两把钥匙搁在膝盖上。他问，十一点开门会不会把你吵醒。你说钥匙倒还好。他摸了摸兜里又响的手机，把它掏出来翻了个面。',
  shared: '鞋柜上多了个垫着布的碟。他那晚回来得晚，钥匙倒没响，是他自己在黑里撞了椅子。',
  standing: '他挑了礼拜三，把那晚的工作提醒划掉。第一回他早到十五分钟，坐着拆了半天饭团上的海苔。',
  wait: '你把那串钥匙推回去。他陪你走到电梯口，这次手机响了，他没低头。',
 },
 lin: {
  title: '画笔占了你的杯子',
  text: '林佳找了半天杯子，最后从窗台捞出一个，里头泡着两支画笔。她说可以添一张桌。你看了眼房间，问添了桌，两把椅子还能不能同时拉出来。',
  shared: '你们买了窄一点的桌子。林佳在桌缝夹了张纸，画了两把背对背的椅子，谁也没坐到谁的脚。',
  standing: '她把周四留在弄堂口。头一回带了两只杯子，都没沾颜料。她说这两只就不往家里拿了。',
  wait: '你拿白水冲了冲那只杯子。她说可以先留给你用，下一句又问，能不能先借回去泡一晚笔。',
 },
 chen: {
  title: '闹钟比咖啡先响',
  text: '陈恺把两只杯子摆好。桌上的闹钟指着五点四十，他说早班从这个点算。你还没喝，他已经在问，真住一起的话，闹钟要不要搬到门外。',
  shared: '闹钟没搬，换成了手表震动。第一天他走得很轻，门口还是留了一杯已经凉了一半的咖啡。',
  standing: '你们约了一顿晚饭，地点离他店里两站。他准点到了。你问咖啡喝不喝，他点了碗辣肉面。',
  wait: '你把两只杯子洗了，只拿走了自己的。他问早上能不能给你留条消息，你说九点以后。',
 },
 qiao: {
  title: '两本账，先摊一本',
  text: '乔敏把两个本子叠好。一本是她自己的，一本还没写。她问同住以后账是各算各的，还是连菜也算一份。你刚要回，她从兜里找出一张还没报掉的停车小票。',
  shared: '你们把住房那栏分成六四。她圈了四成，说她负责。第二天买菜，她把一把葱划到自己那边，说晚上想自己煮碗面。',
  standing: '她挑了礼拜五，把每次考试前那周空出来。第一次吃完，她翻手机看了眼，下周五也在。',
  wait: '她收走已经写满的那本，把空的留在桌上。你问要不要带走，她说先拿来垫不平的桌脚。',
 },
 yang: {
  title: '楼门关了，电话还开着',
  text: '杨帆把伞插进门口的筒里，右袖子湿了一截。他问你要不要多配一把钥匙。手机在鞋柜上亮了，你俩同时看过去。屏幕上又是楼下问漏水。',
  shared: '钥匙挂到最里面。你们给晚上来电分了个急缓。第二天第一通不急，他也没接，先把两碗面端到桌上。',
  standing: '你们留了周三。他发消息说过了六点手机放包里，过五分钟又补一句，楼上真漏水例外。',
  wait: '你帮他把伞撑开晾在门口。他问你走到车站要多久，这回电话响着，他先送你下楼。',
 },
 lu: {
  title: '凌晨回来先别插电',
  text: '陆嘉坐在地毯边收线。她说演出散场最晚能到凌晨一点，问你睡着以后她还能不能从门口摸进来。旁边的耳机只有一边响，她刚才还一直在用。',
  shared: '门口多了一盏能踩亮的小灯。她头一回半夜回来没插电，把新歌哼给你听。你第二天只记得最后三个字。',
  standing: '你们挑了不演出的那晚。她把排练表里的那个格涂空，旁边写着吃饭，连老板也问这是什么活动。',
  wait: '你把松开的那根线重新绕好。她接过去，问你下场还来伐。你说去，坐离音箱远点。',
 },
 he: {
  title: '收工了还要不要吃',
  text: '何亮把两只盖着的面碗往桌上一摆，钥匙放在你的那只旁边。他问同住的话能不能把饭点往后挪一点。你看眼钟，问一点是十点半，还是打烊看最后一桌。',
  shared: '你们买了两个能保温的碗。头一晚他十一点回来，揭开盖子自己先吃了一口，说你这次醋放少了。',
  standing: '每礼拜给店里留一天早点关门。他第一次刚要叠凳子，有人问还做伐。他说明天给你加面，今天有人等。',
  wait: '你把自己那碗吃完，钥匙挪回他手边。他拿起钥匙去洗碗，你这才看见另一只碗一直没揭。',
 },
};

export function householdVisit(state: GameState, personId: string): LifeEvent | undefined {
 if (state.partnerId !== personId || state.pendingYearEvent || state.ended || state.actions <= 0) return;
 if (!state.seenEvents.includes('date-return-' + personId)) return;
 const person = CAST.find(member => member.id === personId);
 const scene = scenes[personId];
 const id = `household-${personId}-${state.age}`;
 if (!person || !scene || state.seenEvents.includes(id)) return;
 const plan = householdPlan(state);
 const newHome = state.housing === 0;
 const moving = plan === 'shared' ? 0 : newHome ? 3500 : 1600;
 const rent = newHome ? housingPayment(1,undefined,true) : lifeStartRent(state,housingPayment(state.housing,state.leaseRent,true),true);
 const ownRent = lifeStartRent(state,housingPayment(state.housing,state.leaseRent,false),false);
 const familyPays = state.housing===2 && state.flags.includes(FAMILY_HOME) && state.flags.includes(FAMILY_PAY);
 const rentHint = familyPays ? `你的住房份额 ¥${rent.toLocaleString('zh-CN')}/月 · 家里代付`
  : plan === 'shared' ? `你每月出 ¥${rent.toLocaleString('zh-CN')} 住房费`
  : `住房 ¥${ownRent.toLocaleString('zh-CN')} → ¥${rent.toLocaleString('zh-CN')}/月`;
 const text = plan === 'shared' ? '两把钥匙放一起已经有阵子了。你们把旧账翻出来，今天重新谈谈怎么住。'
  : plan === 'standing' ? '这周那顿饭照常吃完了。走到门口，你们又聊起房子和两把钥匙。'
  : scene.text;
 return {
  id, title: plan ? '这次还照旧伐' : scene.title, text, category: 'romance', tag: '两个人的事',
  speakerId: personId, district: person.district, illustration: dateScenePhoto(personId,'home',state.age),
  choices: [
   { id: 'share', label: plan === 'shared' ? '继续一起住，账照六四分' : '把钥匙配上，住房费六四分',
    hint: `${moving?`搬家花 ¥${moving.toLocaleString('zh-CN')} · `:''}${newHome?'租一间普通房 · ':''}${rentHint}`,
    reply: plan === 'shared' ? '钥匙又挂回原来的地方。账抄了一遍，这次两个人都留了一份。' : scene.shared,
    effect: { cash: -moving, ...(newHome&&{ housing: 1 }), trust: 7, commitment: 13,
     setFlags: [householdFlag(personId, 'shared')], removeFlags: [householdFlag(personId, 'standing')] } },
   { id: 'standing', label: '各住各的，每周留一顿饭',
    hint: `${plan==='shared'?`住房 ¥${ownRent.toLocaleString('zh-CN')}/月${familyPays?' · 家里代付':''} · `:''}每月见面多花 ¥${STANDING_DATE_MONTHLY_COST}`,
    reply: scene.standing, effect: { trust: 8, commitment: 7, spirit: 4,
     setFlags: [householdFlag(personId, 'standing')], removeFlags: [householdFlag(personId, 'shared')] } },
   { id: 'wait', label: '先把今晚过好，过阵子再谈',
    hint: '今年先照旧',
    reply: plan ? '先把账本合上。你们下楼走了一圈，走到有热汤的地方才停。' : scene.wait,
    effect: { trust: 3, spirit: 6 } },
  ],
 };
}
