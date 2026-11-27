import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { fillName, stageAt, type Beat, type DialogueOption, type Impact } from '../game/dialogue';
import { VN_CAST, spriteArt, stageArt } from '../game/vnCast';
import { playImpact, playSound } from '../game/audio';
import { originPhoto } from '../game/art';
import type { OriginCard } from '../game/types';
import Icon from './Icon';
import './dialogue-stage.css';

const DIRECTIONS = new Set(['bg', 'cast']);
const SHAKES = new Set<Impact>(['slap', 'tear', 'kick', 'crash']);
const PAUSE_AFTER = new Set('，。！？…—、：；「」（）');
const SHOUT: Record<Impact, string> = { slap: '啪——！', tear: '嘶啦——', kick: '哐当——', crash: '哗啦——', ding: '叮——', blackout: '啪。', crowd: '嗡——' };
const RUSH_KEY = 'modu-life-rush';
export const STALL = '__stall';
type LogEntry = { who?: string; text: string; skipped?: boolean };
/** Receives `'tender'` while the stage is inside a tender passage and `undefined` once it has left it. */
export type StageMoodSetter = (mood: 'tender' | undefined) => void;

type Props = {
 /** Beats to play. A decided option splices its own lines in, so the array itself never has to change. */
 beats: readonly Beat[]; startAt?: number; playerName: string; hand?: readonly OriginCard[];
 label: string; variant?: 'default' | 'system'; hud?: ReactNode; tools?: ReactNode;
 /** Seconds to answer before the other side cuts in. Omit to let the player take their time. */
 pressure?: number; stall?: { who: string; text: string };
 /** The options as the rules see them right now; they can open and close while the question is on screen. */
 live?: readonly DialogueOption[];
 /** Offered while foresight is aimed: preview one option without spending the turn. */
 predicting?: (optionId: string) => void;
 /** May return what the choice actually moved, shown as a flash after the pick. */
 onChoice?: (groupId: string, optionId: string) => string | void;
 onEnd: () => void; onPause: () => void; audio: boolean; onAudio: () => void;
 onMood?: StageMoodSetter;
};

function readRush() {
 try { return localStorage.getItem(RUSH_KEY) !== 'off'; } catch { return true; }
}

/** The visual-novel stage: backdrop, standing portraits, typed dialogue and the choices that interrupt it. */
export default function DialogueStage({ beats, startAt = 0, playerName, hand = [], label, variant = 'default', hud, tools, live, predicting,
 pressure = 0, stall, onChoice, onEnd, onPause, audio, onAudio, onMood }: Props) {
 const [playlist, setPlaylist] = useState<Beat[]>(() => [...beats]);
 const [index, setIndex] = useState(Math.max(0, Math.min(startAt, beats.length - 1)));
 const [typed, setTyped] = useState(0);
 const [done, setDone] = useState(true);
 const [auto, setAuto] = useState(false);
 const [impact, setImpact] = useState<{ kind: Impact; text: string; key: number }>();
 const [log, setLog] = useState<LogEntry[]>([]);
 const [logOpen, setLogOpen] = useState(false);
 const [rush, setRush] = useState(readRush);
 const [left, setLeft] = useState(pressure);
 const [rushEpoch, setRushEpoch] = useState(0);
 const [gain, setGain] = useState<{ text: string; key: number }>();
 const [tender, setTender] = useState<[number, number] | null>(null);
 const journal = useRef<HTMLDialogElement>(null);
 const root = useRef<HTMLElement>(null);
 const picture = useRef<HTMLDivElement>(null);
 const options = useRef<HTMLElement>(null);
 const ended = useRef(false);
 const stopped = useRef(false);
 const count = useRef({ index: -1, left: 0, started: 0, timer: undefined as ReturnType<typeof setTimeout> | undefined, pulse: undefined as ReturnType<typeof setInterval> | undefined });
 const latest = useRef({ index, playlist, stall, live });
 latest.current = { index, playlist, stall, live };

 const beat = playlist[index];
 const offered = beat?.t === 'choice' ? live ?? beat.options : [];
 const stage = useMemo(() => stageAt(playlist, index), [playlist, index]);
 const choosing = beat?.t === 'choice';
 const speaker = beat?.t === 'line' ? beat.who : undefined;
 const units = !beat ? 0 : beat.t === 'sys' ? beat.lines.length : 'text' in beat ? beat.text.length : 0;
 const timed = choosing && pressure > 0 && !!stall && rush;
 const timedHere = pressure > 0 && !!stall;

 useEffect(() => { root.current?.focus({ preventScroll: true }); }, []);

 useEffect(() => {
  if (index < playlist.length) return;
  if (!ended.current) { ended.current = true; onEnd(); }
 }, [index, playlist.length, onEnd]);

 // A new beat: remember the line, fire its burst of noise and motion.
 useEffect(() => {
  const current = playlist[index];
  if (!current) return;
  if (current.t === 'line' || current.t === 'nar' || current.t === 'think') setLog(entries => [...entries, { who: current.t === 'line' ? current.who : undefined, text: fillName(current.text, playerName) }]);
  const burst = current.t === 'fx' ? { kind: current.kind, text: current.text } : 'fx' in current ? current.fx : undefined;
  if (!burst) { setImpact(undefined); return; }
  setImpact({ kind: burst.kind, text: burst.text ?? SHOUT[burst.kind], key: index });
  playImpact(burst.kind);
  if (SHAKES.has(burst.kind) && picture.current) {
   picture.current.classList.remove('is-shake');
   void picture.current.offsetWidth;
   picture.current.classList.add('is-shake');
  }
  const timer = setTimeout(() => setImpact(undefined), 1250);
  return () => clearTimeout(timer);
 }, [index, playlist.length]);

 // Lines type themselves out. One click finishes the line, the next one moves on.
 useEffect(() => {
  stopped.current = false;
  if (!units || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(units); setDone(true); return; }
  setTyped(0); setDone(false);
  const at: number[] = [];
  let moment = 80;
  for (let i = 0; i < units; i++) {
   at.push(moment);
   const character = beat && 'text' in beat ? beat.text[i] : '';
   moment += (beat?.t === 'sys' ? 360 : PAUSE_AFTER.has(character) ? 170 : 0) + (beat?.t === 'sys' ? 0 : 27);
  }
  const started = performance.now();
  // A timer rather than an animation frame: the line still finishes when the browser is not painting.
  const timer = setInterval(() => {
   if (stopped.current) return;
   const shown = at.filter(time => time <= performance.now() - started).length;
   setTyped(shown);
   if (shown >= units) { setDone(true); clearInterval(timer); }
  }, 24);
  return () => { stopped.current = true; clearInterval(timer); };
 }, [index, units, beat]);

 function step() {
  const current = latest.current.playlist[latest.current.index];
  if (!current || current.t === 'choice') return;
  if (!done) { stopped.current = true; setTyped(units); setDone(true); return; }
  playSound('tap');
  setIndex(latest.current.index + 1);
 }
 const stepping = useRef(step);
 stepping.current = step;

 // Backdrops and entrances are directions rather than lines: show them, then carry on.
 useEffect(() => {
  if (!beat || !DIRECTIONS.has(beat.t)) return;
  const timer = setTimeout(() => setIndex(index + 1), beat.t === 'cast' ? 320 : 150);
  return () => clearTimeout(timer);
 }, [beat, index]);

 useEffect(() => {
  if (!auto || !done || !beat || beat.t === 'choice' || DIRECTIONS.has(beat.t)) return;
  const timer = setTimeout(() => stepping.current(), 620 + units * 26);
  return () => clearTimeout(timer);
 }, [auto, done, index, units, beat]);

 useEffect(() => {
  if (choosing) options.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  else if (root.current && document.activeElement?.closest('.vn-options')) root.current.focus({ preventScroll: true });
 }, [choosing]);

 function pick(option: DialogueOption) {
  const at = latest.current.index, current = latest.current.playlist[at];
  if (current?.t !== 'choice') return;
  playSound(option.id === STALL ? 'bad' : 'tap');
  setLog(entries => [...entries, { who: '__you', text: fillName(option.label, playerName) }]);
  ended.current = false;
  setPlaylist(list => [...list.slice(0, at + 1), ...option.then, ...list.slice(at + 1)]);
  setIndex(at + 1);
  // The lines just spliced in are numbered at + 1 upward.
  if (option.then.length) setTender(option.mood === 'tender' ? [at + 1, at + option.then.length] : null);
  const moved = onChoice?.(current.id, option.id);
  if (moved) setGain({ text: moved, key: at });
 }

 function cutIn() {
  const at = latest.current.index, current = latest.current.playlist[at];
  if (current?.t !== 'choice' || !latest.current.stall) return;
  const { who, text } = latest.current.stall;
  pick({ id: STALL, label: '慢了半拍，被抢了话', then: [
   { t: 'line', who, text },
   { t: 'nar', text: '话到嘴边慢了半拍，场子里的风向直接被他截走了。' },
  ] });
 }

 // The other side will not wait all night. Opening the log buys time; closing it resumes the count.
 useEffect(() => {
  const clock = count.current;
  if (!timed || logOpen) return;
  if (clock.index !== index) { clock.index = index; clock.left = pressure; }
  else if (clock.left <= 0) { cutIn(); return; }
  clock.started = performance.now();
  clock.timer = setTimeout(() => { clock.left = 0; setLeft(0); cutIn(); }, clock.left * 1000);
  clock.pulse = setInterval(() => setLeft(Math.max(0, clock.left - (performance.now() - clock.started) / 1000)), 200);
  return () => {
   clearTimeout(clock.timer);
   clearInterval(clock.pulse);
   clock.left = Math.max(0, clock.left - (performance.now() - clock.started) / 1000);
  };
 }, [timed, logOpen, index, pressure]);

 function toggleRush() {
  const next = !rush;
  setRush(next);
  setLeft(pressure);
  setRushEpoch(value => value + 1);
  count.current = { index: -1, left: next ? pressure : 0, started: 0, timer: undefined, pulse: undefined };
  try { localStorage.setItem(RUSH_KEY, next ? 'on' : 'off'); } catch {}
 }

 const inTender = !!tender && index >= tender[0] && index <= tender[1];
 useEffect(() => { onMood?.(inTender ? 'tender' : undefined); }, [inTender, onMood]);

 function skip() {
  const next = playlist.findIndex((item, at) => at > index && item.t === 'choice');
  const target = next >= 0 ? next : Math.max(0, playlist.length - 1);
  if (target <= index) return;
  playSound('tap');
  if (target - index > 1) setLog(entries => [...entries, { who: '__skip', text: '' }]);
  setIndex(target);
 }

 function openHistory() {
  if (journal.current && !journal.current.open) { journal.current.showModal(); setLogOpen(true); }
 }

 const keys = (event: KeyboardEvent) => {
  if (event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || logOpen) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
  const current = latest.current.playlist[latest.current.index];
  if (current?.t === 'choice') {
   const options = latest.current.live?.length ? latest.current.live : current.options;
   const option = Number(event.key) >= 1 && Number(event.key) <= 9 ? options[Number(event.key) - 1] : undefined;
   if (option && !option.lock) { event.preventDefault(); pick(option); }
   return;
  }
  if ((event.key === ' ' || event.key === 'Enter') && !target?.closest('button,a,summary')) { event.preventDefault(); step(); }
 };
 useEffect(() => {
  window.addEventListener('keydown', keys);
  return () => window.removeEventListener('keydown', keys);
 });

 const person = (who: string) => who === '__you' ? { name: playerName, role: '十八岁，刚到上海', color: '#4f6b74', poses: { default: { file: '', zoom: 1 } } }
  : VN_CAST[who] ?? { name: who, role: '', color: '#f2c188', poses: { default: { file: '', zoom: 1 } } };
 const text = beat && 'text' in beat ? beat.text : '';
 const shown = fillName(text.slice(0, typed), playerName);
 const waiting = !!beat && beat.t !== 'choice' && !DIRECTIONS.has(beat.t);
 // While a choice is open the line that led to it stays on the page.
 const lastSpoken = choosing ? [...playlist.slice(0, index)].reverse().find(item => item.t === 'line' || item.t === 'nar' || item.t === 'think') : undefined;
 const caption = choosing ? (lastSpoken && 'text' in lastSpoken ? lastSpoken.text : '') : beat?.t === 'sys' ? '' : shown;
 const progress = playlist.length > 1 ? Math.min(100, Math.round(index / (playlist.length - 1) * 100)) : 100;

 return <article className="vn-stage" ref={root} tabIndex={-1} data-beat={beat?.t ?? 'end'} data-variant={variant}
  aria-label={label} onClick={event => { if (!(event.target as HTMLElement).closest('button,a,summary,dialog')) step(); }}>
  <div className="vn-picture" ref={picture} data-dark={beat?.t === 'fx' && beat.kind === 'blackout'} data-covered={beat?.t === 'sys' || beat?.t === 'hand'}>
   {stage.bg && <img key={stage.bg} className="vn-scenery" src={stageArt(stage.bg)} alt="" fetchPriority="high"/>}
   <div className="vn-shade" aria-hidden="true"/>
   {Object.entries(stage.actors).map(([who, actor]) => <img key={who + actor.slot + actor.pose} className="vn-actor" data-who={who} data-slot={actor.slot}
    data-speaking={speaker === who} data-dimmed={!!speaker && speaker !== who} src={spriteArt(who, actor.pose)}
    style={{ '--zoom': person(who).poses[actor.pose]?.zoom ?? 1 } as CSSProperties} alt={person(who).name + '的立绘'} draggable={false}/>)}
   {impact && <div key={impact.key} className="vn-flash" data-kind={impact.kind} aria-hidden="true"/>}
  </div>
  <div className="vn-frame" aria-hidden="true"/>
  {impact && impact.kind !== 'blackout' && <div key={'burst' + impact.key} className="vn-impact" data-kind={impact.kind} aria-hidden="true">{impact.text}</div>}
  <header className="vn-header">
   <div className="vn-mast"><span className="vn-seal" aria-hidden="true">沪</span><span><b>魔都人生</b><small>{label}</small></span></div>
   <nav aria-label="对话操作">
    <button type="button" aria-label={audio ? '关闭声音' : '打开声音'} title={audio ? '关闭声音' : '打开声音'} onClick={onAudio}><Icon name={audio ? 'sound' : 'mute'} size={17}/></button>
    <button type="button" aria-pressed={auto} aria-label={auto ? '关闭自动阅读' : '自动阅读'} title="自动读下一句" onClick={() => setAuto(value => !value)}><Icon name="play" size={15}/><span>{auto ? '自动中' : '自动'}</span></button>
    <button type="button" aria-label="回看对白" onClick={openHistory}><Icon name="book" size={16}/><span>回看</span></button>
    <button type="button" onClick={onPause} aria-label="保存并回首页" title="保存并回首页"><Icon name="save" size={16}/><span>存档离场</span></button>
   </nav>
  </header>
  {(stage.place || hud) && <div className="vn-topline">
   {stage.place && <div className="vn-location"><i/>{stage.place}{stage.clock && <span>{stage.clock}</span>}</div>}
   {hud && <div className="vn-hud">{hud}</div>}
  </div>}
  {beat?.t === 'sys' && <div key={index} className="vn-sys" data-tone={beat.tone} role="status" aria-live="polite" aria-atomic="true" aria-label={fillName(beat.lines.join('，'), playerName)}>
   {beat.title && <h3>{fillName(beat.title, playerName)}</h3>}
   <ul>{beat.lines.slice(0, typed).map(line => <li key={line}>{fillName(line, playerName)}</li>)}</ul>
  </div>}
  {gain && <div key={'g' + gain.key} className="vn-gain-pop" role="status">{fillName(gain.text, playerName)}</div>}
  {beat?.t === 'hand' && <div className="vn-hand" aria-label="你的开局手牌">
   {hand.map((card, at) => <figure key={card.id} data-first={at === 0} style={{ '--tilt': (at - (hand.length - 1) / 2) * 8 + 'deg', '--drop': Math.abs(at - (hand.length - 1) / 2) * 15 + 'px', '--order': at } as CSSProperties}>
    <img src={originPhoto(card.id)} alt="" decoding="async"/><figcaption><small>{card.slot}</small><b>{card.name}</b></figcaption>
   </figure>)}
  </div>}
  <div className="vn-center"/>
  <div className="vn-lower">
   {choosing && <section className="vn-options" ref={options} aria-label="选择你的回应">
    <h3><i/>{fillName(beat.prompt, playerName)}</h3>
    {timedHere && <div className="vn-rush" key={beat.id + rushEpoch} data-off={!rush} data-paused={logOpen} data-urgent={rush && left < 4} style={{ '--rush': pressure + 's' } as CSSProperties}>
     <i aria-hidden="true"/><span>{rush ? `${Math.ceil(left)} 秒内开口，慢了就被他抢话` : '不限时，想清楚再说'}</span>
     <button type="button" aria-pressed={rush} onClick={toggleRush}>{rush ? '关掉限时' : '打开限时'}</button>
    </div>}
    {offered.map((option, at) => <div className="vn-option" key={option.id}>
     <button type="button" data-vn-choice={option.id} disabled={!!option.lock} onClick={() => pick(option)}>
      <kbd>{at + 1}</kbd>
      <span>
       <b>{fillName(option.label, playerName)}</b>
       {(option.tag || option.hint || option.lock) && <small>{option.tag && <em data-tag={option.tag}>{option.tag}</em>}{fillName(option.lock || option.hint || '', playerName)}</small>}
       {(option.gain || option.chance !== undefined) && <small className="vn-gain">{option.chance !== undefined && <span data-gamble>{option.chance}% 押中</span>}{option.gain}</small>}
      </span>
      <Icon name="chevron" size={15}/>
     </button>
     {option.preview && <p className="vn-preview">推演：{fillName(option.preview, playerName)}</p>}
     {predicting && !option.lock && <button type="button" className="vn-predict" data-vn-predict={option.id} onClick={() => predicting(option.id)}>推演这项选择</button>}
    </div>)}
    {tools}
   </section>}
   <div className="vn-dialogue">
    {beat?.t === 'line' && <div className="vn-name" style={{ '--who': person(beat.who).color } as CSSProperties}><b>{person(beat.who).name}</b><i/><span>{person(beat.who).role}</span></div>}
    {beat?.t === 'think' && <div className="vn-name vn-name-you"><b>{playerName}</b><i/><span>心里</span></div>}
    <section className="vn-paper" aria-label="对白">
     <div key={index} className="vn-line" data-kind={choosing ? 'paused' : beat?.t}>
      {beat && text && <p className="visually-hidden" aria-live="polite" aria-atomic="true">{beat.t === 'think' ? '（' + shown + '）' : shown}</p>}
      {beat?.t !== 'sys' && <p className="vn-typed" data-kind={choosing ? 'paused' : beat?.t} data-done={done} aria-hidden="true">{caption}</p>}
      {beat?.t === 'sys' && <p className="vn-typed" data-kind="sys" data-done={done} aria-hidden="true">{done ? '点一下，接着看' : '　'}</p>}
     </div>
     {waiting && <button className="vn-next" type="button" data-vn-next onClick={event => { event.stopPropagation(); step(); }}>
      <span>{done ? '继续' : ''}</span><Icon name="arrow" size={19}/>
     </button>}
    </section>
   </div>
   <footer>
    <span className="vn-progress" aria-label={`已读到第 ${Math.min(index + 1, playlist.length)} 段，共 ${playlist.length} 段`}><i style={{ width: progress + '%' }}/></span>
    {timedHere && !choosing && <button type="button" aria-pressed={rush} onClick={toggleRush}>{rush ? '限时抢话：开' : '限时抢话：关'}</button>}
    {beat && !choosing && <button type="button" onClick={skip}>{playlist.some((item, at) => at > index && item.t === 'choice') ? '跳到下一处选择' : '跳到结尾'} <span aria-hidden="true">»</span></button>}
   </footer>
  </div>
  <dialog ref={journal} className="vn-history" aria-label="对白回看"
   onClose={() => setLogOpen(false)} onClick={event => { if (event.target === journal.current) journal.current?.close(); }}>
   <div><header><h3>对白回看</h3><button type="button" onClick={() => journal.current?.close()} aria-label="回到对话"><Icon name="close" size={20}/></button></header>
    <ol>{log.map((entry, at) => <li key={at}>
     {entry.who === '__you' && <p className="vn-history-player">{playerName} · {entry.text}</p>}
     {entry.who === '__skip' && <p className="vn-history-skip">（中间几段已跳过）</p>}
     {entry.who && entry.who !== '__you' && entry.who !== '__skip' && <b>{person(entry.who).name}</b>}
     {entry.who !== '__skip' && <p>{entry.text}</p>}

    </li>)}</ol>
   </div>
  </dialog>
 </article>;
}
