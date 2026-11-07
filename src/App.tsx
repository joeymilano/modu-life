import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import StreetScene from './components/StreetScene';
import { streetLead } from './game/streetLeads';
import { openingLead, openingStory } from './game/originStories';
import { parkVisit } from './game/matchmaking';
import { ferryVisit } from './game/ferryVisit';
import LifeLines from './components/LifeLines';
import EndingScreen from './components/EndingScreen';
import {
 activeLine, clearReplay, decodeLife, dropLine, encodeLife, forkLife, lineName, MAX_LINES, readLife, recordDecision,
 replayScene, saveLife, SAVE_SIZE_LIMIT, startBook, switchLine, updateLife, type LifeBook,
} from './game/lifeLines';
import { nightOwlLetter } from './game/encounters';
import { dateAnswer, firstDateParting, hasDated } from './game/dates';
import { employmentOf, LONG_COMMUTE, nextReview, NIGHT_WORK } from './game/employment';
import { isJobOffer, isSelfEmployed, jobOffer, type InterviewOffer } from './game/jobOffers';
import { returnDate } from './game/dateReturns';
import { CAREERS, CAST, castTitle, DISTRICTS, GOALS, HOUSING_NAMES } from './game/content';
import { ACTIVITY_NAMES, CHAPTERS, SAVE_KEY, STAT_NAMES, canAfford, chapterOf, checkChance, commitRelationship, createGame, drawOrigins, monthlyBudget, newSeed, nextYear, publicOriginNames, relationshipLabel, rerollOrigin, resolveChoice, selectEvent } from './game/engine';
import { downloadBlob, challengeUrl, makeShareCard, readChallenge, type SharedHand } from './game/share';
import { draftFromEvent, isTicketHash, type Timeline } from './game/timelines';
import { playSound, setAudioEnabled } from './game/audio';
import type { ActivityKind, Career, CastMember, ChoiceResult, DistrictId, Effect, FirstDatePicks, GameState, GoalId, Hotspot, LifeEvent, OriginCard, PlayerAppearance, StatKey } from './game/types';
import Icon, { type IconName } from './components/Icon';
import { CardArt, Portrait, PlayerPortrait } from './components/Portrait';
import AppearancePicker from './components/AppearancePicker';
import ContactProfile from './components/ContactProfile';
import { eventPhoto, interviewPhoto, LOOKS, streetPhoto } from './game/art';
import { DialogueGame } from './components/MiniGames';
import RentalGame from './components/RentalGame';
import StallGame from './components/StallGame';
import { isStallSettlement, settleStall, stallCommitment, stallSchedule, type StallScore } from './game/stall';
import { STALL_PATH } from './game/stallChallenge';
import { rentalNegotiation } from './game/rental';
import LaserGame from './components/LaserGame';
import './opening-draw.css';
import { CURRENT_PEARL_RULES, isPearlPath, pearlHash, pearlReward, readPearlChallenge, type PearlChallenge } from './game/pearl';
const PearlArcade=lazy(()=>import('./components/PearlArcade'));
const CityScene=lazy(()=>import('./components/CityScene'));
const ParallelShanghai=lazy(()=>import('./components/ParallelShanghai'));
const OwlPreview=lazy(()=>import('./components/OwlPreview'));
const activityIcons:Record<ActivityKind,IconName>={career:'case',romance:'heart',rest:'leaf',learn:'book',housing:'home',social:'people',business:'coffee',explore:'eye'};
const money=(n:number)=>'¥'+Math.round(n).toLocaleString('zh-CN');
const STAT_COLORS:Record<StatKey,string>={health:'#7a8a5c',spirit:'#c59d4e',skill:'#60868b',face:'#b65b41',network:'#8b7991'};
type Modal='help'|'journal'|'contacts'|'saves'|'career'|'romance'|'lines'|'challenge'|null;
type Mini={type:'laser'}|{type:'stall'}|{type:'rental';evidence:number}|{type:'dialogue';person:CastMember;career?:never}|{type:'dialogue';person?:never;career:Career};
function useCompact(){const [value,setValue]=useState(window.innerWidth<850);useEffect(()=>{const on=()=>setValue(window.innerWidth<850);window.addEventListener('resize',on);return()=>window.removeEventListener('resize',on);},[]);return value;}
function effectsText(e:Effect){const pairs:[string,number][]=[];if(e.cash)pairs.push(['积蓄',e.cash]);for(const k of Object.keys(STAT_NAMES) as StatKey[])if(e[k])pairs.push([STAT_NAMES[k],e[k]!]);if(e.trust)pairs.push(['信任',e.trust]);if(e.attraction)pairs.push(['好感',e.attraction]);if(e.commitment)pairs.push(['承诺',e.commitment]);return pairs;}
function Brand({onClick}:{onClick:()=>void}){return <button className="brand" onClick={onClick} aria-label="魔都人生首页"><img className="brand-dark" src="/brand/logo-dark.svg" alt="" width="273" height="64"/><img className="brand-light" src="/brand/logo-light.svg" alt="" width="273" height="64"/></button>;}
const isParallelHash=(hash:string)=>hash==='#parallel'||isTicketHash(hash);
function LoadCity(){return <div className="city-loading"><span className="loading-orbit"/><span>进城中</span></div>;}
export default function App(){
 const compact=useCompact();const [screen,setScreen]=useState<'home'|'draw'|'play'|'end'>('home');
 const [book,setBook]=useState(readLife);
 const line=book?activeLine(book):null,game=line?.state??null;
 function setGame(state:GameState){setBook(current=>current?updateLife(current,state):startBook(state));}
 const [timelineDraft,setTimelineDraft]=useState<Timeline>();
 const [timelineHash,setTimelineHash]=useState(window.location.hash),[parallel,setParallel]=useState(isParallelHash(window.location.hash));
 const pearlLanding=isPearlPath(window.location.pathname);
 const [pearl,setPearl]=useState<PearlChallenge|null>(()=>readPearlChallenge(window.location.hash)??(pearlLanding?{seed:newSeed(),rules:CURRENT_PEARL_RULES}:null));
 useEffect(()=>{
  const sync=()=>{const hash=window.location.hash;setTimelineHash(hash);setPearl(readPearlChallenge(hash)??(pearlLanding?{seed:newSeed(),rules:CURRENT_PEARL_RULES}:null));if(isParallelHash(hash))setParallel(true);};
  window.addEventListener('hashchange',sync);
  return()=>window.removeEventListener('hashchange',sync);
 },[pearlLanding]);
 function closeParallel(){
  if(isParallelHash(window.location.hash))history.replaceState(null,'',window.location.pathname+window.location.search);
  setTimelineHash('');setTimelineDraft(undefined);setParallel(false);
 }
 function closePearl(){
  if(pearlLanding){window.location.assign('/');return;}
  if(readPearlChallenge(window.location.hash))history.replaceState(null,'',window.location.pathname+window.location.search);
  setPearl(null);
 }
 const [challenge]=useState(()=>readChallenge(new URLSearchParams(window.location.search)));
 const [seed,setSeed]=useState(newSeed),[cards,setCards]=useState<OriginCard[]>([]),[revealed,setRevealed]=useState<number[]>([]),[rerolls,setRerolls]=useState(0),[name,setName]=useState('小申'),[goal,setGoal]=useState<GoalId>('free');
 const [appearance,setAppearance]=useState<PlayerAppearance>({gender:'female',looks:'stunning'});
 const [modal,setModal]=useState<Modal>(null),[activeEvent,setActiveEvent]=useState<LifeEvent|null>(null),[eventNpc,setEventNpc]=useState<string|undefined>(),[outcome,setOutcome]=useState<(ChoiceResult&{annual?:boolean;income?:number;tableIncome?:number;stallIncome?:number;expense?:number;rentExpense?:number;repayment?:number;payroll?:ReturnType<typeof nextYear>['payroll'];source?:{event:LifeEvent;choiceId:string}})|null>(null),[mini,setMini]=useState<Mini|null>(null);
 const [selected,setSelected]=useState<Hotspot|null>(null),[destination,setDestination]=useState<[number,number]|null>(null),[walking,setWalking]=useState(false);
 const [profile,setProfile]=useState<CastMember>();
 const [handLink,setHandLink]=useState('');
 const [map3d,setMap3d]=useState(false);
 const [night,setNight]=useState(false),[audio,setAudio]=useState(false),[toast,setToast]=useState(''),[mobilePanel,setMobilePanel]=useState<'stats'|'places'|null>(null),[sharing,setSharing]=useState(false),[saveVersion,setSaveVersion]=useState(0);
 const sceneHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const heading=sceneHeading.current;
  if(!heading)return;
  heading.closest('.modal')?.scrollTo({top:0});
  heading.focus({preventScroll:true});
 },[activeEvent]);
 const fileInput=useRef<HTMLInputElement>(null),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),saveWarned=useRef(false);
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const district=DISTRICTS.find(d=>d.id===(game?.district||'bund'))!;
 const lead=game?streetLead(game):null;
 const cardLead=game?openingLead(game):undefined;
 const allRevealed=revealed.length===5;
 const previewStory=allRevealed?openingStory(cards.map(card=>card.id)):undefined;
 const lastEntry=game?.journal.at(-1);
 const chapter=CHAPTERS[chapterOf(game?.age||18)],budget=game?monthlyBudget(game):null,career=CAREERS.find(c=>c.id===game?.jobId);
 const workTrack=game&&employmentOf(game), promotion=game&&nextReview(game);
 const blocked=!!(modal||activeEvent||outcome||mini);
 function notify(text:string){setToast(text);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3800);}
 useEffect(()=>{if(!blocked)return;const prior=document.activeElement as HTMLElement|null;const timer=requestAnimationFrame(()=>document.querySelector<HTMLElement>('[aria-modal="true"] button:not(:disabled)')?.focus({preventScroll:true}));const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const nodes=Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"] button:not(:disabled),[aria-modal="true"] input,[aria-modal="true"] summary')).filter(n=>n.offsetParent!==null);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};window.addEventListener('keydown',trap);return()=>{cancelAnimationFrame(timer);window.removeEventListener('keydown',trap);prior?.focus({preventScroll:true});};},[blocked]);
 useEffect(()=>{
  if(!book||pearl)return;
  try{saveLife(book);}catch{if(!saveWarned.current){saveWarned.current=true;notify('浏览器暂时不能保存，记得导出人生档案。');}}
 },[book,pearl]);
 useEffect(()=>{
  if(!game||screen!=='play'||parallel||pearl||outcome||activeEvent||mini||modal)return;
  if(line?.replay){
   const event=replayScene(game,line.replay);
   if(event){setActiveEvent(event);setEventNpc(line.replay.npc??event.speakerId);return;}
   setBook(current=>current?clearReplay(current):current);
  }
  if(game.pendingYearEvent){const event=selectEvent(game,'year');setActiveEvent(event);setEventNpc(event.speakerId);}
 },[game,screen,parallel,pearl,line?.replay,outcome,activeEvent,mini,modal]);
 function dismissEvent(){
  setActiveEvent(null);
  if(activeEvent&&line?.replay)setBook(current=>current?clearReplay(current):current);
 }
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   if(e.key!=='Escape'||parallel||pearl)return;
   if(outcome){setOutcome(null);if(game?.ended)setScreen('end');return;}
   if(activeEvent&&!game?.pendingYearEvent){dismissEvent();return;}
   if(mini){setMini(null);return;}
   setModal(null);setMobilePanel(null);
  };
  window.addEventListener('keydown',key);
  return()=>window.removeEventListener('keydown',key);
 },[outcome,activeEvent,mini,game?.pendingYearEvent,game?.ended,line?.replay,parallel,pearl]);
 function beginDraw(){playSound('tap');const p=new URLSearchParams(window.location.search);const s=(p.get('seed')||newSeed()).slice(0,32);const initial=challenge?.cards??drawOrigins(s);const sharedGoal=p.get('goal');if(GOALS.some(g=>g.id===sharedGoal))setGoal(sharedGoal as GoalId);const gender=p.get('gender'),looks=p.get('looks');if((gender==='female'||gender==='male')&&(looks==='everyday'||looks==='charming'||looks==='stunning'))setAppearance({gender,looks});setSeed(s);setCards(initial);setRevealed([]);setRerolls(0);setScreen('draw');setModal(null);}
 function revealCard(index:number){playSound('draw');setRevealed(old=>old.includes(index)?old:[...old,index]);}
 function revealAll(){playSound('draw');setRevealed(cards.map((_,index)=>index));}
 function reroll(index:number){
  if(challenge||rerolls>=2)return;
  playSound('draw');
  setCards(old=>old.map((card,i)=>i===index?rerollOrigin(seed,rerolls+1,card):card));
  setRerolls(r=>r+1);
 }
 function startLife(){const s=createGame(seed,name,goal,cards,appearance);setBook(startBook(s));setScreen('play');setSelected(null);setWalking(false);setDestination(null);playSound('year');}
 function openNightOwl(){if(!game||blocked||game.pendingYearEvent)return;if(game.actions<=0){notify('今天先收工，明年来看它。');return;}setWalking(false);setDestination(null);setSelected(null);setActiveEvent(nightOwlLetter(game));setEventNpc(undefined);setMobilePanel(null);}
 function openEvent(kind:ActivityKind,npc?:string){if(!game||game.actions<=0||game.pendingYearEvent||game.ended){notify('今年的时间用完了，去看看年度账本。');return;}const e=selectEvent(game,kind,npc);setActiveEvent(e);setEventNpc(npc||e.speakerId);setMobilePanel(null);}
 function startActivity(h:Hotspot){
  if(!game)return;
  if(game.actions<=0||game.pendingYearEvent){notify('先把这一年结算好，明年继续。');return;}
  playSound('tap');
  const visit=h.id==='people-match'?parkVisit(game)?.event:h.id==='bund-ferry'?ferryVisit(game):null;
  if(visit){setActiveEvent(visit);setEventNpc(visit.speakerId);setMobilePanel(null);return;}
  if(h.kind==='career'){if(game.jobId)openEvent('career');else setModal('career');return;}
  if(h.kind==='romance'){
   const partner=CAST.find(person=>person.id===game.partnerId);
   if(!partner)setModal('romance');
   else if(returnDate(game,partner.id))startRomance(partner);
   else openEvent('romance',partner.id);
   return;
  }
  if(h.id==='xin-rent'&&!game.flags.includes('rental_checked')){setMini({type:'rental',evidence:0});setMobilePanel(null);return;}
  if(h.id==='xin-street'){setMini({type:'stall'});setMobilePanel(null);return;}
  if(h.kind==='explore'&&game.district==='bund'&&!game.flags.includes('laser_done')){setMini({type:'laser'});return;}
  openEvent(h.kind);
 }
 function openLead(event:LifeEvent){
  if(!game||blocked||game.actions<=0)return;
  setSelected(null);setDestination(null);setWalking(false);setMobilePanel(null);
  setGame({...game,district:event.district??game.district});
  setActiveEvent(event);setEventNpc(event.speakerId);
  playSound('tap');
 }
 function requestHotspot(id:string){if(!game||blocked)return;const h=district.hotspots.find(x=>x.id===id);if(!h)return;if(game.actions<=0||game.pendingYearEvent){notify('这一年的行动用完了');return;}if(!map3d){startActivity(h);return;}setSelected(h);setDestination([...h.position]);setWalking(true);setMobilePanel(null);}
 function arrive(){if(!walking||!selected||blocked)return;setWalking(false);setDestination(null);startActivity(selected);}
 function travel(id:DistrictId){if(!game||blocked)return;playSound('tap');setGame({...game,district:id});setSelected(null);setDestination(null);setWalking(false);setMobilePanel(null);}
 function choose(id:string){if(!game||!activeEvent||!book)return;try{const result=resolveChoice(game,activeEvent,id,eventNpc);setBook(recordDecision(book,result.state,activeEvent,id,eventNpc));setOutcome({...result,source:{event:activeEvent,choiceId:id}});setActiveEvent(null);playSound(result.success===false?'bad':'good');}catch(e){notify((e as Error).message);}}
 function miniFinish(effect:Effect,text:string){
  if(!game||!mini||mini.type==='stall'||mini.type==='rental'||(mini.type==='dialogue'&&!mini.career))return;
  const title=mini.type==='laser'?'四元柠檬水保卫战':mini.career!.name+'面试';
  const id=mini.type==='dialogue'?mini.career!.id:mini.type;
  const event:LifeEvent={
   id:'mini-'+id+'-'+game.age+'-'+game.actions,title,text,
   category:mini.type==='laser'?'explore':'career',tag:mini.type==='laser'?'魔都怪谈':'人生现场',
   choices:[{id:'finish',label:'继续',reply:text,effect}],
  };
  try{
   const result=resolveChoice(game,event,'finish');
   const missed=mini.type==='dialogue';
   setGame(result.state);setOutcome(missed?{...result,success:false}:result);setMini(null);playSound(missed?'bad':'good');
  }
  catch(error){notify((error as Error).message);}
 }
 function openRental(evidence:number){
  setMini(null);setActiveEvent(rentalNegotiation(evidence));setEventNpc('fang');
 }
 function closeStallBooks(score:StallScore){
  if(!game||mini?.type!=='stall')return;
  const event=settleStall(game,score);
  setMini(null);setActiveEvent(event);setEventNpc(event.speakerId);
 }
 function openJobOffer(offer:InterviewOffer){
  if(!game||mini?.type!=='dialogue'||!mini.career)return;
  setActiveEvent(jobOffer(game,mini.career,offer));setEventNpc(undefined);setMini(null);
 }
 function openParting(person:CastMember,picks:FirstDatePicks){
  if(!game)return;
  const event=firstDateParting(game,person,picks);
  if(!event){notify('这次约会接不上了');return;}
  setMini(null);setActiveEvent(event);setEventNpc(person.id);
 }
 function advance(){if(!game||blocked)return;try{const r=nextYear(game);setGame(r.state);setOutcome({state:r.state,title:game.age+'岁，收个尾',text:r.notice,effect:{cash:r.income-r.expense-r.repayment},annual:true,income:r.income,tableIncome:r.tableIncome,stallIncome:r.stallIncome,expense:r.expense,rentExpense:r.rentExpense,repayment:r.repayment,payroll:r.payroll});setMobilePanel(null);playSound('year');}catch(e){notify((e as Error).message);}}
 function closeOutcome(){setOutcome(null);if(game?.ended)setScreen('end');}
 function startRomance(person:CastMember){
  if(!game||game.actions<=0||game.pendingYearEvent||game.ended)return;
  const answer=dateAnswer(game,person.id);
  if(answer==='left')return;
  const followup=returnDate(game,person.id);
  setModal(null);
  if(followup){setActiveEvent(followup);setEventNpc(person.id);setMobilePanel(null);}
  else if(hasDated(game,person.id))openEvent(answer==='friends'?'social':'romance',person.id);
  else setMini({type:'dialogue',person});
 }
 function askCommit(person:CastMember){if(!game)return;try{setGame(commitRelationship(game,person.id));notify('你们在一起了');playSound('good');}catch(e){notify((e as Error).message);}}
 async function share(){
  if(!game||sharing)return;
  setSharing(true);
  try{
   const blob=await makeShareCard(game);
   const file=new File([blob],`魔都人生-${game.name}-${game.age}岁.png`,{type:'image/png'});
   if(compact&&navigator.canShare?.({files:[file]})){
    try{
     await navigator.share({files:[file],title:'魔都人生',text:`我抽到了${publicOriginNames(game)[0]}。同一手牌，你来试试？\n${challengeUrl(game)}`});
     return;
    }catch(error){
     if((error as Error).name==='AbortError')return;
    }
   }
   downloadBlob(blob,file.name);notify('人生卡已下载');
  }catch{notify('分享卡暂时没生成，先复制挑战链接也可以。');}
  finally{setSharing(false);}
 }
 async function copyHand(hand:SharedHand){
  const url=challengeUrl(hand);
  try{await navigator.clipboard.writeText(url);notify('挑战链接已复制');}
  catch{setHandLink(url);setMobilePanel(null);setModal('challenge');}
 }
 function copyChallenge(){if(game)void copyHand(game);}
 function resumeBook(next:LifeBook){
  const {state}=activeLine(next);
  setBook(next);setScreen(state.ended?'end':'play');setModal(null);setMini(null);setActiveEvent(null);
  setEventNpc(undefined);setOutcome(null);setSelected(null);setDestination(null);setWalking(false);setMobilePanel(null);
 }
 function branchFrom(index:number){
  if(!book)return;
  try{const next=forkLife(book,index);resumeBook(next);notify('来到'+lineName(next.active));}
  catch(error){notify((error as Error).message);}
 }
 function returnToLine(id:number){if(book){resumeBook(switchLine(book,id));notify('回到'+lineName(id));}}
 function exportSave(){
  if(!book||!game)return;
  downloadBlob(new Blob([JSON.stringify(encodeLife(book))],{type:'application/json'}),`魔都人生-${game.name}-${game.age}岁.json`);notify('存档已导出');
 }
 async function importSave(file?:File){
  if(!file)return;
  try{
   if(file.size>SAVE_SIZE_LIMIT)throw new Error('档案太大了，请选择游戏导出的文件。');
   resumeBook(decodeLife(JSON.parse(await file.text())));notify('已载入存档');
  }catch(error){notify((error as Error).message);}
  if(fileInput.current)fileInput.current.value='';
 }
 function getSlots():(LifeBook|null)[]{
  try{
   const raw=JSON.parse(localStorage.getItem(SAVE_KEY+'-slots')||'[null,null,null]');
   return [0,1,2].map(i=>{try{return raw[i]?decodeLife(raw[i]):null;}catch{return null;}});
  }catch{return [null,null,null];}
 }
 function saveSlot(i:number){
  if(!book)return;
  try{const slots=getSlots();slots[i]=book;localStorage.setItem(SAVE_KEY+'-slots',JSON.stringify(slots.map(slot=>slot?encodeLife(slot):null)));setSaveVersion(v=>v+1);notify('已存档');}
  catch{notify('浏览器不能保存，请导出人生档案。');}
 }
 function loadSlot(i:number){
  const next=getSlots()[i];
  if(next){resumeBook(next);const {state}=activeLine(next);notify('回到'+state.name+'的'+state.age+'岁。');}
 }
 function toggleAudio(){const value=!audio;setAudio(value);setAudioEnabled(value);if(value)playSound('good');}
 const dialogOpen=!!(modal||activeEvent||outcome||mini);
 const speaker=eventNpc?CAST.find(person=>person.id===eventNpc):undefined;
 const isOwl=activeEvent?.tag==='夜猫子来信';
 const scenePhoto=activeEvent&&!isOwl&&(activeEvent.illustration||!speaker)?eventPhoto(activeEvent,district.id):null;
 const openingMessages=activeEvent?.id==='first-night-arrival';
 const rentalEvidence=activeEvent?.rentalEvidence;
 const tableScene=scenePhoto?.startsWith('/art/long-table/')??false;
 const offerScene=!!activeEvent&&isJobOffer(activeEvent.id);
 const stallScene=!!activeEvent&&isStallSettlement(activeEvent.id);
 const birthScene=activeEvent?.id.startsWith('origin-arrival-')??false;
 const signedOffer=!!outcome?.source&&isJobOffer(outcome.source.event.id)&&outcome.effect.payRate!==undefined;
 const focusScene=Boolean(activeEvent?.firstDate)||rentalEvidence!==undefined||tableScene||offerScene||birthScene||stallScene;
 const partingBill=activeEvent?.firstDate ? -(activeEvent.choices[0].effect.cash??0) : 0;
 const wideShot=scenePhoto?.startsWith('/art/shanghai-streets/first-night-')||scenePhoto?.startsWith('/art/dates/')||scenePhoto?.startsWith('/art/endings/farewell-')||scenePhoto?.startsWith('/art/work/')||scenePhoto?.startsWith('/art/pearl/')||scenePhoto?.startsWith('/art/matchmaking/')||scenePhoto?.startsWith('/art/opening/')||scenePhoto?.startsWith('/art/rental/')||scenePhoto?.startsWith('/art/night-ferry/')||tableScene||offerScene||stallScene;
 const leadButtons=game&&(lead||cardLead)?<div className="story-leads">{[lead,cardLead].map(item=>item&&<button
  key={item.event.id} className={'story-lead'+(item===cardLead?' opening-lead':'')}
  disabled={blocked||game.actions<=0} onClick={()=>openLead(item.event)}>
  <span className="story-lead-dot"/><span><small>{item===cardLead?'手牌带来的事':game.age===18?'今晚':'有消息'} · {DISTRICTS.find(place=>place.id===item.event.district)?.name}</small><b>{item.message}</b></span>
  <Icon name="arrow" size={17}/>
 </button>)}</div>:null;
 if(pearl)return <Suspense fallback={<LoadCity/>}><PearlArcade key={pearl.seed+'-'+pearl.target+'-'+pearl.rules} challenge={pearl} onClose={closePearl} audio={audio} onAudio={toggleAudio}/></Suspense>;
 if(parallel)return <Suspense fallback={<LoadCity/>}><ParallelShanghai onClose={closeParallel} hash={timelineHash} preset={timelineDraft}/></Suspense>;
 return <div className={'app screen-'+screen+(compact?' is-compact':'')}>
 <header className="topbar"><Brand onClick={()=>{setScreen('home');setModal(null);}}/><nav className="topbar-actions"><button className="icon-button" title={audio?'关闭声音':'打开声音'} aria-label={audio?'关闭声音':'打开声音'} onClick={toggleAudio}><Icon name={audio?'sound':'mute'}/></button>{screen==='play'&&<button className="nav-button scene-switch" aria-pressed={map3d} onClick={()=>{setMap3d(!map3d);setWalking(false);setDestination(null);setSelected(null);}}><Icon name="eye" size={17}/><span>{map3d?'街景':'3D 地图'}</span></button>}{screen==='play'&&map3d&&<button className="icon-button" aria-label={night?'切换白天':'切换夜景'} onClick={()=>setNight(n=>!n)}><Icon name={night?'sun':'moon'}/></button>}<button className="nav-button" onClick={()=>setModal(screen==='play'?'journal':'help')}><Icon name={screen==='play'?'book':'eye'} size={17}/><span>{screen==='play'?'人生记事':'怎么玩'}</span></button><button className="nav-button outlined" onClick={()=>setModal('saves')}><Icon name="save" size={17}/><span>存档</span></button>{(screen==='play'||screen==='end')&&game&&<button className="nav-button time-nav" aria-label="时间线" onClick={()=>setModal('lines')}><Icon name="map" size={17}/><span>时间线</span></button>}</nav></header>
 {screen==='home'&&<main className="home-screen"><div className="home-copy"><h1 className="game-title"><img src="/brand/logo-poster.svg" alt="魔都人生" width="524" height="534" fetchPriority="high"/></h1><p className="home-description">{challenge?<>朋友递来一手牌<br/>{challenge.cards.slice(0,2).map(card=>card.name).join(' · ')}</>:<>刚到上海南站，手机响了三声<br/>看房、顶班、去码头，你先回谁？</>}</p><div className="home-start"><div className="mode-select" aria-label="选择游戏模式">
 <button className="mode-entry main-mode" onClick={beginDraw}><b>我的人生</b><span>{challenge?'接这手牌':'开局抽卡'} <Icon name="arrow" size={17}/></span></button>
 <button className="mode-entry guest-mode" onClick={()=>setParallel(true)}><b>重走别人的人生</b><span>去平行上海 <Icon name="arrow" size={17}/></span></button>
 </div><div className="home-quick-games"><button className="pearl-entry" onClick={()=>{window.location.hash=pearlHash(newSeed(),undefined,CURRENT_PEARL_RULES);}}><Icon name="bolt" size={17}/>先躲一轮激光</button><a className="pearl-entry" href={STALL_PATH}><Icon name="coffee" size={17}/>去小吃街顶班</a></div>{game&&<button className="continue-button" onClick={()=>{setScreen(game.ended?'end':'play');setModal(null);}}>继续上回 · {game.name}的{game.age}岁 <Icon name="chevron" size={16}/></button>}</div></div><div className="hero-city"><picture>
  <source media="(max-width: 600px)" srcSet={streetPhoto('cover-south-station-mobile')}/>
  <img className="home-key-art" src={streetPhoto('cover-south-station')} alt="上海南站的雨棚下，一位旅客扶着行李箱望向公交站" fetchPriority="high"/>
 </picture><div className="hero-shade"/></div><div className="home-bottom"><span className="ticker-label">申城小报</span><div className="ticker"><span>外滩发布柠檬水预警</span><span>公园相亲角下雨，摊主撑伞继续</span><span>安福路面馆招一晚帮工，管饭</span></div></div></main>}
 {screen==='draw'&&<main className="draw-screen">
  <div className="draw-heading">
   <h1>{challenge?'同手牌挑战':<>你带什么来<span>上海</span></>}</h1>
   <div className="draw-tools">
    <a className="pick-appearance" href="#choose-look">选长相</a>
    {!challenge&&<span>还可重抽 <b>{2-rerolls}</b> 张</span>}
    {!allRevealed&&<button className="secondary" onClick={revealAll}>全部揭晓 <Icon name="spark" size={17}/></button>}
   </div>
  </div>
  <div className="draw-desk">
   <div className="draw-desk-label"><span>五张人生牌</span><span aria-live="polite">{revealed.length} / 5</span></div>
   <div className="origin-cards">{cards.map((card,i)=>{
    const visible=revealed.includes(i);
    return <div key={i} className={'origin-card '+(visible?'revealed':'unrevealed')} style={{'--card-accent':card.accent,'--card-delay':i*45+'ms'} as React.CSSProperties}>
     {!visible?<button className="card-back" onClick={()=>revealCard(i)} aria-label={'揭晓'+card.slot}>
      <span className="back-serial">{String(i+1).padStart(2,'0')}</span>
      <img src="/brand/symbol.svg" width={76} height={76} alt=""/>
      <b>{card.slot}</b><small>翻开 <Icon name="arrow" size={13}/></small>
     </button>:<div className="card-front" key={card.id}>
      <div className="card-top"><span>{String(i+1).padStart(2,'0')} · {card.slot}</span><b className={'rarity rarity-'+card.rarity}>{card.rarity}</b></div>
      <CardArt card={card}/>
      <h2>{card.name}</h2>
      <p className="card-description">{card.description}</p>
      <div className="card-effects">
       {card.effect.housing===3&&<span>自有住房</span>}
       {effectsText(card.effect).slice(0,2).map(([label,n])=><span key={label}>
        {label==='积蓄'?(n>0?'+':'−')+money(Math.abs(n)):label+(n>0?' +':' ')+n}
       </span>)}
      </div>
      <div className="card-bottom">
       <span>{card.tag}</span>
       {!challenge&&<button disabled={rerolls>=2} onClick={()=>reroll(i)} aria-label={'重抽'+card.slot}><Icon name="dice" size={15}/>重抽</button>}
      </div>
     </div>}
    </div>;
   })}</div>
  </div>
  {allRevealed&&<>
   {previewStory&&<aside className="opening-slip" aria-label="这手牌带来的故事">
    <img src={previewStory.event.illustration} alt="" width={1260} height={840}/>
    <div><p>{previewStory.cards.map(id=>cards.find(card=>card.id===id)?.name).join(' × ')}</p><h2>{previewStory.event.title}</h2><span>{previewStory.teaser}</span></div>
   </aside>}
   <section className="draw-next">
    <div className="name-field"><label htmlFor="player-name">怎么称呼你</label><input id="player-name" value={name} maxLength={12} onChange={e=>setName(e.target.value)} placeholder="给自己起个名字"/></div>
    <div className="goal-picker"><p>这辈子图什么</p><div className="goal-options">{GOALS.map(g=><button key={g.id} className={goal===g.id?'selected':''} onClick={()=>setGoal(g.id)}><Icon name={({wealth:'home',love:'heart',craft:'case',free:'leaf',community:'people'} as Record<string,IconName>)[g.id]} size={18}/>{g.name}</button>)}</div></div>
    <div className="draw-actions">
     <button className="primary enter-city" onClick={startLife}>就这手牌，进上海 <Icon name="arrow" size={22}/></button>
     <button className="text-button" onClick={()=>void copyHand({seed,origins:cards.map(card=>card.id),goal,appearance})}><Icon name="share" size={16}/>发这手牌给朋友</button>
    </div>
   </section>
  </>}
  <div id="choose-look"><AppearancePicker value={appearance} onChange={setAppearance}/></div>
  <button className="text-button back-home" onClick={()=>setScreen('home')}>← 回去想想</button>
 </main>}
 {screen==='play'&&game&&<main className="play-screen"><aside className={'life-sidebar '+(mobilePanel==='stats'?'mobile-open':'')}><div className="player-identity"><PlayerPortrait appearance={game.appearance} size={49} age={game.age}/><div><b>{game.name}</b><span>{game.appearance.gender==='female'?'女性':'男性'} · {LOOKS.find(l=>l.id===game.appearance.looks)?.name}</span></div><button className="identity-seal line-seal" onClick={()=>setModal('lines')} aria-label="查看当前时间线">{lineName(line!.id)}</button></div><div className="chapter-label"><span>第 {String(chapterOf(game.age)+1).padStart(2,'0')} 章</span><small>{chapter.years}</small></div><div className="age-row"><strong>{game.age}</strong><span>岁<br/><b>{chapter.name}</b></span><span className="age-stamp">来沪<br/>{game.age-17}年</span></div><div className="cash-block"><span>手头积蓄</span><strong>{money(game.cash)}</strong><div><span>每月结余</span><b className={budget!.net>=0?'positive':'negative'}>{budget!.net>=0?'+':''}{money(budget!.net)}</b></div></div><div className="stats-list">{(Object.keys(STAT_NAMES) as StatKey[]).map(k=><div className="stat-row" key={k}><span>{STAT_NAMES[k]}</span><div className="stat-track"><i style={{width:game.stats[k]+'%',background:STAT_COLORS[k]}}/></div><b>{game.stats[k]}</b></div>)}</div><button className="career-summary" onClick={()=>{if(game.actions<=0){notify('明年再谈工作，先结算这一年。');return;}setModal('career');}}><span className="summary-icon"><Icon name="case" size={20}/></span><span><small>{career?career.name:'当前工作'}</small><b>{career?career.ranks[game.jobRank]:'还在找机会'}</b></span><Icon name="chevron" size={16}/></button><div className="life-small-row"><span><Icon name="home" size={14}/>{HOUSING_NAMES[game.housing]}</span><span>{money(budget!.rent)}/月</span></div><button className="relationship-summary" onClick={()=>{setProfile(undefined);setModal('contacts');}}><Icon name="heart" size={17}/><span>{game.partnerId?'和'+CAST.find(c=>c.id===game.partnerId)?.name+'在一起':'单身'}</span><Icon name="chevron" size={14}/></button><div className="time-budget"><div><b>今年剩几次行动</b><span>{game.actions} / 3</span></div><div className="time-tokens">{[0,1,2].map(i=><span key={i} className={i<game.actions?'available':'used'}><Icon name="clock" size={15}/>{i<game.actions?'还能安排':'已经用掉'}</span>)}</div></div><button className={'primary year-button '+(game.actions===0?'ready':'')} onClick={advance} disabled={blocked||game.pendingYearEvent}>结算这一年 <Icon name="arrow" size={19}/></button><small className="year-hint">{game.actions===0?'行动已用完':(lead||cardLead)?'还有消息':'结算后进入下一年'}</small></aside>
 <section data-night={map3d&&night} className={'city-stage '+(map3d?'city-map-mode':'city-street-mode')}>{map3d?<><div className="district-title"><span className="district-en">{district.en}</span><h1>{district.name}<small>· {night?'夜间':'白天'}</small></h1><p>{district.subtitle}</p></div><Suspense fallback={<LoadCity/>}><CityScene district={game.district} appearance={game.appearance} onNightOwl={openNightOwl} mode="play" selectedHotspot={selected?.id} destination={destination} onHotspot={requestHotspot} onArrive={arrive} night={night} compact={compact} reducedMotion={reducedMotion}/></Suspense></>:<StreetScene district={district} disabled={blocked||game.actions<=0||game.pendingYearEvent} onVisit={startActivity} onNightOwl={openNightOwl}/>}{compact&&leadButtons}{compact&&map3d&&!lead&&!cardLead&&!blocked&&!walking&&<div className="mobile-next"><div><span>{game.age}岁 · 这一年还剩 {game.actions} 格时间</span><p>{game.actions>0?'想去哪，点地点':'行动已用完'}</p></div>{game.actions>0?<button onClick={()=>game.jobId?setModal('romance'):setModal('career')}>{game.jobId?'约个人见见':'找个工作聊聊'}<Icon name="arrow" size={16}/></button>:<button onClick={advance}>年度结算<Icon name="arrow" size={16}/></button>}</div>}{map3d&&<div className="stage-bottom"><span><i className="red-dot"/>{walking?'正去'+selected?.name:'点地面走走，点地点办事'}</span>{walking?<button onClick={arrive}>直接进去 <Icon name="arrow" size={14}/></button>:<small>{compact?'逛街不扣行动':'WASD / 方向键移动 · 逛街不扣行动'}</small>}</div>}</section>
 <aside className={'places-sidebar '+(mobilePanel==='places'?'mobile-open':'')}><div className="places-top"><div><h2>{map3d?'街区地点':(lead||cardLead)?'手头的事':'刚发生的事'}</h2></div></div>{!compact&&leadButtons}{!map3d&&lastEntry&&<article className="street-journal">
 <small>{lastEntry.age}岁 · {lastEntry.tag}</small><h3>{lastEntry.title}</h3><p>{lastEntry.text}</p>
 <button className="text-button" onClick={()=>{setMobilePanel(null);setModal('journal');}}>翻记事本 <Icon name="arrow" size={14}/></button>
 </article>}{map3d&&<div className="place-list">{district.hotspots.map((h,i)=><button key={h.id} disabled={game.actions<=0||blocked||game.pendingYearEvent} className={'place-card '+(selected?.id===h.id?'active':'')} onClick={()=>requestHotspot(h.id)}><div className="place-icon"><Icon name={activityIcons[h.kind]} size={22}/></div><div><small>{String(i+1).padStart(2,'0')} / {ACTIVITY_NAMES[h.kind]}</small><h3>{h.name}</h3><p>{h.caption}</p></div><Icon name="arrow" size={16}/></button>)}</div>}<button className="quiet-action" disabled={game.actions<=0||blocked} onClick={()=>openEvent('rest')}><Icon name="leaf" size={18}/><span>今天歇一歇</span><small>1格时间</small></button><button className="share-life-button" onClick={share} disabled={sharing}><Icon name="share" size={17}/>{sharing?'正在洗照片…':'生成人生卡'}<Icon name="arrow" size={15}/></button><button className="challenge-link-button" onClick={copyChallenge}><Icon name="dice" size={17}/>复制同手牌链接</button></aside>
 <nav className="district-nav" aria-label="切换城区"><div className="metro-mark"><Icon name="map" size={18}/><span>换一站</span></div><div className="metro-line">{DISTRICTS.map((d,i)=><button key={d.id} onClick={()=>travel(d.id)} disabled={blocked} className={game.district===d.id?'active':''}><span className="metro-dot">{String(i+1).padStart(2,'0')}</span><b>{d.name}</b><small>{d.en}</small></button>)}</div><span className="metro-free">换城区不扣时间</span></nav>
 {compact&&<nav className="mobile-tools"><button onClick={()=>setMobilePanel(v=>v==='stats'?null:'stats')}><Icon name="people" size={17}/>{game.age}岁 · {money(game.cash)}</button><button onClick={()=>setMobilePanel(v=>v==='places'?null:'places')}><Icon name={map3d?'map':'book'} size={17}/>{map3d?'地点':'手头的事'}</button><button onClick={advance} disabled={blocked||game.pendingYearEvent}>年度结算 <Icon name="arrow" size={16}/></button></nav>}
 </main>}
 {screen==='end'&&game&&<EndingScreen game={game} sharing={sharing} onShare={share}
  onChallenge={copyChallenge} onDraw={beginDraw} onJournal={()=>setModal('journal')} onLines={()=>setModal('lines')}/>}
 {dialogOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!activeEvent&&!mini&&!outcome)setModal(null);}}><section className={'modal '+(activeEvent?'event-modal':'')+(wideShot?' wide-shot-modal':'')+(openingMessages?' arrival-modal':'')+(activeEvent?.firstDate?' date-parting-modal':'')+(rentalEvidence!==undefined?' rental-negotiation':'')+(tableScene?' long-table-modal':'')+(offerScene?' job-offer-modal':'')+(birthScene||stallScene?' birth-scene-modal':'')+(mini?' minigame-modal':'')+(mini?.type==='rental'?' rental-modal':'')+(mini?.type==='stall'?' stall-modal':'')+(mini?.type==='dialogue'?(mini.person?' date-modal':' date-modal work-interview-modal'):'')+(modal==='romance'?' romance-modal':'')+(modal==='journal'?' journal-modal':'')+(modal==='lines'?' lines-modal':'')} role="dialog" aria-modal="true" aria-label={activeEvent?.title||outcome?.title||(mini?.type==='stall'?'晚风小吃街':mini?'人生现场':modal==='saves'?'存档':modal==='journal'?'人生记事':modal==='lines'?'时间线':modal==='contacts'?(profile?.name??'认识的人'):'魔都人生')}>
 {!(activeEvent&&game?.pendingYearEvent)&&<button className="modal-close icon-button" aria-label="关闭" onClick={()=>{if(outcome)closeOutcome();else{setModal(null);setMini(null);dismissEvent();}}}><Icon name="close"/></button>}
 {modal==='help'&&<div className="help-content"><h2>怎么玩</h2><div className="help-step"><b>01</b><div><h3>先抽五张人生牌</h3><p>每类一张，有两次重抽机会。</p></div></div><div className="help-step"><b>02</b><div><h3>每年三次行动</h3><p>点地点办事，每次扣一格。走路、换城区不扣行动。</p></div></div><div className="help-step"><b>03</b><div><h3>年底结账</h3><p>点年度结算，工资到账，房租和生活费一起扣。六十岁结局。</p></div></div><button className="primary" onClick={()=>setModal(null)}>晓得了 <Icon name="check" size={18}/></button><small className="fiction-note">人物与怪谈均为虚构</small></div>}
 {modal==='lines'&&book&&<LifeLines book={book} onFork={branchFrom} onSwitch={returnToLine} onDrop={id=>setBook(current=>current?dropLine(current,id):current)}/>}
 {modal==='challenge'&&handLink&&<div className="challenge-copy">
  <h2>把这手牌发给朋友</h2>
  <input aria-label="同手牌挑战链接" value={handLink} readOnly onFocus={event=>event.currentTarget.select()}/>
 </div>}
 {modal==='journal'&&game&&<div className="journal-content"><h2>记事本</h2><div className="journal-list">{game.journal.slice().reverse().map((j,i)=><article key={i}><div><b>{j.age}</b><span>岁</span></div><section><span className="journal-tag">{j.tag}</span><h3>{j.title}</h3><p>{j.text}</p></section></article>)}</div><button className="secondary" onClick={exportSave}><Icon name="download" size={17}/>导出完整人生档案</button></div>}
 {modal==='contacts'&&game&&(profile
  ? <ContactProfile person={profile} game={game} onBack={()=>{
   const id=profile.id;setProfile(undefined);
   requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('[data-profile="'+id+'"]')?.focus());
  }}/>
  : <div className="contacts-content"><h2>通讯录</h2><div className="contact-grid">{CAST.map(p=>{const r=game.relationships[p.id];return <article className={'contact-card '+(!r.met?'not-met':'')} key={p.id}><button type="button" className="contact-avatar" data-profile={p.id} aria-label={'查看'+p.name+'的立绘'} onClick={()=>setProfile(p)}><Portrait person={p} size={64} age={game.age} decorative/><Icon name="eye" size={12}/></button><div className="contact-name"><h3>{p.name}<span>{relationshipLabel(game,p.id)}</span></h3><small>{castTitle(p,game.age)} · {p.ageOffset+game.age}岁 · {DISTRICTS.find(d=>d.id===p.district)?.name}</small><p>{p.description}</p>{r.met&&<><div className="contact-meters"><span>信任 {r.trust}</span>{p.role==='romance'&&<span>好感 {r.attraction} · 承诺 {r.commitment}</span>}</div>{r.memories.length>0&&<small className="memory">{r.memories[r.memories.length-1]}</small>}</>}{p.role==='romance'&&r.trust>=55&&r.attraction>=45&&game.partnerId!==p.id&&<button className="text-button" onClick={()=>askCommit(p)}>确定关系 <Icon name="heart" size={14}/></button>}</div></article>;})}</div></div>)}
 {modal==='saves'&&<div className="save-content" key={saveVersion}><h2>存档</h2><p>进度自动保存在当前浏览器</p><div className="save-slots">{getSlots().map((slot,i)=>{const s=slot?activeLine(slot).state:null;return <div className="save-slot" key={i}><span className="slot-no">0{i+1}</span><div><b>{s?s.name+' · '+s.age+'岁':'空存档'}</b><small>{s?publicOriginNames(s)[0]+' / '+money(s.cash):'未使用'}</small></div><div>{s&&<button className="text-button" onClick={()=>loadSlot(i)}>载入</button>}{game&&<button className="secondary small" onClick={()=>saveSlot(i)}>{s?'覆盖':'存这里'}</button>}</div></div>;})}</div><div className="save-file-actions"><button className="secondary" onClick={()=>fileInput.current?.click()}><Icon name="save" size={17}/>导入档案</button><button className="secondary" disabled={!game} onClick={exportSave}><Icon name="download" size={17}/>导出当前人生</button></div><small>换设备前先导出存档</small></div>}
 {modal==='career'&&game&&workTrack&&<div className="career-content">
   <h2>{game.jobId?'换份工作':'找工作'}</h2>
   <p>{workTrack.closedMonths?`本年还剩 ${12-workTrack.closedMonths} 个月可结算，旧岗位工资年底一起发。`:'答完三轮，再看对方开的条件。'}</p>
   {game.flags.includes(NIGHT_WORK)&&<p className="active-work-terms">当前接轮值 · {money(budget!.salary)}/月</p>}
   {game.flags.includes(LONG_COMMUTE)&&<p className="active-work-terms">当前跨江通勤 · {money(budget!.salary)}/月</p>}
   {stallCommitment(game)>0&&<p className="active-work-terms">小吃街晚班 · 还剩 {stallCommitment(game)} 年</p>}
   {promotion&&<div className="career-review">
    <b>下一档 · {promotion.title}</b>
    <span>在岗 {game.age-workTrack.sinceAge}/{promotion.years} 年</span>
    <span>评审 {workTrack.reviews}/{promotion.reviews}</span>
    <span>本事 {game.stats.skill}/{promotion.skill}</span>
   </div>}
   <div className="career-grid">{CAREERS.map(c=><button key={c.id} disabled={game.actions<=0} className={'career-option '+(game.jobId===c.id?'current':'')}
    onClick={()=>{setModal(null);setMini({type:'dialogue',career:c});}}>
    <img className="career-preview" src={interviewPhoto(c.id)} alt="" loading="lazy"/><h3>{c.name}</h3>
    <b>{money(c.salary)}<small>{isSelfEmployed(c.id)?'/月估算':'/月起'}</small></b><p>{c.description}</p>
    <div>{game.jobId===c.id?'当前职业 · 再谈一次':'面试看看'}<Icon name="arrow" size={15}/></div>
   </button>)}</div>
   {game.jobId&&<button className="text-button" onClick={()=>{setModal(null);openEvent('career');}}>处理工作上的事 <Icon name="chevron" size={16}/></button>}
 </div>}
 {modal==='romance'&&game&&<div className="romance-content"><h2>约谁出来</h2><div className="romance-grid">{CAST.filter(p=>p.role==='romance').map(p=>{
  const answer=dateAnswer(game,p.id);
  const action=answer==='left'?'已经道别':answer==='friends'?'以朋友身份碰面':hasDated(game,p.id)?'再约一次':'约见面';
  return <button key={p.id} disabled={answer==='left'} onClick={()=>startRomance(p)}><Portrait person={p} full/><h3>{p.name}<small>{relationshipLabel(game,p.id)}</small></h3><span>{p.title} · {p.ageOffset+game.age}岁</span><p>{p.description}</p><b>{action} {answer!=='left'&&<Icon name="arrow" size={15}/>}</b></button>;})}</div><button className="text-button" onClick={()=>{setModal(null);openEvent('romance',game.partnerId||undefined);}}>看看最近的感情状况 <Icon name="chevron" size={16}/></button></div>}
 {activeEvent&&game&&<><div className={'event-visual'+(scenePhoto?' event-photo':'')}>
  {scenePhoto?<img src={scenePhoto} alt=""/>:isOwl?<Suspense fallback={<LoadCity/>}><OwlPreview/></Suspense>:speaker&&<Portrait person={speaker} full/>}
 </div><div className="event-content"><div className="event-meta"><span>{activeEvent.tag||ACTIVITY_NAMES[activeEvent.category as ActivityKind]||'这一年'}</span><small>{game.age}岁 · {activeEvent.category==='year'?'不扣行动':'1 格行动'}</small></div>
 {speaker&&!activeEvent.firstDate&&!birthScene&&!stallScene&&<div className="event-speaker"><Portrait person={speaker} size={54} age={game.age}/><div><b>{speaker.name}</b><small>{castTitle(speaker,game.age)}</small></div></div>}<h2 ref={focusScene?sceneHeading:undefined} tabIndex={focusScene?-1:undefined}>{activeEvent.title}</h2><p className="event-body">{activeEvent.text}</p>{partingBill>0&&<p className="date-bill">这顿你付 {money(partingBill)}</p>}<div className="event-choices">{activeEvent.choices.map((c,i)=>{
  const sender=c.senderId?CAST.find(person=>person.id===c.senderId):undefined;
  return <button key={c.id} className={sender?'message-choice':undefined} disabled={!canAfford(game,c.effect)} onClick={()=>choose(c.id)}>
   {sender?<Portrait person={sender} size={41} decorative/>:<span className="choice-letter">{String.fromCharCode(65+i)}</span>}<div><b>{c.label}</b>{c.hint&&<p>{c.hint}</p>}<small>{!focusScene&&effectsText(c.effect).slice(0,4).map(([label,n])=>label==='积蓄'?(n>0?'+':'−')+money(Math.abs(n)):label+(n>0?' +':' ')+n).join(' · ')}{c.check?' · '+STAT_NAMES[c.check.stat]+'检定 '+checkChance(game,c)+'%':''}{!canAfford(game,c.effect)?' · 钱暂时不够':''}</small></div><Icon name="chevron" size={17}/></button>;})}</div>{rentalEvidence!==undefined&&!line?.replay&&<button className="text-button rental-back" onClick={()=>{
  setActiveEvent(null);setEventNpc(undefined);setMini({type:'rental',evidence:rentalEvidence});
 }}>← 回房间看看</button>}</div></>}
 {outcome&&game&&<div className="outcome-content"><p className="eyebrow">{outcome.annual?'年度账本 / '+(game.age-1)+'岁':'结果'}</p><div className={'outcome-symbol '+(outcome.success===false?'muted':'')}><Icon name={outcome.annual?'book':outcome.success===false?'leaf':'check'} size={33}/></div><h2>{outcome.title}</h2>{outcome.text&&<p className="outcome-text">{outcome.text}</p>}{outcome.annual?<div className="annual-ledger">{outcome.payroll&&<>
  <div><span>旧岗位收入</span><b>{money(outcome.payroll.previous)}</b></div>
  <div><span>当前岗位 · {outcome.payroll.months} 个月</span><b>{money(outcome.payroll.current)}</b></div>
 </>}<div><span>全年工作收入</span><b>{money((outcome.income||0)-(outcome.tableIncome||0)-(outcome.stallIncome||0))}</b></div>
 {!!outcome.tableIncome&&<div><span>长桌修补台</span><b>+{money(outcome.tableIncome)}</b></div>}{!!outcome.stallIncome&&<div><span>小吃街晚班</span><b>+{money(outcome.stallIncome)}</b></div>}{outcome.rentExpense!==undefined?<>
  <div><span>这份租约的全年房租</span><b>−{money(outcome.rentExpense)}</b></div>
  <div><span>全年生活开支</span><b>−{money((outcome.expense||0)-outcome.rentExpense)}</b></div>
 </>:<div><span>全年住房与生活</span><b>−{money(outcome.expense||0)}</b></div>}{!!outcome.repayment&&<div><span>这期助学贷款</span><b>−{money(outcome.repayment)}</b></div>}<div><span>现在手上</span><strong>{money(game.cash)}</strong></div></div>:<div className="effect-badges">{effectsText(outcome.effect).map(([label,n])=><span key={label} className={n>0?'gain':'loss'}>{label} <b>{label==='积蓄'?(n>0?'+':'−')+money(Math.abs(n)):(n>0?'+':'')+n}</b></span>)}{outcome.effect.job&&<span className={outcome.effect.job==='unemployed'?'loss':'gain'}>{outcome.effect.job==='unemployed'?'开始待业':'新的职业机会'}</span>}{signedOffer?<span className="gain">{isSelfEmployed(game.jobId??'')?'月收入估算':'约定月薪'} <b>{money(budget!.salary)}</b></span>:outcome.effect.payRate!==undefined&&<span className={outcome.effect.payRate<1?'loss':'gain'}>薪资按原价 <b>{Math.round(outcome.effect.payRate*100)}%</b> 发</span>}</div>}<button className="primary" onClick={closeOutcome}>{game.ended?'回头看看这一生':outcome.annual?game.age+'岁，接着过':'继续'} <Icon name="arrow" size={19}/></button><div className="outcome-links">
 {outcome.annual&&book&&book.lines.length>1&&<button className="text-button" onClick={()=>{closeOutcome();setModal('lines');}}>对照另一条线 <Icon name="map" size={16}/></button>}
 {outcome.source&&outcome.source.event.choices.length>1&&line?.points.at(-1)?.scene.eventId===outcome.source.event.id&&
  <button className="text-button" onClick={()=>{
   if(book&&book.lines.length<MAX_LINES)branchFrom(line.points.length-1);
   else{closeOutcome();setModal('lines');}
  }}>回这一步改选 <Icon name="map" size={16}/></button>}
 {outcome.source&&outcome.source.event.choices.length>=3&&<button className="text-button parallel-outcome" onClick={()=>{
 const {event,choiceId}=outcome.source!;
 const sceneDistrict=DISTRICTS.find(item=>item.id===event.district)?.name??district.name;
 setTimelineDraft(draftFromEvent(event,choiceId,outcome.text,game.age,sceneDistrict));
 closeOutcome();setParallel(true);
 }}>把这一幕发给朋友 <Icon name="map" size={17}/></button>}</div></div>}
 {mini?.type==='laser'&&game&&<LaserGame seed={game.seed} cash={game.cash} appearance={game.appearance} onFinish={result=>{const reward=pearlReward(result);miniFinish(reward.effect,reward.text);}}/>}
 {mini?.type==='rental'&&game&&<RentalGame initialEvidence={mini.evidence} onTalk={openRental}/>}
 {mini?.type==='stall'&&game&&<StallGame seed={game.seed} age={game.age} schedule={stallSchedule(game.seed,game.age,game.actions)} onCloseBooks={closeStallBooks}/>}
 {mini?.type==='dialogue'&&game&&(mini.person?
  <DialogueGame person={mini.person} skill={game.stats.skill} cash={game.cash} flags={game.flags} onParting={picks=>openParting(mini.person,picks)}/>:
  <DialogueGame career={mini.career} skill={game.stats.skill} cash={game.cash} flags={game.flags} onFinish={miniFinish} onOffer={openJobOffer}/>)}
 </section></div>}
 <input ref={fileInput} className="visually-hidden" type="file" accept=".json,application/json" aria-label="导入人生档案文件" onChange={e=>void importSave(e.target.files?.[0])}/>
 {toast&&<div className="toast" role="status"><Icon name="check" size={17}/>{toast}</div>}
 </div>;
}

