import { useState } from 'react';
import { calendarYear } from '../game/calendar';
import { playImpact } from '../game/audio';
import {
  assignHeistCrew,
  executeHeist,
  HEIST_CREW,
  HEISTS,
  heistChance,
  heistDoneFlag,
  heistPrepFlag,
  scoutHeist,
  selectedHeistCrew,
  type HeistCrewId,
  type HeistOutcome,
} from '../game/heists';
import type { GameState } from '../game/types';
import GameIcon from './GameIcon';
import Icon from './Icon';

const yuan = (n: number) => '¥' + Math.round(n).toLocaleString('zh-CN');

export default function HeistBoard({
  game,
  onChange,
}: {
  game: GameState;
  onChange: (next: GameState) => void;
}) {
  const year = calendarYear(game);
  const [selectedId, setSelectedId] = useState(HEISTS[0].id);
  const [note, setNote] = useState('');
  const [verdict, setVerdict] = useState<HeistOutcome | null>(null);

  const heist = HEISTS.find(h => h.id === selectedId) ?? HEISTS[0];
  const unlocked = year >= heist.openYear;
  const scouted = game.flags.includes(heistPrepFlag(heist.id));
  const done = game.flags.includes(heistDoneFlag(heist.id));
  const crew = selectedHeistCrew(game, heist.id);
  const locked = game.ended || game.pendingYearEvent || Boolean(game.showdown) || Boolean(game.episode);

  function handleScout() {
    try {
      const next = scoutHeist(game, heist.id);
      playImpact('ding');
      onChange(next);
      setVerdict(null);
      setNote(`已完成「${heist.title}」踩点摸底！请挑选入伙搭档并敲定收网方案。`);
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleCrew(crewId: HeistCrewId) {
    try {
      const next = assignHeistCrew(game, heist.id, crewId);
      onChange(next);
      setNote('已更换入伙搭档，分账比例与胜率已实时重算。');
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  function handleExecute(approach: 'smart' | 'loud') {
    try {
      const res = executeHeist(game, heist.id, approach);
      playImpact(res.success ? 'missionPassed' : 'crash');
      onChange(res.state);
      setVerdict(res);
      setNote('');
    } catch (err) {
      setNote((err as Error).message);
    }
  }

  return (
    <section className="heist-board">
      <header className="empire-head">
        <div>
          <p className="empire-kicker">SHANGHAI BIG SCORE · 作战筹备白板</p>
          <h2>浦江大买卖 · 组局收网</h2>
        </div>
        <span className="empire-owned-pill">剩余行动 {game.actions} / 3</span>
      </header>

      <nav className="empire-tabs" aria-label="选择大买卖">
        {HEISTS.map(item => {
          const itemDone = game.flags.includes(heistDoneFlag(item.id));
          const itemOpen = year >= item.openYear;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === heist.id}
              onClick={() => {
                setSelectedId(item.id);
                setNote('');
                setVerdict(null);
              }}
            >
              <GameIcon name="mission" size={15} />
              {item.title}
              {itemDone ? '（已收官）' : !itemOpen ? `（${item.openYear}年）` : ''}
            </button>
          );
        })}
      </nav>

      {verdict && (
        <div className="heist-verdict-banner" data-win={verdict.success}>
          <div className="gta-stamp" data-verdict={verdict.success ? 'win' : 'partial'}>
            <span lang="en">{verdict.success ? 'HEIST PASSED' : 'ESCAPED ALIVE'}</span>
            <i>{verdict.success ? '大票落袋' : '断后保本'}</i>
          </div>
          <h3>{verdict.headline}</h3>
          <p>{verdict.detail}</p>
          <strong>个人净分红 +{yuan(verdict.netTake)}</strong>
        </div>
      )}

      {note && (
        <p className="empire-note" role="status">
          <Icon name="check" size={15} />
          {note}
        </p>
      )}

      <article className="heist-dossier">
        <div className="heist-dossier-top">
          <span>{heist.codename} · {heist.location}</span>
          <b>基准分红池 {yuan(heist.basePayout)}</b>
        </div>
        <h3>{heist.title}</h3>
        <p className="heist-brief">{heist.brief}</p>

        {done ? (
          <div className="vip-activated-banner">
            <Icon name="check" size={18} />
            <span>这桩轰动上海滩的大买卖已载入你的江湖档案。</span>
          </div>
        ) : !unlocked ? (
          <p className="heist-locked-msg">时代风口未到：需等到 {heist.openYear} 年（当前 {year} 年）方能入局。</p>
        ) : !scouted ? (
          <div className="heist-step-box">
            <div>
              <b>第一阶段：前期踩点与买通内线</b>
              <small>消耗 1 格年度行动 + 前期打点费 {yuan(heist.prepCost)}，摸清全场底牌并提升 3 点本事。</small>
            </div>
            <button
              type="button"
              className="primary"
              disabled={locked || game.actions < 1 || game.cash < heist.prepCost}
              onClick={handleScout}
            >
              {game.actions < 1 ? '今年行动已用完' : game.cash < heist.prepCost ? `经费差 ${yuan(heist.prepCost - game.cash)}` : `启动踩点 · ${yuan(heist.prepCost)}`}
            </button>
          </div>
        ) : (
          <div className="heist-ready-zone">
            <p className="heist-scout-ok">
              <Icon name="check" size={15} />
              情报就绪：{heist.scoutSummary}
            </p>

            <h4>第二阶段：钦点入伙搭档（切换搭档不扣行动）</h4>
            <div className="heist-crew-grid">
              {HEIST_CREW.map(member => (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={crew.id === member.id}
                  className={'heist-crew-card' + (crew.id === member.id ? ' active' : '')}
                  onClick={() => handleCrew(member.id)}
                >
                  <div>
                    <b>{member.name}</b>
                    <span>分账 {member.cutPct}%</span>
                  </div>
                  <p>{member.pitch}</p>
                </button>
              ))}
            </div>

            <h4>第三阶段：拍板收网路线（消耗 1 格行动）</h4>
            <div className="heist-approach-grid">
              <div className="heist-approach-card">
                <b>{heist.smartLabel}</b>
                <span>综合成算：{heistChance(game, heist, 'smart')}%</span>
                <button
                  type="button"
                  className="secondary"
                  disabled={locked || game.actions < 1}
                  onClick={() => handleExecute('smart')}
                >
                  按 A 计划智取收网
                </button>
              </div>
              <div className="heist-approach-card loud">
                <b>{heist.loudLabel}</b>
                <span>综合成算：{heistChance(game, heist, 'loud')}% · 收益上限 ×1.35</span>
                <button
                  type="button"
                  className="primary"
                  disabled={locked || game.actions < 1}
                  onClick={() => handleExecute('loud')}
                >
                  按 B 计划强攻掀桌
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
