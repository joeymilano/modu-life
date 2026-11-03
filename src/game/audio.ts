let context:AudioContext|null=null;let enabled=false;
export function setAudioEnabled(value:boolean){enabled=value;if(value){context??=new AudioContext();void context.resume();}}
export function playSound(type:'tap'|'draw'|'good'|'bad'|'year'='tap'){
 if(!enabled)return;context??=new AudioContext();const ctx=context;void ctx.resume();const notes=type==='draw'?[293.66,440,587.33]:type==='good'?[392,493.88,587.33]:type==='bad'?[196,146.83]:type==='year'?[261.63,329.63,392,523.25]:[440];
 notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type==='tap'?'sine':'triangle';o.frequency.value=f;const t=ctx.currentTime+i*.075;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.3);});
}

