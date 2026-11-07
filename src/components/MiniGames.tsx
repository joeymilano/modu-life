import { useEffect, useRef, useState } from 'react';
import type { Career, CastMember, Effect, PlayerAppearance } from '../game/types';
import { finishDate, romanceQuestions, type Question } from '../game/dates';
import { datePhoto } from '../game/art';
import { hashSeed } from '../game/engine';
import Icon from './Icon';
import { Portrait, PlayerPortrait } from './Portrait';

export function LaserGame({seed,cash,appearance={gender:'male',looks:'everyday'},age=18,onFinish}:{seed:string;cash:number;appearance?:PlayerAppearance;age?:number;onFinish:(effect:Effect,text:string)=>void}){
 const [phase,setPhase]=useState<'intro'|'warn'|'fire'|'done'>('intro'),[wave,setWave]=useState(0),[lane,setLane]=useState(1),[hits,setHits]=useState(0);
 const current=useRef(lane);current.current=lane;const hitRef=useRef(0),finished=useRef(false);const threat=hashSeed(seed+':laser:'+wave)%3;
 useEffect(()=>{if(phase==='warn'){const timer=setTimeout(()=>{if(current.current===threat){hitRef.current++;setHits(hitRef.current);}setPhase('fire');},wave<2?1500:1050);return()=>clearTimeout(timer);}if(phase==='fire'){const timer=setTimeout(()=>{if(wave>=4)setPhase('done');else{setWave(w=>w+1);setPhase('warn');}},450);return()=>clearTimeout(timer);}},[phase,wave,threat]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(phase!=='warn')return;if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();setLane(l=>Math.max(0,l-1));}if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();setLane(l=>Math.min(2,l+1));}if(['1','2','3'].includes(e.key))setLane(Number(e.key)-1);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[phase]);
 const finish=(effect:Effect,text:string)=>{if(finished.current)return;finished.current=true;onFinish({...effect,setFlags:['laser_done',...(effect.setFlags||[])]},text);};
 return <div className="laser-game"><div className="mini-eyebrow">城市怪谈 / 外滩限定</div><h2>四元柠檬水保卫战</h2><p className="mini-lead">吸管刚插进去，对岸的塔红了。<br/>“不是吧，我就喝一口。”</p>
 <div className={'laser-arena phase-'+phase}>
 <div className="laser-status">{phase==='intro'?'消费记录异常，正在扫描':phase==='done'?'扫描结束，你还在上海':phase==='warn'?'红色区域即将被扫到，快换位置！':'侬好，防御塔已上线'}</div>
 <div className="laser-lanes">{[0,1,2].map(i=><button key={i} aria-label={'移动到'+['左侧','中间','右侧'][i]} aria-pressed={lane===i} className={'laser-lane '+(i===threat&&phase!=='intro'&&phase!=='done'?'danger ':'')+(lane===i?'occupied':'')} onClick={()=>setLane(i)}>{i===threat&&phase==='fire'&&<span className="beam"/>}{lane===i&&<span className="tiny-player"><PlayerPortrait appearance={appearance} size={42} age={age}/></span>}<span className="lane-number">{i+1}</span></button>)}</div>
 <div className="laser-hud"><span>第 {Math.min(5,wave+1)} / 5 轮</span><span>擦伤 {hits} 次</span></div></div>
 {phase==='intro'?<div className="mini-options"><button className="primary" onClick={()=>setPhase('warn')}><Icon name="bolt"/>拿稳柠檬水，开始躲</button><button className="secondary" disabled={cash<80} onClick={()=>finish({cash:-80,face:5,spirit:3},'你花八十块套上咖啡杯套。红光扫了一圈，放行了。吸管里还是那口四元柠檬水。')}>借个咖啡杯套伪装 · ¥80</button><button className="text-button" onClick={()=>finish({network:8,spirit:7,face:-2},'路人一看你手里的杯子，熟练地撑开伞，把你拉进阴影里。伞上贴着六个字，蜜雪用户专用。')}>喊路人搭把手</button><small>点击三条步道换位置，或按 ← → / 1 2 3。先看红色预警。</small></div>:phase==='done'?<div className="mini-options"><p>{hits===0?'一滴没洒，冰块都还在':hits<=2?'袖口蹭黑了，柠檬水还剩大半杯。也算赚到。':'路人把你拉回来，看了看杯子，说下次换个袋子装'}</p><button className="primary" onClick={()=>finish({health:-hits*3,spirit:12-hits*2,face:8-hits,network:hits>=3?5:2,setFlags:hits===0?['laser_master']:[]},hits===0?'你躲过了五轮扫描，四元柠檬水一滴没洒。有人鼓掌，有人问你教程发哪里。你说下次带个杯套也行。':`扫描结束。你擦伤了${hits}次，路人帮你掸了掸灰。“来都来了，喝完再走。”`)}>喝完再走 <Icon name="arrow"/></button></div>:<p className="mini-help">点步道移动 · 红色预告 → 激光扫过 · 剩下 {5-wave} 轮</p>}</div>;
}

function interviewQuestions(career:Career):Question[]{return [
 {text:'负责人翻开简历：“先讲一个你真的做过的项目。”',answers:[
 {label:'讲我负责哪块，做完有什么结果',reply:'对方停下翻页，追问了一个细节。',points:2},
 {label:'先讲我参与过的大项目和大客户。',reply:'“那里面，你具体负责什么？”',points:0},
 {label:'拿出一份小作品，承认还有哪里没做好。',reply:'项目不大，但过程说得通。',points:2}]},
 {text:'“明天就要交，今天又加了两个需求。你怎么办？”',answers:[
 {label:'先承诺都能做，回去再想办法。',reply:'对方点了点头，表情看不出在想什么。',points:0},
 {label:'让他选，明天先交哪一版',reply:'“可以，具体说说你会砍哪一部分。”',points:2},
 {label:'说清一个人做不完，需要谁帮忙',reply:'对方把项目排期拿了出来。',points:1}]},
 {text:'“你还有什么想问我们的？”',answers:[
 {label:'问岗位目标、薪酬和实际作息。',reply:'对方把薪酬表转过来，指了指其中一行。',points:2},
 {label:'问做这份工作的人，最近最难解决什么。',reply:'对方笑了一下：“这个问题问得蛮好。”',points:2},
 {label:'都可以，我比较能吃苦。',reply:'“明白了。”这句结束得有点快。',points:0}]}
];}
export function DialogueGame({person,career,skill,cash,flags,onFinish}:{
 person?:CastMember;career?:Career;skill:number;cash:number;flags:string[];onFinish:(effect:Effect,text:string)=>void;
}){
 const [round,setRound]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [points,setPoints]=useState(0);
 const [spent,setSpent]=useState(0);
 const [shotReady,setShotReady]=useState(false);
 const shot=person?datePhoto(person.id,'meeting'):null;
 const questions=person?romanceQuestions(person,flags):interviewQuestions(career!);
 const question=questions[round];
 const answer=selected===null?null:question.answers[selected];

 useEffect(()=>{
  if(!shot)return;
  const preload=new Image();
  preload.src=shot;
 },[shot]);

 function next(){
  if(!answer)return;
  const score=points+answer.points,cost=spent+(answer.cost||0);
  if(round<2){
   setPoints(score);setSpent(cost);setRound(round+1);setSelected(null);
   return;
  }
  if(person){
   const result=finishDate(person,answer,score,cost);
   onFinish(result.effect,result.text);
   return;
  }
  const success=score+skill/25>=5.5;
  onFinish({job:success?career!.id:undefined,skill:success?4:7,face:success?5:1,spirit:success?8:-3},
   success?`拿到${career!.entry}的offer，月薪 ¥${career!.salary.toLocaleString()} 起。你走出楼门，给家里发了张截图。`:
   '没拿到offer。电梯里，你把答得最差的那道题记进手机，准备回去再练一遍。');
 }

 return <div className="dialogue-game">
  {person&&<div className="date-visual">
   {!shotReady&&<Portrait person={person} full/>}
   {round>0&&shot&&<img className={'date-shot'+(shotReady?' visible':'')} src={shot} alt=""
    onLoad={()=>setShotReady(true)}/>}
   <div className="date-visual-caption"><b>{person.name}</b><small>{person.title}</small></div>
  </div>}
  <div className="dialogue-content">
   {!person&&<div className="mini-eyebrow">{career?.name}</div>}
   <div className="dialogue-head">
    {!person&&<div className="interview-badge"><Icon name="case" size={37}/></div>}
    <div><h2>{person?person.name:'面试'}</h2>{person&&<p>{person.title}</p>}</div>
   </div>
   <div className="round-dots">{questions.map((_,i)=><span key={i} className={i<=round?'done':''}/>)}
    <small>{person?['碰面','聊到一半','临走前'][round]:'第 '+(round+1)+' / 3 轮'}</small>
   </div>
   <div className="dialogue-question" aria-live="polite">{question.text}</div>
   <div className="dialogue-answers">{question.answers.map((ans,i)=>
    <button key={i} disabled={selected!==null||cash<spent+(ans.cost||0)} className={selected===i?'picked':''}
     onClick={()=>setSelected(i)}><span>{String.fromCharCode(65+i)}</span>{ans.label}{ans.cost?' · ¥'+ans.cost:''}<Icon name="chevron" size={16}/></button>)}
   </div>
   {answer&&<div className="dialogue-reply"><p>{answer.reply}</p>
    <button className="primary" onClick={next}>{round===2?'看看这次怎么样':'接着聊'}<Icon name="arrow" size={17}/></button>
   </div>}
  </div>
 </div>;
}

export function RentalGame({cash,onFinish}:{cash:number;onFinish:(effect:Effect,text:string)=>void}){
 const [clues,setClues]=useState<string[]>([]);const toggle=(s:string)=>setClues(x=>x.includes(s)?x.filter(i=>i!==s):[...x,s]);
 return <div className="rental-game"><div className="mini-eyebrow">看房实战 / 莘庄</div><h2>这房子能住伐</h2><p className="mini-lead">“采光蛮好，住过的人都说好。”<br/>点开墙角、合同和窗外看看</p><div className="room-scene"><img src="/art/encounters/rental.webp" alt="一间待租的上海卧室，窗外有排风机，桌上放着合同"/><button className={'clue c1 '+(clues.includes('wall')?'found':'')} aria-pressed={clues.includes('wall')} onClick={()=>toggle('wall')}><Icon name="eye" size={18}/>墙角</button><button className={'clue c2 '+(clues.includes('contract')?'found':'')} aria-pressed={clues.includes('contract')} onClick={()=>toggle('contract')}><Icon name="eye" size={18}/>合同</button><button className={'clue c3 '+(clues.includes('window')?'found':'')} aria-pressed={clues.includes('window')} onClick={()=>toggle('window')}><Icon name="eye" size={18}/>窗外</button></div>
 <div className="clue-list">{clues.includes('wall')&&<p><b>墙角</b> 刚刷过，手摸上去却有点潮。</p>}{clues.includes('contract')&&<p><b>合同</b> 口头月付，纸上写着一次付半年。</p>}{clues.includes('window')&&<p><b>窗外</b> 窗一开，楼下排风机的声音就来了。</p>}</div><div className="mini-options"><button className="primary" disabled={cash<6000} onClick={()=>onFinish(clues.length>=2?{cash:-6000,housing:1,skill:6,spirit:8}:{cash:-6000,housing:1,health:-8,spirit:-5},clues.length>=2?'潮湿和排风机都写进了补充约定，租金改成月付。你转完钱，方姐把钥匙递过来。':'搬进去那晚，排风机一直响到十一点。你翻开合同，没找到中介答应过的那一条。')}>{clues.length>=2?'把问题谈清楚再租':'先签了再说'} · ¥6,000</button><button className="secondary" onClick={()=>onFinish({skill:7,spirit:3,network:2},'你没签。方姐收起合同，又翻出一套房源，问你明天上午有空伐。')}>这间不合适，再找找</button><small>看过 {clues.length} / 3 处</small></div></div>;
}

