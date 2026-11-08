import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

export default function LifeStartPicker({onPick}: {onPick: (start: LifeStart) => void}) {
 return <section className="life-start-picker">
  <h2>选一种开局</h2>
  <div className="life-start-options">
   {LIFE_STARTS.map((start,index) => <button type="button" key={start.id} onClick={() => onPick(start)}>
    <img src={start.photo} alt="" width={1320} height={880} decoding="async"/>
    <div>
     <span className="start-number">0{index+1}</span>
     <h3>{start.title}</h3>
     <b>{start.line}</b>
     <p>{start.text}</p>
     <span className="start-action">用这手牌 <Icon name="arrow" size={17}/></span>
    </div>
   </button>)}
  </div>
 </section>;
}
