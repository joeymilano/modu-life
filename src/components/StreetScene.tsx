import { streetPhoto } from '../game/art';
import { ACTIVITY_NAMES } from '../game/engine';
import type { District, Hotspot } from '../game/types';
import Icon from './Icon';

export default function StreetScene({ district, disabled, onVisit, onNightOwl }: {
  district: District; disabled: boolean; onVisit: (place: Hotspot) => void; onNightOwl: () => void;
}) {
  return <div className="street-scene">
    <div className="street-frame" data-district={district.id} key={district.id}>
      <img src={streetPhoto(district.id)} alt="" width={1536} height={1024} decoding="async" />
      <div className="street-name">
        <span>{district.en}</span>
        <h1>{district.name}</h1>
      </div>
      {district.id === 'bund' && <button className="street-owl" onClick={onNightOwl} disabled={disabled} aria-label="打开夜猫子邮筒">
        <Icon name="moon" size={16} /> 夜猫子邮筒
      </button>}
    </div>
    <div className="street-places">
      {district.hotspots.map((place, index) => <button key={place.id} className="place-card street-place" disabled={disabled} onClick={() => onVisit(place)}>
        <span className="street-index">{String(index + 1).padStart(2, '0')}</span>
        <span><small>{ACTIVITY_NAMES[place.kind]}</small><b>{place.name}</b><span>{place.caption}</span></span>
        <Icon name="arrow" size={16}/>
      </button>)}
    </div>
  </div>;
}
