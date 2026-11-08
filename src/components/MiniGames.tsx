import { useEffect, useRef, useState } from 'react';
import type { Career, CastMember, Effect, FirstDatePicks } from '../game/types';
import { romanceQuestions, type Question } from '../game/dates';
import { datePhoto, interviewPhoto, offerPhoto } from '../game/art';
import { isSelfEmployed, offerTopic, type InterviewOffer } from '../game/jobOffers';
import Icon from './Icon';
import { Portrait } from './Portrait';

function interviewOpening(text:string, practical:[string,string], bluff:[string,string], alternative:[string,string]):Question{
 return {text,answers:[practical,bluff,alternative].map(([label,reply],index)=>({label,reply,points:[2,0,1][index]}))};
}

const interviewStarts:Record<string,Question>={
 tech:interviewOpening('负责人把简历放下。「上回上线出问题，你先干了什么？」',
  ['说清怎么复现、怎么把影响停住','对方把电脑转过来，让你指一个会先看的地方。'],
  ['讲团队熬了多久，先别提哪段是我写的','「你负责哪段？」对方问第二遍的时候已经放下了笔。'],
  ['拿一个小项目讲我犯过的错','项目很小。听到你怎么发现错误，对方又拿起了笔。']),
 creative:interviewOpening('桌上摆着三张海报。她点第一张，说客户改了七次之后又想用它。',
  ['问第一张为什么被改，拿出两版对着讲','她把最后一版抽回来，发现活动时间早就改了。'],
  ['说客户爱哪张就交哪张','她问那谁负责把三张的日期查一遍。'],
  ['先问客户最想保住哪个地方','她指了指主图，说终于有人问这句了。']),
 finance:interviewOpening('她把两张表叠在一起推过来。「总额一样。可我觉得这两张都错了。」',
  ['顺着其中一笔查回原始记录','你找到了一笔被抄了两遍的款。她把另外一张也摊开了。'],
  ['总额一样，先把表发出去','她把光标移到收件人栏，问你敢不敢用自己的名字发。'],
  ['先找口径不同的列','你圈出了一个含税数。她问这列是谁给你的。']),
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

const followups:Record<string,Question>={
 tech:interviewOpening('「回滚以后，后台还在重试。明早有两千笔单，你怎么交班？」',
  ['把异常订单列出来，标明谁接、几点查','她翻开交接本，问你准备把哪笔放在最前面。'],
  ['看着像恢复了，先让大家回家','她问那明早谁来认领没到账的订单。'],
  ['自己再盯一小时，写下异常再走','她在排班表上圈了一格，问这小时以后呢。']),
 creative:interviewOpening('「印厂等到六点。还有两张没过，甲方现在在飞机上。」',
  ['把改过日期的那张先发去打样','她把台历转过来，给你看印厂最晚接稿的时间。'],
  ['用旧稿，甲方回来再说','她用铅笔点了一下旧稿上的日期。'],
  ['让印厂先做确认过的那一张','她把第一张放到边上，问剩下两张还能等多久。']),
 finance:interviewOpening('沈经理看了眼表。「三分钟以后要发。那笔重复款谁来认？」',
  ['先标记差额和来源，给她一版能核的','她把电话按掉，说给你五分钟。'],
  ['先改总数，细项下次再对','她问这两版打印出来，以后还能不能对上。'],
  ['打电话找填表的人，先把出表时间往后挪','她把对方号码写在纸背上。']),
 service:interviewOpening('后厨说挂面还剩三份。吴师傅往门口一指，外面又来了四个。',
  ['先把卖完的划掉，给新来的说还有什么','他把柜台那块小黑板拿了出来。'],
  ['先收钱，真不够了再退','他问那四个人是来吃饭还是来退钱的。'],
  ['问后厨能不能换面，再给前面的人选','他从冰箱拿出一袋年糕，说你来开口。']),
 public:interviewOpening('楼上的人只能晚上七点到，维修师傅六点就收工。',
  ['先请师傅查公区，和两户定同一时间复查','她拿下墙上的轮值表，把七点那格划出来。'],
  ['让楼下继续等，什么时候都齐了再说','她翻过报修单，最早的日期是上个月。'],
  ['先协调师傅拍照留记录，晚上再联系两户','她问你打算给谁留办公室电话。']),
 freelance:interviewOpening('「有一页还想换个颜色。顺手的事嘛，就别写进合同了。」',
  ['把哪一页、改几次、哪天确认都写上','他接过笔，自己把「这一页」圈了出来。'],
  ['顺手多做几版，做完他总会付','他问，五版够不够挑。'],
  ['先答应改一次，确认后再谈其它页','他想了会儿，说那就改这次。']),
 business:interviewOpening('吴师傅刚找出零钱，有人问明早能不能先留三十份生煎。',
  ['问清几个人、几点取，订金到了再备料','吴师傅把订货本翻到明早那页。'],
  ['先答应，明天人没来也能卖','他问你准备拿什么锅，先多煎三十个。'],
  ['先留十份，其它的到店再加','那人想了想，问有没有个能固定下单的办法。']),
 trade:interviewOpening('客户回了邮件，说可以定一半，另一半想再占两天仓位。',
  ['锁已确认的，余货写明几点释放','经理拿出仓库的电话，让你当面说一遍。'],
  ['占着，客户看见有货才肯付','经理看了一眼库存，说还有三个人在等这批。'],
  ['先请客户定一个能承诺的时间','经理翻到那封邮件的时间戳，问你按哪边的钟。']),
};

function interviewQuestions(career:Career):Question[]{const contract=isSelfEmployed(career.id);return [
 interviewStarts[career.id],
 followups[career.id],
 {text:'对方把笔放下。「还有什么想问？」',answers:[
 {label:contract?'问现在能先转多少':'问津贴怎么算，写不写进工资',reply:contract?'他把手机翻了过来。':'对方翻到写津贴的那一页。',points:2},
 {label:contract?'问哪天交，临时改怎么算':'问晚上和周末谁接电话',reply:contract?'他把第二页抽了出来。':'对方从抽屉里拿出排班表。',points:2},
 {label:contract?'都好说，什么时候开工':'都可以，我比较能吃苦',reply:'对方拿起了笔。',points:0}]}
];}
function DialogueShot({src, person, previous}: {src: string; person?: CastMember; previous?: string}) {
 const [ready, setReady] = useState(false);
 return <>
  {!ready && (previous ? <img className="date-hold" src={previous} alt=""/> :
   person && <Portrait person={person} full decorative/>)}
  <img className={'date-shot' + (ready ? ' visible' : '')} src={src} alt="" onLoad={() => setReady(true)}/>
 </>;
}

type DialogueProps = {skill:number;cash:number;flags:string[]} & (
 {person:CastMember;career?:never;onParting:(picks:FirstDatePicks)=>void;onFinish?:never;onOffer?:never} |
 {person?:never;career:Career;onParting?:never;onFinish:(effect:Effect,text:string)=>void;onOffer:(offer:InterviewOffer)=>void}
);

export function DialogueGame({person,career,skill,cash,flags,onFinish,onParting,onOffer}:DialogueProps){
 const [picks,setPicks]=useState<number[]>([]);
 const [selected,setSelected]=useState<number|null>(null);
 const questionRef=useRef<HTMLDivElement>(null);
 const replyRef=useRef<HTMLDivElement>(null);
 const round=picks.length;
 const shot=person?datePhoto(person.id,round===0?'meeting':'middle'):interviewPhoto(career.id);
 const nextShot=person?datePhoto(person.id,round===0?'middle':'parting'):offerPhoto(career.id);
 const questions=person?romanceQuestions(person,flags):interviewQuestions(career);
 const question=questions[round];
 const answer=selected===null?null:question.answers[selected];
 const earlier=picks.map((pick,index)=>questions[index].answers[pick]);
 const spent=earlier.reduce((total,item)=>total+(item.cost??0),0);

 useEffect(()=>{
  const image=new Image();
  image.fetchPriority='low';
  image.src=nextShot;
 },[nextShot]);

 useEffect(()=>{
  if(!person||round===0)return;
  const question=questionRef.current;
  question?.closest('.modal')?.scrollTo({top:0});
  question?.focus({preventScroll:true});
 },[person,round]);

 function selectAnswer(index: number) {
  setSelected(index);
  if(person)requestAnimationFrame(()=>replyRef.current?.scrollIntoView({block:'nearest'}));
 }

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
  if(!career||!onFinish||!onOffer)return;
  const score=earlier.reduce((total,item)=>total+item.points,0);
  if(score+answer.points+skill/25>=5.5){
   onOffer({topic:offerTopic(selected),proof:score>=3});
  }else{
   onFinish({skill:7,face:1,spirit:-3},'没谈成。走到楼下，你把卡住的那道题记进手机。');
  }
 }

 return <div className="dialogue-game">
  <div className="date-visual">
   <DialogueShot key={shot} src={shot} person={person} previous={person&&round>0?datePhoto(person.id,'meeting'):undefined}/>
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
   <div className="dialogue-question" ref={questionRef} tabIndex={person?-1:undefined} aria-live="polite">{question.text}</div>
   <div className="dialogue-answers">{question.answers.map((ans,i)=>
    <button key={i} disabled={selected!==null||cash<spent+(ans.cost||0)} className={selected===i?'picked':''}
     onClick={()=>selectAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{ans.label}{ans.cost?' · ¥'+ans.cost:''}<Icon name="chevron" size={16}/></button>)}
   </div>
   {answer&&<div className="dialogue-reply" ref={replyRef}><p>{answer.reply}</p>
    <button className="primary" onClick={next}>{person&&round===1?'要走了':round===2?'听听对方怎么说':'接着聊'}<Icon name="arrow" size={17}/></button>
   </div>}
  </div>
 </div>;
}
