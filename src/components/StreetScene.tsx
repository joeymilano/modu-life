import { BUND_1992 } from '../game/calendar';
import type { CSSProperties, ReactNode } from 'react';
import { ACTIVITY_NAMES } from '../game/engine';
import { CORNER_OBJECTS, cornerPhoto } from '../game/streetCorners';
import type { District, DistrictId, Hotspot } from '../game/types';
import GameIcon from './GameIcon';
import Icon from './Icon';

const EARLY_STREET_ART: Partial<Record<DistrictId, string>> = {
  bund: BUND_1992,
  lujiazui: '/art/era/lujiazui-1992.webp',
};

const DISTRICT_ATMOS: Record<DistrictId, string> = {
  bund: '江雾微雨 · 汽笛夜航',
  anfu: '梧桐晚风 · 街角暗香',
  people: '霓虹车流 · 不夜中枢',
  lujiazui: '摩天流光 · 资本潮汐',
  zhangjiang: '园区灯火 · 算力昼夜',
  xinzhuang: '外环晚班 · 烟火站台',
};

export default function StreetScene({ district, disabled, onVisit, onNightOwl, onCorner, returning, concierge, year, heatLevel = 0 }: {
  district: District; disabled: boolean; onVisit: (place: Hotspot) => void; onNightOwl: () => void;
  onCorner?: () => void; returning: boolean; concierge?: ReactNode; year: number; heatLevel?: number;
}) {
  const periodArtwork = year < 1995 ? EARLY_STREET_ART[district.id] : undefined;
  const object = CORNER_OBJECTS[district.id];
  const [x,y] = object.point;
  return <div className={'street-scene'+(concierge?' has-concierge':'')}>
    <div className="street-frame" data-district={district.id} data-heat={heatLevel >= 2 ? 'high' : heatLevel > 0 ? 'low' : undefined} key={district.id}>
      <img src={periodArtwork ?? cornerPhoto(district.id)} alt="" width={1320} height={880} decoding="async" />
      <div className="street-hud-top" aria-hidden="true">
        <span className="street-weather-pill"><i>●</i> {DISTRICT_ATMOS[district.id]}</span>
        {heatLevel > 0 && (
          <span className={'street-wanted-stars' + (heatLevel >= 3 ? ' is-critical' : '')} title={`街头风头 ${heatLevel} 星`}>
            {'★'.repeat(heatLevel)}{'☆'.repeat(5 - heatLevel)}
          </span>
        )}
      </div>
      {onCorner&&!periodArtwork&&<button className="corner-pin"
        style={{'--object-x':x+'%','--object-y':y+'%','--offset-x':x/100-.5,'--offset-y':y/100-.5} as CSSProperties}
        disabled={disabled} onClick={onCorner} aria-label={(returning?'再去看看':'看看')+object.label}>
        <span className="corner-pin-label">{returning?'再去看看':object.label}</span>
        <span className="corner-pin-target"><Icon name="eye" size={19}/></span>
      </button>}
      <div className="street-name">
        <div className="street-dateline"><span>{year}</span> {district.en}</div>
        <h1>{district.name}</h1>
        <p className="street-subtitle">{district.subtitle}</p>
      </div>
      {district.id === 'bund' && <button className="street-owl" onClick={onNightOwl} disabled={disabled} aria-label="打开夜猫子邮筒">
        <GameIcon name="night-mail" size={18}/> 夜猫子邮筒
      </button>}
    </div>
    {concierge}
    <div className="street-places">
      {district.hotspots.map(place => {
        const archival = place.id === 'bund-photo' && year < 1995;
        const artwork = archival ? 'bund-photo-1992' : place.id;
        return <button key={place.id} className="place-card street-place" data-activity={place.kind}
          disabled={disabled} onClick={() => onVisit(place)}>
          <img className="street-card-art" src={`/art/street-cards/${artwork}.webp`} alt="" width={480} height={235} decoding="async"/>
          <span className="street-place-icon"><GameIcon name={place.kind} size={21}/></span>
          <span className="street-place-copy">
            <small>{ACTIVITY_NAMES[place.kind]}{archival && ' · 1992 实景'}</small>
            <b>{place.name}</b>
          </span>
          <Icon className="street-place-chevron" name="chevron" size={15}/>
        </button>;
      })}
    </div>
  </div>;
}
