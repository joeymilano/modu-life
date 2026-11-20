import { CINEMA_ART } from '../game/pujiangCinema';
import { useState } from 'react';
import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

const starts = [{
 id:'arrival' as const,place:'江边小礼堂',title:'随机出身',photo:CINEMA_ART.stage,
 text:'首演将开，主理人失约。费启准备带走观众，你能把这一场撑起来吗？',
},...LIFE_STARTS.map(start=>start.id==='heir'?{...start,place:'锦江饭店',photo:CINEMA_ART.dinner,
 text:'身家六千万，进饭局却被当成送货的。周骁端着酒杯，正替你接手项目。'}:
 start.id==='system'?{...start,photo:CINEMA_ART.gu,text:'江边演出突然停电。只有你看见八万奖励，顾桥却提前知道这个数字。'}:{...start,photo:CINEMA_ART.shift,text:'顶班才能保住床位，吴师傅却被划掉了名字。末班车在等你的安排。'})];

export default function LifeStartPicker({hasSave,onPick,onEdit}: {
 hasSave:boolean; onPick:(start?:LifeStart)=>void; onEdit:(start?:LifeStart)=>void;
}) {
 const [edit,setEdit]=useState(false);
 return <section className="life-start-picker">
  <header>
   <h2>选择出身</h2>
   <button type="button" className="text-button" aria-pressed={edit} onClick={()=>setEdit(current=>!current)}>
    <Icon name={edit?'check':'dice'} size={16}/>先看手牌
   </button>
  </header>
  {hasSave&&!edit&&<p className="start-save-note">开局会替换自动存档</p>}
  <div className="life-start-options">
   {starts.map(start => <button type="button" key={start.id} data-origin={start.id} onClick={() => {
    const profile = LIFE_STARTS.find(item=>item.id===start.id);
    (edit?onEdit:onPick)(profile);
   }}>
    <div className="start-portrait">
     <img src={start.photo} alt="" width={1320} height={880} decoding="async"/>
     <div className="start-title"><span>{start.place}</span><h3>{start.title}</h3></div>
    </div>
    <div className="start-details">
     <p>{start.text}</p>
     <span className="start-action">{edit?'看手牌':'开局'} <Icon name="arrow" size={17}/></span>
    </div>
   </button>)}
  </div>
 </section>;
}
