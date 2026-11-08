import { useState } from 'react';
import { rentalPhoto } from '../game/art';
import { CAST } from '../game/content';
import { RENTAL_CLUES, RENTAL_CONTRACT_LINES } from '../game/rental';
import { Portrait } from './Portrait';
import Icon from './Icon';
import './rental.css';

const agent = CAST.find(person => person.id === 'fang')!;
type Clue = (typeof RENTAL_CLUES)[number];
type Clause = (typeof RENTAL_CONTRACT_LINES)[number];

export default function RentalGame({ initialEvidence, age, onTalk }: {
 initialEvidence: number; age: number; onTalk: (evidence: number) => void;
}) {
 const [found, setFound] = useState(initialEvidence);
 const [active, setActive] = useState<Clue>();
 const [clause, setClause] = useState<Clause>();
 const [upstairs, setUpstairs] = useState(false);
 const notes = RENTAL_CLUES.filter(clue => found & clue.bit);
 function inspect(clue: Clue) {
  if (clue.id !== 'contract') setFound(mask => mask | clue.bit);
  setClause(clue.id === 'contract' && (found & clue.bit) ? RENTAL_CONTRACT_LINES.find(line => line.id === 'equipment') : undefined);
  setActive(clue);
  setUpstairs(false);
 }
 function readClause(line: Clause) {
  setClause(line);
  if (active?.id === 'contract' && line.id === 'equipment') setFound(mask => mask | active.bit);
 }

 return <div className="rental-game">
  <div className="rental-view">
   <div className="room-scene">
    <img src={rentalPhoto('room')} alt="莘庄待租的小房间。床头靠左墙，正对窗户，右边的桌上有合同。" />
    {RENTAL_CLUES.map((clue, index) => <button key={clue.id} className="rental-pin"
     style={{ left: clue.x + '%', top: clue.y + '%' }}
     aria-pressed={active?.id === clue.id} data-found={Boolean(found & clue.bit)}
     onClick={() => inspect(clue)}>
     <span aria-hidden="true">{found & clue.bit ? <Icon name="check" size={15} /> : String(index + 1).padStart(2, '0')}</span>
     {clue.label}
    </button>)}
   </div>
   <div className="rental-room-caption"><span>莘庄 · 二楼</span><span>单间 12㎡</span></div>
  </div>
  <div className="rental-inspect">
   <div className="rental-intro">
   <Portrait person={agent} size={46} age={age} decorative />
    <div><small>方姐带看 · 报价 ¥3,000／月</small><h2>这房子能住伐</h2></div>
   </div>
   <div className="rental-detail">
    {active ? <>
     <img key={upstairs ? 'upstairs' : active.id} src={rentalPhoto(upstairs ? 'upstairs' : active.id)}
      alt={upstairs ? '楼上的小房间，窗外看得到树梢' : active.alt} />
     <h3>{upstairs ? '楼上窗对着树' : active.title}</h3>
     <p>{upstairs ? '窗拉到底，风吹进来，听见的是树叶声。方姐说楼上每月三千六。' : active.detail}</p>
     {active.id === 'contract' ? <>
      <div className="rental-contract" role="group" aria-label="租房合同第二页">
       <div className="contract-heading"><span>房屋租赁合同</span><small>02 / 02</small></div>
       {RENTAL_CONTRACT_LINES.map(line => <button type="button" key={line.id}
        aria-pressed={clause?.id === line.id} data-saved={line.id === 'equipment' && Boolean(found & active.bit)}
        onClick={() => readClause(line)}>
        <span>{line.label}</span><b>{line.terms}</b>
       </button>)}
      </div>
      <p className="contract-note" aria-live="polite">{clause?.note}</p>
     </> : <b>{upstairs ? '签约先付 ¥5,200。月租 ¥3,600。' : active.evidence}</b>}
    </> : <p className="rental-opening">「这间三千，签字的钱另外算。」方姐把钥匙放下。楼下的车还没熄火，你可以先看一圈。</p>}
   </div>
   {active?.id === 'window' && <button className="text-button rental-upstairs" onClick={() => setUpstairs(value => !value)}>
    {upstairs ? '← 回看排风机' : '上楼看一眼'} <Icon name="chevron" size={15} />
   </button>}
   <div className="rental-notes">
    <span>已看 {notes.length}／{RENTAL_CLUES.length}</span>
    {notes.map(clue => <span className="rental-note" key={clue.id}><Icon name="check" size={12} />{clue.label}</span>)}
   </div>
   <button className="primary rental-talk" onClick={() => onTalk(found)}>去跟方姐谈 <Icon name="arrow" size={17} /></button>
  </div>
 </div>;
}
