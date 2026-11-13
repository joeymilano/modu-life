import { heirConcierge, type ConciergeTab } from '../game/heirConcierge';
import { heirAssets } from '../game/heirStory';
import { heirBoardVisit } from '../game/lifeStarts';
import type { GameState, LifeEvent } from '../game/types';
import Icon from './Icon';
import './heir-story.css';

const money = (value: number) => '¥' + value.toLocaleString('zh-CN');
const sections = {shopping:'买点东西',tonight:'今晚安排',owned:'我的资产'};

export default function HeirAssets({ game, tab, onTab, onVisit }: {
 game: GameState;
 tab: ConciergeTab;
 onTab: (tab: ConciergeTab) => void;
 onVisit: (event: LifeEvent) => void;
}) {
 const offers = heirConcierge(game);
 const owned = heirAssets(game);
 const board = heirBoardVisit(game);
 const cards = offers?.[tab] ?? [];
 return <section className="heir-assets">
  <header>
   <div><h2>私人礼宾</h2><small>随时可用 · 不占行动</small></div>
   <div className="concierge-wallet"><small>可用余额</small><strong>{money(game.cash)}</strong></div>
  </header>
  <div className="concierge-tabs" role="group" aria-label="礼宾服务">
   {(Object.keys(sections) as ConciergeTab[]).map(id=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>onTab(id)}>{sections[id]}</button>)}
  </div>
  {tab==='owned'&&(owned.length ? <ul className="heir-collection">{owned.map(asset=><li key={asset.id}>
   <img src={asset.image} alt="" loading="lazy"/>
   <div><b>{asset.name}</b><small>{asset.place}</small><span>{money(asset.price)}</span></div>
  </li>)}</ul> : <p>还没有买下的东西。</p>)}
  {cards.length>0&&<div className="concierge-grid">
   {cards.map(({name,event})=>{
    const booked=game.seenEvents.includes(event.id);
    const price=Math.min(...event.choices.map(choice=>-(choice.effect.cash??0)));
    return <button type="button" key={event.id} className="concierge-card" disabled={booked} onClick={()=>onVisit(event)}>
     <img src={event.illustration} alt="" decoding="async"/>
     <span className="concierge-card-details">
      <small>{event.location}</small>
      <b>{name}</b>
      <span>{booked?'本年已安排':price?money(price)+(event.choices.length>1?' 起':''):'已购资产可用'}</span>
     </span>
     <Icon name={booked?'check':'arrow'} size={16}/>
    </button>;
   })}
  </div>}
  {tab==='shopping'&&!cards.length&&<p>这会儿没有新到的东西。<button className="text-button" onClick={()=>onTab('owned')}>看看我的资产 <Icon name="arrow" size={15}/></button></p>}
  {tab==='tonight'&&offers?.pause&&!game.seenEvents.includes(offers.pause.event.id)&&<div className="heir-visit-list">
   <button type="button" className="secondary" onClick={()=>onVisit(offers.pause!.event)}>把工作交接出去<Icon name="arrow" size={16}/></button>
  </div>}
  {tab==='owned'&&board&&<div className="heir-visit-list">
   <button type="button" className="secondary" onClick={()=>onVisit(board)}>陆家嘴 · {board.title}<Icon name="arrow" size={16}/></button>
  </div>}
 </section>;
}
