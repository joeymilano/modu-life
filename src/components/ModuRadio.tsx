import { useState } from 'react';
import { playImpact } from '../game/audio';
import { MODU_STATIONS, streetWireOf } from '../game/moduRadio';
import type { GameState } from '../game/types';
import Icon from './Icon';
import type { useSoundtrack } from './useSoundtrack';

export default function ModuRadio({ game, soundtrack }: {
  game: GameState;
  soundtrack: ReturnType<typeof useSoundtrack>;
}) {
  const [wireIndex, setWireIndex] = useState(0);
  const { audio, toggleAudio, tuneStation, station } = soundtrack;
  const wire = streetWireOf(game, wireIndex);
  const [eraTitle, eraLine] = wire.era;

  return <section className="modu-radio-card" aria-label="魔都电台与街头风声">
    <div className="modu-radio-bar">
      <button type="button" className="modu-radio-power" data-on={audio} aria-label="电台静音切换" onClick={toggleAudio}>
        <Icon name={audio ? 'sound' : 'mute'} size={14}/>
        <span lang="en">{audio ? 'ON AIR' : 'MUTED'}</span>
      </button>
      <button type="button" className="modu-radio-next" aria-label="切换魔都电台频道" onClick={() => { playImpact('radioClick'); tuneStation(); }}>
        换台 <Icon name="chevron" size={13}/>
      </button>
    </div>
    <div className="modu-radio-screen">
      <span className="modu-freq" lang="en">{station.freq}</span>
      <strong>{station.name}</strong>
    </div>
    <div className="modu-radio-dials" role="group" aria-label="电台频段">
      {MODU_STATIONS.map(item => <button
        key={item.key}
        type="button"
        aria-pressed={item.key === station.key}
        aria-label={item.freq + ' ' + item.name}
        onClick={() => { playImpact('radioClick'); tuneStation(item.key); }}
      >
        {item.freq.replace('FM ', '')}
      </button>)}
    </div>
    <p className="modu-dj-line"><b>{station.dj}</b>：{station.line}</p>
    <div className="modu-wire" onClick={() => setWireIndex(n => n + 1)} role="button" tabIndex={0}
      aria-label="刷新街头风声" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWireIndex(n => n + 1); } }}>
      <div className="modu-wire-head">
        <span>{wire.source}</span>
        <small>{eraTitle}</small>
      </div>
      <p>{wire.text}</p>
      <small className="modu-wire-era">{eraLine}</small>
    </div>
  </section>;
}
