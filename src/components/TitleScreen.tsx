import Icon from './Icon';
import { STALL_PATH } from '../game/stallChallenge';
import './title-screen.css';

type TitleScreenProps = {
  hand?: string;
  resume?: { label: string; onSelect: () => void };
  onStart: () => void;
  onDraw: () => void;
  onParallel: () => void;
  onSelectOrigin: () => void;
  onPearl: () => void;
};

function MenuEntry({ label, detail, primary, onSelect }: {
  label: string;
  detail?: string;
  primary?: boolean;
  onSelect: () => void;
}) {
  return <button className={primary ? 'title-entry title-entry-primary' : 'title-entry'} onClick={onSelect}>
    <b>{label}</b>{detail && <small>{detail}</small>}
    <Icon name="chevron" size={17}/>
  </button>;
}

export default function TitleScreen({ hand, resume, onStart, onDraw, onParallel, onSelectOrigin, onPearl }: TitleScreenProps) {
  const showResume = Boolean(resume && hand === undefined);
  return <main className="title-screen">
    <div className="title-stage">
      <div className="title-scene">
        <picture>
          <source media="(max-width: 760px)" srcSet="/art/title/shanghai-stories-mobile.webp"/>
          <img className="home-key-art" src="/art/title/shanghai-stories.webp"
            alt="漫画里的上海傍晚。拖着红行李箱的女孩来到外滩，骑手穿过弄堂，黄河路的饭局刚刚开场。"
            fetchPriority="high"/>
        </picture>
      </div>

      <div className="title-copy">
        <h1 className="game-title"><img src="/brand/shanghai-stories/logo-poster.svg" alt="魔都人生" width={524} height={126}/></h1>
        <p className="title-english" lang="en">MODU LIFE</p>

        <nav className="title-menu" aria-label="选择游戏模式">
          {showResume && resume && <MenuEntry label="继续游戏" detail={resume.label} primary onSelect={resume.onSelect}/>}
          <MenuEntry label={hand === undefined ? '开始新游戏' : '接这手牌'} detail={hand} primary={!showResume} onSelect={onStart}/>
          <MenuEntry label="选择出身" onSelect={onSelectOrigin}/>
          {hand===undefined&&<MenuEntry label="手牌与角色" onSelect={onDraw}/>}
          <MenuEntry label="平行上海" onSelect={onParallel}/>
          {!showResume && resume && <MenuEntry label="继续游戏" detail={resume.label} onSelect={resume.onSelect}/>}
        </nav>

        <div className="title-arcades" aria-label="小游戏">
          <button onClick={onPearl}><Icon name="bolt" size={16}/>外滩激光</button>
          <a href={STALL_PATH}><Icon name="coffee" size={16}/>晚风小吃街</a>
        </div>
      </div>
    </div>

  </main>;
}
