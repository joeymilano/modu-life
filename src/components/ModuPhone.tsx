import { useState } from 'react';
import { calendarYear } from '../game/calendar';
import { playImpact } from '../game/audio';
import {
  blackMarketOf,
  buyBlackMarketItem,
  callQuickContact,
  likePhonePost,
  phoneFeedOf,
  phoneShellOf,
  quickContactsOf,
} from '../game/moduPhone';
import type { GameState } from '../game/types';
import GameIcon from './GameIcon';
import Icon from './Icon';

const yuan = (n: number) => '¥' + Math.round(n).toLocaleString('zh-CN');

export default function ModuPhone({
  game,
  onChange,
}: {
  game: GameState;
  onChange: (next: GameState) => void;
}) {
  const [tab, setTab] = useState<'feed' | 'call' | 'market'>('feed');
  const [note, setNote] = useState('');
  const year = calendarYear(game);
  const shell = phoneShellOf(game);
  const posts = phoneFeedOf(game);
  const contacts = quickContactsOf(game);
  const market = blackMarketOf(game);
  const locked = game.ended || game.pendingYearEvent || Boolean(game.showdown) || Boolean(game.episode);

  function handleLike(postId: string, authorId?: string) {
    try {
      const next = likePhonePost(game, postId, authorId);
      playImpact('ding');
      onChange(next);
      setNote('已互动捧场 · 心气 +1 / 人脉 +1');
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleCall(id: string) {
    try {
      const res = callQuickContact(game, id);
      playImpact('ding');
      onChange(res.state);
      setNote(res.summary);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleBuy(id: string) {
    try {
      const res = buyBlackMarketItem(game, id);
      playImpact('ding');
      onChange(res.state);
      setNote(res.summary);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  return (
    <section className="modu-phone" data-era={shell.era}>
      <header className="phone-statusbar">
        <span>{shell.networkLabel}</span>
        <b>{year} · 22:40</b>
      </header>

      <div className="phone-device-head">
        <div>
          <small>{shell.deviceName}</small>
          <h2>随身通讯终端</h2>
        </div>
        <span className="phone-cash-pill">活钱 {yuan(game.cash)}</span>
      </div>

      <nav className="phone-dock" aria-label="手机应用">
        <button type="button" aria-pressed={tab === 'feed'} onClick={() => { setTab('feed'); setNote(''); }}>
          <GameIcon name="social" size={16} />
          {shell.era === 'pager' ? '传呼台' : '魔都圈'}
        </button>
        <button type="button" aria-pressed={tab === 'call'} onClick={() => { setTab('call'); setNote(''); }}>
          <Icon name="people" size={16} />
          熟人急电
        </button>
        <button type="button" aria-pressed={tab === 'market'} onClick={() => { setTab('market'); setNote(''); }}>
          <Icon name="bolt" size={16} />
          暗巷闪送
        </button>
      </nav>

      {note && (
        <p className="empire-note phone-toast" role="status">
          <Icon name="check" size={15} />
          {note}
        </p>
      )}

      {tab === 'feed' && (
        <div className="phone-feed-list">
          {posts.map(post => (
            <article key={post.id} className="phone-post">
              <div className="phone-post-head">
                <div>
                  <b>{post.author}</b>
                  <small>{post.handle}</small>
                </div>
                <span>{post.timeAgo}</span>
              </div>
              <p>{post.text}</p>
              <div className="phone-post-foot">
                <small>{post.location}</small>
                <button
                  type="button"
                  className={'phone-like-btn' + (post.liked ? ' is-liked' : '')}
                  disabled={locked || post.liked}
                  onClick={() => handleLike(post.id, post.authorId)}
                >
                  ♥ {post.likes + (post.liked ? 1 : 0)} {post.liked ? '已捧场' : '捧场 +人脉'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'call' && (
        <div className="phone-call-list">
          {contacts.map(c => (
            <article key={c.id} className="phone-contact-card">
              <div className="phone-contact-top">
                <b>{c.name}</b>
                <span>{c.cost > 0 ? yuan(c.cost) : '免费通话'}</span>
              </div>
              <p>{c.desc}</p>
              <button
                type="button"
                className="primary small"
                disabled={locked || c.calledThisYear || game.cash < c.cost}
                onClick={() => handleCall(c.id)}
              >
                {c.calledThisYear ? '今年已通话' : game.cash < c.cost ? '余额不足' : c.actionTitle}
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === 'market' && (
        <div className="phone-call-list">
          {market.map(item => (
            <article key={item.id} className="phone-contact-card bm-card">
              <div className="phone-contact-top">
                <b>{item.name}</b>
                <span className="bm-price">{yuan(item.price)}</span>
              </div>
              <p>{item.desc}</p>
              <small className="bm-perk">{item.perkLabel}</small>
              <button
                type="button"
                className="secondary small"
                disabled={locked || item.boughtThisYear || game.cash < item.price}
                onClick={() => handleBuy(item.id)}
              >
                {item.boughtThisYear ? '今年已断货' : game.cash < item.price ? `差 ${yuan(item.price - game.cash)}` : `暗线下单 · ${yuan(item.price)}`}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
