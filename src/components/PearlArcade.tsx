import { useEffect, useRef, useState } from 'react';
import { pearlPhoto } from '../game/art';
import { pearlRank, type PearlChallenge, type PearlScore } from '../game/pearl';
import { downloadBlob, makePearlTicket, pearlChallengeUrl } from '../game/share';
import Icon from './Icon';
import LaserGame from './LaserGame';

export default function PearlArcade({challenge, onClose}: {challenge: PearlChallenge; onClose: () => void}) {
 const [round, setRound] = useState(0);
 const [score, setScore] = useState<PearlScore>();
 const [status, setStatus] = useState('');
 const [linkField, setLinkField] = useState(false);
 const [printing, setPrinting] = useState(false);
 const resultHeading = useRef<HTMLHeadingElement>(null);
 const board = useRef<HTMLElement>(null);
 const title = useRef<HTMLHeadingElement>(null);
 const {seed, target} = challenge;

 useEffect(() => {
  window.scrollTo(0, 0);
  title.current?.focus({preventScroll: true});
 }, []);
 useEffect(() => {
  if (score) resultHeading.current?.focus();
 }, [score]);

 const link = score ? pearlChallengeUrl(seed, score.hits) : '';
 const comparison = score && target !== undefined
  ? score.hits === target ? '你们洒得一样多。'
   : score.hits < target ? `你比朋友少洒 ${target - score.hits} 回。`
   : `朋友只洒了 ${target} 回。杯子还在，再来？`
  : '把小票发过去，朋友会碰到同样的红光。';

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
   downloadBlob(await makePearlTicket(seed, score), `外滩小票-${seed}.png`);
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
   <small>外滩 · #{seed}</small>
  </header>
  <div className="pearl-layout">
   <section className="pearl-hero">
    <img src={pearlPhoto('hero')} alt="外滩游客举着柠檬水，对岸亮起红光" width={1260} height={840}/>
    <div>
     <h1 ref={title} tabIndex={-1}>四元柠檬水保卫战</h1>
     <p>{target === undefined ? '吸管刚插下去，对岸的灯就红了。' : target === 0 ? '朋友刚才一滴没洒。换你拿杯子。' : `朋友刚在这儿洒了 ${target} 回。换你拿杯子。`}</p>
    </div>
   </section>
   <section className="pearl-board" ref={board} tabIndex={-1} aria-label="外滩走位">
    {score ? <div className="pearl-result">
     <p className="eyebrow">外滩小票 · #{seed}</p>
     <h2 ref={resultHeading} tabIndex={-1}>{pearlRank(score)}</h2>
     <div className="pearl-score"><span>洒了 <b>{score.hits}</b> 回</span><span>挡住 <b>{score.blocks}</b> 回</span></div>
     <p>{comparison}</p>
     <img src={pearlPhoto('booth')} alt="小摊桌上的柠檬水和空杯套" width={1260} height={840}/>
     <div className="pearl-result-actions">
      <button type="button" className="primary" onClick={copyLink}><Icon name="share" size={17}/>复制挑战链接</button>
      <button type="button" className="secondary" disabled={printing} onClick={printTicket}><Icon name="download" size={17}/>{printing?'打印中':'下载小票'}</button>
      <button type="button" className="text-button" onClick={replay}>原路再来一次</button>
     </div>
     {linkField && <label className="pearl-link-field">挑战链接
      <input value={link} readOnly autoFocus onFocus={event => event.target.select()}/>
     </label>}
     <p className="pearl-status" role="status">{status}</p>
    </div> : <LaserGame key={round} seed={seed} standalone onFinish={result=>{if(result.method==='run')setScore(result.score);}}/>}
   </section>
  </div>
 </main>;
}
