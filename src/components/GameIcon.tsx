import type { ActivityKind, DistrictId, StatKey } from '../game/types';

export type GameIconName = ActivityKind | DistrictId | StatKey
  | 'new-life' | 'resume' | 'origin' | 'hand' | 'rank' | 'parallel'
  | 'arcade' | 'stall' | 'market' | 'journal' | 'action' | 'mission' | 'reward' | 'night-mail';

export default function GameIcon({ name, size = 20 }: { name: GameIconName; size?: number }) {
  return <svg className="game-icon" width={size} height={size} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false">
    <use href={'/icons/game-ui.svg#' + name} width="512" height="512"/>
  </svg>;
}
