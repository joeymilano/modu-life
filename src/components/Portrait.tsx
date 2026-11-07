import type { CastMember, OriginCard, PlayerAppearance } from '../game/types';
import { playerArt, portraitArt } from '../game/art';

export function Portrait({ person, size = 64, full = false }: { person: CastMember; size?: number; full?: boolean }) {
 return <div className={'portrait ' + (full ? 'portrait-full' : 'portrait-head')} style={full ? undefined : { width: size, height: size }}>
  <img src={portraitArt(person.id, full)} alt={person.name} decoding="async" loading="lazy" />
 </div>;
}

export function PlayerPortrait({ appearance, full = false, size = 52, age = 18 }: { appearance: PlayerAppearance; full?: boolean; size?: number; age?: number }) {
 return <div className={'player-portrait ' + (full ? 'player-portrait-full' : 'player-portrait-head')} style={full ? undefined : { width: size, height: size }}>
  <img src={playerArt(appearance, full, age)} alt={`${age}岁时的玩家形象`} decoding="async" />
 </div>;
}

export function CardArt({ card }: { card: OriginCard }) {
 return <div className="card-art"><img src={'/art/origins/' + card.id + '.webp'} alt="" decoding="async" /></div>;
}
