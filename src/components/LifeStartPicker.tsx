import { useState } from 'react';
import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

const starts = [{
 id:'arrival' as const,place:'上海站',title:'随机出身',photo:'/art/title/origin-arrival.webp',
 text:'上海站有人举着你的名字。纸板翻过来，是今晚江边小礼堂的一张演出票。',
},...LIFE_STARTS.map(start=>start.id==='heir'?{...start,place:'锦江饭店',photo:'/art/title/origin-heir.webp',
 text:'母亲让你第一次去见客户。饭店门廊下，做样灯的沈经理等着有人搭把手。'}:
 start.id==='system'?{...start,photo:'/art/title/origin-system.webp',text:'第一晚给礼堂打杂，送货的车让雨困在侧门。台上试音时，灯闪了一下。'}:{...start,photo:'/art/title/origin-daywork.webp',text:'七百八十块钱，一张只付到明早的床。头回到仓里上工，吴师傅分了你一只手套。'})];

export default function LifeStartPicker({hasSave,onPick,onEdit}: {
 hasSave:boolean; onPick:(start?:LifeStart)=>void; onEdit:(start?:LifeStart)=>void;
}) {
 const [edit,setEdit]=useState(false);
 return <section className="life-start-picker">
  <header>
   <div><span className="origin-dateline" lang="en">SHANGHAI / 1992</span><h2>选择出身</h2></div>
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
     <img src={start.photo} alt="" width={420} height={690} decoding="async"/>
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
