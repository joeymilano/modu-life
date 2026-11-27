type Sound = 'tap' | 'draw' | 'good' | 'bad' | 'year' | 'scan';
export type Impact = 'slap' | 'tear' | 'kick' | 'crash' | 'ding' | 'blackout' | 'crowd' | 'missionPassed' | 'radioClick' | 'siren';

const sounds: readonly Sound[] = ['tap', 'draw', 'good', 'bad', 'year', 'scan'];
const clips = new Map<Sound, Promise<AudioBuffer | undefined>>();

let context: AudioContext | null = null;
let effects: GainNode | null = null;
let enabled = false;
let enableRevision = 0;
let music: HTMLAudioElement | null = null;
let track = '';
let playingTrack = '';
let advanceTrack: (() => void) | undefined;

function syncMusic() {
 if (effects) effects.gain.value = enabled && !document.hidden ? 1 : 0;
 if (!enabled || document.hidden || !track) {
  music?.pause();
  return;
 }
 if (!music) {
  music = new Audio();
  music.volume = .62;
  music.addEventListener('ended', () => advanceTrack?.());
 }
 if (playingTrack !== track) {
  playingTrack = track;
  music.src = track;
 }
 if (music.paused) void music.play().catch(() => {});
}

export function setMusicTrack(source: string, onEnded: () => void) {
 track = source;
 advanceTrack = onEnded;
 syncMusic();
}

function playbackContext() {
 if (typeof AudioContext === 'undefined') return null;
 if (!context) {
  context = new AudioContext();
  effects = context.createGain();
  effects.connect(context.destination);
 }
 if (context.state !== 'running') void context.resume().catch(() => {});
 return context;
}

function loadClip(type: Sound, ctx: AudioContext) {
 const cached = clips.get(type);
 if (cached) return cached;
 const loaded = fetch('/audio/foley/' + type + '.wav').then(response => {
  if (!response.ok) throw new Error('Missing sound effect');
  return response.arrayBuffer();
 }).then(data => ctx.decodeAudioData(data)).catch(() => {
  clips.delete(type);
  return undefined;
 });
 clips.set(type, loaded);
 return loaded;
}

export function setAudioEnabled(value: boolean) {
 if (enabled === value) {
  if (value) syncMusic();
  return;
 }
 enabled = value;
 enableRevision++;
 if (value) {
  const ctx = playbackContext();
  if (ctx) for (const sound of sounds) void loadClip(sound, ctx);
  document.addEventListener('visibilitychange',syncMusic);
 } else document.removeEventListener('visibilitychange',syncMusic);
 syncMusic();
}

export function playSound(type: Sound = 'tap') {
 if (!enabled || document.hidden) return;
 const ctx = playbackContext();
 const output = effects;
 if (!ctx || !output) return;
 const revision = enableRevision;
 const called = performance.now();
 void loadClip(type, ctx).then(clip => {
  if (!clip || !enabled || document.hidden || revision !== enableRevision ||
      ctx.state !== 'running' || performance.now() - called > 350) return;
  const source = ctx.createBufferSource();
  source.buffer = clip;
  source.connect(output);
  source.onended = () => source.disconnect();
  source.start();
 });
}

/** Short synthesised hits for the dialogue stage, so a slap or a system chime needs no recording. */
export function playImpact(kind: Impact) {
 if (!enabled || document.hidden) return;
 const ctx = playbackContext(), output = effects;
 if (!ctx || !output) return;
 const now = ctx.currentTime;
 const tone = (at: number, duration: number, gain: number, from: number, to: number, type: OscillatorType = 'sine') => {
  const osc = ctx.createOscillator(), envelope = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now + at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + at + duration);
  envelope.gain.setValueAtTime(gain, now + at);
  envelope.gain.exponentialRampToValueAtTime(.0001, now + at + duration);
  osc.connect(envelope).connect(output);
  osc.start(now + at); osc.stop(now + at + duration + .02);
  osc.onended = () => osc.disconnect();
 };
 const hiss = (duration: number, gain: number, from: number, to: number, type: BiquadFilterType = 'bandpass', swell = 0) => {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain();
  source.buffer = buffer; filter.type = type; filter.Q.value = .8;
  filter.frequency.setValueAtTime(from, now);
  filter.frequency.exponentialRampToValueAtTime(to, now + duration);
  envelope.gain.setValueAtTime(swell ? .0001 : gain, now);
  if (swell) envelope.gain.exponentialRampToValueAtTime(gain, now + swell);
  envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
  source.connect(filter).connect(envelope).connect(output);
  source.start(now); source.onended = () => source.disconnect();
 };
 if (kind === 'slap') { hiss(.16, .8, 4200, 700); tone(0, .2, .7, 170, 45); }
 else if (kind === 'tear') hiss(.34, .5, 1500, 5600);
 else if (kind === 'kick' || kind === 'crash') { tone(0, .24, .9, 130, 38); hiss(.13, .4, 900, 180, 'lowpass'); if (kind === 'crash') hiss(.5, .3, 5200, 1400); }
 else if (kind === 'ding') { tone(0, .7, .28, 1318.5, 1310); tone(.1, .8, .22, 1975.5, 1970); tone(0, .5, .08, 659.3, 659.3, 'triangle'); }
 else if (kind === 'missionPassed') {
  tone(0, 1.15, .42, 110, 55, 'triangle');
  tone(.06, .95, .22, 220, 220, 'sawtooth');
  tone(.14, .95, .20, 329.6, 329.6, 'triangle');
  tone(.22, 1.05, .24, 440, 438, 'sine');
 }
 else if (kind === 'radioClick') {
  hiss(.065, .26, 2600, 900);
  tone(0, .04, .18, 920, 420, 'square');
 }
 else if (kind === 'siren') {
  tone(0, .32, .18, 640, 880, 'triangle');
  tone(.32, .34, .16, 880, 620, 'triangle');
 }
 else if (kind === 'blackout') { tone(0, 1.1, .45, 96, 28, 'sawtooth'); hiss(.06, .3, 6000, 1200); }
 else hiss(1.5, .22, 260, 760, 'bandpass', .35);
}
