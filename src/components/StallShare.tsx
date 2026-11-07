import { useState } from 'react';
import { stallChallengeUrl } from '../game/stallChallenge';
import type { StallSchedule, StallScore } from '../game/stall';
import Icon from './Icon';

export default function StallShare({ seed, schedule, score }: { seed: string; schedule: StallSchedule; score: StallScore }) {
 const [status, setStatus] = useState('');
 const [showLink, setShowLink] = useState(false);
 const [printing, setPrinting] = useState(false);
 const challenge = { seed, schedule, target: score };
 const link = stallChallengeUrl(challenge);

 async function copy() {
  try {
   await navigator.clipboard.writeText(link);
   setShowLink(false);
   setStatus('挑战链接已复制');
  } catch {
   setShowLink(true);
   setStatus('选中下面的链接就能复制');
  }
 }

 async function print() {
  if (printing) return;
  setPrinting(true);
  try {
   const { downloadBlob, makeStallTicket } = await import('../game/share');
   downloadBlob(await makeStallTicket(challenge), '莘庄晚市小票-' + seed + '.png');
   setStatus('晚市小票已下载');
  } catch {
   setStatus('小票没印出来，可以先发挑战链接');
  } finally {
   setPrinting(false);
  }
 }

 return <div className="stall-share">
  <div className="stall-share-actions">
   <button className="secondary" onClick={copy}><Icon name="share" size={16}/>复制挑战链接</button>
   <button className="secondary" onClick={print} disabled={printing}><Icon name="download" size={16}/>{printing ? '打印中' : '下载晚市小票'}</button>
  </div>
  {showLink && <label>挑战链接<input value={link} readOnly autoFocus onFocus={event => event.target.select()}/></label>}
  {status && <p role="status">{status}</p>}
 </div>;
}
