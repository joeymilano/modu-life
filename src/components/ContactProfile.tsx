import { DISTRICTS } from '../game/content';
import { relationshipLabel } from '../game/engine';
import type { CastMember, GameState } from '../game/types';
import { Portrait } from './Portrait';
import './contact-profile.css';

export default function ContactProfile({person, game, onBack}: {
 person: CastMember; game: GameState; onBack: () => void;
}) {
 const relation = game.relationships[person.id];
 const district = DISTRICTS.find(item => item.id === person.district)?.name;
 return <div className="contact-profile">
  <div className="contact-profile-photo"><Portrait person={person} full age={game.age} decorative/></div>
  <div className="contact-profile-info">
   <button type="button" className="text-button" autoFocus onClick={onBack}>← 通讯录</button>
   <h2>{person.name}</h2>
   <p className="contact-profile-place">{person.title} · {district}</p>
   <p>{person.description}</p>
   <div className="contact-profile-status">
    <b>{relationshipLabel(game,person.id)}</b>
    {relation.met && <span>信任 {relation.trust}</span>}
    {relation.met && person.role==='romance' && <span>好感 {relation.attraction} · 承诺 {relation.commitment}</span>}
   </div>
   {relation.memories.length>0 && <ul aria-label="一起经历过的事">
    {relation.memories.slice(-3).reverse().map((memory,index) => <li key={index}>{memory}</li>)}
   </ul>}
  </div>
 </div>;
}
