import { useEffect, useRef, useState } from 'react';
import { pearlPhoto } from '../game/art';
import {
 comparePearlScore, CURRENT_PEARL_RULES, pearlCueNames, pearlHash, pearlMarkStamp, pearlMarkText, pearlRank, pearlResultPhoto,
 pearlRoundCount, pearlRounds, type PearlChallenge, type PearlMark, type PearlRunnerId, type PearlScore, type PearlWave,
} from '../game/pearl';
import { downloadBlob, makePearlTicket, pearlChallengeUrl } from '../game/share';
import { newSeed } from '../game/seed';
import Icon from './Icon';
import LaserGame from './LaserGame';
import MusicCredit from './MusicCredit';

function resultMessage(score: PearlScore, target?: number, targetBlocks?: number) {
 if (target === undefined) return '把小票发过去，朋友会碰到同样的红光。';
 if (score.hits < target) return `你比朋友少洒 ${target - score.hits} 回。`;
 if (score.hits > target) return target === 0 ? '朋友那杯一滴没洒。原路再试？' : `朋友只洒了 ${target} 回。杯子还在，再来？`;
 if (targetBlocks === undefined) return '你们洒得一样多。';
 const order = comparePearlScore(score, target, targetBlocks);
 if (order === 0) return '杯子打平，伞也打平。';
 return order < 0 ? '洒得一样多，你少用伞挡了一回。' : '洒得一样多，朋友少用伞挡了一回。';
}

function RoundTrace({label, trail, waves}: {label: string; trail: readonly PearlMark[]; waves: readonly PearlWave[]}) {
 return <div className="pearl-trace">
  <b>{label}</b>
  <ol aria-label={label}>
   {trail.map((mark,index) => {
    const cue = pearlCueNames[waves[index].kind];
    return <li key={index} data-mark={mark} aria-label={`第 ${index+1} 轮，${cue}，${pearlMarkText[mark]}`}>
     <small aria-hidden="true">{cue}</small><span aria-hidden="true">{pearlMarkStamp[mark]}</span>
    </li>;
   })}
  </ol>
 </div>;
}

export default function PearlArcade({challenge, onClose, audio, onAudio}: {
 challenge: PearlChallenge; onClose: () => void; audio: boolean; onAudio: () => void;
}) {
 const [round, setRound] = useState(0);
 const [runner, setRunner] = useState<PearlRunnerId>('yan');
 const [score, setScore] = useState<PearlScore>();
 const [status, setStatus] = useState('');
 const [linkField, setLinkField] = useState(false);
 const [printing, setPrinting] = useState(false);
 const resultHeading = useRef<HTMLHeadingElement>(null);
 const board = useRef<HTMLElement>(null);
 const title = useRef<HTMLHeadingElement>(null);
 const {seed, target, targetBlocks, targetTrail, rules = 1} = challenge;

 useEffect(() => {
  window.scrollTo(0, 0);
  title.current?.focus({preventScroll: true});
 }, []);
 useEffect(() => {
  if (score) resultHeading.current?.focus();
 }, [score]);

 const link = score ? pearlChallengeUrl(seed, score.hits, rules, score.blocks, score.trail) : '';
 const waves = score?.trail ? pearlRounds(seed, rules) : [];

 async function copyLink() {
  try {
   await navigator.clipboard.writeText(link);
   setStatus('挑战链接已复制');
  } catch {
   setLinkField(true);
   setStatus('选中下面的链接就能复制');
  }
 }

 async function printTicket() {
  if (!score || printing) return;
  setPrinting(true);
  try {
   downloadBlob(await makePearlTicket(seed, score, rules), `外滩小票-${seed}.png`);
   setStatus('小票已下载');
  } catch {
   setStatus('小票没印出来，可以先发挑战链接');
  } finally {
   setPrinting(false);
  }
 }

 function replay() {
  setRound(current => current + 1);
  setScore(undefined);
  setLinkField(false);
  setStatus('');
  board.current?.focus({preventScroll: true});
 }

 return <main className="pearl-page">
  <header className="pearl-top">
   <button type="button" onClick={onClose}>← 回魔都</button>
   <div><small>外滩 · {pearlRoundCount(rules)} 轮 · #{seed}</small>
    <button type="button" onClick={onAudio} aria-label={audio ? '关闭声音' : '打开声音'}><Icon name={audio ? 'sound' : 'mute'} size={17}/></button>
   </div>
  </header>
  <div className="pearl-layout">
   <section className="pearl-hero">
    <img src={pearlPhoto(rules === 4 ? 'snow-king-poster' : 'hero')}
     alt={rules === 4 ? '雨后的外滩，雪王站在蜜雪冰城摊位旁，拿着柠檬水的旅客回头' : '雨后的外滩，拿柠檬水的旅客听见动静回头'} width={850} height={1275}/>
    <div>
     <h1 ref={title} tabIndex={-1} aria-label="四元柠檬水保卫战"><span>四元柠檬水</span><span>保卫战</span></h1>
     <p>{target === undefined ? rules === 4 ? '雪王刚递来四块钱那杯，对岸的灯就红了。' : '吸管刚插下去，对岸的灯就红了。'
      : targetBlocks !== undefined ? `朋友洒了 ${target} 回，挡了 ${targetBlocks} 回。换你拿杯子。`
      : target === 0 ? '朋友刚才一滴没洒。换你拿杯子。' : `朋友刚在这儿洒了 ${target} 回。换你拿杯子。`}</p>
    </div>
   </section>
   <section className="pearl-board" ref={board} tabIndex={-1} aria-label="外滩走位">
    {score ? <div className="pearl-result">
     <p className="eyebrow">外滩小票 · #{seed}</p>
     <h2 ref={resultHeading} tabIndex={-1}>{pearlRank(score)}</h2>
     <div className="pearl-score"><span>洒了 <b>{score.hits}</b> 回</span><span>挡住 <b>{score.blocks}</b> 回</span></div>
     <p>{resultMessage(score, target, targetBlocks)}</p>
     {score.trail && <RoundTrace label="你的八轮" trail={score.trail} waves={waves}/>}
     {targetTrail && <RoundTrace label="朋友的八轮" trail={targetTrail} waves={waves}/>}
     <img src={pearlResultPhoto(score,rules)}
      alt={score.hits ? '洒在石板上的冰块和递过来的纸巾' : score.blocks && rules === 4 ? '有人把伞递过来，柠檬水还拿在手里' : '江边的柠檬水还满着'} width={1320} height={880}/>
     <div className="pearl-result-actions">
      <button type="button" className="primary" onClick={copyLink}><Icon name="share" size={17}/>复制挑战链接</button>
      <button type="button" className="secondary" disabled={printing} onClick={printTicket}><Icon name="download" size={17}/>{printing?'打印中':'下载小票'}</button>
      <button type="button" className="text-button" onClick={replay}>原路再来一次</button>
      <button type="button" className="text-button" onClick={() => { window.location.hash = pearlHash(newSeed(), undefined, CURRENT_PEARL_RULES); }}>换条路线</button>
     </div>
     <a className="text-button pearl-story-link" href="/#story=pearl-signal">
      <Icon name="book" size={16}/> 上船，看看五年后的外滩 <Icon name="chevron" size={15}/>
     </a>
     {linkField && <label className="pearl-link-field">挑战链接
      <input value={link} readOnly autoFocus onFocus={event => event.target.select()}/>
     </label>}
     <p className="pearl-status" role="status">{status}</p>
    </div> : <LaserGame key={round} seed={seed} rules={rules} standalone
     runner={rules === 4 ? runner : undefined} onRunnerChange={rules === 4 ? setRunner : undefined}
     onFinish={result=>{if(result.method==='run')setScore(result.score);}}/>}
   </section>
  </div>
  <footer className="pearl-music"><MusicCredit/></footer>
 </main>;
}
