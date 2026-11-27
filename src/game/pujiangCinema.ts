import type { EpisodeScript } from './pujiangTypes';
import type { GameState } from './types';
import { everyBeat } from './dialogue';

/** Wide story stills, also cropped for the three contacts who have no portrait of their own. */
export const CINEMA_ART = {
 gu: '/art/pujiang-cinema/gu.webp', stage: '/art/pujiang-cinema/stage.webp',
 shift: '/art/pujiang-cinema/shift.webp', dinner: '/art/pujiang-cinema/dinner.webp',
 xu: '/art/pujiang-cinema/xu.webp', workshop: '/art/pujiang-cinema/workshop.webp',
 banquet: '/art/pujiang-cinema/gu-dinner.webp', expo: '/art/pujiang-cinema/expo.webp',
} as const;
export const CINEMA_CONTACTS: Record<string, { art: keyof typeof CINEMA_ART; focus: string }> = {
 'pj-gu': { art: 'gu', focus: '67% 27%' }, 'pj-wen': { art: 'workshop', focus: '60% 26%' }, 'pj-xu': { art: 'xu', focus: '57% 25%' },
};

/** `who` is how a script names them; `id` is where their trust is kept. */
const chapterCast: { name: string; role: string; who?: string; id?: string }[] = [
 { name: '毛小毛', role: '替礼堂收票，也管散场那顿饭', id: 'mao' },
 { name: '陆嘉', role: '在江边小礼堂唱歌的乐手', id: 'lu' },
 { name: '费启', role: '隔壁场子的老板', id: 'fei' },
 { name: '吴师傅', role: '莘庄仓库里带过新人的老工友', id: 'wu' },
 { name: '赵正', role: '仓里排夜班的领班', id: 'zheng' },
 { name: '老孙', role: '在仓门口等最后一班的司机', id: 'sun' },
 { name: '沈经理', role: '带队做样品，替工人追尾款的负责人', who: 'shen', id: 'boss' },
 { name: '周骁', role: '你的表哥，今晚代家里招呼客户', id: 'zhouxiao' },
 { name: '采购主任', role: '替饭店验样、签试单的人', id: 'buyer' },
 { name: '许舟', role: '自己接单跑运输的司机', who: 'xu', id: 'pj-xu' },
 { name: '顾桥', role: '管场子和客户的项目主理人', who: 'gu', id: 'pj-gu' },
 { name: '周闻', role: '修设备的工程师，习惯把故障记在纸上', who: 'wen', id: 'pj-wen' },
 { name: '余老师', role: '街区夜校的老师', id: 'yu' },
 { name: '陶厂长', role: '亲自来看样品的采购负责人', id: 'tao' },
];

export function speakerRole(name: string) {
 return chapterCast.find(person => person.name === name)?.role;
}

/** Who has spoken up to and including an act, with the trust this scene has moved. */
export function cinemaRelationships(game: GameState, script: EpisodeScript, changes: [string, number][] = [], act = 0) {
 const heard = new Set<string>();
 for (const scene of script.scenes.slice(0, act + 1)) for (const beat of everyBeat(scene.beats)) if (beat.t === 'line') heard.add(beat.who);
 return chapterCast.filter(person => person.id && heard.has(person.who ?? person.id)).map(person => {
  const delta = changes.filter(([id]) => id === person.id).reduce((n, [, change]) => n + change, 0);
  const relation = game.relationships[person.id!];
  return { ...person, delta, trust: relation ? Math.max(0, Math.min(100, relation.trust + delta)) : undefined };
 });
}
