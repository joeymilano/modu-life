import type { Effect } from './types';

/** A line the dialogue stage plays. Scripts are plain data so saves only ever store the picks. */
export type Slot = 'left' | 'center' | 'right';
export type Impact = 'slap' | 'tear' | 'kick' | 'crash' | 'ding' | 'blackout' | 'crowd';
export interface Entrance { who: string; slot: Slot; pose?: string }
export interface Actor { slot: Slot; pose: string }
export interface DialogueOption {
 id: string; label: string; hint?: string; tag?: string; effect?: Effect; lock?: string; then: Beat[];
 /** Read-outs for a rules-backed choice: what it moves, how a gamble sits, what foresight showed. */
 gain?: string; chance?: number; preview?: string;
 /** The lines that follow this answer are a tender passage; the music follows them. */
 mood?: 'tender';
 /** What the person you just met remembers, and what they bring up a year later. */
 memory?: string; nextYear?: string;
}
export type Beat =
 | { t: 'line'; who: string; text: string; pose?: string; fx?: { kind: Impact; text?: string } }
 | { t: 'nar'; text: string; fx?: { kind: Impact; text?: string } }
 | { t: 'think'; text: string }
 | { t: 'sys'; title?: string; lines: string[]; tone: 'system' | 'stake' }
 | { t: 'hand'; text: string }
 | { t: 'bg'; id: string; place?: string; clock?: string }
 | { t: 'cast'; enter?: Entrance[]; exit: string[]; pose?: { who: string; pose: string } }
 | { t: 'fx'; kind: Impact; text: string }
 | { t: 'choice'; id: string; prompt: string; options: DialogueOption[] };

/* Authoring shorthand. */
export type Burst = { kind: Impact; text?: string };
/** `__you` is the player: named on the page, never drawn. */
export const me = (text: string): Beat => ({ t: 'line', who: '__you', text });
export const say = (who: string, text: string, pose?: string, burst?: Burst): Beat =>
 ({ t: 'line', who, text, ...(pose ? { pose } : {}), ...(burst ? { fx: burst } : {}) });
export const nar = (text: string, burst?: Burst): Beat => ({ t: 'nar', text, ...(burst ? { fx: burst } : {}) });
export const think = (text: string): Beat => ({ t: 'think', text });
export const sys = (lines: string[], title?: string): Beat => ({ t: 'sys', tone: 'system', lines, ...(title ? { title } : {}) });
export const stake = (lines: string[], title?: string): Beat => ({ t: 'sys', tone: 'stake', lines, ...(title ? { title } : {}) });
export const hand = (text: string): Beat => ({ t: 'hand', text });
export const bg = (id: string, place?: string, clock?: string): Beat => ({ t: 'bg', id, ...(place ? { place } : {}), ...(clock ? { clock } : {}) });
export const cast = (enter: Entrance[], exit: string[] = []): Beat => ({ t: 'cast', enter, exit });
export const fx = (kind: Impact, text: string): Beat => ({ t: 'fx', kind, text });
export const choice = (id: string, prompt: string, options: DialogueOption[]): Beat => ({ t: 'choice', id, prompt, options });

export const isSpoken = (beat: Beat): beat is Extract<Beat, { t: 'line' | 'nar' | 'think' | 'sys' | 'hand' | 'fx' }> =>
 beat.t === 'line' || beat.t === 'nar' || beat.t === 'think' || beat.t === 'sys' || beat.t === 'hand' || beat.t === 'fx';

/** `{name}` in a script becomes the player's name. */
export const fillName = (text: string, name: string) => text.replaceAll('{name}', name);

/** Walks the script up to a beat and reports what should be on screen. */
export function stageAt(beats: readonly Beat[], index: number) {
 const stage: { bg?: string; place?: string; clock?: string; actors: Record<string, Actor> } = { actors: {} };
 for (const beat of beats.slice(0, index + 1)) {
  if (beat.t === 'bg') Object.assign(stage, { bg: beat.id, ...(beat.place ? { place: beat.place } : {}), ...(beat.clock ? { clock: beat.clock } : {}) });
  if (beat.t === 'cast') {
   for (const who of beat.exit) delete stage.actors[who];
   for (const person of beat.enter ?? []) {
    const current = stage.actors[person.who];
    stage.actors[person.who] = { slot: person.slot, pose: person.pose ?? current?.pose ?? 'default' };
   }
   if (beat.pose && stage.actors[beat.pose.who]) stage.actors[beat.pose.who] = { ...stage.actors[beat.pose.who], pose: beat.pose.pose };
  }
 }
 return stage;
}

/** First beat a returning player should land on: the next question they still owe an answer to. */
export function resumeAt(beats: readonly Beat[], picks: readonly string[]) {
 const first = beats.findIndex(beat => beat.t === 'choice' && !beat.options.some(option => picks.includes(option.id)));
 return first < 0 ? Math.max(0, beats.length - 1) : first;
}

export const everyChoice = (beats: readonly Beat[]): Extract<Beat, { t: 'choice' }>[] =>
 beats.flatMap(beat => beat.t === 'choice' ? [beat, ...everyChoice(beat.options.flatMap(option => option.then))] : []);

export function everyBeat(beats: readonly Beat[]): Beat[] {
 return beats.flatMap(beat => beat.t === 'choice' ? [beat, ...beat.options.flatMap(option => everyBeat(option.then))] : [beat]);
}
