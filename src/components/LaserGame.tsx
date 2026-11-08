import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
 CURRENT_PEARL_RULES, PEARL_LANES, pearlRank, pearlRounds, type PearlResult, type PearlRules,
} from '../game/pearl';
import { playSound } from '../game/audio';
import { pearlPhoto, pearlRunner } from '../game/art';
import type { PlayerAppearance } from '../game/types';
import Icon from './Icon';
import './pearl.css';

type Phase = 'intro' | 'warn' | 'fire' | 'done';
type Umbrella = 'ready' | 'open' | 'spent';
type Impact = 'hit' | 'blocked' | 'clear';

const FLOOR_ZONES = ['68,298 227,298 197,390 0,390', '227,298 373,298 403,390 197,390', '373,298 532,298 600,390 403,390'];
const LANE_X = [100, 300, 500];
const TOWER_POINT = [300, 98];
const IMPACT_TEXT = { hit: '洒出来了！', blocked: '这下伞替你挨了', clear: '杯子还稳着' };
const FLASH_MS = 355;
const strongerImpact = (a: Impact, b: Impact): Impact =>
 a === 'hit' || b === 'hit' ? 'hit' : a === 'blocked' || b === 'blocked' ? 'blocked' : 'clear';

export default function LaserGame({ seed, cash = 0, appearance = { gender: 'female', looks: 'everyday' }, rules = CURRENT_PEARL_RULES, standalone = false, onFinish }: {
 seed: string; cash?: number; appearance?: PlayerAppearance; rules?: PearlRules;
 standalone?: boolean; onFinish: (result: PearlResult) => void;
}) {
 const waves = useMemo(() => pearlRounds(seed, rules), [seed, rules]);
 const [phase, setPhase] = useState<Phase>('intro');
 const [wave, setWave] = useState(0);
 const [lane, setLane] = useState(1);
 const [facing, setFacing] = useState<'left' | 'right'>('right');
 const [mask, setMask] = useState(0);
 const [locked, setLocked] = useState(false);
 const [history, setHistory] = useState<Impact[]>([]);
 const [blocks, setBlocks] = useState(0);
 const [impact, setImpact] = useState<Impact>();
 const [sweepStep, setSweepStep] = useState(0);
 const [umbrella, setUmbrella] = useState<Umbrella>('ready');
 const [hidden, setHidden] = useState(document.hidden);
 const player = useRef({ lane: 1, umbrella: 'ready' as Umbrella });
 const timing = useRef({ elapsed: 0, mask: 0, locked: false, step: 0, sweepImpact: 'clear' as Impact });
 const fuse = useRef<HTMLSpanElement>(null);
 const finished = useRef(false);
 const cue = waves[wave];
 const active = phase === 'warn' || phase === 'fire';
 const aiming = phase === 'warn' && cue.kind === 'lock' && !locked;
 const sweeping = phase === 'fire' && cue.kind === 'sweep';
 const canMove = phase === 'warn' || phase === 'intro' || sweeping;
 const canOpen = phase === 'warn' || (sweeping && sweepStep < cue.order.length - 1);
 const score = { hits: history.filter(item => item === 'hit').length, blocks };

 useEffect(() => {
  const change = () => setHidden(document.hidden);
  document.addEventListener('visibilitychange', change);
  return () => document.removeEventListener('visibilitychange', change);
 }, []);

 const beginWave = useCallback((index: number) => {
  timing.current = { elapsed: 0, mask: waves[index].mask, locked: false, step: 0, sweepImpact: 'clear' };
  setMask(waves[index].mask);
  setLocked(false);
  setImpact(undefined);
  setSweepStep(0);
  setWave(index);
  setPhase('warn');
  playSound('scan');
 }, [waves]);

 const strike = useCallback((strikeMask: number): Impact => {
  const open = player.current.umbrella === 'open';
  const caught = Boolean(strikeMask & (1 << player.current.lane));
  const result: Impact = caught ? (open ? 'blocked' : 'hit') : 'clear';
  setImpact(result);
  if (caught) playSound(open ? 'good' : 'bad');
  if (result === 'blocked') setBlocks(current => current + 1);
  if (open) {
   player.current.umbrella = 'spent';
   setUmbrella('spent');
  }
  return result;
 }, []);

 useEffect(() => {
  if (hidden || (phase !== 'warn' && phase !== 'fire')) return;
  let frame: number;
  let previous = performance.now();
  const tick = (now: number) => {
   if (document.hidden) return;
   const clock = timing.current;
   clock.elapsed += Math.min(80, Math.max(0, now - previous));
   previous = now;
   if (phase === 'warn') {
    if (fuse.current) fuse.current.style.transform = `scaleX(${Math.max(0, 1 - clock.elapsed / cue.warn)})`;
    if (cue.kind === 'lock' && cue.lockAt !== undefined && !clock.locked && clock.elapsed >= cue.lockAt) {
     clock.mask = 1 << player.current.lane;
     clock.locked = true;
     setMask(clock.mask);
     setLocked(true);
     playSound('scan');
    }
    if (clock.elapsed >= cue.warn) {
     const result = strike(clock.mask);
     if (cue.kind === 'sweep') clock.sweepImpact = result;
     else setHistory(items => [...items, result]);
     clock.elapsed = 0;
     setPhase('fire');
     return;
    }
   } else if (clock.elapsed >= (cue.kind === 'sweep' ? cue.stepMs : FLASH_MS)) {
    if (cue.kind === 'sweep') {
     const nextLane = cue.order[clock.step + 1];
     if (nextLane !== undefined) {
      clock.step++;
      clock.elapsed -= cue.stepMs;
      clock.mask = 1 << nextLane;
      clock.sweepImpact = strongerImpact(clock.sweepImpact, strike(clock.mask));
      setSweepStep(clock.step);
      setMask(clock.mask);
      frame = requestAnimationFrame(tick);
      return;
     }
     const result = clock.sweepImpact;
     setHistory(items => [...items, result]);
    }
    if (wave === waves.length - 1) setPhase('done');
    else beginWave(wave + 1);
    return;
   }
   frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
 }, [phase, wave, cue, hidden, waves.length, beginWave, strike]);

 const move = useCallback((next: number) => {
  if (hidden || !canMove) return;
  const lane = Math.max(0, Math.min(2, next));
  if (lane !== player.current.lane) setFacing(lane < player.current.lane ? 'left' : 'right');
  player.current.lane = lane;
  setLane(player.current.lane);
 }, [canMove, hidden]);

 const openUmbrella = useCallback(() => {
  if (hidden || !canOpen || player.current.umbrella !== 'ready') return;
  player.current.umbrella = 'open';
  setUmbrella('open');
  playSound('tap');
 }, [canOpen, hidden]);

 useEffect(() => {
  const onKey = (event: KeyboardEvent) => {
   if (!active || !canMove || event.altKey || event.ctrlKey || event.metaKey) return;
   const key = event.key.toLowerCase();
   if (key === 'arrowleft' || key === 'a') { event.preventDefault(); move(player.current.lane - 1); }
   if (key === 'arrowright' || key === 'd') { event.preventDefault(); move(player.current.lane + 1); }
   if (['1', '2', '3'].includes(key)) { event.preventDefault(); move(Number(key) - 1); }
   if (key === 'u') { event.preventDefault(); openUmbrella(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
 }, [active, canMove, move, openUmbrella]);

 function finish(result: PearlResult) {
  if (finished.current) return;
  finished.current = true;
  onFinish(result);
 }

 const laneNames = PEARL_LANES.filter((_, index) => Boolean(mask & (1 << index)));
 const status = hidden && active ? '切回这页再继续' : phase === 'intro' ? '对岸的塔亮了'
  : phase === 'done' ? pearlRank(score)
  : sweeping && impact === 'clear' ? `${laneNames[0]}扫过了，往它身后走`
  : phase === 'fire' ? IMPACT_TEXT[impact ?? 'clear']
  : aiming ? '它在瞄你，等红框锁住'
  : cue.kind === 'sweep' ? `${PEARL_LANES[cue.order[0]]}开始扫 · 红光过了就能跨回去`
  : cue.kind === 'double' ? `两道红光 · 去${PEARL_LANES.find((_, index) => !(mask & (1 << index)))}`
  : cue.kind === 'lock' ? `锁在${laneNames[0]}，快闪`
  : `${laneNames[0]}要被扫，换条道`;

 return <div className="laser-game">
  {!standalone && <>
   <div className="mini-eyebrow">魔都怪谈 · 外滩</div>
   <h2>四元柠檬水保卫战</h2>
   <p className="mini-lead">吸管刚插下去，对岸的灯就红了。</p>
  </>}
  <div className={'laser-arena phase-' + phase} data-cue={cue.kind}
   data-wave={wave + 1} data-mask={active && !aiming ? mask : 0}
   data-sweep-step={sweeping ? sweepStep + 1 : undefined} data-lock={aiming ? 'aiming' : locked ? 'locked' : undefined}>
   <img className="laser-backdrop" src={pearlPhoto('arena')} alt="" width={1536} height={1024} />
   <svg className="laser-floor" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
    {FLOOR_ZONES.map((points, index) => {
     const passed = sweeping && cue.order.slice(0, sweepStep).includes(index);
     const zone = active && (mask & (1 << index)) ? ' zone-danger' : aiming && lane === index ? ' zone-aiming' : passed ? ' zone-passed' : '';
     return <polygon key={index} points={points} className={'laser-zone' + zone} />;
    })}
   </svg>
   <div className="laser-status" data-impact={phase === 'fire' ? impact : undefined} data-aiming={aiming || undefined} aria-live="polite">
    {status}
    {phase === 'warn' && <span key={wave} ref={fuse} className="laser-countdown" />}
   </div>
   {phase === 'fire' && <svg key={sweeping ? sweepStep : wave} className="laser-beam" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
    {LANE_X.filter((_, index) => Boolean(mask & (1 << index))).map(x => {
     const blocked = impact === 'blocked' && (sweeping || x === LANE_X[lane]);
     const targetY = blocked ? 220 : 355;
     const line = `M ${TOWER_POINT.join(' ')} L ${x} ${targetY}`;
     return <g key={x}>
      <path className="beam-glow" d={line} />
      <path className="beam-core" d={line} />
      <ellipse className={blocked ? 'beam-hit beam-deflect' : 'beam-hit'} cx={x} cy={targetY} rx={blocked ? 22 : 30} ry={blocked ? 9 : 5} />
     </g>;
    })}
   </svg>}
   <div className={'laser-runner' + (phase === 'fire' && impact === 'hit' ? ' runner-hit' : '')}
    style={{ left: LANE_X[lane] / 6 + '%' }} data-facing={facing} aria-hidden="true">
    <img className="runner-image" src={pearlRunner(appearance)} alt="" />
    <img className="umbrella-canopy" src={pearlPhoto('umbrella')} alt=""
     hidden={umbrella !== 'open' && !(phase === 'fire' && impact === 'blocked')} />
   </div>
   <div className="laser-lanes">
    {PEARL_LANES.map((label, i) => <button key={label} type="button" aria-label={'移动到' + label} aria-pressed={lane === i}
     className={'laser-lane' + (active && (mask & (1 << i)) ? ' danger' : '') + (lane === i ? ' occupied' : '')}
     onClick={() => move(i)}>
     <span className="lane-number">{i + 1} · {label}</span>
    </button>)}
   </div>
  </div>
  <div className="laser-hud">
   <span>{wave + 1} / {waves.length} 轮</span>
   <ol className="laser-rounds" aria-label="本轮记录">
    {waves.map((_, index) => <li key={index} data-impact={history[index]} aria-current={active && index === wave ? 'step' : undefined}
     aria-label={history[index] ? IMPACT_TEXT[history[index]] : '还未经过'} />)}
   </ol>
   <span>洒了 {score.hits} 回</span>
   {phase === 'done' ? <span>挡住 {score.blocks} 回</span> : <button className="laser-umbrella" disabled={!canOpen || umbrella !== 'ready' || hidden}
    onClick={openUmbrella} aria-label="撑一次伞">{umbrella === 'ready' ? '撑一次伞' : umbrella === 'open' ? '伞已撑开' : '伞用过了'}</button>}
  </div>
  {phase === 'intro' && <div className="mini-options">
   <button className="primary" onClick={() => beginWave(0)}><Icon name="bolt" />拿稳柠檬水，开始躲</button>
   {!standalone && <>
    <button className="secondary" disabled={cash < 80} onClick={() => finish({ method: 'sleeve' })}>借个咖啡杯套伪装 · ¥80</button>
    <button className="text-button" onClick={() => finish({ method: 'neighbor' })}>喊路人搭把手</button>
   </>}
   <small>点步道或按 1 2 3 换位，按 U 撑伞。{rules === 3 && ' 等红光扫过，再跨回去。'}</small>
  </div>}
  {phase === 'done' && <div className="mini-options">
   <button className="primary" onClick={() => finish({ method: 'run', score })}>{standalone ? '拿走这张小票' : '喝完再走'} <Icon name="arrow" /></button>
  </div>}
 </div>;
}
