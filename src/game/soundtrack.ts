export const SOUNDTRACK = {
  apero: { title: 'Apero Hour', file: 'apero-hour', isrc: 'USUAN1700070' },
  vibes: { title: 'Backed Vibes (clean)', file: 'backed-vibes', isrc: 'USUAN1100479' },
  lobby: { title: 'Lobby Time', file: 'lobby-time', isrc: 'USUAN1600054' },
  docks: { title: 'Night on the Docks - Sax', file: 'night-on-the-docks', isrc: 'USUAN1100137' },
  noir: { title: 'I Knew a Guy', file: 'i-knew-a-guy', isrc: 'USUAN1100199' },
  walks: { title: 'Opportunity Walks', file: 'opportunity-walks', isrc: 'USUAN1100123' },
} as const;

type Song = keyof typeof SOUNDTRACK;

export const PLAYLISTS = {
  home: ['apero', 'lobby', 'vibes'],
  street: ['vibes', 'apero', 'lobby'],
  work: ['lobby', 'vibes', 'walks'],
  night: ['docks', 'noir', 'vibes'],
  story: ['noir', 'docks', 'vibes'],
  cards: ['docks', 'vibes', 'noir'],
  arcade: ['walks', 'lobby', 'apero'],
} satisfies Record<string, readonly Song[]>;

export type MusicScene = keyof typeof PLAYLISTS;
