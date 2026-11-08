import { useEffect, useRef, useState } from 'react';
import { DISTRICTS } from '../game/content';
import { streetPhoto, TIMELINE_COVER } from '../game/art';
import { activeLine, lineName, MAX_LINES, type LifeBook } from '../game/lifeLines';
import { comparedFacts, describeDecision, lineDivergence } from '../game/lineComparison';
import { downloadBlob, makeLineCard } from '../game/share';
import { PlayerPortrait } from './Portrait';
import Icon from './Icon';
import './life-lines.css';

export default function LifeLines({ book, onFork, onSwitch, onDrop }: {
 book: LifeBook; onFork: (index: number) => void; onSwitch: (id: number) => void; onDrop: (id: number) => void;
}) {
 const line = activeLine(book);
 const [comparedId, setComparedId] = useState<number>();
 const [deleting, setDeleting] = useState<number | null>(null);
 const [printing, setPrinting] = useState(false);
 const [notice, setNotice] = useState('');
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => {
  const title = heading.current;
  title?.closest('.modal')?.scrollTo({ top: 0 });
  title?.focus({ preventScroll: true });
 }, []);
 const others = book.lines.filter(item => item.id !== line.id);
 const other = others.find(item => item.id === comparedId)
  ?? others.find(item => item.id === line.from?.line) ?? others.at(-1);
 const lanes = other ? [line, other] : [line];
 const split = other && lineDivergence(line, other);
 const scene = split && describeDecision(line, split.left);
 const facts = comparedFacts(lanes, scene?.speaker);
 const full = book.lines.length >= MAX_LINES;

 async function print() {
  if (!other || printing) return;
  setPrinting(true);
  setNotice('');
  try {
   const blob = await makeLineCard(line, other);
   downloadBlob(blob, '魔都人生-' + lineName(line.id) + '-' + lineName(other.id) + '.png');
  } catch {
   setNotice('对照图没存下来，再试一次。');
  } finally {
   setPrinting(false);
  }
 }

 return <div className="life-lines">
  <header className="life-lines-heading">
   <img src={TIMELINE_COVER} alt="" />
   <div><span>我的人生</span><h2 ref={heading} tabIndex={-1}>时间线</h2></div>
  </header>
  <div className="life-lines-body">
   {others.length > 1 && <div className="life-line-tabs" role="group" aria-label="选择要对照的时间线">
    <span>选一条来对照</span>
    {others.map(item => <button type="button" key={item.id} aria-pressed={other?.id === item.id}
     onClick={() => { setComparedId(item.id); setDeleting(null); setNotice(''); }}>
     {lineName(item.id)} <small>{item.state.age}岁</small>
    </button>)}
   </div>}
   <section className="life-line-compare">
    <div className="life-compare-heading">
     <h3>{other ? '两条线的近况' : '眼下这条线'}</h3>
     {other && <button className="secondary life-print" disabled={printing} onClick={print}>
      <Icon name="download" size={16}/>{printing ? '正在生成…' : '保存对照图'}
     </button>}
    </div>
    {notice && <p className="life-line-notice" role="status">{notice}</p>}
    <table className="life-compare-table" aria-label="时间线进度对照">
     <thead><tr><td>进度</td>{lanes.map(item => {
      const { state, id } = item;
      const district = DISTRICTS.find(place => place.id === state.district)!;
      return <th scope="col" key={id} className={id === line.id ? 'current' : undefined}>
       <div className="life-line-photo">
        <img src={streetPhoto(state.district)} alt="" />
        <div><PlayerPortrait appearance={state.appearance} size={36} age={state.age}/>
         <div><b>{lineName(id)}</b><span>{state.age}岁 · {district.name}</span></div>
        </div>
        {id === line.id && <small>正在走</small>}
       </div>
      </th>;
     })}</tr></thead>
     <tbody>{facts[0].map(({ label }, index) => {
      const different = Boolean(other && facts[0][index].value !== facts[1][index].value);
      return <tr key={label} data-different={different}>
       <th scope="row">{label}</th>{facts.map((rows, column) => <td key={lanes[column].id}>{rows[index].value}</td>)}
      </tr>;
     })}</tbody>
    </table>
    {!split && lanes.some(item => item.from) && <ul className="life-line-origins">
     {lanes.map(item => item.from && <li key={item.id}>
      {lineName(item.id)} 从{lineName(item.from.line)}的{item.from.age}岁岔出 · {item.from.title}
     </li>)}
    </ul>}
    {other && <div className="life-line-actions">
     <button className="primary" onClick={() => onSwitch(other.id)}>回到{lineName(other.id)} <Icon name="arrow" size={15}/></button>
     {other.id !== 0 && full && (deleting === other.id ? <>
      <button className="text-button" onClick={() => { onDrop(other.id); setDeleting(null); }}>确认删除</button>
      <button className="text-button" onClick={() => setDeleting(null)}>取消</button>
     </> : <button className="text-button" onClick={() => setDeleting(other.id)}>删掉{lineName(other.id)}</button>)}
    </div>}
   </section>
   {split && other && <section className="life-divergence" aria-label="两条线分开的那一步">
    <img src={scene?.art ?? TIMELINE_COVER} alt="" />
    <div>
     <span>分岔于 {split.left.before.age}岁 · {scene?.district}</span>
     <h3>{split.left.title}</h3>
     <dl>
      <div><dt>{lineName(line.id)}</dt><dd>{split.left.choice}</dd></div>
      <div><dt>{lineName(other.id)}</dt><dd>{split.right.choice}</dd></div>
     </dl>
    </div>
   </section>}
   <section className="life-line-points">
    <div className="life-compare-heading"><h3>{lineName(line.id)}的岔路</h3>
     {line.points.length > 0 && <small>{line.points.length}处</small>}
    </div>
    {line.points.length === 0 && <p>做过剧情选择后，可以从这里回去改选。</p>}
    {full && <p>已经有八条线。选一条支线删掉，就能再开。</p>}
    <ol>
     {line.points.map((point, index) => ({ point, index })).reverse().map(({ point, index }) => {
      const shot = describeDecision(line, point);
      return <li key={index}>
       <div className="life-point-thumb">{shot.art ? <img src={shot.art} alt="" loading="lazy" /> : <Icon name="book" size={22}/>}</div>
       <div className="life-point-copy">
        <small>{point.before.age}岁 · {shot.district}</small>
        <b>{point.title}</b>
        <span>{point.choice}</span>
        {shot.result && <details><summary>后来</summary><p>{shot.result}</p></details>}
       </div>
       <button className="secondary" disabled={full || !shot.canReplay} onClick={() => onFork(index)}>
        {shot.canReplay ? '从这里开分支' : '这一幕已换版'} <Icon name="arrow" size={15}/>
       </button>
      </li>;
     })}
    </ol>
   </section>
  </div>
 </div>;
}
