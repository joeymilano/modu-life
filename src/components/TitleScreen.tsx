import Icon from './Icon';
import GameIcon, { type GameIconName } from './GameIcon';
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
    <GameIcon name={icon} size={18}/>
    <span><b>{label}</b>{detail && <small>{detail}</small>}</span>
    {primary && <span className="entry-tear"><Icon name="arrow" size={22}/></span>}
  </button>;
}

function ArcadeTicket({ image, label, mode }: { image: string; label: string; mode: string }) {
  return <>
    <img src={image} alt="" width={460} height={160} decoding="async"/>
    <div className="arcade-ticket-copy"><small>{mode}</small><b>{label}</b></div>
    <span className="arcade-ticket-arrow"><Icon name="arrow" size={18}/></span>
  </>;
}

export default function TitleScreen({ hand, resume, onStart, onDraw, onParallel, onSelectOrigin, onRanks, onPearl }: TitleScreenProps) {
  const showResume = Boolean(resume && hand === undefined);
  return <main className="title-screen">
    <section className="title-stage" aria-labelledby="game-cover-title">
      <picture className="title-scene">
        <source media="(max-width: 700px)" srcSet="/art/title/bund-night-mobile.webp"/>
        <img className="home-key-art" src="/art/title/bund-night.webp" alt="夜色里的上海外滩，两位年轻人站在海关钟楼和轮渡的灯火前。" fetchPriority="high"/>
      </picture>
      <div className="title-copy">
        <div className="title-era"><i aria-hidden="true"/>SHANGHAI <span>1992</span></div>
        <h1 className="game-title" id="game-cover-title"><span>魔都</span><em>人生</em></h1>
        <p className="cover-line">十八岁到上海。手里五张牌，先打哪一张？</p>
        <nav className="title-menu" aria-label="选择游戏模式">
          {showResume && resume && <MenuEntry label="继续游戏" icon="resume" detail={resume.label} primary onSelect={resume.onSelect}/>}
          <MenuEntry label={hand === undefined ? '开始新游戏' : '接这手牌'} icon={hand === undefined ? 'new-life' : 'hand'} detail={hand} primary={!showResume} onSelect={onStart}/>
          <MenuEntry label="选择出身" icon="origin" onSelect={onSelectOrigin}/>
          {hand === undefined && <MenuEntry label="手牌与角色" icon="hand" onSelect={onDraw}/>}
          <MenuEntry label="全球周榜" icon="rank" onSelect={onRanks}/>
          <MenuEntry label="平行上海" icon="parallel" onSelect={onParallel}/>
          {!showResume && resume && <MenuEntry label="继续游戏" icon="resume" detail={resume.label} onSelect={resume.onSelect}/>}
        </nav>
      </div>
      <div className="cover-location"><GameIcon name="bund" size={22}/><span>上海 · 外滩<small>THE BUND</small></span></div>
    </section>
    <section className="title-arcades" aria-label="小游戏">
      <div className="arcade-heading"><span lang="en">ARCADE</span><h2>街机厅</h2></div>
      <button onClick={onPearl}><ArcadeTicket image="/art/title/arcade-pearl.webp" mode="走位挑战" label="外滩激光"/></button>
      <a href={STALL_PATH}><ArcadeTicket image="/art/title/arcade-stall.webp" mode="限时经营" label="晚风小吃街"/></a>
    </section>
  </main>;
}
