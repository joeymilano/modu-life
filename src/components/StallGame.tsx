import { useEffect, useRef, useState } from 'react';
import { stallPhoto } from '../game/art';
import { CAST } from '../game/content';
import { moveStall, servingPan, STALL_DISHES, STALL_STEPS, stallRank, stallScore, startStall, waitingOrders,
 type PanIndex, type StallMove, type StallSchedule, type StallScore } from '../game/stall';
import { compareStallScores } from '../game/stallChallenge';
import Icon from './Icon';
import { Portrait } from './Portrait';
import StallShare from './StallShare';
import './stall.css';

const pans = ['左锅', '右锅'] as const;
const dishes = ['sheng', 'guo'] as const;

export default function StallGame({ seed, age, schedule, onCloseBooks, target, autoStart = false, onStart, onReplay }: {
 seed: string; age: number; schedule: StallSchedule; onCloseBooks?: (score: StallScore) => void;
 target?: StallScore; autoStart?: boolean; onStart?: () => void; onReplay?: (changeOrders: boolean) => void;
}) {
 const [shift, setShift] = useState<ReturnType<typeof startStall> | null>(() => autoStart ? startStall(schedule) : null);
 const result = useRef<HTMLHeadingElement>(null);
 const done = shift?.step === STALL_STEPS;
 useEffect(() => {
  if (!done) return;
  result.current?.closest('.modal')?.scrollTo({top:0});
  result.current?.focus();
 },[done]);
 if (!shift) return <div className={'stall-intro'+(onCloseBooks?'':' stall-arcade-intro')}>
  <img src={stallPhoto('counter')} alt="吴师傅举起两张单子，身前是开着的两口锅"/>
  <div className="stall-intro-copy">
   <span className="stall-location">莘庄 · 晚风小吃街</span>
   <h2>{onCloseBooks ? '两口锅，八张单' : '吴师傅把围裙递给你'}</h2>
   <p>{onCloseBooks?'吴师傅把围裙往你手里一塞。':''}「生煎慢，锅贴快。哪张单子快跑了，侬先管哪张。」</p>
   <ul>
    <li>每口锅下两份。生煎下锅后等两步，锅贴等一步。</li>
    <li>出锅、下锅、撤锅和干等都走一步。熟了四步还没卖完，就会糊。</li>
    <li>{onCloseBooks ? '看好哪张单先到期。收摊结工钱，占一格行动。' : '先比出了几单，单数相同再比谁损耗少。'}</li>
   </ul>
   <button className="primary" onClick={() => {setShift(startStall(schedule));onStart?.();}}>系围裙，开锅 <Icon name="arrow" size={18}/></button>
   {!onCloseBooks&&<div className="stall-menu" aria-hidden="true">
    {dishes.map(dish=><div key={dish}><img src={stallPhoto(dish)} alt=""/><b>{STALL_DISHES[dish].name}</b></div>)}
   </div>}
  </div>
 </div>;

 const score = stallScore(shift);
 const comparison = target ? compareStallScores(score, target) : undefined;
 const finishedPhoto = onCloseBooks ? score.waste ? 'burnt' : 'close' : score.waste || score.served < 6 ? 'receipt-rush' : 'receipt-clean';
 if (done) return <div className={'stall-intro'+(onCloseBooks?'':' stall-arcade-result')}>
  <img src={stallPhoto(finishedPhoto)} alt="晚市收摊后的柜台"/>
  <div className="stall-intro-copy">
   <span className="stall-location">莘庄 · 收摊</span>
   <h2 ref={result} tabIndex={-1}>{stallRank(score)}</h2>
   <div className="stall-result">
    <div><b>{score.served}/{shift.orders.length}</b><span>出的单</span></div>
    <div><b>{shift.orders.length - score.served}</b><span>等走的单</span></div>
    <div><b>{score.waste}</b><span>损耗</span></div>
   </div>
   <p>{comparison === undefined ? score.waste ? '吴师傅拿来块湿抹布，让你别趁热抠锅。' : '吴师傅把醋碟收了，账本还摊着。'
    : comparison > 0 ? '这回你赢了，吴师傅在你那张单上画了个圈。'
    : comparison < 0 ? '这回朋友占上风。锅还在，要不要再试？'
    : '出单和损耗都一样。吴师傅说，谁先把锅刷了？'}</p>
   {onCloseBooks&&<button className="primary" onClick={() => onCloseBooks(score)}>跟吴师傅对账 <Icon name="arrow" size={18}/></button>}
   <StallShare seed={seed} schedule={schedule} score={score}/>
   {onReplay&&<div className="stall-replay">
    <button className="text-button" onClick={() => onReplay(false)}>同一批单再来</button>
    <button className="text-button" onClick={() => onReplay(true)}>换一批单</button>
   </div>}
  </div>
 </div>;

 const queue = waitingOrders(shift);
 const upcoming = shift.orders.find(order => order.arrives > shift.step);
 const move = (action: StallMove) => setShift(current => current ? moveStall(current, action) : current);
 return <div className="stall-workbench">
  <header className="stall-work-head">
   <img src={stallPhoto('rush')} alt=""/>
   <div><span className="stall-location">莘庄 · 晚市</span><h2>吴师傅的两口锅</h2></div>
   <div className="stall-counter"><b>{shift.step + 1} / {STALL_STEPS}</b><span>{score.served} 单已出 · {score.waste} 份损耗</span></div>
  </header>
  <p className="stall-update" role="status">{shift.message}</p>
  <div className="stall-board">
   <section className="stall-pans" aria-label="灶台">
    {pans.map((name, index) => {
     const pan = index as PanIndex;
     const batch = shift.pans[pan];
     const ready = batch && batch.ready <= shift.step;
     const status = batch ? ready ? `已熟 · ${batch.burns - shift.step} 步后糊底` : `还要 ${batch.ready - shift.step} 步` : '空锅';
     return <article key={name} className="stall-pan" data-ready={Boolean(ready)}>
      <img src={stallPhoto(batch?.dish ?? 'empty')} alt=""/>
      <div className="stall-pan-caption"><b>{name}{batch ? ' · ' + STALL_DISHES[batch.dish].name + ' ' + batch.portions + ' 份' : ''}</b><span>{status}</span></div>
      <div className="stall-pan-actions">
       {batch ? <button className="secondary stall-discard" onClick={() => move({ type: 'discard', pan })} aria-label={'撤掉' + name}>撤锅 · 计损耗</button>
        : dishes.map(dish => <button className="secondary" key={dish} onClick={() => move({ type: 'cook', pan, dish })}
         aria-label={name + '下' + STALL_DISHES[dish].name}>下{STALL_DISHES[dish].name}</button>)}
      </div>
     </article>;
    })}
    <button className="secondary stall-wait" onClick={() => move({ type: 'wait' })}><Icon name="clock" size={16}/>等一拍</button>
   </section>
   <section className="stall-orders" aria-label="手上的单">
    <div className="stall-order-head"><h3>手上的单</h3>{upcoming&&<span>{upcoming.arrives - shift.step} 步后还有人来</span>}</div>
    {!queue.length && <p className="stall-empty">手上没单了。看看两口锅，或等下一单。</p>}
    {queue.map(order => {
     const person = CAST.find(item => item.id === order.person)!;
     const ready = servingPan(shift, order.dish) !== undefined;
     const left = order.deadline - shift.step;
     return <article className="stall-order" key={order.id} data-urgent={left <= 1}>
      <Portrait person={person} decorative size={34} age={age}/>
      <div><b>{person.name} · {STALL_DISHES[order.dish].name}</b><small>{order.line}</small></div>
      <div className="stall-order-action"><span>{left ? `还能等 ${left} 步` : '这步就要走'}</span>
       <button className="secondary" disabled={!ready} onClick={() => move({ type: 'serve', order: order.id })}
        aria-label={'出单给' + person.name}>出单</button></div>
     </article>;
    })}
   </section>
  </div>
 </div>;
}
