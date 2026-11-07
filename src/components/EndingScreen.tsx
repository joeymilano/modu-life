import { ending, publicOriginNames } from '../game/engine';
import { endingPhoto } from '../game/art';
import { lastDayMemory } from '../game/lastDay';
import type { GameState } from '../game/types';
import Icon from './Icon';
import { PlayerPortrait } from './Portrait';
import './ending.css';

export default function EndingScreen({ game, sharing, onShare, onChallenge, onDraw, onJournal, onLines }: {
 game: GameState;
 sharing: boolean;
 onShare: () => void;
 onChallenge: () => void;
 onDraw: () => void;
 onJournal: () => void;
 onLines: () => void;
}) {
 const result = ending(game);
 const memory = lastDayMemory(game);
 const contacts = Object.values(game.relationships).filter(person => person.met).length;

 return <main className="ending-screen">
  <header className="ending-copy">
   <p className="eyebrow">在上海过了 42 年</p>
   <h1>{result.title}</h1>
   <p className="ending-description">{result.text}</p>
  </header>

  <section className="ending-media" aria-label="这一路的照片">
   <img className="ending-scene" src={endingPhoto(result.id)} alt="" fetchPriority="high"/>
   <div className="ending-portraits">
    <figure>
     <PlayerPortrait appearance={game.appearance} age={18} full/>
     <figcaption>18 岁 <span>刚到上海</span></figcaption>
    </figure>
    <figure>
     <PlayerPortrait appearance={game.appearance} age={game.age} full/>
     <figcaption>{game.age} 岁 <span>{game.name}</span></figcaption>
    </figure>
   </div>
  </section>

  <section className="ending-details">
   <dl className="ending-stats">
    <div><dt>手上剩下</dt><dd>¥{Math.round(game.cash).toLocaleString('zh-CN')}</dd></div>
    <div><dt>认识的人</dt><dd>{contacts} 位</dd></div>
    <div><dt>遇到的故事</dt><dd>{game.seenEvents.length} 段</dd></div>
   </dl>
   {memory&&<article className="ending-memory">
    <p className="eyebrow">{memory.age} 岁 · {memory.tag}</p>
    <h2>{memory.title}</h2>
    <p>{memory.text}</p>
   </article>}
   <div className="ending-origin">
    <p>当年的这手牌</p>
    <ul>{publicOriginNames(game).map((name,index)=><li key={index}>{name}</li>)}</ul>
   </div>
   <div className="ending-actions">
    <button className="primary" onClick={onShare} disabled={sharing}><Icon name="share" size={18}/>{sharing?'正在洗照片…':'带走我的人生卡'}</button>
    <button className="secondary" onClick={onDraw}>再活一次 <Icon name="dice" size={17}/></button>
   </div>
   <div className="ending-links">
    <button className="text-button" onClick={onChallenge}>把同一手牌发给朋友 <Icon name="share" size={16}/></button>
    <button className="text-button" onClick={onLines}>回到一处岔路 <Icon name="map" size={16}/></button>
    <button className="text-button" onClick={onJournal}>翻记事本 <Icon name="book" size={16}/></button>
   </div>
  </section>
 </main>;
}
