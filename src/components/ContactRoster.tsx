import { CAST, castForGame, castTitle, DISTRICTS } from '../game/content';
import { contactStory } from '../game/contactStories';
import { relationshipLabel } from '../game/engine';
import type { CastMember, GameState } from '../game/types';
import Icon from './Icon';
import { Portrait } from './Portrait';
import './contact-profile.css';

const filters = { all: '全部', met: '见过', messages: '有消息' };
export type ContactFilter = keyof typeof filters;

export default function ContactRoster({game, filter, onFilter, onProfile, onCommit}: {
 game: GameState; filter: ContactFilter; onFilter: (filter: ContactFilter) => void;
 onProfile: (person: CastMember) => void; onCommit: (person: CastMember) => void;
}) {
 const all = CAST.map(person => ({
  person: castForGame(person,game), relation: game.relationships[person.id], visit: contactStory(game, person.id),
 })).sort((a, b) => Number(!!b.visit) - Number(!!a.visit) || Number(b.relation.met) - Number(a.relation.met));
 const lists = { all, met: all.filter(contact => contact.relation.met), messages: all.filter(contact => contact.visit) };

 return <div className="contacts-content">
  <h2>通讯录</h2>
  <div className="contact-filters" role="group" aria-label="筛选联系人">
   {(Object.keys(filters) as ContactFilter[]).map(id => <button type="button" key={id}
    aria-pressed={filter === id} onClick={() => onFilter(id)}>
    {filters[id]} <span>{lists[id].length}</span>
   </button>)}
  </div>
  {lists[filter].length ? <div className="contact-roster-grid">
   {lists[filter].map(({person, relation, visit}) => <article className="contact-roster-card" key={person.id}>
    <button type="button" className="contact-roster-open" data-profile={person.id} aria-label={'查看' + person.name + '的立绘'}
     aria-describedby={'contact-detail-' + person.id}
     onClick={() => onProfile(person)}>
     <div className="contact-roster-photo">
      <Portrait person={person} full age={game.age} decorative/>
      {visit && <span className="contact-message-marker">有消息</span>}
      <span className="contact-roster-caption"><strong>{person.name}</strong><Icon name="eye" size={16}/></span>
     </div>
     <span className="contact-roster-label" id={'contact-detail-' + person.id}>
      <span>{visit?.message ?? castTitle(person, game.age)}</span>
      <small>{DISTRICTS.find(district => district.id === person.district)?.name} · {relationshipLabel(game, person.id)}</small>
     </span>
    </button>
    {person.role === 'romance' && relation.trust >= 55 && relation.attraction >= 45 && game.partnerId !== person.id &&
     <button type="button" className="text-button contact-roster-commit" onClick={() => onCommit(person)}>确定关系 <Icon name="heart" size={14}/></button>}
   </article>)}
  </div> : <div className="contact-roster-empty">
   <p>{filter === 'messages' ? '暂时没有新消息' : '还没在城里碰到熟人'}</p>
   <button type="button" className="text-button" onClick={() => onFilter('all')}>看全部 <Icon name="arrow" size={16}/></button>
  </div>}
 </div>;
}
