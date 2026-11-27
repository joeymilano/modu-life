import { everyChoice, resumeAt, isSpoken, type Beat, type DialogueOption } from './dialogue';
import { PROLOGUE_SCRIPTS } from './prologueScripts';
import type { PujiangRoute } from './pujiangTypes';

/** Saves hold three answers per route as flags; the lines themselves are read from the script again. */
export const PROLOGUE_PENDING = 'pj-prologue-pending';
export type PrologueGroup = 'stance' | 'meet' | 'parting';
export interface PrologueChoice { id: PrologueGroup; options: DialogueOption[] }

export interface Prologue {
 routeName: string; title: string; line: string; place: string; setup: string; photo: string;
 personId: string; speaker: string; role: string; script: Beat[];
}

export const PROLOGUES: Record<PujiangRoute, Prologue> = {
 arrival: {
  routeName: '初到上海', title: '今晚这场，取消？', place: '上海站 · 南广场', photo: '/art/prologue/arrival-place.webp',
  line: '海报被撕，皮箱被踹，五十张票的演出遭人当众截胡',
  setup: '到上海头一晚，隔壁老板费启撕了海报和票根、踹翻你的旧皮箱，当众喊停陆嘉的演出。毛小毛把检票夹交到了你手里。',
  personId: 'mao', speaker: '毛小毛', role: '和你合租的人', script: PROLOGUE_SCRIPTS.arrival,
 },
 worker: {
  routeName: '日结工', title: '名字划掉，铺位没你的', place: '莘庄 · 仓库门房', photo: '/art/prologue/worker-place.webp',
  line: '报名单被撕，皮箱被踢，门房铺位半夜到期',
  setup: '领班赵正当众撕掉报名单角、踢翻你的皮箱，把吴师傅的名字也从续住表划掉了：夜里最后一车货，你一个人卸。',
  personId: 'wu', speaker: '吴师傅', role: '带你上第一班的老工友', script: PROLOGUE_SCRIPTS.worker,
 },
 heir: {
  routeName: '顶级富二代', title: '备餐口给你加张折凳', place: '锦江饭店 · 包厢', photo: '/art/prologue/heir-place.webp',
  line: '六千万上午刚进存折，满桌人还当你是来跑腿的',
  setup: '表哥周骁霸了主位，招呼服务员在备餐口给你加张折凳。没人晓得六千万上午刚进你的中行存折，母亲把原版主东请帖塞进了你手里。',
  personId: 'boss', speaker: '沈经理', role: '替你家做样灯的人', script: PROLOGUE_SCRIPTS.heir,
 },
 system: {
  routeName: '系统流', title: '外滩暴雨，首单八万', place: '外滩 · 江边小礼堂侧门', photo: '/art/prologue/system-place.webp',
  line: '首单悬赏八万，面板却把主导权判给了顾桥',
  setup: '暴雨夜绑定系统，首单悬赏八万。总场务顾桥让你滚去后巷卸货，面板还把主导者判给了他。你帮许舟把电瓶抬进廊下时，整栋楼断电了。',
  personId: 'pj-xu', speaker: '许舟', role: '今晚给礼堂送货的司机', script: PROLOGUE_SCRIPTS.system,
 },
};

export const prologueChoices = (route: PujiangRoute): PrologueChoice[] =>
 everyChoice(PROLOGUES[route].script) as PrologueChoice[];
export const prologueChoice = (route: PujiangRoute, group: string) => prologueChoices(route).find(choice => choice.id === group);

/** The first meeting is shared wording across routes, so it is flagged by its own id. */
export const prologueFlag = (route: PujiangRoute, group: PrologueGroup, option: string) =>
 group === 'meet' ? 'pj-prologue-' + option : `pj-prologue-${route}-${option}`;

export function prologueOption(route: PujiangRoute, id: string): { group: PrologueGroup; option: DialogueOption } | undefined {
 for (const choice of prologueChoices(route)) {
  const option = choice.options.find(item => item.id === id);
  if (option) return { group: choice.id, option };
 }
 return undefined;
}

export const isDecided = (flags: readonly string[], route: PujiangRoute, group: PrologueGroup) =>
 prologueChoice(route, group)?.options.some(option => flags.includes(prologueFlag(route, group, option.id))) ?? false;

export function rememberedMeeting(flags: readonly string[], route: PujiangRoute) {
 return prologueChoice(route, 'meet')?.options.find(option => flags.includes(prologueFlag(route, 'meet', option.id)));
}

/** A returning player picks up at the first answer they still owe. */
export function prologueStart(route: PujiangRoute, flags: readonly string[]) {
 const picks = prologueChoices(route).flatMap(choice => choice.options)
  .filter(option => flags.includes(prologueFlag(route, choiceId(route, option.id), option.id))).map(option => option.id);
 // A first visit plays from the top; only someone who already answered resumes further in.
 return picks.length ? resumeAt(PROLOGUES[route].script, picks) : 0;
}
function choiceId(route: PujiangRoute, option: string): PrologueGroup {
 return prologueChoices(route).find(choice => choice.options.some(item => item.id === option))?.id ?? 'meet';
}

/** What the journal keeps from an answer: the first few things said after it. */
export const spokenText = (beats: readonly Beat[]) =>
 beats.filter(isSpoken).filter(beat => beat.t !== 'fx').map(beat => beat.t === 'sys' ? beat.lines.join('，') : beat.text).slice(0, 3).join(' ');
