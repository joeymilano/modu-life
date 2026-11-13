import { BUND_1992 } from '../game/calendar';
import type { CSSProperties, ReactNode } from 'react';
import { ACTIVITY_NAMES } from '../game/engine';
import { CORNER_OBJECTS, cornerPhoto } from '../game/streetCorners';
import type { District, Hotspot } from '../game/types';
import Icon from './Icon';

export default function StreetScene({ district, disabled, onVisit, onNightOwl, onCorner, returning, concierge, year }: {
  district: District; disabled: boolean; onVisit: (place: Hotspot) => void; onNightOwl: () => void;
  onCorner?: () => void; returning: boolean; concierge?: ReactNode; year: number;
}) {
  const earlyBund=year<1995&&(district.id==='bund'||district.id==='lujiazui');
  const object = CORNER_OBJECTS[district.id];
  const [x,y] = object.point;
  return <div className={'street-scene'+(concierge?' has-concierge':'')}>
    <div className="street-frame" data-district={district.id} key={district.id}>
      <img src={earlyBund?BUND_1992:cornerPhoto(district.id)} alt="" width={1320} height={880} decoding="async" />
      {onCorner&&!earlyBund&&<button className="corner-pin"
        style={{'--object-x':x+'%','--object-y':y+'%','--offset-x':x/100-.5,'--offset-y':y/100-.5} as CSSProperties}
        disabled={disabled} onClick={onCorner} aria-label={(returning?'再去看看':'看看')+object.label}>
        <span className="corner-pin-label">{returning?'再去看看':object.label}</span>
        <span className="corner-pin-target"><Icon name="eye" size={19}/></span>
      </button>}
      <div className="street-name"><h1>{district.name}</h1></div>
      {district.id === 'bund' && <button className="street-owl" onClick={onNightOwl} disabled={disabled} aria-label="打开夜猫子邮筒">
        <Icon name="moon" size={16} /> 夜猫子邮筒
      </button>}
    </div>
    {concierge}
    <div className="street-places">
      {district.hotspots.map(place => <button key={place.id} className="place-card street-place" disabled={disabled} onClick={() => onVisit(place)}>
        <span><b>{place.name}</b><small>{ACTIVITY_NAMES[place.kind]}</small></span>
        <Icon name="chevron" size={16}/>
      </button>)}
    </div>
  </div>;
}
