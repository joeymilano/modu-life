type Sound = 'tap' | 'draw' | 'good' | 'bad' | 'year' | 'scan';

const notes: Record<Sound, number[]> = {
 tap: [440],
 draw: [293.66, 440, 587.33],
 good: [392, 493.88, 587.33],
 bad: [196, 146.83],
 year: [261.63, 329.63, 392, 523.25],
 scan: [246.94, 369.99],
};

let context: AudioContext | null = null;
let enabled = false;

function playbackContext() {
 if (typeof AudioContext === 'undefined') return null;
 context ??= new AudioContext();
 if (context.state !== 'running') void context.resume().catch(() => {});
 return context;
}

export function setAudioEnabled(value: boolean) {
 enabled = value;
 if (value) playbackContext();
}

export function playSound(type: Sound = 'tap') {
 if (!enabled) return;
 const ctx = playbackContext();
 if (!ctx) return;
 notes[type].forEach((frequency, index) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + index * .075;
  oscillator.type = type === 'tap' ? 'sine' : 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(type === 'scan' ? .031 : .045, start + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .28);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + .3);
 });
}
