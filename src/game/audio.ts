type Sound = 'tap' | 'draw' | 'good' | 'bad' | 'year' | 'scan';

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
