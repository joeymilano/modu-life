import './game-credits.css';
import { SOUNDTRACK, type Song } from '../game/soundtrack';

export default function GameCredits() {
  const songs = Object.values(SOUNDTRACK);
  // Songs under the shared licence are listed together; a song used under its own terms is credited on its own line.
  const shared: Song[] = songs.filter(track => track.isrc);
  const licensed: Song[] = songs.filter(track => !track.isrc);
  return <details className="game-credits">
    <summary>制作名单</summary>
    <div className="game-credit-list">
      {shared.length > 0 && <>
        <span>配乐 · Kevin MacLeod</span>
        <ul>{shared.map(track =>
          <li key={track.file}><a href={`https://incompetech.com/music/royalty-free/index.html?isrc=${track.isrc}`} target="_blank" rel="noreferrer">{track.title}</a></li>
        )}</ul>
        <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · 音量调整、转码</p>
      </>}
      {licensed.map(track => <p key={track.file}>配乐 · {track.title} — {track.artist ?? '作者未登记'}
        {track.source ? <> · <a href={track.source} target="_blank" rel="noreferrer">{track.license ?? '已获授权使用'}</a></> : ` · ${track.license ?? '已获授权使用'}`}
      </p>)}
      <p><a href="/audio/foley/credits.txt" target="_blank" rel="noreferrer">实录音效来源 · CC0</a></p>
      <hr/>
      <span>图标 · Delapouite</span>
      <a href="https://game-icons.net/" target="_blank" rel="noreferrer">Game-icons.net</a>
      <p><a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> · 去底、重新配色</p>
      <hr/>
      <span>历史照片 · Gary Stevens</span>
      <a href="https://commons.wikimedia.org/wiki/File:The_Bund,_1992_(3776324495).jpg" target="_blank" rel="noreferrer">The Bund, 1992</a>
      <p><a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noreferrer">CC BY 2.0</a> · 裁切、调色</p>
      <p><a href="/art/street-cards/credits.txt" target="_blank" rel="noreferrer">逐项素材来源</a></p>
    </div>
  </details>;
}
