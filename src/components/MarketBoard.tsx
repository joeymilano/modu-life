import { useState } from 'react';
import { calendarYear, cityYearNote } from '../game/calendar';
import {
 LISTINGS, LISTING_IDS, lotteryPrice, marketQuote, marketValue, openYear, scratchLottery, tradeMarket, tradeValue, type ListingId,
} from '../game/market';
import type { GameState } from '../game/types';
import Icon from './Icon';
import './market.css';

const yuan=(n:number)=>'¥'+n.toLocaleString('zh-CN');

export default function MarketBoard({game,onChange}:{game:GameState;onChange:(state:GameState)=>void}) {
 const year=calendarYear(game);
 const [selected,setSelected]=useState<ListingId>('sh_trade');
 const [tab,setTab]=useState<'trade'|'lottery'>('trade');
 const [lots,setLots]=useState('1');
 const [note,setNote]=useState('');
 const item=LISTINGS[selected];
 const first=openYear(selected), available=year>=first;
 const price=marketQuote(game,selected,year);
 const units=Number(lots);
 const valid=Number.isInteger(units)&&units>0&&units<=1_000_000;
 const buy=valid?tradeValue(game,selected,units,'buy'):0;
 const sell=valid?tradeValue(game,selected,units,'sell'):0;
 const owned=game.market?.holdings[selected];
 const value=marketValue(game);
 const ticket=game.market?.lottery?.year===year?game.market.lottery:null;
 const unitPrice=lotteryPrice(year);
 const locked=game.ended||game.pendingYearEvent||!!game.showdown;
 const points=available?Array.from({length:Math.min(10,year-first+1)},(_,i)=>{
  const at=Math.max(first,year-9)+i;
  return {at,price:marketQuote(game,selected,at)};
 }):[];
 const ceiling=Math.max(...points.map(point=>point.price),1);

 function order(side:'buy'|'sell'){
  try{
   onChange(tradeMarket(game,selected,units,side));
   setNote((side==='buy'?'买入':'卖出')+' '+units+' 手 · '+yuan(side==='buy'?buy:sell));
  }catch(error){setNote((error as Error).message);}
 }
 function scratch(count:number){
  try{
   const result=scratchLottery(game,count);
   onChange(result.state);setNote(result.prize?'兑奖 '+yuan(result.prize):'这几张都没中。');
  }catch(error){setNote((error as Error).message);}
 }
 return <section className="market-board">
  <header><p>{year} 年 · 游戏行情</p><h2>交易所</h2></header>
  <dl className="market-summary"><div><dt>现金</dt><dd>{yuan(game.cash)}</dd></div>
   <div><dt>持仓市值</dt><dd>{yuan(value)}</dd></div><div><dt>现金与持仓</dt><dd>{yuan(game.cash+value)}</dd></div></dl>
  {cityYearNote(year)&&<p className="market-headline">{cityYearNote(year)}</p>}
  <nav className="market-tabs" aria-label="投资板块">
   <button aria-pressed={tab==='trade'} onClick={()=>{setTab('trade');setNote('');}}>行情与持仓</button>
   <button aria-pressed={tab==='lottery'} onClick={()=>{setTab('lottery');setNote('');}}>彩票亭</button>
  </nav>
  {tab==='trade'?<div className="market-desk">
   <div className="market-watch" role="group" aria-label="市场标的">
    {LISTING_IDS.map(id=><button key={id} aria-pressed={id===selected} onClick={()=>{setSelected(id);setNote('');}}>
     <span><small>{LISTINGS[id].market}</small><b>{LISTINGS[id].name}</b></span>
     <strong>{year>=openYear(id)?yuan(marketQuote(game,id,year)):openYear(id)+' 年开放'}</strong>
    </button>)}
   </div>
   <div className="market-ticket">
    <h3>{item.name}</h3>
    {available?<>
     <p>{yuan(price)} / {item.lot} · {owned?'持有 '+owned.lots+' 手':'暂无持仓'}</p>
     {owned&&<p>账面盈亏 <b>{(owned.lots*price-owned.cost>=0?'+':'−')+yuan(Math.abs(owned.lots*price-owned.cost))}</b></p>}
     {points.length>1&&<><ol className="market-chart" aria-label="历年价格">
      {points.map(point=><li key={point.at} title={point.at+' 年 · '+yuan(point.price)}>
       <i style={{height:Math.max(4,point.price/ceiling*100)+'%'}} aria-hidden="true"/>
       <span className="visually-hidden">{point.at} 年 {yuan(point.price)}</span>
      </li>)}
     </ol>
     <div className="market-chart-range"><span>{points[0].at}</span><span>{year}</span></div></>}
     <label>手数 <input aria-label="交易手数" inputMode="numeric" type="number" min={1} max={1000000} value={lots} onChange={event=>setLots(event.target.value)}/></label>
     <div className="market-orders">
      <button className="primary" disabled={locked||!valid||buy>game.cash} onClick={()=>order('buy')}>买入 {valid&&yuan(buy)}</button>
      <button className="secondary" disabled={locked||!valid||units>(owned?.lots??0)} onClick={()=>order('sell')}>卖出 {valid&&yuan(sell)}</button>
     </div>
    </>:<p>{first} 年开放。</p>}
   </div>
  </div>:<div className="market-ticket lottery-ticket">
   <Icon name="spark" size={22}/><h3>即开票</h3><p>{yuan(unitPrice)} / 张 · 每年买一次，最多三张</p>
   {ticket?<p>今年刮了 {ticket.count} 张 · 兑奖 {yuan(ticket.prize)}</p>:
    <div className="market-orders">
     {[1,3].map(count=><button className="primary" key={count} disabled={locked||game.cash<unitPrice*count} onClick={()=>scratch(count)}>刮 {count} 张 · {yuan(unitPrice*count)}</button>)}
    </div>}
  </div>}
  {note&&<p className="market-note" role="status">{note}</p>}
 </section>;
}
