import Icon, { type IconName } from './Icon';
import { STALL_PATH } from '../game/stallChallenge';
import './title-screen.css';

type TitleScreenProps = {
  hand?: string;
  resume?: { label: string; onSelect: () => void };
  onDraw: () => void;
  onParallel: () => void;
  onSelectOrigin: () => void;
  onPearl: () => void;
};

function MenuEntry({ icon, label, detail, primary, onSelect }: {
  icon: IconName;
  label: string;
  detail: string;
  primary?: boolean;
  onSelect: () => void;
}) {
  return <button className={primary ? 'title-entry title-entry-primary' : 'title-entry'} onClick={onSelect}>
    <Icon name={icon} size={18}/>
    <span className="title-entry-label"><b>{label}</b><small>{detail}</small></span>
    <Icon name="arrow" size={19}/>
  </button>;
}

export default function TitleScreen({ hand, resume, onDraw, onParallel, onSelectOrigin, onPearl }: TitleScreenProps) {
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
        <span className="title-location" aria-hidden="true">31°14′ N <i/> 121°29′ E</span>
      </div>

      <div className="title-copy">
        <p className="title-kicker"><span aria-hidden="true"/> 上海 <i/> SHANGHAI</p>
        <h1 className="game-title"><img src="/brand/shanghai-stories/logo-poster.svg" alt="魔都人生" width={524} height={126}/></h1>
        <p className="title-english" lang="en">MODU LIFE</p>
        <p className="title-hook">{hand !== undefined
          ? <>朋友递来一手牌<br/>{hand}</>
          : <>十八岁到上海。<br/>手里五张牌，先打哪一张？</>}</p>

        <nav className="title-menu" aria-label="选择游戏模式">
          {showResume && resume && <MenuEntry icon="play" label="继续上回" detail={resume.label} primary onSelect={resume.onSelect}/>}
          <MenuEntry icon="dice" label="我的人生" detail={hand !== undefined ? '接这手牌' : '开局抽卡'} primary={!showResume} onSelect={onDraw}/>
          <MenuEntry icon="map" label="重走别人的人生" detail="去平行上海" onSelect={onParallel}/>
          <MenuEntry icon="people" label="选定出身" detail="日结工 / 顶级富二代" onSelect={onSelectOrigin}/>
          {!showResume && resume && <MenuEntry icon="play" label="继续上回" detail={resume.label} onSelect={resume.onSelect}/>}
        </nav>

        <div className="title-arcades" aria-label="小游戏">
          <button onClick={onPearl}><Icon name="bolt" size={16}/> 先躲一轮激光</button>
          <a href={STALL_PATH}><Icon name="coffee" size={16}/> 去小吃街顶班</a>
        </div>
      </div>
    </div>

    <nav className="title-stories" aria-label="申城小报">
      <span className="title-stories-label"><Icon name="book" size={16}/> 申城小报</span>
      <a href="#story=paper-forward" aria-label="试玩相亲群里那张图">相亲群转错了一张纸 <span aria-hidden="true">↗</span></a>
      <a href="#story=huanghe-toast">黄河路叫你去庆功 <span aria-hidden="true">↗</span></a>
      <a href="#story=staff-bed">宿舍这笔钱 <span aria-hidden="true">↗</span></a>
    </nav>
  </main>;
}
