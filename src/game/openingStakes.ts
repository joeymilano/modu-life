import type { Effect } from './types';

export const OPENING_DRAMA = 'opening-drama';
export const OPENING_PROOF = 'opening-proof';
export const OPENING_ALLIES = 'opening-allies';

export const OPENING_STILLS = ['stage','shift'] as const;
export const dramaPhoto = (shot: (typeof OPENING_STILLS)[number]) => '/art/cold-open/'+shot+'.webp';

export function withOpeningRecord(effect: Effect, record: typeof OPENING_PROOF | typeof OPENING_ALLIES): Effect {
 return {...effect,setFlags:[...(effect.setFlags??[]),record]};
}
