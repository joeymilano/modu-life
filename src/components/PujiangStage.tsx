import Icon, { type IconName } from './Icon';
import GameIcon from './GameIcon';
import { useEffect, useRef, useState } from 'react';
import { ABILITIES, abilityPoints, abilitySlots, completedChapters, ENDING_NAMES, episodeCarry, episodeOffer, episodeView, equipAbility, isPujiangSystem, learnAbility, PUJIANG_NAMES, systemLevel } from '../game/pujiang';
import { CINEMA_ART, cinemaBeat, cinemaRelationships } from '../game/pujiangCinema';
import { COMMISSIONS, SYSTEM_EPISODES } from '../game/pujiangScript';
import { DISTRICTS } from '../game/content';
import { calendarYear } from '../game/calendar';
import type { AbilityId, EpisodeMove } from '../game/pujiangTypes';
import type { GameState } from '../game/types';
import './pujiang.css';
import './pujiang-cinema.css';

const money=(n:number)=>'¥'+n.toLocaleString('zh-CN');

const abilityDial: Record<AbilityId, [IconName, string]> = {
 insight: ['eye', '看穿心思'], forecast: ['clock', '预看后果'],
 borrow: ['bolt', '借用专长'], combine: ['spark', '组合专长'],
 seek: ['people', '找到帮手'], resonate: ['share', '追加协作'],
};

export function AbilityLoadout({ game, onChange, onError }: {
 game: GameState; onChange: (s: GameState) => void; onError: (s: string) => void;
}) {
 const progress = game.systemProgress!;
 const level = systemLevel(game), points = abilityPoints(game), slots = abilitySlots(game);
 const visible = ABILITIES.filter(a => !a.parent || level >= 3);
 function toggle(id: AbilityId, learned: boolean) {
  try { onChange(learned ? equipAbility(game, id) : learnAbility(game, id)); }
  catch (e) { onError((e as Error).message); }
 }
 return <section className="pj-loadout" aria-label="系统能力配置">
  <div className="pj-loadout-head"><b>能力配装 <em>Lv.{level}</em></b><span aria-live="polite"><strong>{points}</strong> 点可用 <i/> 槽位 {progress.equipped.length}/{slots}</span></div>
  <div className="pj-dials">{visible.map(a => {
   const learned = progress.learned.includes(a.id), equipped = progress.equipped.includes(a.id);
   const parent = a.parent && ABILITIES.find(b => b.id === a.parent);
   const missing = parent && !progress.learned.includes(parent.id);
   const full = learned && !equipped && progress.equipped.length >= slots;
   const reason = game.episode || game.ended ? '已锁定' : missing ? '先学' + parent.name : !learned && points < a.cost ? '点数不足' : full ? '先腾出槽位' : '';
   const action = reason || (equipped ? '已装 · 卸下' : learned ? '装备' : '学习 · '+a.cost+'点');
   const [icon, caption] = abilityDial[a.id];
   return <button key={a.id} type="button" className="pj-dial"
    data-learn={learned ? undefined : a.id} data-equip={learned ? a.id : undefined}
    data-equipped={equipped} aria-pressed={learned ? equipped : undefined}
    aria-label={a.name+'，'+caption+'，'+action} title={a.description} disabled={!!reason}
    onClick={() => toggle(a.id, learned)}>
     <span className="pj-dial-icon"><Icon name={icon} size={28}/>{equipped && <i>✓</i>}</span>
     <b>{a.name}</b><span className="pj-dial-caption">{caption}</span><small>{action}</small>
   </button>;
  })}</div>
  <details className="pj-recap pj-manual"><summary>能力说明</summary>
   <p>回合随选择推进。主线不占年度行动。进场锁定配装，每项能力每场限用一次。每章结束得 1 点。{level < 5 && `再完成 ${2-completedChapters(game)%2} 章升至 Lv.${level+1}。`}</p>
   <ul>{ABILITIES.map(a=><li key={a.id}><b>{a.name}</b>　{a.description}{a.parent && '（Lv.3，需先学'+ABILITIES.find(b=>b.id===a.parent)!.name+'）'}</li>)}</ul>
  </details>
 </section>;
}

export function PujiangSystemPanel({game,onChange,onStart,onError}:{game:GameState;onChange:(s:GameState)=>void;onStart:(id:string)=>void;onError:(s:string)=>void}){
 const next=SYSTEM_EPISODES.find(e=>!game.seenEvents.includes(e.id));
 return <section className="pj-system-panel">
  <header><span className="pj-eyebrow">系统 Lv.{systemLevel(game)}</span><h2>浦江破局</h2><p>{next?`下一章 · ${next.age}岁 · ${next.title}`:'八章完结'}</p>{next&&<p>{DISTRICTS.find(d=>d.id===next.district)!.name} · {next.goal}</p>}</header>
  <AbilityLoadout game={game} onChange={onChange} onError={onError}/>
  <h3>六区委托</h3><p className="pj-help">每单消耗 1 格行动。</p>
  <div className="pj-commissions">{COMMISSIONS.map(e=>{
   const done=game.seenEvents.includes(e.id),disabled=done||game.ended||game.pendingYearEvent||!!game.episode||game.actions<1||!!episodeOffer(game);
   return <button key={e.id} data-commission={e.district} disabled={disabled} onClick={()=>onStart(e.id)}><span>{DISTRICTS.find(d=>d.id===e.district)!.name}</span><b>{e.title}</b><small>{done?'已完成':game.actions<1?'来年再来':'1行动 · 最高'+money(e.reward)}</small></button>;
  })}</div>
 </section>;
}

export default function PujiangStage({game,onStart,onMove,onDone,onPause,onChange,onError}:{game:GameState;onStart:(id:string)=>void;onMove:(move:EpisodeMove)=>void;onDone:()=>void;onPause:()=>void;onChange:(s:GameState)=>void;onError:(s:string)=>void}){
 const run=game.episode,view=run?episodeView(game):undefined,script=view?.script??episodeOffer(game)!;
 const heading=useRef<HTMLHeadingElement>(null),panel=useRef<HTMLElement>(null);
 const [targeting,setTargeting]=useState<'forecast'|'resonate'>();
 useEffect(()=>{setTargeting(undefined);panel.current?.closest('.modal')?.scrollTo({top:0});heading.current?.focus({preventScroll:true});},[script.id,view?.stage,!!run?.receipt]);
 const useTarget=(id:'forecast'|'resonate',target:string)=>{onMove({kind:'ability',id,target});setTargeting(undefined);};
 const chapter=SYSTEM_EPISODES.indexOf(script)+1,receipt=run?.receipt;
 const act=Math.min(view?.stage??0,script.scenes.length-1),shot=cinemaBeat(script,act);
 const relationships=cinemaRelationships(game,script,receipt?[]:view?.relations);
 const [still,setStill]=useState(false);
 const district=DISTRICTS.find(d=>d.id===script.district)!.name;
 const place=script.id==='pj-heir-18'||script.id==='pj-system-20'?'锦江饭店':
  ['pj-system-18','pj-arrival-18','pj-system-25'].includes(script.id)?'江边小礼堂':
  script.id==='pj-worker-18'?'莘庄仓库':district;
 const series=script.commission?'街区委托':chapter?'浦江破局':{arrival:'初到上海',worker:'日结工',heir:'顶级富二代',system:'浦江破局'}[script.route];
 const intro=!run;
 return <article className="pj-stage" ref={panel} data-still={still} data-route={script.route} data-mode={intro?'brief':receipt?'result':'scene'} data-verdict={receipt?.verdict}>
  <figure className="pj-frame">
   <div className="pj-shot" key={`${script.id}-${act}-${!!receipt}`}>
    <img src={script.commission?script.photo:CINEMA_ART[shot.art]} style={{objectPosition:shot.focus}} alt={script.commission?'':`${shot.speaker}，${shot.direction}`} fetchPriority="high"/>
   </div>
   <div className="pj-film-top"><span className="pj-place"><b>{calendarYear(game)}</b> 上海 / {place}</span>
    <button type="button" className="pj-motion" aria-label={still?'开启镜头微动':'静止画面'} title={still?'开启镜头微动':'静止画面'} aria-pressed={still} onClick={()=>setStill(v=>!v)}>{still?<Icon name="play" size={14}/>:<i aria-hidden="true"/>}</button>
   </div>
   {!receipt&&<figcaption><div className="pj-dialogue" key={`${script.id}-${act}`}>
    <span>{shot.speaker}</span><blockquote>{shot.line}</blockquote>
   </div></figcaption>}
  </figure>
  <div className="pj-stage-body">
   <div className="pj-topline"><span className="pj-index"><i aria-hidden="true"/>{series}{chapter>0 && <> / <b>{String(chapter).padStart(2,'0')}</b></>}</span>
    <button type="button" className="pj-pause" aria-label="保存并回首页" onClick={onPause}><Icon name="save" size={14}/>存档离场</button></div>
   <h2 ref={heading} tabIndex={-1}>{receipt?receipt.title:run?view!.scene.title:script.title}</h2>
   {intro&&<div className="pj-mission">
    <p className="pj-objective"><GameIcon name="mission" size={17}/>{script.goal}</p>
    <span><GameIcon name="action" size={16}/>{script.scenes.length} 回合{script.commission?' · 1 格行动':''}</span>
    {script.reward>0&&<span className="pj-bounty"><GameIcon name="reward" size={16}/>最高 <b>{money(script.reward)}</b></span>}
   </div>}
   {run&&!receipt&&<ol className="pj-act-strip" aria-label="本章幕次">{script.scenes.map((scene,i)=><li key={scene.title} data-current={i===act} data-done={i<act} aria-label={scene.title} aria-current={i===act?'step':undefined}/>)}</ol>}
   {!run?<>
    <p className="pj-prose">{script.intro}</p>
    {episodeCarry(game,script).map(t=><p className="pj-carry" key={t}>{t}</p>)}
    {script.offline&&<p className="pj-offline">今晚异能离线。</p>}
    {isPujiangSystem(game)&&!script.offline&&<AbilityLoadout game={game} onChange={onChange} onError={onError}/>}

    <button className="pj-primary" data-pj-start onClick={()=>onStart(script.id)}>进入现场 <span><Icon name="arrow" size={22}/></span></button>
   </>:receipt?<>
    <p className="pj-prose">{receipt.text}</p>
    {receipt.ending&&<p className="pj-ending">你选择了 · {ENDING_NAMES[receipt.ending]}</p>}
    <dl className="pj-receipt"><div><dt>奖金</dt><dd>{money(receipt.cash)}</dd></div><div><dt>净收支</dt><dd>{(receipt.effect.cash??0)>=0?'+':''}{money(receipt.effect.cash??0)}</dd></div>
     <div><dt>收获</dt><dd>本事 +{receipt.effect.skill} · 人脉 +{receipt.effect.network}</dd></div>
     <div><dt>支出</dt><dd>{money(Math.max(0,receipt.cash-(receipt.effect.cash??0)))}</dd></div>
     {run!.moves.at(-1)?.id==='share'&&<div><dt>分出的奖励</dt><dd>本次个人奖励减半</dd></div>}
     {script.id==='pj-system-19'&&run!.moves.at(-1)?.id==='partners'&&<div><dt>共同接单的取舍</dt><dd>个人报酬减半 · 保留团队机会</dd></div>}
     {!script.commission&&isPujiangSystem(game)&&<div><dt>成长保留</dt><dd>能力点 +1 · Lv.{systemLevel(game)}</dd></div>}
    </dl>
    {receipt.relationships.length>0&&<section className="pj-relation-result"><h3>关系变化</h3>{receipt.relationships.map(t=><p key={t}>{t}</p>)}</section>}
    <p className="pj-next">{receipt.next}</p>
    <details className="pj-recap"><summary>回顾选择</summary>{view!.recent.map((t,i)=><p key={i}>{t}</p>)}</details>
    <button className="pj-primary" data-pj-done onClick={onDone}>回到街上 <span><Icon name="arrow" size={22}/></span></button>
   </>:<>
    <div className="pj-resources" aria-label="现场资源"><span>现场 <b>{view!.score}</b></span><span>合作 <b>{view!.team}</b></span><span>调度 <b>{view!.budget}</b></span><span>剩余 <b>{script.scenes.length-view!.stage}轮</b></span></div>
    {view!.recent.length>0&&<p className="pj-feedback" role="status">{view!.recent.at(-1)}</p>}
    <div className="pj-prose"><p>{view!.scene.text.split('\n\n')[0]}</p></div>
    {view!.scene.text.includes('\n\n')&&<details className="pj-aside" key={'talk-'+act}><summary>听他们说</summary>{view!.scene.text.split('\n\n').slice(1).map((t,i)=><p key={i}>{t}</p>)}</details>}
    <details className="pj-observation" key={`${script.id}-${act}`}><summary><span>查看</span><b>{shot.prop}</b><span aria-hidden="true">＋</span></summary><p>{shot.observation}</p></details>
    <details className="pj-people"><summary>在场伙伴 <span>{relationships.filter(r=>r.delta>0).length?'有人开始信任你':'信任'}</span></summary><div>{relationships.map(r=><p key={r.id}><b>{PUJIANG_NAMES[r.id]}</b><span>信任 {r.trust}</span>{r.delta!==0&&<em data-negative={r.delta<0}>{r.delta>0?'+':''}{r.delta}</em>}</p>)}</div></details>
    {view!.abilities.length>0&&<div className="pj-powerbar" aria-label="本场能力">{view!.abilities.map(a=><button key={a.id} data-ability={a.id} disabled={!!a.reason} onClick={()=>{if(a.id==='forecast'||a.id==='resonate')setTargeting(targeting===a.id?undefined:a.id);else onMove({kind:'ability',id:a.id});}}><b>{a.name}</b><small>{a.reason??(targeting===a.id?'取消选择':a.id==='forecast'?'指定一个选择':a.id==='resonate'?'安排协同行动':'使用')}</small></button>)}</div>}
    {targeting==='forecast'&&<p className="pj-help" role="status">选择要推演的行动。</p>}
    {targeting==='resonate'&&<div className="pj-powerbar" aria-label="协同行动"><button data-pj-aid="team" onClick={()=>useTarget('resonate','team')}><b>请伙伴留在现场补位</b><small>合作 +2 · 不消耗选择回合</small></button><button data-pj-aid="dispatch" onClick={()=>useTarget('resonate','dispatch')}><b>请伙伴协调下一轮人手</b><small>合作 +1 · 调度 +1</small></button></div>}
    {script.offline&&<p className="pj-offline">异能离线</p>}
    {view!.secret&&<p className="pj-secret" role="status"><b>识人</b>{view!.secret}</p>}

    <div className="pj-choices">{view!.choices.map((c,i)=><div key={c.id}><button data-pj-choice={c.id} disabled={!!c.disabled} onClick={()=>onMove({kind:'choice',id:c.id})}><i aria-hidden="true">{String.fromCharCode(65+i)}</i><b>{c.label}</b><small>{c.disabled?'暂不可选 · '+c.disabled:c.hint}</small><span aria-hidden="true">↗</span></button>{targeting==='forecast'&&<button className="pj-predict" data-pj-predict={c.id} onClick={()=>useTarget('forecast',c.id)}>推演这项选择</button>}{c.preview&&<p className="pj-preview">推演：{c.preview}</p>}</div>)}</div>
   </>}
  </div>
 </article>;
}
