import { useState } from 'react';
import type { StoryComparison, storyComparisons } from '../game/timelineComparison';
import Icon from './Icon';

export default function StoryReceiptCompare({options, printing, endingPhoto, onPrint}: {
 options: ReturnType<typeof storyComparisons>; printing: boolean; endingPhoto?: string;
 onPrint: (comparison: StoryComparison) => void;
}) {
 const [key, setKey] = useState('');
 const selected = options.find(option => option.routeKey === key) ?? options[0];
 const { comparison: { date, place, left, right } } = selected;
 const showStills = Boolean(left.shot && right.shot && left.shot !== right.shot);
 return <section className="story-compare" aria-label="两条走法">
  <header className="story-compare-head">
   <div><h2>两条走法</h2><p>{date} · {place}</p></div>
   {options.length > 1 && <label>拿哪一条比
    <select value={selected.routeKey} onChange={event => setKey(event.target.value)}>
     {options.map(option => <option value={option.routeKey} key={option.routeKey}>{option.label}</option>)}
    </select>
   </label>}
  </header>
  {!showStills && endingPhoto && <img className="parallel-ending-photo" src={endingPhoto} alt="" decoding="async"/>}
  <div className="story-compare-pair">
   {[left,right].map((side,index) => <article key={index}>
    <div className="story-compare-tag">{index === 0 ? '这回' : '另一条'} <b>{side.path}</b></div>
    {showStills && <img className={index === 0 && endingPhoto === side.shot ? 'parallel-ending-photo' : undefined}
     src={side.shot} alt="" width={1320} height={880} decoding="async"/>}
    <div className="story-compare-copy">
     <h3>{side.choice}</h3>
     {side.ending !== side.choice && <p className="story-compare-last">{side.ending}</p>}
     <p>{side.after}</p>
    </div>
   </article>)}
  </div>
  <button className="parallel-outline story-compare-save" disabled={printing} onClick={() => onPrint(selected.comparison)}>
   {printing ? '正在洗照片' : '存一张对照图'} <Icon name="download" size={17}/>
  </button>
 </section>;
}
