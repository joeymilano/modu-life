import { useEffect, useRef, useState } from 'react';
import type { Career, CastMember, Effect } from '../game/types';
import { hashSeed } from '../game/engine';
import Icon from './Icon';
import { Portrait } from './Portrait';

export function LaserGame({seed,cash,onFinish}:{seed:string;cash:number;onFinish:(effect:Effect,text:string)=>void}){
 const [phase,setPhase]=useState<'intro'|'warn'|'fire'|'done'>('intro'),[wave,setWave]=useState(0),[lane,setLane]=useState(1),[hits,setHits]=useState(0);
 const current=useRef(lane);current.current=lane;const hitRef=useRef(0),finished=useRef(false);const threat=hashSeed(seed+':laser:'+wave)%3;
 useEffect(()=>{if(phase==='warn'){const timer=setTimeout(()=>{if(current.current===threat){hitRef.current++;setHits(hitRef.current);}setPhase('fire');},wave<2?1500:1050);return()=>clearTimeout(timer);}if(phase==='fire'){const timer=setTimeout(()=>{if(wave>=4)setPhase('done');else{setWave(w=>w+1);setPhase('warn');}},450);return()=>clearTimeout(timer);}},[phase,wave,threat]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(phase!=='warn')return;if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();setLane(l=>Math.max(0,l-1));}if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();setLane(l=>Math.min(2,l+1));}if(['1','2','3'].includes(e.key))setLane(Number(e.key)-1);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[phase]);
 const finish=(effect:Effect,text:string)=>{if(finished.current)return;finished.current=true;onFinish({...effect,setFlags:['laser_done',...(effect.setFlags||[])]},text);};
 return <div className="laser-game"><div className="mini-eyebrow">城市怪谈 / 外滩限定</div><h2>四元柠檬水保卫战</h2><p className="mini-lead">吸管刚插进去，对岸的塔红了。<br/>“不是吧，我就喝一口。”</p>
 <div className={'laser-arena phase-'+phase}>
 <div className="laser-skyline"><span/><span/><span/><span/><span/></div><div className="laser-tower"><i className="tower-needle"/><i className="tower-ball top"/><i className="tower-stem"/><i className="tower-ball bottom"/><i className="tower-feet"/></div>
 <div className="laser-status">{phase==='intro'?'消费记录异常，正在扫描':phase==='done'?'扫描结束，你还在上海':phase==='warn'?'红色区域即将被扫到，快换位置！':'侬好，防御塔已上线'}</div>
 <div className="laser-lanes">{[0,1,2].map(i=><button key={i} aria-label={'移动到'+['左侧','中间','右侧'][i]} className={'laser-lane '+(i===threat&&phase!=='intro'&&phase!=='done'?'danger ':'')+(lane===i?'occupied':'')} onClick={()=>setLane(i)}>{i===threat&&phase==='fire'&&<span className="beam"/>}{lane===i&&<span className="tiny-player"><b/><i/><em>柠檬水</em></span>}<span className="lane-number">{i+1}</span></button>)}</div>
 <div className="laser-hud"><span>第 {Math.min(5,wave+1)} / 5 轮</span><span>擦伤 {hits} 次</span></div></div>
 {phase==='intro'?<div className="mini-options"><button className="primary" onClick={()=>setPhase('warn')}><Icon name="bolt"/>拿稳奶茶，试试走位</button><button className="secondary" disabled={cash<80} onClick={()=>finish({cash:-80,face:5,spirit:3},'你花八十块买了个咖啡杯套。防御塔放行了，你的预算不太高兴。杯子里还是四元柠檬水。')}>借个咖啡杯套伪装 · ¥80</button><button className="text-button" onClick={()=>finish({network:8,spirit:7,face:-2},'旁边的人递来一把伞，顺手给你指了条路。你问怎么谢，他说下次帮别人挡一挡就行。')}>喊路人搭把手</button><small>点击三条步道换位置，或按 ← → / 1 2 3。先看红色预警。</small></div>:phase==='done'?<div className="mini-options"><p>{hits===0?'一滴没洒。省下来的钱，和刚才那点勇气，都是你的。':hits<=2?'袖口蹭黑了，柠檬水还剩大半杯。也算赚到。':'刚才走位不太灵。好在路人把你拉了回来，人生没有因此结束。'}</p><button className="primary" onClick={()=>finish({health:-hits*3,spirit:12-hits*2,face:8-hits,network:hits>=3?5:2,setFlags:hits===0?['laser_master']:[]},hits===0?'你躲过了五轮扫描，四元柠檬水一滴没洒。有人鼓掌，有人问你教程发哪里。你说：下次带个杯套也行。':`扫描结束。你擦伤了${hits}次，路人帮你掸了掸灰。“来都来了，喝完再走。”`)}>继续在上海生活 <Icon name="arrow"/></button></div>:<p className="mini-help">点步道移动 · 红色预告 → 激光扫过 · 剩下 {5-wave} 轮</p>}</div>;
}

type Answer={label:string;reply:string;points:number;cost?:number};
type Question={text:string;answers:Answer[]};
function romanceQuestions(person:CastMember):Question[]{
 const trait=person.trait;
 return [
 {text:person.name+'问：“周末你一般怎么过？”',answers:[
  {label:'补觉，买菜。有时就窝着。',reply:trait==='security'?'“蛮好的，日子得过稳一点。”':'“原来你也有不发朋友圈的周末。”',points:trait==='security'||trait==='sincerity'?2:0},
  {label:'忙自己的东西，但会留时间见人。',reply:trait==='ambition'?'“下次给我看看你做的东西？”':'“留时间这件事，比说有空靠谱。”',points:trait==='ambition'||trait==='freedom'?2:0},
  {label:'先问你想干嘛，再一起定。',reply:trait==='freedom'?'“可以，不过你自己的想法也要讲。”':'“那我们别把行程排太满。”',points:trait==='humor'||trait==='sincerity'?2:0}
 ]},
 {text:'原定的店要排一个半小时，对方看了看表。',answers:[
  {label:'找家附近的普通店，吃好再散步。',reply:'“我其实已经很饿了。”气氛松下来一点。',points:trait==='security'||trait==='humor'?2:0},
  {label:'问问对方，是想等还是换一家。',reply:'对方认真想了一下，把手机收了起来。',points:trait==='freedom'||trait==='sincerity'?2:0},
  {label:'订个不用排队的位置 · ¥300',reply:'安排妥了。对方也问了一句：“这样会不会超预算？”',points:trait==='ambition'?2:0,cost:300}
 ]},
 {text:person.name+'说：“讲个你最近有点烦的事吧。”',answers:[
  {label:'讲一件真的，哪怕不太光鲜。',reply:'这次对方没有急着安慰，先问了一个很具体的问题。',points:trait==='sincerity'||trait==='security'?2:0},
  {label:'先自嘲两句，再讲实情。',reply:'对方笑了一下，又认真听你讲完。',points:trait==='humor'?2:0},
  {label:'讲讲我在试的办法，也问问对方。',reply:'你们一起补了几个办法，话题终于不再像面试。',points:trait==='ambition'||trait==='freedom'?2:0}
 ]}
 ];
}
function interviewQuestions(career:Career):Question[]{return [
 {text:'负责人翻开简历：“先讲一个你真的做过的项目。”',answers:[
 {label:'讲清楚问题、我的部分和最后结果。',reply:'对方停下翻页，追问了一个细节。',points:2},
 {label:'先讲我参与过的大项目和大客户。',reply:'“那里面，你具体负责什么？”',points:0},
 {label:'拿出一份小作品，承认还有哪里没做好。',reply:'项目不大，但过程说得通。',points:2}]},
 {text:'“明天就要交，今天又加了两个需求。你怎么办？”',answers:[
 {label:'先承诺都能做，回去再想办法。',reply:'对方点了点头，表情看不出在想什么。',points:0},
 {label:'问清轻重，给出可交付的两种方案。',reply:'“可以，具体说说你会砍哪一部分。”',points:2},
 {label:'说明边界，提出需要谁协助。',reply:'对方把项目排期拿了出来。',points:1}]},
 {text:'“你还有什么想问我们的？”',answers:[
 {label:'问岗位目标、薪酬和实际作息。',reply:'问题很实在，对方也开始认真谈条件。',points:2},
 {label:'问做这份工作的人，最近最难解决什么。',reply:'对方笑了一下：“这个问题问得蛮好。”',points:2},
 {label:'都可以，我比较能吃苦。',reply:'“明白了。”这句结束得有点快。',points:0}]}
];}
export function DialogueGame({person,career,skill,cash,onFinish}:{person?:CastMember;career?:Career;skill:number;cash:number;onFinish:(effect:Effect,text:string)=>void}){
 const [round,setRound]=useState(0),[selected,setSelected]=useState<number|null>(null),[points,setPoints]=useState(0),[spent,setSpent]=useState(0);const questions=person?romanceQuestions(person):interviewQuestions(career!);const question=questions[round];const a=selected===null?null:question.answers[selected];
 function next(){if(!a)return;const score=points+a.points,cost=spent+(a.cost||0);if(round<2){setPoints(score);setSpent(cost);setRound(r=>r+1);setSelected(null);}else if(person){onFinish({cash:-cost,trust:score*3-2,attraction:score*4-5,commitment:score>=5?4:0,spirit:score>=4?6:-2},score>=5?`和${person.name}的这次见面，没有急着给彼此打分。你们约了下次。临走时，对方还记得提醒你那件没讲完的烦心事。`:`和${person.name}聊完，知道了对方一点习惯，也发现自己还有些话没说清。关系慢慢来。`);}else{const success=score+skill/25>=5.5;onFinish({job:success?career!.id:undefined,skill:success?4:7,face:success?5:1,spirit:success?8:-3},success?`拿到了${career!.entry}的机会。月薪从 ¥${career!.salary.toLocaleString()} 起，细节都谈清楚了。走出楼门，你终于不是只会刷招聘软件的人。`:'这次没拿到offer。对方给了两个具体意见，你把它们记了下来。下次至少知道从哪里讲起。');}}
 return <div className="dialogue-game"><div className="mini-eyebrow">{person?'好好见一面 / '+person.title:'面试现场 / '+career?.name}</div><div className="dialogue-head">{person?<Portrait person={person} size={86}/>:<div className="interview-badge"><Icon name="case" size={37}/></div>}<div><h2>{person?person.name:'讲点真本事'}</h2><p>{person?person.description:'漂亮话可以少一点，把事讲明白。'}</p></div></div><div className="round-dots">{questions.map((_,i)=><span key={i} className={i<=round?'done':''}/>)}<small>第 {round+1} / 3 轮</small></div><div className="dialogue-question">{question.text}</div><div className="dialogue-answers">{question.answers.map((ans,i)=><button key={i} disabled={selected!==null||cash<spent+(ans.cost||0)} className={selected===i?'picked':''} onClick={()=>setSelected(i)}><span>{String.fromCharCode(65+i)}</span>{ans.label}<Icon name="chevron" size={16}/></button>)}</div>{a&&<div className="dialogue-reply"><p>{a.reply}</p><button className="primary" onClick={next}>{round===2?'看看这次怎么样':'接着聊'}<Icon name="arrow" size={17}/></button></div>}</div>;
}

export function RentalGame({cash,onFinish}:{cash:number;onFinish:(effect:Effect,text:string)=>void}){
 const [clues,setClues]=useState<string[]>([]);const toggle=(s:string)=>setClues(x=>x.includes(s)?x.filter(i=>i!==s):[...x,s]);
 return <div className="rental-game"><div className="mini-eyebrow">看房实战 / 莘庄</div><h2>房子有潜力，钱包没有。</h2><p className="mini-lead">“采光蛮好，住过的人都说好。”<br/>先点开三个细节，再决定签不签。</p><div className="room-scene"><div className="room-window"><i/><i/></div><div className="room-bed"><i/><b/></div><div className="room-plant"/><button className={'clue c1 '+(clues.includes('wall')?'found':'')} onClick={()=>toggle('wall')}><Icon name="eye" size={18}/>墙角</button><button className={'clue c2 '+(clues.includes('contract')?'found':'')} onClick={()=>toggle('contract')}><Icon name="eye" size={18}/>合同</button><button className={'clue c3 '+(clues.includes('window')?'found':'')} onClick={()=>toggle('window')}><Icon name="eye" size={18}/>窗外</button></div>
 <div className="clue-list">{clues.includes('wall')&&<p><b>墙角：</b>刚刷过，手摸上去却有点潮。</p>}{clues.includes('contract')&&<p><b>合同：</b>口头月付，纸上写着一次付半年。</p>}{clues.includes('window')&&<p><b>窗外：</b>窗一开，楼下排风机的声音就来了。</p>}</div><div className="mini-options"><button className="primary" disabled={cash<6000} onClick={()=>onFinish(clues.length>=2?{cash:-6000,housing:1,skill:6,spirit:8}:{cash:-6000,housing:1,health:-8,spirit:-5},clues.length>=2?'你把问题一条条写进补充约定，谈成月付，也确认了排风机停机时间。房子不完美，条件至少是你谈明白的。':'合同签得有点急。搬进来才发现口头保证不太顶用，你开始补学看房这门课。')}>{clues.length>=2?'把问题谈清楚再租':'先签了再说'} · ¥6,000</button><button className="secondary" onClick={()=>onFinish({skill:7,spirit:3,network:2},'你没签。方姐收起合同，说下次看房也照这个劲头。今天少一把钥匙，多一点判断力。')}>这间不合适，再找找</button><small>看过 {clues.length} / 3 处。所有线索都能免费检查。</small></div></div>;
}

