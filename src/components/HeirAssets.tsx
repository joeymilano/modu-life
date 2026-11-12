import { heirAssets, heirShopVisits } from '../game/heirStory';
import { heirBoardVisit } from '../game/lifeStarts';
import type { GameState, LifeEvent } from '../game/types';
import Icon from './Icon';
import './heir-story.css';

const money = (value: number) => '¥' + value.toLocaleString('zh-CN');

export default function HeirAssets({ game, onVisit }: {game: GameState; onVisit: (event: LifeEvent) => void}) {
 const owned = heirAssets(game);
 const board = heirBoardVisit(game);
 const shops = heirShopVisits(game);
 return <section className="heir-assets">
  <header><h2>我的资产</h2><div><small>个人余额</small><strong>{money(game.cash)}</strong></div></header>
  {owned.length ? <ul className="heir-collection">{owned.map(asset=><li key={asset.id}>
   <img src={asset.image} alt="" loading="lazy"/>
   <div><b>{asset.name}</b><small>{asset.place}</small><span>{money(asset.price)}</span></div>
  </li>)}</ul> : <p>暂无购入记录</p>}
  {!!(shops.length||board)&&<div className="heir-visit-list" aria-label="可前往的地点">
   {shops.map(visit=><button type="button" className="secondary" key={visit.id} onClick={()=>onVisit(visit)}>再去{visit.location}<Icon name="arrow" size={16}/></button>)}
   {board&&<button type="button" className="secondary" onClick={()=>onVisit(board)}>陆家嘴 · {board.title}<Icon name="arrow" size={16}/></button>}
  </div>}
 </section>;
}
