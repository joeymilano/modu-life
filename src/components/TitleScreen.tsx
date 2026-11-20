import Icon from './Icon';
import GameIcon, { type GameIconName } from './GameIcon';
import { CINEMA_ART } from '../game/pujiangCinema';
import { STALL_PATH } from '../game/stallChallenge';
import './title-screen.css';

type TitleScreenProps = {
  hand?: string;
  resume?: { label: string; onSelect: () => void };
  onStart: () => void;
  onDraw: () => void;
  onParallel: () => void;
  onSelectOrigin: () => void;
  onRanks: () => void;
  onPearl: () => void;
};

function MenuEntry({ label, detail, icon, primary, onSelect }: {
  label: string;
  detail?: string;
  icon: GameIconName;
  primary?: boolean;
  onSelect: () => void;
}) {
  return <button className={primary ? 'title-entry title-entry-primary' : 'title-entry'} onClick={onSelect}>
    <span className="title-entry-emblem"><GameIcon name={icon} size={20}/></span>
    <b>{label}</b>{detail && <small>{detail}</small>}
    <Icon name="chevron" size={17}/>
  </button>;
}

export default function TitleScreen({ hand, resume, onStart, onDraw, onParallel, onSelectOrigin, onRanks, onPearl }: TitleScreenProps) {
  const showResume = Boolean(resume && hand === undefined);
  return <main className="title-screen">
    <div className="title-stage title-cinema">
      <div className="title-scene">
        <picture>
          <img className="home-key-art" src={CINEMA_ART.gu}
            alt="1992年上海小礼堂，顾桥站在暗红幕布旁看向你，许舟在雨夜的窗边等待。"
            fetchPriority="high"/>
        </picture>
        <div className="title-feature"><span>系统篇 · 浦江破局</span><p>他怎么知道<br/>你眼前的奖励？</p><small>顾桥 · 江边小礼堂</small></div>
      </div>

      <div className="title-copy">
        <p className="title-era">一九九二 · 上海</p>
        <h1 className="game-title cinema-wordmark">魔都<span>人生</span></h1>
        <p className="title-english">四种出身 · 由你开场</p>

        <nav className="title-menu" aria-label="选择游戏模式">
          {showResume && resume && <MenuEntry label="继续游戏" icon="resume" detail={resume.label} primary onSelect={resume.onSelect}/>}
          <MenuEntry label={hand === undefined ? '开始新游戏' : '接这手牌'} icon={hand === undefined?'new-life':'hand'} detail={hand} primary={!showResume} onSelect={onStart}/>
          <MenuEntry label="选择出身" icon="origin" onSelect={onSelectOrigin}/>
          {hand===undefined&&<MenuEntry label="手牌与角色" icon="hand" onSelect={onDraw}/>}
          <MenuEntry label="本周排位" icon="rank" onSelect={onRanks}/>
          <MenuEntry label="平行上海" icon="parallel" onSelect={onParallel}/>
          {!showResume && resume && <MenuEntry label="继续游戏" icon="resume" detail={resume.label} onSelect={resume.onSelect}/>}
        </nav>

        <div className="title-arcades" aria-label="小游戏">
          <button onClick={onPearl}>
            <img src="/art/street-cards/bund-photo.webp" alt="" width={480} height={235} decoding="async"/>
            <GameIcon name="arcade" size={17}/><span>外滩激光</span>
          </button>
          <a href={STALL_PATH}>
            <img src="/art/street-cards/xin-street.webp" alt="" width={480} height={235} decoding="async"/>
            <GameIcon name="stall" size={18}/><span>晚风小吃街</span>
          </a>
        </div>
      </div>
    </div>

  </main>;
}
