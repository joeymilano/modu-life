import { castTitle, DISTRICTS } from '../game/content';
import { monthlyBudget, relationshipLabel } from '../game/engine';
import { householdPlan, STANDING_DATE_MONTHLY_COST } from '../game/household';
import type { CastMember, GameState } from '../game/types';
import { Portrait } from './Portrait';
import './contact-profile.css';

export default function ContactProfile({person, game, onBack, onTalk}: {
 person: CastMember; game: GameState; onBack: () => void; onTalk?: () => void;
}) {
 const relation = game.relationships[person.id];
 const district = DISTRICTS.find(item => item.id === person.district)?.name;
 const plan = game.partnerId === person.id ? householdPlan(game) : undefined;
 return <div className="contact-profile">
  <div className="contact-profile-photo"><Portrait person={person} full age={game.age} decorative/></div>
  <div className="contact-profile-info">
   <button type="button" className="text-button" autoFocus onClick={onBack}>← 通讯录</button>
   <h2>{person.name}</h2>
   <p className="contact-profile-place">{castTitle(person,game.age)} · {district}</p>
   <p>{person.description}</p>
   <div className="contact-profile-status">
    <b>{relationshipLabel(game,person.id)}</b>
    {relation.met && <span>信任 {relation.trust}</span>}
    {relation.met && person.role==='romance' && <span>好感 {relation.attraction} · 承诺 {relation.commitment}</span>}
   </div>
   {plan==='shared'&&<p className="contact-profile-plan">一起住 · 你每月出 ¥{monthlyBudget(game).rent.toLocaleString('zh-CN')} 住房费</p>}
   {plan==='standing'&&<p className="contact-profile-plan">每周留一顿饭 · 每月多花 ¥{STANDING_DATE_MONTHLY_COST}</p>}
   {onTalk&&<button className="secondary" onClick={onTalk}>聊聊以后怎么住</button>}
   {relation.memories.length>0 && <ul aria-label="一起经历过的事">
    {relation.memories.slice(-3).reverse().map((memory,index) => <li key={index}>{memory}</li>)}
   </ul>}
  </div>
 </div>;
}
