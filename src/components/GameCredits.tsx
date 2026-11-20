import './game-credits.css';

export default function GameCredits() {
  return <details className="game-credits">
    <summary>制作名单</summary>
    <div className="game-credit-list">
      <span>配乐</span>
      <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700070" target="_blank" rel="noreferrer">Apero Hour</a>
      <p>Kevin MacLeod</p>
      <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · 音量调整、转码</p>
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
