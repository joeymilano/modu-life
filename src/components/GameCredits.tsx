import './game-credits.css';

export default function GameCredits() {
  return <details className="game-credits">
    <summary>制作名单</summary>
    <div className="game-credit-list">
      <span>配乐</span>
      <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700070" target="_blank" rel="noreferrer">Apero Hour</a>
      <p>Kevin MacLeod</p>
      <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · 音量调整、转码</p>
    </div>
  </details>;
}
