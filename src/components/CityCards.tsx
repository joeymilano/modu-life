import { useState } from 'react';
import { CITY_CARDS, CITY_PITY, CITY_RATES, CITY_TIERS, cityDrawHistory, cityTickets, type CityDrawSize } from '../game/cityCards';
import { STAT_NAMES } from '../game/engine';
import type { GameState } from '../game/types';
import GameIcon from './GameIcon';
import './city-cards.css';

type StreetCard = (typeof CITY_CARDS)[number];

function CardEffects({ card }: { card: StreetCard }) {
  return <ul className="city-card-bonus">{Object.entries(card.effect).map(([key, value]) => {
    const stat = key as keyof typeof STAT_NAMES;
    return <li key={key}><GameIcon name={key === 'cash' ? 'reward' : stat} size={14}/>
      {key === 'cash' ? `+¥${value.toLocaleString('zh-CN')}` : `${STAT_NAMES[stat]} +${value}`}
    </li>;
  })}</ul>;
}

function CardImage({ card }: { card: StreetCard }) {
  return <img src={`/art/${card.image}.webp`} alt="" width={480} height={235} decoding="async"/>;
}

export default function CityCards({ game, onDraw }: { game: GameState; onDraw: (count: CityDrawSize) => boolean }) {
  const [collection, setCollection] = useState(game.ended);
  const [batch, setBatch] = useState<CityDrawSize>(1);
  const [selected, setSelected] = useState<number>();
  const total = game.cityDraws ?? 0;
  const tickets = cityTickets(game);
  const history = cityDrawHistory(game.seed, total);
  const counts = new Map<string, number>();
  for (const card of history.cards) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  const latest = history.cards.slice(-batch);
  const best = latest.reduce((bestIndex, card, index) =>
    CITY_TIERS.indexOf(card.rarity) > CITY_TIERS.indexOf(latest[bestIndex].rarity) ? index : bestIndex, 0);
  const current = selected ?? best;
  const featured = latest[current];
  const collected = CITY_TIERS.slice().reverse().flatMap(tier =>
    CITY_CARDS.filter(card => card.rarity === tier && counts.has(card.id)));

  function draw(count: CityDrawSize) {
    if (onDraw(count)) {
      setBatch(count);
      setSelected(undefined);
    }
  }

  return <div className="city-cards" data-collection={collection} data-rarity={featured?.rarity}>
    <header className="city-cards-header">
      <h2>{collection ? '街头图鉴' : '街头抽卡'}</h2>
      {!game.ended && <nav className="city-cards-nav" aria-label="街头抽卡页面">
        <button aria-pressed={!collection} onClick={() => setCollection(false)}>抽卡</button>
        <button aria-pressed={collection} onClick={() => setCollection(true)}><GameIcon name="journal" size={16}/>收藏 {counts.size} / {CITY_CARDS.length}</button>
      </nav>}
    </header>
    {collection ? <section className="city-album" aria-label="街头卡片收藏">
      <p className="city-album-progress">已收集 <strong>{counts.size}</strong> / {CITY_CARDS.length}</p>
      <dl className="city-card-rates" aria-label="各稀有度收藏进度">
        {CITY_TIERS.map(tier => {
          const cards = CITY_CARDS.filter(card => card.rarity === tier);
          return <div key={tier} data-rarity={tier}><dt>{tier}</dt><dd>{cards.filter(card => counts.has(card.id)).length} / {cards.length}</dd></div>;
        })}
      </dl>
      {collected.length ? <ul className="city-card-collection">
        {collected.map(card => <li key={card.id} className="city-album-entry" data-rarity={card.rarity}>
          <div className="city-album-thumb"><CardImage card={card}/></div>
          <div><div className="city-album-title"><strong>{card.name}</strong><span>{card.rarity}</span></div><CardEffects card={card}/></div>
          <b className="city-album-copies">×{counts.get(card.id)}</b>
        </li>)}
      </ul> : <p className="city-cards-note">抽到的卡片会收录在这里。</p>}
    </section> : <>
      <section className="city-draw-stage" aria-label="抽卡结果">
        <div className="city-draw-glow" aria-hidden="true"/>
        {featured ? <figure key={`${total}-${current}`} className="city-card-feature" data-rarity={featured.rarity}>
          <div className="city-feature-art">
            <CardImage card={featured}/>
            <span className="city-feature-tier">{featured.rarity}</span>
          </div>
          <figcaption>
            <strong>{featured.name}</strong>
            <CardEffects card={featured}/>
          </figcaption>
        </figure> : <div className="city-card-back" aria-hidden="true"><div className="city-sealed-card">
          <img src="/art/title/bund-deck.webp" alt="" width={520} height={780}/>
        </div></div>}
        {latest.length > 1 && <ol className="city-result-reel" aria-label="本次抽到的卡片">
          {latest.map((card, index) => <li key={total - latest.length + index} data-rarity={card.rarity}>
            <button onClick={() => setSelected(index)} aria-pressed={index === current}
              aria-label={`第 ${index + 1} 张，${card.rarity}，${card.name}`}>
              <span className="city-reel-image"><CardImage card={card}/></span><b>{card.rarity}</b>
            </button>
          </li>)}
        </ol>}
        <p className="city-draw-status" aria-live="polite">{featured ? `${featured.name} · 奖励已到账` : ''}</p>
      </section>
      <div className="city-draw-controls">
        <p className="city-ticket-count"><GameIcon name="action" size={20}/><b>{tickets}</b> 张抽奖券</p>
        <div className="city-draw-actions">
          <button className="primary" onClick={() => draw(1)} disabled={tickets < 1}><GameIcon name="action" size={17}/>抽 1 张</button>
          <button className="secondary" onClick={() => draw(5)} disabled={tickets < 5}><GameIcon name="hand" size={17}/>抽 5 张</button>
        </div>
        <p className="city-cards-note">{tickets === 0 ? '下一岁可再领 1 张券。' : '开局和每次进入新的一岁各得 1 张券。'}</p>
        <div className="city-pity">
          <div><span>SS / SSS 保底</span><span>最多再抽 <b>{CITY_PITY - history.misses}</b> 张</span></div>
          <progress aria-label="SS 或 SSS 保底进度" value={history.misses} max={CITY_PITY}/>
        </div>
        <dl className="city-card-rates" aria-label="基础出卡概率">
          {CITY_TIERS.map(tier => <div key={tier} data-rarity={tier}><dt>{tier}</dt><dd>{CITY_RATES[tier]}%</dd></div>)}
        </dl>
        <details className="city-card-rules">
          <summary>抽卡规则和奖励</summary>
          <p>抽奖券免费，可跨年累积。每张卡消耗 1 张券，属性或游戏内现金自动到账。重复卡照常发放奖励，属性最高 100。</p>
          <p>每档内的卡等概率。连续 {CITY_PITY - 1} 次未出 SS 或 SSS 时，下一抽在两档中按 {CITY_RATES.SS}∶{CITY_RATES.SSS} 权重抽取。抽到任一档即重置保底。</p>
        </details>
      </div>
    </>}
  </div>;
}
