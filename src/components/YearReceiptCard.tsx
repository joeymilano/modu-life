import { useEffect, useRef, useState, type ReactNode } from 'react';
import { activeLine, lineName, type LifeBook } from '../game/lifeLines';
import { downloadBlob, makeYearCard } from '../game/share';
import { signedYearMoney, yearMoment, yearMoney, yearTotals, type YearReceipt } from '../game/yearReceipt';
import Icon from './Icon';
import { PlayerPortrait } from './Portrait';
import './year-receipt.css';

function item(label: string, amount: number, signed = false, className?: string) {
 return <div className={className}><span>{label}</span><b>{signed ? signedYearMoney(amount) : yearMoney(amount)}</b></div>;
}

export default function YearReceiptCard({book, age, receipt, children}: {
 book: LifeBook; age: number; receipt: YearReceipt; children?: ReactNode;
}) {
 const heading = useRef<HTMLHeadingElement>(null);
 const [printing,setPrinting] = useState(false);
 const [printError,setPrintError] = useState(false);
 const current = activeLine(book);
 const moment = yearMoment(receipt.moment);
 const total = yearTotals(receipt);
 const others = book.lines.filter(line=>line.id!==book.active);
 const hasComparison = others.length>0;
 useEffect(()=>{
  const title = heading.current;
  if (!title) return;
  title.closest('.modal')?.scrollTo({top:0});
  title.focus({preventScroll:true});
 },[age]);
 async function print() {
  setPrinting(true);
  setPrintError(false);
  try {downloadBlob(await makeYearCard(current.state,age,receipt),'魔都人生-'+age+'岁.png');}
  catch {setPrintError(true);}
  finally {setPrinting(false);}
 }
 return <div className="year-receipt">
  <figure className="year-photo">
   <img src={moment.photo} alt={moment.alt} decoding="async"/>
   <figcaption>
    <div className="year-photo-id"><PlayerPortrait appearance={current.state.appearance} size={46} age={age}/>
     <span>{current.state.name}<small>{lineName(current.id)}</small></span>
    </div>
   </figcaption>
  </figure>
  <div className="year-sheet">
   <header className="year-sheet-head">
    <span><b>{age}</b> 岁</span>
   </header>
   <h2 ref={heading} tabIndex={-1}>{moment.title}</h2>
   <div className="year-balance">
    <div><small>余额</small><strong>{yearMoney(receipt.after)}</strong></div>
    <div className={total.delta<0?'year-down':'year-up'}><small>本次结算</small><b>{signedYearMoney(total.delta)}</b></div>
   </div>
   <div className="year-totals">
    <div><span>到账</span><b>{yearMoney(total.income)}</b></div>
    <div><span>支出</span><b>{yearMoney(total.paid)}</b></div>
   </div>
   {receipt.notice&&<p className="outcome-text year-notice">{receipt.notice}</p>}
   <div className="year-actions">
    {children}
    <button className="text-button year-print" disabled={printing} onClick={()=>void print()}>
     <Icon name="download" size={17}/>{printing?'正在生成…':'下载账单'}
    </button>
   </div>
   {printError&&<p role="status">下载失败，请重试。</p>}
   <details className="year-details">
    <summary>账单明细 <Icon name="chevron" size={16}/></summary>
    <div className="annual-ledger">
     {item('结算前手上',receipt.before)}
     {item('全年工作收入',receipt.workIncome,true)}
     {receipt.payroll&&<section className="year-payroll" aria-label="换岗工资明细">
      {item('旧岗位收入',receipt.payroll.previous)}
      {item('当前岗位 · '+receipt.payroll.months+' 个月',receipt.payroll.current)}
     </section>}
     {!!receipt.tableIncome&&item('长桌修补台',receipt.tableIncome,true)}
     {!!receipt.stallIncome&&item('小吃街晚班',receipt.stallIncome,true)}
     {!!receipt.friendAdvance&&item('朋友垫付',receipt.friendAdvance,true)}
     {item(receipt.rentKind==='shared'?'你承担的全年住房费':receipt.rentKind==='lease'?'这份租约的全年房租':'全年住房费',-receipt.rent,true)}
     {item('全年生活开支',-receipt.living,true)}
     {!!receipt.familyPaid&&item('家里代付指定账单',receipt.familyPaid,true)}
     {!!receipt.repayment&&item('这期助学贷款',-receipt.repayment,true)}
     {!!receipt.care&&item('休养花费',-receipt.care,true)}
     {!!receipt.uncovered&&item('基本开销缺口 · 未支付',receipt.uncovered,true,'year-shortfall')}
     {item('现在手上',receipt.after)}
    </div>
    <div className="year-wellbeing">
     <span>身体 <b>{receipt.body>0?'+':''}{receipt.body}</b></span>
     <span>心气 <b>{receipt.spirit>0?'+':''}{receipt.spirit}</b></span>
    </div>
   </details>
   {hasComparison&&<details className="year-details year-compare">
    <summary>对照时间线 <Icon name="chevron" size={16}/></summary>
    <ul>{others.map(line=>{
     const other = line.state.journal.find(entry=>entry.age===age&&entry.receipt)?.receipt;
     return <li key={line.id}>
      <div><b>{lineName(line.id)}</b><span>{other?yearMoment(other.moment).title:line.state.age<=age?'还没结这一年的账':'这年的旧账只有文字'}</span></div>
      {other&&<div><strong>{yearMoney(other.after)}</strong><small>比这条线 {signedYearMoney(other.after-receipt.after)}</small></div>}
     </li>;
    })}</ul>
   </details>}
  </div>
 </div>;
}
