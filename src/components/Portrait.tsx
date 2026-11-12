import type { CastMember, OriginCard, PlayerAppearance } from '../game/types';
import { originPhoto, playerArt, portraitArt } from '../game/art';

export function Portrait({ person, size = 64, full = false, age = 18, decorative = false }: {
 person: CastMember; size?: number; full?: boolean; age?: number; decorative?: boolean;
}) {
 return <div className={'portrait ' + (full ? 'portrait-full' : 'portrait-head')} style={full ? undefined : { width: size, height: size }}>
  <img src={portraitArt(person.portraitId ?? person.id, full, age)} alt={decorative ? '' : person.name} decoding="async" loading="lazy" />
 </div>;
}

export function PlayerPortrait({ appearance, full = false, size = 52, age = 18 }: { appearance: PlayerAppearance; full?: boolean; size?: number; age?: number }) {
 return <div className={'player-portrait ' + (full ? 'player-portrait-full' : 'player-portrait-head')} style={full ? undefined : { width: size, height: size }}>
  <img src={playerArt(appearance, full, age)} alt={`${age}岁时的玩家形象`} decoding="async" />
 </div>;
}

export function CardArt({ card }: { card: OriginCard }) {
 return <div className="card-art"><img src={originPhoto(card.id)} alt="" decoding="async" /></div>;
}
