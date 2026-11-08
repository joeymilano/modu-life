import { LIFE_STARTS, type LifeStart } from '../game/lifeStarts';
import Icon from './Icon';
import './life-starts.css';

export default function LifeStartPicker({onPick}: {onPick: (start: LifeStart) => void}) {
 return <section className="life-start-picker">
  <h2>选一种开局</h2>
  <div className="life-start-options">
   {LIFE_STARTS.map(start => <button type="button" key={start.id} onClick={() => onPick(start)}>
    <div className="start-portrait">
     <img src={start.photo} alt="" width={1320} height={880} decoding="async"/>
     <div className="start-title"><span>{start.id==='daywork'?'莘庄':'陆家嘴'}</span><h3>{start.title}</h3></div>
    </div>
    <div className="start-details">
     <div className="start-balance"><span>手头</span><b>¥{start.cash.toLocaleString('zh-CN')}</b></div>
     <p>{start.text}</p>
     <span className="start-action">从这里开始 <Icon name="arrow" size={17}/></span>
    </div>
   </button>)}
  </div>
 </section>;
}
