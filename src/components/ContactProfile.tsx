import { castTitle, DISTRICTS } from '../game/content';
import { contactStory, contactStoryMemory } from '../game/contactStories';
import { monthlyBudget, relationshipLabel } from '../game/engine';
import { householdPlan, STANDING_DATE_MONTHLY_COST } from '../game/household';
import type { CastMember, GameState, LifeEvent } from '../game/types';
import Icon from './Icon';
import { Portrait } from './Portrait';
import './contact-profile.css';

export default function ContactProfile({person, game, onBack, onTalk, onVisit}: {
 person: CastMember; game: GameState; onBack: () => void; onTalk?: () => void; onVisit: (event: LifeEvent) => void;
}) {
 const relation = game.relationships[person.id];
 const district = DISTRICTS.find(item => item.id === person.district)?.name;
 const plan = game.partnerId === person.id ? householdPlan(game) : undefined;
 const visit = contactStory(game,person.id);
 const memory = contactStoryMemory(game,person.id);
 return <div className="contact-profile">
  <figure className="contact-profile-photo">
   <Portrait person={person} full age={game.age} decorative/>
   <figcaption>{district}<span>{person.ageOffset + game.age} 岁</span></figcaption>
  </figure>
  <div className="contact-profile-info">
   <button type="button" className="text-button" autoFocus onClick={onBack}>← 通讯录</button>
   <h2>{person.name}</h2>
   <p className="contact-profile-place">{castTitle(person,game.age)}</p>
   <p>{person.description}</p>
   <div className="contact-profile-status">
    <b>{relationshipLabel(game,person.id)}</b>
    {relation.met && <span>信任 {relation.trust}</span>}
    {relation.met && person.role==='romance' && <span>好感 {relation.attraction} · 承诺 {relation.commitment}</span>}
   </div>
   {plan==='shared'&&<p className="contact-profile-plan">一起住 · 你每月出 ¥{monthlyBudget(game).rent.toLocaleString('zh-CN')} 住房费</p>}
   {plan==='standing'&&<p className="contact-profile-plan">每周留一顿饭 · 每月多花 ¥{STANDING_DATE_MONTHLY_COST}</p>}
   {onTalk&&<button className="secondary" onClick={onTalk}>聊聊以后怎么住</button>}
   {visit&&<button className="contact-thread" onClick={()=>onVisit(visit.event)}>
    <span><small>有消息</small><b>{visit.message}</b></span><Icon name="arrow" size={19}/>
   </button>}
   {memory&&<article className="contact-last-meeting">
    <small>{memory.age} 岁那年</small>
    <h3>{memory.title}</h3>
    <p>{memory.text}</p>
   </article>}
   {relation.memories.length>0 && <ul aria-label="一起经历过的事">
    {relation.memories.filter(item=>item!==`${memory?.age}岁 · ${memory?.title}`).slice(-3).reverse().map((item,index) => <li key={index}>{item}</li>)}
   </ul>}
  </div>
 </div>;
}
