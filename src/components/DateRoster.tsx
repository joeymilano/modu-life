import { useState } from 'react';
import { CAST, DISTRICTS } from '../game/content';
import { dateAnswer, hasDated } from '../game/dates';
import { relationshipLabel } from '../game/engine';
import { householdPlan, householdVisit } from '../game/household';
import type { CastMember, GameState } from '../game/types';
import Icon from './Icon';
import { Portrait } from './Portrait';
import './date-roster.css';

const people = CAST.filter(person=>person.role==='romance');

export default function DateRoster({game,onPick,onOther}: {
 game: GameState; onPick: (person: CastMember) => void; onOther: () => void;
}) {
 const [nearby,setNearby] = useState(false);
 const district = DISTRICTS.find(place=>place.id===game.district)!;
 const local = people.filter(person=>person.district===game.district);
 const home = householdPlan(game);

 return <div className="date-roster">
  <header className="date-roster-head">
   <div><h2>约会</h2><p>行动 {game.actions} / 3</p></div>
   <div className="date-roster-filter" role="group" aria-label="见面范围">
    <button type="button" onClick={()=>setNearby(false)} aria-pressed={!nearby}>全城 <span>{people.length}</span></button>
    <button type="button" onClick={()=>setNearby(true)} aria-pressed={nearby}>{district.name} <span>{local.length}</span></button>
   </div>
  </header>
  <div className="romance-grid">
   {(nearby?local:people).map(person=>{
    const answer = dateAnswer(game,person.id);
    const action = answer==='left'?'已经道别':!home&&householdVisit(game,person.id)?'聊聊以后怎么住':
     answer==='friends'?'以朋友身份碰面':answer==='waiting'?'先见一面':hasDated(game,person.id)?'再约一次':'约见面';
    const place = DISTRICTS.find(item=>item.id===person.district)!;
    return <button type="button" className="date-roster-card" key={person.id} disabled={answer==='left'} onClick={()=>onPick(person)}>
     <div className="date-roster-frame">
      <Portrait person={person} full age={game.age} decorative/>
      <span>{relationshipLabel(game,person.id)}</span>
     </div>
     <div className="date-roster-details">
      <div className="date-roster-name"><h3>{person.name}</h3><span>{person.ageOffset+game.age}岁</span></div>
      <small>{place.name} <span>·</span> {person.title}</small>
      <b>{action} {answer!=='left'&&<Icon name="arrow" size={15}/>}</b>
     </div>
    </button>;
   })}
  </div>
  <button type="button" className="text-button date-roster-other" onClick={onOther}>感情近况 <Icon name="chevron" size={16}/></button>
 </div>;
}
