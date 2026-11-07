import { useEffect, useState } from 'react';
import { stallPhoto } from '../game/art';
import { newSeed } from '../game/seed';
import { STALL_ORDER_COUNT, STALL_STEPS, stallSchedule } from '../game/stall';
import { readStallChallenge, stallChallengeHash, type StallChallenge } from '../game/stallChallenge';
import StallGame from './StallGame';

function firstChallenge(): StallChallenge {
 const saved = readStallChallenge(window.location.hash);
 if (saved) return saved;
 const seed = newSeed();
 return { seed, schedule: stallSchedule(seed, 18, 3) };
}

export default function StallArcade() {
 const [challenge, setChallenge] = useState(firstChallenge);
 const [round, setRound] = useState(0);
 const [started, setStarted] = useState(false);

 useEffect(() => {
  const sync = () => {
   setChallenge(firstChallenge());
   setRound(0);
   setStarted(false);
   window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', sync);
  return () => window.removeEventListener('hashchange', sync);
 }, []);

 function replay(changeOrders: boolean) {
  if (changeOrders) {
   const next: StallChallenge = { seed: newSeed(), schedule: challenge.schedule ? 0 : 1 };
   window.history.replaceState(null, '', stallChallengeHash(next));
   setChallenge(next);
  }
  setRound(previous => previous + 1);
  window.scrollTo(0, 0);
 }

 return <main className="stall-page" data-started={started}>
  <header className="stall-page-top">
   <a href="/">← 回魔都人生</a>
   <span>莘庄晚市 · #{challenge.seed}</span>
  </header>
  <div className="stall-arcade-layout">
   <section className="stall-hero">
    <img src={stallPhoto('hero')} alt="傍晚的莘庄小吃摊，吴师傅手搭着锅盖" width={850} height={1275} fetchPriority="high"/>
    <div>
     <span>晚风小吃街</span>
     <h1 aria-label="两口锅，八张单">两口锅<br/>八张单</h1>
     <p>生煎刚下锅，催单的已经站到门口。</p>
    </div>
   </section>
   <section className="stall-arcade-board" aria-label="晚市挑战">
    <div className="stall-challenge-banner">
     {challenge.target
      ? <><b>朋友出了 {challenge.target.served}/{STALL_ORDER_COUNT} 单</b><span>损耗 {challenge.target.waste} 份 · 同一批单</span></>
      : <><b>今晚的单子</b><span>{STALL_STEPS} 步 · {STALL_ORDER_COUNT} 单</span></>}
    </div>
    <StallGame key={round} seed={challenge.seed} schedule={challenge.schedule} age={18} target={challenge.target}
     autoStart={round > 0} onStart={() => {setStarted(true);window.scrollTo(0, 0);}} onReplay={replay}/>
   </section>
  </div>
 </main>;
}
