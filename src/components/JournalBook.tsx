import { useRef, useState } from 'react';
import { activeLine, type LifeBook } from '../game/lifeLines';
import { yearMoment, yearMoney } from '../game/yearReceipt';
import Icon from './Icon';
import YearReceiptCard from './YearReceiptCard';

export default function JournalBook({book, onExport}: {book: LifeBook; onExport: () => void}) {
 const [open,setOpen] = useState<number>();
 const yearButtons = useRef(new Map<number,HTMLButtonElement>());
 const journal = activeLine(book).state.journal;
 const entry = open===undefined ? undefined : journal[open];
 if (entry?.receipt) return <YearReceiptCard book={book} age={entry.age} receipt={entry.receipt}>
  <button className="secondary" onClick={()=>{
   setOpen(undefined);
   requestAnimationFrame(()=>{if (open!==undefined) yearButtons.current.get(open)?.focus();});
  }}>← 记事本</button>
 </YearReceiptCard>;
 return <div className="journal-content">
  <h2>记事本</h2>
  <div className="journal-list">{journal.map((j,i)=>({j,i})).reverse().map(({j,i})=>(
   <article key={i}>
    <div><b>{j.age}</b><span>岁</span></div>
    <section>
     <span className="journal-tag">{j.tag}</span>
     {j.receipt?<button className="journal-year" ref={button=>{
      if (button) yearButtons.current.set(i,button);
      else yearButtons.current.delete(i);
     }} onClick={()=>setOpen(i)}>
      <span><b>{yearMoment(j.receipt.moment).title}</b><small>结完账还剩 {yearMoney(j.receipt.after)}</small></span>
      <Icon name="arrow" size={18}/>
     </button>:<><h3>{j.title}</h3><p>{j.text}</p></>}
    </section>
   </article>
  ))}</div>
  <button className="secondary" onClick={onExport}><Icon name="download" size={17}/>导出完整人生档案</button>
 </div>;
}
