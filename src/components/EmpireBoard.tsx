import { useState } from 'react';
import { calendarYear } from '../game/calendar';
import {
  buyEmpireAsset,
  EMPIRE_ASSETS,
  empireAssetValue,
  empireDividend,
  empireResalePrice,
  ownedEmpireAssets,
  sellEmpireAsset,
  type EmpireTab,
} from '../game/empire';
import { marketValue } from '../game/market';
import type { GameState } from '../game/types';
import GameIcon from './GameIcon';
import Icon from './Icon';

const yuan = (n: number) => '¥' + Math.round(n).toLocaleString('zh-CN');

export default function EmpireBoard({
  game,
  onChange,
}: {
  game: GameState;
  onChange: (next: GameState) => void;
}) {
  const year = calendarYear(game);
  const [tab, setTab] = useState<EmpireTab>('business');
  const [note, setNote] = useState('');

  const owned = ownedEmpireAssets(game);
  const dividend = empireDividend(game);
  const empireVal = empireAssetValue(game);
  const stockVal = marketValue(game);
  const netWorth = game.cash + stockVal + empireVal;
  const locked = game.ended || game.pendingYearEvent || Boolean(game.showdown) || Boolean(game.episode);

  const items = EMPIRE_ASSETS.filter(item => item.kind === tab);

  function handleBuy(id: string, name: string, price: number) {
    try {
      const next = buyEmpireAsset(game, id);
      onChange(next);
      setNote(`已签约拿下「${name}」· 支出 ${yuan(price)}`);
    } catch (error) {
      setNote((error as Error).message);
    }
  }

  function handleSell(id: string, name: string, payout: number) {
    try {
      const next = sellEmpireAsset(game, id);
      onChange(next);
      setNote(`已转让「${name}」· 回笼现金 ${yuan(payout)}`);
    } catch (error) {
      setNote((error as Error).message);
    }
  }

  return (
    <section className="empire-board">
      <header className="empire-head">
        <div>
          <p className="empire-kicker">SHANGHAI SYNDICATE · {year} 年</p>
          <h2>魔都产业与名流车房</h2>
        </div>
        <span className="empire-owned-pill">名下 {owned.length} 项</span>
      </header>

      <dl className="empire-metrics">
        <div>
          <dt>可用现金</dt>
          <dd>{yuan(game.cash)}</dd>
        </div>
        <div>
          <dt>产业估值</dt>
          <dd>{yuan(empireVal)}</dd>
        </div>
        <div>
          <dt>每年躺赚分红</dt>
          <dd className="empire-yield">+{yuan(dividend)}/年</dd>
        </div>
        <div>
          <dt>总身价净值</dt>
          <dd>{yuan(netWorth)}</dd>
        </div>
      </dl>

      <nav className="empire-tabs" aria-label="置业板块">
        <button
          type="button"
          aria-pressed={tab === 'business'}
          onClick={() => {
            setTab('business');
            setNote('');
          }}
        >
          <GameIcon name="business" size={16} />
          商业版图（现金流产业）
        </button>
        <button
          type="button"
          aria-pressed={tab === 'luxury'}
          onClick={() => {
            setTab('luxury');
            setNote('');
          }}
        >
          <GameIcon name="housing" size={16} />
          名流车房（座驾与豪宅）
        </button>
      </nav>

      {note && (
        <p className="empire-note" role="status">
          <Icon name="check" size={15} />
          {note}
        </p>
      )}

      <div className="empire-grid">
        {items.map(asset => {
          const isOwned = game.flags.includes(asset.flag);
          const unlocked = year >= asset.openYear;
          const canBuy = unlocked && !isOwned && !locked && game.cash >= asset.price;
          const resale = empireResalePrice(asset);
          return (
            <article
              key={asset.id}
              className={'empire-card' + (isOwned ? ' is-owned' : '') + (!unlocked ? ' is-locked' : '')}
            >
              <div className="empire-card-top">
                <span className="empire-loc">
                  <GameIcon name={asset.district} size={14} />
                  {asset.location}
                </span>
                {isOwned ? (
                  <b className="empire-status owned">已收入麾下</b>
                ) : unlocked ? (
                  <b className="empire-status">{yuan(asset.price)}</b>
                ) : (
                  <b className="empire-status locked">{asset.openYear} 年开放</b>
                )}
              </div>
              <h3>{asset.name}</h3>
              <p className="empire-tagline">{asset.tagline}</p>
              <p className="empire-perk">{asset.perkLabel}</p>
              <div className="empire-card-actions">
                {isOwned ? (
                  <button
                    type="button"
                    className="secondary small"
                    disabled={locked}
                    onClick={() => handleSell(asset.id, asset.name, resale)}
                  >
                    转让变现 · {yuan(resale)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary small"
                    disabled={!canBuy}
                    onClick={() => handleBuy(asset.id, asset.name, asset.price)}
                  >
                    {!unlocked
                      ? `${asset.openYear} 年解锁`
                      : game.cash < asset.price
                        ? `差 ${yuan(asset.price - game.cash)}`
                        : `签约购入 · ${yuan(asset.price)}`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
