import { useEffect, useRef, useState } from 'react';
import { PEARL_DELAYS, PEARL_LANES, pearlLanes, pearlRank, type PearlResult, type PearlScore } from '../game/pearl';
import { playSound } from '../game/audio';
import { pearlPhoto } from '../game/art';
import type { PlayerAppearance } from '../game/types';
import Icon from './Icon';
import { PlayerPortrait } from './Portrait';
import './pearl.css';

type Phase = 'intro' | 'warn' | 'fire' | 'done';
type Umbrella = 'ready' | 'open' | 'spent';

export default function LaserGame({seed, cash=0, appearance={gender:'female',looks:'everyday'}, age=18, standalone=false, onFinish}:{
 seed:string; cash?:number; appearance?:PlayerAppearance; age?:number; standalone?:boolean; onFinish:(result:PearlResult)=>void;
}){
 const [phase,setPhase]=useState<Phase>('intro');
 const [wave,setWave]=useState(0);
 const [lane,setLane]=useState(1);
 const [score,setScore]=useState<PearlScore>({hits:0,blocks:0});
 const [umbrella,setUmbrella]=useState<Umbrella>('ready');
 const [hidden,setHidden]=useState(document.hidden);
 const [impact,setImpact]=useState<'hit'|'blocked'|'clear'>('clear');
 const current=useRef({lane:1,umbrella:'ready' as Umbrella});
 const finished=useRef(false);
 const threat=pearlLanes(seed)[wave];

 useEffect(()=>{
  const change=()=>setHidden(document.hidden);
  document.addEventListener('visibilitychange',change);
  return()=>document.removeEventListener('visibilitychange',change);
 },[]);

 useEffect(()=>{
  if(hidden)return;
  if(phase==='warn'){
   const timer=setTimeout(()=>{
    const open=current.current.umbrella==='open';
    const caught=current.current.lane===threat;
    setImpact(caught ? (open?'blocked':'hit') : 'clear');
    if(caught){
     setScore(previous=>open?{...previous,blocks:previous.blocks+1}:{...previous,hits:previous.hits+1});
     playSound(open?'good':'bad');
    }
    if(open){current.current.umbrella='spent';setUmbrella('spent');}
    setPhase('fire');
   },PEARL_DELAYS[wave]);
   return()=>clearTimeout(timer);
  }
  if(phase==='fire'){
   const timer=setTimeout(()=>{
    if(wave===PEARL_DELAYS.length-1)setPhase('done');
    else{setWave(wave+1);setPhase('warn');}
   },370);
   return()=>clearTimeout(timer);
  }
 },[phase,wave,threat,hidden]);

 function move(next:number){
  if(phase!=='warn'&&phase!=='intro')return;
  current.current.lane=Math.max(0,Math.min(2,next));
  setLane(current.current.lane);
 }
 function openUmbrella(){
  if(phase!=='warn'||current.current.umbrella!=='ready')return;
  current.current.umbrella='open';
  setUmbrella('open');
 }
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(phase!=='warn'||event.altKey||event.ctrlKey||event.metaKey)return;
   const key=event.key.toLowerCase();
   if(key==='arrowleft'||key==='a'){event.preventDefault();move(current.current.lane-1);}
   if(key==='arrowright'||key==='d'){event.preventDefault();move(current.current.lane+1);}
   if(['1','2','3'].includes(key)){event.preventDefault();move(Number(key)-1);}
   if(key==='u'){event.preventDefault();openUmbrella();}
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[phase]);

 function finish(result:PearlResult){
  if(finished.current)return;
  finished.current=true;
  onFinish(result);
 }

 const status=phase==='intro'?'对岸的塔亮了':phase==='done'?pearlRank(score)
  : phase==='fire'?{hit:'洒出来了！',blocked:'伞面挨了一下',clear:'杯子还稳着'}[impact]
  : `${PEARL_LANES[threat]}要被扫，换条道`;
 return <div className="laser-game">
  {!standalone&&<div className="mini-eyebrow">魔都怪谈 · 外滩</div>}
  <h2>{standalone?'站哪条道':'四元柠檬水保卫战'}</h2>
  <p className="mini-lead">{standalone?'红灯亮了就换道，伞只能用一次。':'吸管刚插下去，对岸的灯就红了。'}</p>
  <div className={'laser-arena phase-'+phase}>
   <img className="laser-backdrop" src={pearlPhoto('arena')} alt="" width={1260} height={840} />
   <div className="laser-status" data-impact={phase==='fire'?impact:undefined} aria-live="polite">
    {status}
    {phase==='warn'&&!hidden&&<span className="laser-countdown" style={{animationDuration:PEARL_DELAYS[wave]+'ms'}}/>}
   </div>
   {phase==='fire'&&<svg className="laser-beam" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
    <path className="beam-glow" d={`M 300 98 L ${100+200*threat} 342`}/>
    <path className="beam-core" d={`M 300 98 L ${100+200*threat} 342`}/>
   </svg>}
   <div className="laser-lanes">
    {PEARL_LANES.map((label,i)=><button key={label} type="button" aria-label={'移动到'+label} aria-pressed={lane===i}
     className={'laser-lane'+(i===threat&&(phase==='warn'||phase==='fire')?' danger':'')+(lane===i?' occupied':'')}
     onClick={()=>move(i)}>
     {i===threat&&phase==='warn'&&<span className="laser-warning">要扫到</span>}
     {lane===i&&<span className={'tiny-player'+(umbrella==='open'?' under-umbrella':'')}>
      <PlayerPortrait appearance={appearance} size={42} age={age}/>
      {umbrella==='open'&&<span className="umbrella-mark" aria-hidden="true">伞</span>}
     </span>}
     <span className="lane-number">{i+1} · {label}</span>
    </button>)}
   </div>
  </div>
  <div className="laser-hud"><span>{Math.min(PEARL_DELAYS.length,wave+1)} / {PEARL_DELAYS.length} 轮</span><span>洒了 {score.hits} 回</span>
   {phase==='warn'||phase==='fire'?<button className="laser-umbrella" disabled={phase!=='warn'||umbrella!=='ready'} onClick={openUmbrella}
    aria-label="撑一次伞">{umbrella==='ready'?'撑一次伞':umbrella==='open'?'伞已撑开':'伞用过了'}</button>:<span>挡住 {score.blocks} 回</span>}
  </div>
  {phase==='intro'&&<div className="mini-options">
   <button className="primary" onClick={()=>setPhase('warn')}><Icon name="bolt"/>拿稳柠檬水，开始躲</button>
   {!standalone&&<>
    <button className="secondary" disabled={cash<80} onClick={()=>finish({method:'sleeve'})}>借个咖啡杯套伪装 · ¥80</button>
    <button className="text-button" onClick={()=>finish({method:'neighbor'})}>喊路人搭把手</button>
   </>}
   <small>点步道换位置。键盘可按 1 2 3 或 ← →，按 U 撑伞。</small>
  </div>}
  {phase==='done'&&<div className="mini-options">
   <button className="primary" onClick={()=>finish({method:'run',score})}>{standalone?'拿走这张小票':'喝完再走'} <Icon name="arrow"/></button>
  </div>}
 </div>;
}
