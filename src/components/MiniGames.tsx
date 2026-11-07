import { useEffect, useState } from 'react';
import type { Career, CastMember, Effect, FirstDatePicks } from '../game/types';
import { romanceQuestions, type Question } from '../game/dates';
import { datePhoto, workPhoto } from '../game/art';
import Icon from './Icon';
import { Portrait } from './Portrait';

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
type DialogueProps = {skill:number;cash:number;flags:string[]} & (
 {person:CastMember;career?:never;onParting:(picks:FirstDatePicks)=>void;onFinish?:never} |
 {person?:never;career:Career;onParting?:never;onFinish:(effect:Effect,text:string)=>void}
);

export function DialogueGame({person,career,skill,cash,flags,onFinish,onParting}:DialogueProps){
 const [picks,setPicks]=useState<number[]>([]);
 const [selected,setSelected]=useState<number|null>(null);
 const [shotReady,setShotReady]=useState(false);
 const round=picks.length;
 const shot=person?datePhoto(person.id,'meeting'):workPhoto(['service','business'].includes(career.id)?'interview-shop':'interview-office');
 const showShot=!person||round>0;
 const questions=person?romanceQuestions(person,flags):interviewQuestions(career);
 const question=questions[round];
 const answer=selected===null?null:question.answers[selected];
 const earlier=picks.map((pick,index)=>questions[index].answers[pick]);
 const spent=earlier.reduce((total,item)=>total+(item.cost??0),0);

 useEffect(()=>{
  if(!person)return;
  for(const src of [shot,datePhoto(person.id,'parting')])new Image().src=src;
 },[shot,person]);

 function next(){
  if(!answer||selected===null)return;
  if(onParting&&round===1){
   onParting([picks[0],selected]);
   return;
  }
  if(round<2){
   setPicks([...picks,selected]);setSelected(null);
   return;
  }
  if(!career||!onFinish)return;
  const score=earlier.reduce((total,item)=>total+item.points,answer.points);
  const success=score+skill/25>=5.5;
  onFinish({job:success?career.id:undefined,skill:success?4:7,face:success?5:1,spirit:success?8:-3},
   success?`拿到${career.entry}的offer，月薪 ¥${career.salary.toLocaleString()} 起。你走出楼门，给家里发了张截图。`:
   '没拿到offer。电梯里，你把答得最差的那道题记进手机，准备回去再练一遍。');
 }

 return <div className="dialogue-game">
  <div className="date-visual">
   {person&&!shotReady&&<Portrait person={person} full/>}
   {showShot&&<img className={'date-shot'+(shotReady?' visible':'')} src={shot} alt=""
    onLoad={()=>setShotReady(true)}/>}
   <div className="date-visual-caption"><b>{person?.name??career?.name}</b>{person&&<small>{person.title}</small>}</div>
  </div>
  <div className="dialogue-content">
   {!person&&<div className="mini-eyebrow">{career?.name}</div>}
   <div className="dialogue-head">
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
    <button className="primary" onClick={next}>{person&&round===1?'要走了':round===2?'看看这次怎么样':'接着聊'}<Icon name="arrow" size={17}/></button>
   </div>}
  </div>
 </div>;
}
