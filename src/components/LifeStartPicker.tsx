import { useState } from 'react';
import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

const starts = [{
 id:'arrival' as const,place:'上海站',title:'随机出身',photo:'/art/title/origin-arrival.webp',
 text:'出站不到两钟头，隔壁老板撕了海报、踢翻皮箱，当众喊停演出。五张底牌在手，今晚这台子你接不接？',
},...LIFE_STARTS.map(start=>start.id==='heir'?{...start,place:'锦江饭店',photo:'/art/title/origin-heir.webp',
 text:'表哥周骁霸了主位，招呼服务员在备餐口给你加张折凳。满桌推杯换盏，没人晓得六千万上午刚进你存折。'}:
 start.id==='system'?{...start,photo:'/art/title/origin-system.webp',text:'外滩暴雨夜，首单悬赏八万。顾桥拿伞尖指路让你去后门卸货——话音没落，整间礼堂啪地断了电。'}:{...start,photo:'/art/title/origin-daywork.webp',text:'兜里七百八，铺位半夜到期。领班赵正撕了报名单角，把老吴的名字也一并划掉：最后一车，你一个人卸。'})];

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
