import type { DistrictId } from './types';

export interface Song {
 title: string; file: string;
 /** Kevin MacLeod's tracks are looked up by ISRC. A song used under its own licence says by whom and on what terms. */
 isrc?: string; artist?: string; license?: string; source?: string;
}

const songs = {
 apero: { title: 'Apero Hour', file: 'apero-hour', isrc: 'USUAN1700070' },
 vibes: { title: 'Backed Vibes (clean)', file: 'backed-vibes', isrc: 'USUAN1100479' },
 lobby: { title: 'Lobby Time', file: 'lobby-time', isrc: 'USUAN1600054' },
 docks: { title: 'Night on the Docks - Sax', file: 'night-on-the-docks', isrc: 'USUAN1100137' },
 noir: { title: 'I Knew a Guy', file: 'i-knew-a-guy', isrc: 'USUAN1100199' },
 walks: { title: 'Opportunity Walks', file: 'opportunity-walks', isrc: 'USUAN1100123' },
 // 徐吉成（MT1990）的钢琴曲，单独取得授权。文件由 320kbps 原件降音量 8.3dB、转为 128kbps，响度与其余曲目一致。
 liuyuexia: { title: '六月下', file: 'liuyuexia', artist: 'MT1990', license: '已获授权使用', source: 'https://music.163.com/song?id=2161973189' },
} as const satisfies Record<string, Song>;

export type SongKey = keyof typeof songs;
export const SOUNDTRACK: Record<SongKey, Song> = songs;

export const PLAYLISTS = {
 home: ['apero', 'lobby', 'vibes'],
 street: ['vibes', 'apero', 'lobby'],
 work: ['lobby', 'vibes', 'walks'],
 night: ['docks', 'noir', 'vibes'],
 story: ['noir', 'docks', 'vibes'],
 cards: ['docks', 'vibes', 'noir'],
 arcade: ['walks', 'lobby', 'apero'],
 /** Dates, goodbyes and other tender passages. Opens on a different song from the story scenes, so the change is heard. */
 tender: ['liuyuexia', 'docks', 'noir'],
} satisfies Record<string, readonly SongKey[]>;

export type MusicScene = keyof typeof PLAYLISTS;

/** What is on screen, reduced to what the music cares about. */
export interface MusicView {
 /** 外滩激光、晚风小吃街和单独的小游戏页 */
 arcade: boolean;
 /** 平行上海 */
 parallel: boolean;
 screen: 'home' | 'draw' | 'play' | 'end';
 cards: boolean;
 /** 约会、道别、同居、恋爱结局，以及对话舞台上的抒情段落 */
 tender: boolean;
 /** 主线、对决、年度事件和面试 */
 story: boolean;
 /** 三维地图的夜景 */
 night: boolean;
 district: DistrictId;
}

export function musicSceneFor(view: MusicView): MusicScene {
 if (view.arcade) return 'arcade';
 // Love outranks the place it happens in: a date in 陆家嘴 is still a date.
 if (view.tender) return 'tender';
 if (view.parallel || view.screen === 'end') return 'night';
 if (view.cards) return 'cards';
 if (view.story) return 'story';
 if (view.screen === 'play') return view.night ? 'night' : view.district === 'lujiazui' || view.district === 'zhangjiang' ? 'work' : 'street';
 return 'home';
}
