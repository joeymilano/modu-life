import { useEffect, useState } from 'react';
import {
  activateBlackCard,
  canClaimDaily,
  claimDailySupply,
  claimPassTier,
  claimSponsorReward,
  MAX_PASS_LEVEL,
  MODU_ACHIEVEMENTS,
  passLevelOf,
  SEASON_PASS_TIERS,
  SPONSOR_COOLDOWN_MS,
  SPONSOR_SPOTS,
  SUPPLY_INFO,
  useTacticalSupply,
  type ModuMeta,
  type SupplyKey,
} from '../game/commercial';
import type { GameState } from '../game/types';
import GameIcon from './GameIcon';
import Icon from './Icon';

type PassTab = 'pass' | 'vip' | 'achievements';

declare global {
  interface Window {
    __MODU_REWARDED_AD__?: { show: () => Promise<boolean> };
  }
}

export default function PassModal({
  meta,
  game,
  onMetaChange,
  onGameChange,
}: {
  meta: ModuMeta;
  game: GameState | null;
  onMetaChange: (next: ModuMeta) => void;
  onGameChange?: (next: GameState) => void;
}) {
  const [tab, setTab] = useState<PassTab>('pass');
  const [note, setNote] = useState('');
  const [code, setCode] = useState('');
  const [spotPlaying, setSpotPlaying] = useState<number | null>(null);
  const [spotSeconds, setSpotSeconds] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { level, progressXp, nextXp } = passLevelOf(meta.xp);
  const dailyReady = canClaimDaily(meta);
  const cooldownLeft = Math.max(0, Math.ceil((SPONSOR_COOLDOWN_MS - (nowMs - meta.lastSponsorAt)) / 1000));
  const checkoutUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CHECKOUT_URL;
  const disableTrialCode =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DISABLE_TRIAL_CODE === 'true';

  useEffect(() => {
    if (spotPlaying === null) return;
    if (spotSeconds <= 0) {
      try {
        const res = claimSponsorReward(meta, spotPlaying, Date.now());
        onMetaChange(res.meta);
        setNote(res.summary);
      } catch (err) {
        setNote((err as Error).message);
      }
      setSpotPlaying(null);
      setNowMs(Date.now());
      return;
    }
    const timer = setTimeout(() => setSpotSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [spotPlaying, spotSeconds, meta, onMetaChange]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  function handleDaily() {
    try {
      const res = claimDailySupply(meta);
      onMetaChange(res.meta);
      setNote(res.summary);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  async function handleStartSponsor() {
    if (cooldownLeft > 0 || spotPlaying !== null) return;
    const idx = Math.floor(Date.now() / 1000) % SPONSOR_SPOTS.length;
    if (window.__MODU_REWARDED_AD__) {
      try {
        const watched = await window.__MODU_REWARDED_AD__.show();
        if (!watched) {
          setNote('播报未完整收听，暂未发放补给。');
          return;
        }
        const res = claimSponsorReward(meta, idx, Date.now());
        onMetaChange(res.meta);
        setNote(res.summary);
        setNowMs(Date.now());
      } catch {
        setNote('广告服务暂不可用，请稍后重试。');
      }
      return;
    }
    setSpotPlaying(idx);
    setSpotSeconds(4);
  }

  function handleClaimTier(tierLevel: number, track: 'free' | 'pro') {
    try {
      const next = claimPassTier(meta, tierLevel, track);
      onMetaChange(next);
      setNote(`已领取 Lv.${tierLevel} ${track === 'pro' ? '黑卡尊享轨' : '免费轨'}奖励！`);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleRedeem(inputCode: string) {
    try {
      const next = activateBlackCard(meta, inputCode);
      onMetaChange(next);
      setCode('');
      setNote('恭喜激活「魔都创始黑卡」！全套尊享特权与 +200 XP 已到账。');
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleUseSupply(key: 'prClear' | 'headhunter' | 'insider') {
    if (!game || !onGameChange) {
      setNote('进入上海牌局后即可在局内启用该特权物资。');
      return;
    }
    try {
      const res = useTacticalSupply(meta, game, key);
      onMetaChange(res.meta);
      onGameChange(res.game);
      setNote(res.message);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleSelectTitle(title: string) {
    if (!meta.unlockedTitles.includes(title)) return;
    onMetaChange({ ...meta, activeTitle: title });
    setNote(`已佩戴跨周目荣誉铭牌：「${title}」`);
  }

  const activeSpot = spotPlaying !== null ? SPONSOR_SPOTS[spotPlaying] : null;

  return (
    <section className="pass-modal">
      <header className="pass-header">
        <div>
          <p className="pass-kicker">
            SEASON 01 · SHANGHAI SYNDICATE {meta.blackCard && <em>BLACK CARD VIP</em>}
          </p>
          <h2>浦江风云通行证与黑卡俱乐部</h2>
        </div>
        <div className="pass-level-box">
          <span>Lv.{level}</span>
          <div>
            <b>{meta.activeTitle}</b>
            <small>
              {level >= MAX_PASS_LEVEL ? `满级 · 共 ${meta.xp} XP` : `${progressXp} / ${nextXp} XP`}
            </small>
            <i style={{ width: `${Math.min(100, Math.round((progressXp / nextXp) * 100))}%` }} />
          </div>
        </div>
      </header>

      <div className="pass-daily-strip">
        <div className="pass-daily-card">
          <div>
            <b>每日街头签到补给</b>
            <small>
              连续第 {meta.checkin.streak || 1} 天 · {meta.blackCard ? '黑卡双倍物资生效中' : '激活黑卡享双倍签到物资'}
            </small>
          </div>
          <button type="button" className="primary small" disabled={!dailyReady} onClick={handleDaily}>
            {dailyReady ? '领取今日补给' : '今日已签'}
          </button>
        </div>

        <div className="pass-daily-card sponsor-card">
          {activeSpot ? (
            <div className="sponsor-live">
              <small>{activeSpot.station} · 特约播报中（{spotSeconds}s）</small>
              <p>{activeSpot.copy}</p>
            </div>
          ) : (
            <>
              <div>
                <b>FM 电台特约激励补给</b>
                <small>收听 4 秒沪上电台特约口播，立领随机特权令 +45 XP</small>
              </div>
              <button
                type="button"
                className="secondary small"
                disabled={cooldownLeft > 0}
                onClick={() => void handleStartSponsor()}
              >
                {cooldownLeft > 0 ? `冷却 ${cooldownLeft}s` : '收听领补给'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pass-supplies" aria-label="特权物资库存">
        {(['prClear', 'headhunter', 'insider', 'bonusReroll'] as SupplyKey[]).map(key => {
          const info = SUPPLY_INFO[key];
          const count = meta.supplies[key];
          const usableInPlay = key !== 'bonusReroll';
          return (
            <div key={key} className="supply-chip">
              <div>
                <b>{info.name}</b>
                <strong>×{count}</strong>
              </div>
              <small>{info.desc}</small>
              {usableInPlay && game && !game.ended && (
                <button
                  type="button"
                  className="text-button"
                  disabled={count <= 0 && !(key === 'insider' && meta.blackCard)}
                  onClick={() => handleUseSupply(key)}
                >
                  {key === 'insider' && meta.blackCard ? '黑卡永久生效' : info.actionLabel}
                  <Icon name="arrow" size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <nav className="empire-tabs pass-tabs" aria-label="俱乐部栏目">
        <button type="button" aria-pressed={tab === 'pass'} onClick={() => setTab('pass')}>
          <GameIcon name="reward" size={15} />
          S1 赛季通行证
        </button>
        <button type="button" aria-pressed={tab === 'vip'} onClick={() => setTab('vip')}>
          <Icon name="spark" size={15} />
          创始黑卡 VIP
        </button>
        <button type="button" aria-pressed={tab === 'achievements'} onClick={() => setTab('achievements')}>
          <GameIcon name="rank" size={15} />
          传奇勋章（{meta.achievements.length}/{MODU_ACHIEVEMENTS.length}）
        </button>
      </nav>

      {note && (
        <p className="empire-note" role="status">
          <Icon name="check" size={15} />
          {note}
        </p>
      )}

      {tab === 'pass' && (
        <div className="pass-track-list">
          {SEASON_PASS_TIERS.map(tier => {
            const unlocked = level >= tier.level;
            const freeClaimed = meta.claimedFreeTiers.includes(tier.level);
            const proClaimed = meta.claimedProTiers.includes(tier.level);
            return (
              <div key={tier.level} className={'pass-tier-row' + (unlocked ? ' is-unlocked' : '')}>
                <div className="pass-tier-lv">
                  <span>Lv.{tier.level}</span>
                  {unlocked && <Icon name="check" size={13} />}
                </div>
                <div className="pass-tier-cell">
                  <small>免费街头轨</small>
                  <b>{tier.freeLabel}</b>
                  <button
                    type="button"
                    className="secondary small"
                    disabled={!unlocked || freeClaimed}
                    onClick={() => handleClaimTier(tier.level, 'free')}
                  >
                    {freeClaimed ? '已领取' : unlocked ? '领取' : '未达成'}
                  </button>
                </div>
                <div className="pass-tier-cell pro-cell">
                  <small>创始黑卡尊享轨</small>
                  <b>{tier.proLabel}</b>
                  {meta.blackCard ? (
                    <button
                      type="button"
                      className="primary small"
                      disabled={!unlocked || proClaimed}
                      onClick={() => handleClaimTier(tier.level, 'pro')}
                    >
                      {proClaimed ? '已领取' : unlocked ? '尊享领取' : '未达成'}
                    </button>
                  ) : (
                    <button type="button" className="text-button" onClick={() => setTab('vip')}>
                      解锁黑卡领奖 →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'vip' && (
        <div className="vip-showcase">
          <div className="vip-card-visual">
            <div className="vip-card-top">
              <span>MODU SYNDICATE · FOUNDER EDITION</span>
              <b>¥18 · 终身买断</b>
            </div>
            <h3>魔都人生 · 创始黑卡会员</h3>
            <ul className="vip-perks">
              <li>
                <b>交易所「外滩私募内参」永久开启</b> — 实时推演每只标的下一年度涨跌风向与预期幅度
              </li>
              <li>
                <b>开局手牌重抽上限永久 +1</b> — 每局免费重抽由 2 次升至 3 次，逆天改命更从容
              </li>
              <li>
                <b>S1 赛季通行证尊享轨全额解锁</b> — 领限定称号「十六铺话事人」「浦江传奇教父」及海量特权令
              </li>
              <li>
                <b>黑卡专属流光铭牌与海报钢印</b> — 街区 HUD 与人生分享海报镌刻金色创始黑卡徽记
              </li>
            </ul>
            {meta.blackCard ? (
              <div className="vip-activated-banner">
                <Icon name="check" size={18} />
                <span>尊贵的创始黑卡会员（激活于 {meta.blackCardSince ?? '本赛季'}）· 全部特权永久生效中</span>
              </div>
            ) : (
              <div className="vip-actions">
                {checkoutUrl && (
                  <a className="primary vip-buy-link" href={checkoutUrl} target="_blank" rel="noreferrer">
                    前往收银台开通创始黑卡（¥18）
                  </a>
                )}
                <div className="vip-redeem-row">
                  <input
                    aria-label="黑卡激活码"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="输入黑卡兑换码（如 MODU-1992-VIP）"
                  />
                  <button type="button" className="primary small" onClick={() => handleRedeem(code)}>
                    核销激活
                  </button>
                  {!disableTrialCode && (
                    <button
                      type="button"
                      className="secondary small"
                      onClick={() => handleRedeem('MODU-1992-VIP')}
                    >
                      公测创始礼遇一键激活
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="vip-titles-box">
            <h4>佩戴荣誉铭牌（展示于街区档案与分享海报）</h4>
            <div className="vip-title-list">
              {meta.unlockedTitles.map(title => (
                <button
                  key={title}
                  type="button"
                  aria-pressed={meta.activeTitle === title}
                  className={meta.activeTitle === title ? 'active' : ''}
                  onClick={() => handleSelectTitle(title)}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="ach-grid">
          {MODU_ACHIEVEMENTS.map(ach => {
            const done = meta.achievements.includes(ach.id);
            return (
              <article key={ach.id} className={'ach-card' + (done ? ' is-done' : '')}>
                <div>
                  <b>{ach.title}</b>
                  <span className="ach-xp">+{ach.xp} XP</span>
                </div>
                <p>{ach.desc}</p>
                <small>{done ? '已载入沪上传奇档案' : '进行对局即可解锁'}</small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
