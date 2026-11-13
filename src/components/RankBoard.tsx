import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignRoute } from '../game/campaignScript';
import { RANK_ATTEMPTS, isRankWeek, rankWeekLabel, type RankBoard as Board, type RankedRun } from '../game/ranked';
import { SHOWDOWN_NAMES, SHOWDOWN_ROUTES, showdownView, type Move } from '../game/showdowns';
import ShowdownStage from './ShowdownStage';

async function rankRequest<T>(query:Record<string,string>,body?:Record<string,unknown>,signal?:AbortSignal):Promise<T> {
 const response=await fetch('/api/ranks?'+new URLSearchParams(query),{
  cache:'no-store',signal,
  ...(body&&{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
 });
 if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('排位暂时连不上。');
 const data=await response.json();
 if (!response.ok) throw new Error(data.error??'排位暂时连不上。');
 return data as T;
}

export default function RankBoard({initialRoute}: {initialRoute?:CampaignRoute}) {
 const params=new URLSearchParams(window.location.search);
 const selected=params.get('rank') as CampaignRoute;
 const date=params.get('week');
 const [route,setRoute]=useState<CampaignRoute>(SHOWDOWN_ROUTES.includes(selected)?selected:initialRoute??'arrival');
 const [week,setWeek]=useState<string|null>(date&&isRankWeek(date)?date:null);
 const [board,setBoard]=useState<Board>();
 const [run,setRun]=useState<RankedRun>();
 const [nickname,setNickname]=useState('');
 const [busy,setBusy]=useState(false);
 const [failed,setFailed]=useState('');
 const [share,setShare]=useState('');
 const pending=useRef<{step:number;move:Move;requestId:string}|undefined>(undefined);
 const locked=useRef(false);
 const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);

 const refresh=useCallback(async(signal?:AbortSignal)=>{
  try{
   const next=await rankRequest<Board>({route,...(week?{week}:{})},undefined,signal);
   if (signal?.aborted||!mounted.current) return;
   setBoard(next);if(!pending.current)setFailed('');
  }catch(error){
   if(!signal?.aborted&&mounted.current) setFailed(error instanceof TypeError?'网络断开了，连上后再试。':(error as Error).message);
  }
 },[route,week]);
 useEffect(()=>{
  const controller=new AbortController();
  void refresh(controller.signal);
  const online=()=>void refresh(controller.signal);
  window.addEventListener('online',online);
  return()=>{controller.abort();window.removeEventListener('online',online);};
 },[refresh]);
 useEffect(()=>{
  const url=new URL(window.location.href);
  url.searchParams.set('rank',route);
  if(week)url.searchParams.set('week',week);else url.searchParams.delete('week');
  history.replaceState(null,'',url);
 },[route,week]);

 function select(nextRoute:CampaignRoute,nextWeek:string|null){
  setBoard(undefined);setRun(undefined);setShare('');setFailed('');
  pending.current=undefined;
  setRoute(nextRoute);setWeek(nextWeek);
 }
 async function request<T>(body:Record<string,unknown>,onSuccess:(result:T)=>void){
  if(locked.current)return;
  locked.current=true;setBusy(true);setFailed('');
  try{
   const result=await rankRequest<T>({},body);
   if(mounted.current)onSuccess(result);
  }catch(error){
   if(mounted.current)setFailed(error instanceof TypeError?'网络断开了，连上后可重试。':(error as Error).message);
  }finally{
   locked.current=false;
   if(mounted.current)setBusy(false);
  }
 }
 function start(){
  if(!board)return;
  if(board.latest&&board.latest.game.moves.length<3){setRun(board.latest);return;}
  void request<RankedRun>({op:'start',week:board.week,route,after:board.latest?.id??null},next=>{
   setBoard({...board,latest:next});setRun(next);
  });
 }
 function move(id:Move){
  if(!run||!board)return;
  const step=run.game.moves.length;
  const outgoing=pending.current?.step===step?pending.current:{step,move:id,requestId:crypto.randomUUID()};
  pending.current=outgoing;
  void request<RankedRun>({op:'move',week:board.week,route,id:run.id,...outgoing},next=>{
   pending.current=undefined;setRun(next);setBoard({...board,latest:next});
  });
 }
 async function invite(){
  if(!board)return;
  const url=new URL('/',window.location.origin);
  url.searchParams.set('rank',route);url.searchParams.set('week',board.week);
  setShare(url.href);
  try{await navigator.clipboard.writeText(url.href);}catch{/* The selectable link is shown either way. */}
 }
 if(run&&board)return <>
  <ShowdownStage game={run.game} ranked busy={busy||!!failed} onMove={move} onDone={()=>{setRun(undefined);void refresh();}}/>
  {failed&&<div className="rank-board">
   <p className="rank-error" role="status">{failed}</p>
   <div className="rank-tools">
    {pending.current&&<button className="secondary" disabled={busy} onClick={()=>move(pending.current!.move)}>重试这一步</button>}
    <button className="secondary" disabled={busy} onClick={()=>{setRun(undefined);pending.current=undefined;void refresh();}}>返回排位</button>
   </div>
  </div>}
 </>;

 const rows=board?[...board.rows,...(board.mine&&!board.rows.some(row=>row.id===board.mine?.id)?[board.mine]:[])]:[];
 const attempts=board?.latest?.attempt??0;
 const active=!!board?.latest&&board.latest.game.moves.length<3;
 return <section className="rank-board">
  <h2>本周排位</h2>
  <nav className="rank-tabs" aria-label="出身排行榜">
   {SHOWDOWN_ROUTES.map(item=><button type="button" key={item} aria-pressed={item===route} disabled={busy}
    onClick={()=>{if(item!==route)select(item,week);}}>{SHOWDOWN_NAMES[item]}</button>)}
  </nav>
  {failed&&<><p className="rank-error" role="status">{failed}</p>
   <button className="secondary" onClick={()=>void refresh()}>重新载入</button></>}
  {!board&&!failed&&<p role="status">正在载入排位…</p>}
  {board&&<>
   <p><b>{showdownView(board.challenge).scene.title}</b> · {rankWeekLabel(board.week)}</p>
   <div className="rank-tools">
    <button className="secondary" disabled={busy} onClick={()=>select(route,board.week===board.current?board.previous:null)}>
     {board.week===board.current?'上周榜':'回到本周'}
    </button>
    <button className="secondary" onClick={()=>void invite()}>邀请好友</button>
    {board.player&&board.week===board.current&&<button className="primary" disabled={busy||(!active&&attempts>=RANK_ATTEMPTS)} onClick={start}>
     {active?'继续排位':attempts>=RANK_ATTEMPTS?'本周已打完':`开一局 · 剩 ${RANK_ATTEMPTS-attempts} 次`}
    </button>}
   </div>
   {share&&<input readOnly aria-label="本周同题链接" value={share} onFocus={event=>event.currentTarget.select()}/>}
   {!board.player&&board.week===board.current&&<form className="rank-register" onSubmit={event=>{
    event.preventDefault();void request({op:'join',nickname},()=>void refresh());
   }}>
    <input value={nickname} onChange={event=>setNickname(event.target.value)} aria-label="排位昵称" placeholder="取个昵称" required minLength={2} maxLength={12}/>
    <button className="primary" disabled={busy}>取名参赛</button>
   </form>}
   {board.player&&<p>我的 ID　{board.player.id}{board.mine&&' · 第 '+board.mine.position+' 名'}</p>}
   {rows.length>0?<table className="rank-table" aria-label="全服排名">
    <thead><tr><th>名次</th><th>玩家</th><th>ID</th><th>积分</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id} data-me={row.id===board.player?.id}>
     <td>{row.position}</td><td>{row.nickname}</td><td>{row.id}</td><td>{row.score}</td>
    </tr>)}</tbody>
   </table>:<p>这期还没有成绩。</p>}
  </>}
 </section>;
}
