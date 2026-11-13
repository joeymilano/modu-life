import { useEffect, useRef } from 'react';
import { showdownView, type Showdown, type Move } from '../game/showdowns';
import Icon from './Icon';
import './showdown.css';

export default function ShowdownStage({game,photo,intro,ranked,busy,onMove,onDone}:{
 game:Showdown; photo?:string; intro?:string; ranked?:boolean; busy?:boolean;
 onMove:(move:Move)=>void; onDone:()=>void;
}) {
 const view=showdownView(game);
 const focus=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const stage=focus.current?.closest('.showdown-stage');
  stage?.closest('.modal')?.scrollTo({top:0});
  focus.current?.focus({preventScroll:true});
 },[game.moves.length,game.route,game.age]);
 return <article className="showdown-stage">
  {photo&&<figure className="showdown-frame"><img src={photo} alt=""/></figure>}
  <section className="showdown-body">
   <div className="showdown-kicker">
    <span>{ranked?'本周排位':'主线任务'}</span>
    <span>{view.verdict?'已结算':`剩余 ${4-view.round} 回合`}</span>
   </div>
   <h2 ref={focus} tabIndex={-1}>{view.verdict?{win:'任务拿下',partial:'保住一部分',loss:'对手抢先一步'}[view.verdict]:view.scene.title}</h2>
   {!view.verdict&&<p className="showdown-goal">{view.scene.goal}</p>}
   {game.moves.length===0&&<p className="showdown-intro">{intro??view.scene.intro}</p>}
   {view.recent.length>0&&<ol className="showdown-beats" aria-live="polite">
    {view.recent.map((beat,i)=><li key={beat} data-rival={i===1&&!view.verdict}>{beat}</li>)}
   </ol>}
   {view.assets.length>0&&!view.verdict&&<ul className="showdown-assets" aria-label="手上的筹码">
    {view.assets.map(asset=><li key={asset}>{asset}</li>)}
   </ul>}
   {view.verdict?<div className="showdown-result">
    {ranked&&<dl className="showdown-score"><div><dt>本场积分</dt><dd>{view.score}</dd></div>
     {view.scorecard?.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.points}</dd></div>)}</dl>}
    <button type="button" className="primary" onClick={onDone}>{ranked?'查看排名':'回到街上'}<Icon name="arrow" size={17}/></button>
   </div>:<div className="showdown-actions">
    {view.options.map(option=><button type="button" data-move={option.id} key={option.id} disabled={busy} onClick={()=>onMove(option.id)}>
     <span><b>{option.label}</b><small>{option.hint}</small></span><Icon name="chevron" size={17}/>
    </button>)}
   </div>}
  </section>
 </article>;
}
