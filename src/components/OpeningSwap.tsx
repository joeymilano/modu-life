import { rerollOptions } from '../game/engine';
import { openingForecast } from '../game/openingForecast';
import type { GoalId, OriginCard, PlayerAppearance } from '../game/types';
import { CardArt } from './Portrait';
import Icon from './Icon';

export default function OpeningSwap({cards, index, seed, round, goal, appearance, complete, onChoose, onKeep}: {
 cards: OriginCard[]; index: number; seed: string; round: number; goal: GoalId; appearance: PlayerAppearance;
 complete: boolean; onChoose: (card: OriginCard) => void; onKeep: () => void;
}) {
 const current = cards[index];
 const picks = [current, ...rerollOptions(seed, round, current)];
 const money = (value: number) => '¥' + value.toLocaleString('zh-CN');
 return <div className="opening-swap">
  <header><h2>换张{current.slot}牌</h2><p>选中才用掉一次重抽</p></header>
  <div className="swap-picks">
   {picks.map((card, choice) => {
    const result = complete ? openingForecast(seed, cards.map((item, i) => i === index ? card : item), goal, appearance) : undefined;
    return <article className={'swap-card' + (choice === 0 ? ' swap-current' : '')} key={card.id}>
     <div className="swap-card-top"><span>{choice === 0 ? '手上这张' : '备选 ' + choice}</span><b className={'rarity rarity-' + card.rarity}>{card.rarity}</b></div>
     <CardArt card={card}/>
     <div className="swap-copy"><h3>{card.name}</h3><p>{card.description}</p></div>
     {result && <div className="swap-forecast"><b>{money(result.cash)}</b><span>{result.housing}</span><small>{result.story?.event.title}</small></div>}
     {choice === 0 ? <button className="secondary" onClick={onKeep}>留手上这张</button> :
      <button className="primary" aria-label={'换这张，' + card.name} onClick={() => onChoose(card)}>换这张 <Icon name="arrow" size={16}/></button>}
    </article>;
   })}
  </div>
 </div>;
}
