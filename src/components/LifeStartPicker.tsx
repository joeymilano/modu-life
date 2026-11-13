import { SHANGHAI_STATION_1992 } from '../game/calendar';
import { useState } from 'react';
import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

const starts = [{
 id:'arrival' as const,place:'上海站',title:'随机出身',photo:SHANGHAI_STATION_1992,
 text:'刚出站，费启就拿走你的试场。十点开门，先把名字抢回来。',
},...LIFE_STARTS.map(start=>start.id==='heir'?{...start,place:'锦江饭店',photo:'/art/era/jinjiang-1992.webp',
 text:'母亲把请帖留在锦江饭店。周骁已经在排座位，你先去拿原件。'}:
 start.id==='system'?{...start,photo:'/art/era/terminal-1992.webp',text:'机房最旧的终端亮了。第一张结算单上，顾桥写了自己的名字。'}:start)];

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
   {starts.map(start => <button type="button" key={start.id} onClick={() => {
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
