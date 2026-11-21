import { useEffect, useRef } from 'react';
import { advancePrologue } from '../game/pujiang';
import { openingScene } from '../game/pujiangPrologue';
import type { PujiangRoute } from '../game/pujiangTypes';
import type { GameState } from '../game/types';
import Icon from './Icon';
import './prologue-stage.css';

type Props = {
 route:PujiangRoute; game:GameState; onChange:(game:GameState)=>void;
 onPause:()=>void; audio:boolean; onAudio:()=>void;
};

export default function PrologueStage({route,game,onChange,onPause,audio,onAudio}:Props) {
 const {story,page,second,current,history}=openingScene(route,game.flags);
 const options=page==='question'?story.choices:page==='offer'?story.partings:[];
 const next=page==='entrance'?'meet':page==='reply'?'ask':page==='departure'?'leave':undefined;
 const journal=useRef<HTMLDialogElement>(null);
 const stage=useRef<HTMLElement>(null);
 const change=(action:string)=>onChange(advancePrologue(game,action));

 useEffect(()=>{
  // A disappearing choice must not leave keyboard focus in the city behind the scene.
  stage.current?.focus({preventScroll:true});
 },[page,route]);
 useEffect(()=>{
  const keys=(event:KeyboardEvent)=>{
   if(event.repeat||event.isComposing||event.metaKey||event.ctrlKey||event.altKey||journal.current?.open)return;
   const target=event.target as HTMLElement|null;
   if(target?.closest('input,textarea,select,[contenteditable=true]'))return;
   const chosen=event.key==='1'?options[0]:event.key==='2'?options[1]:undefined;
   if(chosen){event.preventDefault();change(chosen.id);}
   else if(next&&(event.key===' '||event.key==='Enter')&&!target?.closest('button,a,summary')){
    event.preventDefault();change(next);
   }
  };
  window.addEventListener('keydown',keys);
  return ()=>window.removeEventListener('keydown',keys);
 });
 function openHistory(){
  if(!journal.current?.open)journal.current?.showModal();
 }
 const destination=second?.id==='stay'?story.speaker+' · 信任 +3':'第一幕 · 调度 +1';
 return <article className="vn-stage" ref={stage} tabIndex={-1} data-route={route} data-mode="prologue" data-page={page} aria-label={story.title}>
  <img className="vn-scenery" src={story.photo} alt={story.alt} fetchPriority="high"/>
  <div className="vn-shade" aria-hidden="true"/>
  <div className="vn-frame" aria-hidden="true"/>
  <img className="vn-actor" src={'/art/prologue/'+route+'-actor.webp'} alt={story.speaker+'的半身立绘'} fetchPriority="high"/>
  <header className="vn-header">
   <div className="vn-mast"><span className="vn-seal" aria-hidden="true">沪</span><span>魔都人生</span></div>
   <nav aria-label="序章操作">
    <button type="button" aria-label={audio?'关闭声音':'打开声音'} title={audio?'关闭声音':'打开声音'} onClick={onAudio}><Icon name={audio?'sound':'mute'} size={17}/></button>
    <button type="button" onClick={openHistory}><Icon name="book" size={16}/><span>回看</span></button>
    <button type="button" onClick={onPause} aria-label="保存并回首页"><Icon name="save" size={16}/><span>存档离场</span></button>
   </nav>
  </header>
  <div className="vn-location"><i/>{story.place}<span>{story.clock}</span></div>
  <div className="vn-center">
   {page==='entrance'?<section className="vn-title" aria-label={story.title}>
    <div className="vn-chapter"><i/>序章 <span>/</span> {story.routeName}</div>
    <h2>{story.titleLines.map(line=><span key={line}>{line}</span>)}</h2>
    <p><b>1992</b><i/>{game.name} · 十八岁</p>
   </section>:options.length>0?<section className="vn-options" aria-label="选择你的回应">
    <h3><i/>你的回应</h3>
    {options.map((option,i)=><button type="button" key={option.id}
     data-pj-prologue={option.id} onClick={()=>change(option.id)}>
     <kbd>{i+1}</kbd><span>{option.label}</span><Icon name="chevron" size={15}/>
    </button>)}
   </section>:null}
  </div>
  <div className="vn-lower">
   <div className="vn-name"><b>{story.speaker}</b><i/><span>{story.role}</span></div>
   <section className="vn-paper" aria-label="对白">
    <div key={page} className="vn-line" aria-live="polite" aria-atomic="true">
     {current.action&&<p>{current.action}</p>}
     <blockquote>{current.line}</blockquote>
     {second&&<small className="vn-effect">{destination}</small>}
    </div>
    {next&&<button className="vn-next" type="button" data-vn-next={next} onClick={()=>change(next)}>
     <span>{page==='departure'?story.destination:'下一句'}</span><Icon name="arrow" size={19}/>
    </button>}
   </section>
   <footer><span className="vn-pages" aria-label={'当前第 '+history.length+' 段，共 5 段'}>{Array.from({length:5},(_,i)=><i key={i} data-on={i<history.length}/>)}</span>
    <button type="button" onClick={()=>change('skip')}>跳过序章 <span aria-hidden="true">»</span></button>
   </footer>
  </div>
  <dialog ref={journal} className="vn-history" aria-label="对白回看" onClick={event=>{if(event.target===journal.current)journal.current?.close();}}>
   <div><header><h3>对白回看</h3><button type="button" onClick={()=>journal.current?.close()} aria-label="回到对话"><Icon name="close" size={20}/></button></header>
    <ol>{history.map(beat=><li key={beat.id}>
     {beat.choice&&<p className="vn-history-player">{game.name} · {beat.choice}</p>}
     {beat.action&&<p>{beat.action}</p>}<b>{story.speaker}</b><p>{beat.line}</p>
    </li>)}</ol>
   </div>
  </dialog>
 </article>;
}
