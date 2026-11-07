import { useEffect, useRef, useState } from 'react';
import type { Career, CastMember, Effect, PlayerAppearance } from '../game/types';
import { finishDate, romanceQuestions, type Question } from '../game/dates';
import { datePhoto, workPhoto } from '../game/art';
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

function interviewOpening(text:string, practical:[string,string], bluff:[string,string], alternative:[string,string]):Question{
 return {text,answers:[practical,bluff,alternative].map(([label,reply],index)=>({label,reply,points:[2,0,1][index]}))};
}

const interviewStarts:Record<string,Question>={
 tech:interviewOpening('负责人把简历放下。「上回上线出问题，你先干了什么？」',
  ['说清怎么复现、怎么把影响停住','对方把电脑转过来，让你指一个会先看的地方。'],
  ['讲团队熬了多久，先别提哪段是我写的','「你负责哪段？」对方问第二遍的时候已经放下了笔。'],
  ['拿一个小项目讲我犯过的错','项目很小。他听到你怎么发现错误时，把笔又拿起来了。']),
 creative:interviewOpening('桌上摆着三张海报。她点第一张，说客户改了七次之后又想用它。',
  ['问第一张为什么被改，拿出两版对着讲','她把最后一版抽回来，发现活动时间早就改了。'],
  ['说客户爱哪张就交哪张','她问那谁负责把三张的日期查一遍。'],
  ['先问客户最想保住哪个地方','她指了指主图，说终于有人问这句了。']),
 finance:interviewOpening('他把两张表叠在一起推过来。「总额一样。可我觉得这两张都错了。」',
  ['顺着其中一笔查回原始记录','你找到了一笔被抄了两遍的款。他把另外一张也摊开了。'],
  ['总额一样，先把表发出去','他把光标移到收件人栏，问你敢不敢用自己的名字发。'],
  ['先找口径不同的列','你圈出了一个含税数。他问这列是谁给你的。']),
 service:interviewOpening('吴师傅把两张面单放在柜台上。「一桌等了二十分钟，另一桌先端到了。你先找谁？」',
  ['先跟在等的人讲清楚，再去后厨确认','他把后厨那张翻过来，背面还有一行不放葱。'],
  ['先把现成的端给等得久的那桌','「那人家不吃葱，你这一碗怎么交？」'],
  ['先问后厨再几分钟能出锅','他报了个时间，接着问你怎么把这句话说给客人听。']),
 public:interviewOpening('负责人指着两份报修单。楼上说漏水没找他，楼下说他敲过三次门。',
  ['约两家在同一时间到场，先弄清水从哪来','她把维修师傅的号码圈了出来。'],
  ['让他们自己商量好，再一起回来','她说他们自己商量了一个礼拜，才到这里。'],
  ['先各自打电话，把时间和照片对上','她拿起电话，让你先听一通。']),
 freelance:interviewOpening('对方翻完作品，说方案蛮好。今天能不能先把源文件发过去，合同下礼拜补？',
  ['先给可看的样稿，签完再交源文件','他盯着预览图看了一会儿，把法务拉进了群。'],
  ['文件先发，显得好说话','他立刻问另外三版能不能也打个包。'],
  ['拆成两次交，先写清第一份给什么','他说今晚能先定这一部分。']),
 business:interviewOpening('店里排了六个人，收款码忽然打不开。吴师傅问你准备先贴什么在门口。',
  ['把能收款的办法和等多久先写清楚','排队的人看完散了两个，剩下的自己把零钱找出来了。'],
  ['照常接单，结账的时候再想办法','他问最后一位排半小时才知道付不了，会说什么。'],
  ['先暂停新单，把排着的几份做完','他问你能不能把这句话说给刚进门的人听。']),
 trade:interviewOpening('客户说下周签合同，今天就想让仓库先留货。经理问你给仓库怎么写。',
  ['确认数量和保留期限，留货条件让客户也确认','他把仓库那封邮件抄送给你，说可以开始谈。'],
  ['让仓库全留，客户都说下周签了','他翻了翻上周那封一模一样的邮件。'],
  ['先问哪些货可以少留几天','他说这个能问，接着问拿什么换这几天。']),
};

function interviewQuestions(career:Career):Question[]{return [
 interviewStarts[career.id],
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
 const shot=person?datePhoto(person.id,'meeting'):career?workPhoto(['service','business'].includes(career.id)?'interview-shop':'interview-office'):null;
 const showShot=shot&&(!person||round>0);
 const questions=person?romanceQuestions(person,flags):interviewQuestions(career!);
 const question=questions[round];
 const answer=selected===null?null:question.answers[selected];

 useEffect(()=>{
  if(!shot||!person)return;
  const preload=new Image();
  preload.src=shot;
 },[shot,person]);

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
  {shot&&<div className="date-visual">
   {person&&!shotReady&&<Portrait person={person} full/>}
   {showShot&&<img className={'date-shot'+(shotReady?' visible':'')} src={shot} alt=""
    onLoad={()=>setShotReady(true)}/>}
   <div className="date-visual-caption"><b>{person?.name??career?.name}</b>{person&&<small>{person.title}</small>}</div>
  </div>}
  <div className="dialogue-content">
   {!person&&<div className="mini-eyebrow">{career?.name}</div>}
   <div className="dialogue-head">
    {!person&&!shot&&<div className="interview-badge"><Icon name="case" size={37}/></div>}
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

