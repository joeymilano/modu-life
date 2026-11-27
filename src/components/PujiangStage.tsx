import Icon, { type IconName } from './Icon';
import GameIcon from './GameIcon';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ABILITIES, abilityPoints, abilitySlots, completedChapters, ENDING_NAMES, episodeCarry, episodeOffer, episodeView, equipAbility, isPujiangSystem, learnAbility, rollLuck, systemLevel, type EpisodeViewChoice } from '../game/pujiang';
import { cinemaRelationships } from '../game/pujiangCinema';
import { PROLOGUES, PROLOGUE_PENDING, rememberedMeeting, spokenText } from '../game/pujiangPrologue';
import { COMMISSIONS, SYSTEM_EPISODES } from '../game/pujiangScript';
import PrologueStage from './PrologueStage';
import DialogueStage, { STALL, type StageMoodSetter } from './DialogueStage';
import type { DialogueOption } from '../game/dialogue';
import { DISTRICTS } from '../game/content';
import { calendarYear } from '../game/calendar';
import type { AbilityId, EpisodeMove } from '../game/pujiangTypes';
import type { GameState } from '../game/types';
import './pujiang.css';
import './pujiang-cinema.css';

const money = (n: number) => '¥' + n.toLocaleString('zh-CN');
const SERIES: Record<string, string> = { arrival: '初到上海', worker: '日结工', heir: '顶级富二代', system: '浦江破局' };

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
   const action = reason || (equipped ? '已装 · 卸下' : learned ? '装备' : '学习 · ' + a.cost + '点');
   const [icon, caption] = abilityDial[a.id];
   return <button key={a.id} type="button" className="pj-dial"
    data-learn={learned ? undefined : a.id} data-equip={learned ? a.id : undefined}
    data-equipped={equipped} aria-pressed={learned ? equipped : undefined}
    aria-label={a.name + '，' + caption + '，' + action} title={a.description} disabled={!!reason}
    onClick={() => toggle(a.id, learned)}>
    <span className="pj-dial-icon"><Icon name={icon} size={28}/>{equipped && <i>✓</i>}</span>
    <b>{a.name}</b><span className="pj-dial-caption">{caption}</span><small>{action}</small>
   </button>;
  })}</div>
  <details className="pj-recap pj-manual"><summary>能力说明</summary>
   <p>回合随选择推进。主线不占年度行动。进场锁定配装，每项能力每场限用一次。每章结束得 1 点。{level < 5 && `再完成 ${2 - completedChapters(game) % 2} 章升至 Lv.${level + 1}。`}</p>
   <ul>{ABILITIES.map(a => <li key={a.id}><b>{a.name}</b>　{a.description}{a.parent && '（Lv.3，需先学' + ABILITIES.find(b => b.id === a.parent)!.name + '）'}</li>)}</ul>
  </details>
 </section>;
}

export function PujiangSystemPanel({ game, onChange, onStart, onError }: { game: GameState; onChange: (s: GameState) => void; onStart: (id: string) => void; onError: (s: string) => void }) {
 const next = SYSTEM_EPISODES.find(e => !game.seenEvents.includes(e.id));
 return <section className="pj-system-panel">
  <header><span className="pj-eyebrow">系统 Lv.{systemLevel(game)}</span><h2>浦江破局</h2><p>{next ? `下一章 · ${next.age}岁 · ${next.title}` : '八章完结'}</p>{next && <p>{DISTRICTS.find(d => d.id === next.district)!.name} · {next.goal}</p>}</header>
  <AbilityLoadout game={game} onChange={onChange} onError={onError}/>
  <h3>六区委托</h3><p className="pj-help">每单消耗 1 格行动。</p>
  <div className="pj-commissions">{COMMISSIONS.map(e => {
   const done = game.seenEvents.includes(e.id), disabled = done || game.ended || game.pendingYearEvent || !!game.episode || game.actions < 1 || !!episodeOffer(game);
   return <button key={e.id} data-commission={e.district} disabled={disabled} onClick={() => onStart(e.id)}><span>{DISTRICTS.find(d => d.id === e.district)!.name}</span><b>{e.title}</b><small>{done ? '已完成' : game.actions < 1 ? '来年再来' : '1行动 · 最高' + money(e.reward)}</small></button>;
  })}</div>
 </section>;
}

/** What one chapter option looks like on the dialogue stage. */
function toOption(choice: EpisodeViewChoice): DialogueOption {
 return { id: choice.id, label: choice.label, tag: choice.tag, hint: choice.hint, lock: choice.disabled, gain: choice.gain, chance: choice.chance,
  preview: choice.preview, then: choice.react ?? [] };
}

export default function PujiangStage({ game, onStart, onMove, onDone, onPause, onChange, onError, onMood, audio, onAudio }: { game: GameState; onStart: (id: string) => void; onMove: (move: EpisodeMove) => void; onDone: () => void; onPause: () => void; onChange: (s: GameState) => void; onError: (s: string) => void; onMood?: StageMoodSetter; audio: boolean; onAudio: () => void }) {
 const run = game.episode, view = run ? episodeView(game) : undefined, script = view?.script ?? episodeOffer(game)!;
 const prologue = !run && script.age === 18 && !script.commission && game.flags.includes(PROLOGUE_PENDING) ? PROLOGUES[script.route] : undefined;
 const meeting = !run && script.age === 18 && !script.commission ? rememberedMeeting(game.flags, script.route) : undefined;
 const heading = useRef<HTMLHeadingElement>(null);
 const panel = useRef<HTMLElement>(null);
 const [targeting, setTargeting] = useState<'forecast' | 'resonate'>();
 // The act on screen. After a choice the rules are already a beat ahead; the reaction gets to finish first.
 const [act, setAct] = useState(() => view?.stage ?? 0);
 const receipt = run?.receipt && act >= script.scenes.length ? run.receipt : undefined;
 useEffect(() => { setTargeting(undefined); panel.current?.closest('.modal')?.scrollTo({ top: 0 }); heading.current?.focus({ preventScroll: true }); }, [script.id, !!prologue, !!run, act, !!receipt]);
 const useTarget = (id: 'forecast' | 'resonate', target: string) => { onMove({ kind: 'ability', id, target }); setTargeting(undefined); };
 const chapter = SYSTEM_EPISODES.indexOf(script) + 1;
 const series = script.commission ? '街区委托' : chapter ? SERIES.system : SERIES[script.route];
 const place = DISTRICTS.find(d => d.id === script.district)!.name;
 const scene = script.scenes[Math.min(act, script.scenes.length - 1)], choosing = !!view && view.stage === act;
 // The script's own copy of the options: labels and the lines that follow them never change mid-question.
 const options = useMemo(() => scene.choices.map(toOption), [script.id, act]); // eslint-disable-line react-hooks/exhaustive-deps
 const beats = useMemo(() => [...scene.beats, { t: 'choice' as const, id: 'act-' + act, prompt: scene.prompt, options }], [script.id, act, options]); // eslint-disable-line react-hooks/exhaustive-deps

 if (prologue) return <PrologueStage route={script.route} game={game} onChange={onChange} onPause={onPause} onMood={onMood} audio={audio} onAudio={onAudio}/>;
 if (!run || !view || receipt) return <article className="pj-stage" ref={panel} data-route={script.route} data-mode={receipt ? 'result' : 'brief'} data-verdict={receipt?.verdict}>
  <figure className="pj-frame">
   <div className="pj-shot"><img src={script.photo} style={{ objectPosition: '62% 36%' }} alt="" fetchPriority="high"/></div>
   <div className="pj-film-top"><span className="pj-place"><b>{calendarYear(game)}</b> 上海 / {place}</span>
    <div className="pj-film-controls"><button type="button" className="pj-motion" aria-label={audio ? '关闭声音' : '打开声音'} onClick={onAudio}><Icon name={audio ? 'sound' : 'mute'} size={16}/></button></div>
   </div>
  </figure>
  <div className="pj-stage-body">
   {receipt ? <>
    <div className="gta-stamp" data-verdict={receipt.verdict} aria-hidden="true">
     <span lang="en">{receipt.verdict === 'win' ? 'MISSION PASSED' : receipt.verdict === 'partial' ? 'DEAL SETTLED' : 'ROUND LOST'}</span>
     <i>{receipt.verdict === 'win' ? '腔势 +' : receipt.verdict === 'partial' ? '落袋为安' : '留得青山'}</i>
    </div>
    <div className="pj-topline"><span className="pj-index"><i aria-hidden="true"/>{series}{chapter > 0 && <> / <b>{String(chapter).padStart(2, '0')}</b></>}</span></div>
    <h2 ref={heading} tabIndex={-1}>{receipt.title}</h2>
    <p className="pj-prose">{receipt.text}</p>
    {receipt.ending && <p className="pj-ending">你选择了 · {ENDING_NAMES[receipt.ending]}</p>}
    <dl className="pj-receipt"><div><dt>奖金</dt><dd>{money(receipt.cash)}</dd></div><div><dt>净收支</dt><dd>{(receipt.effect.cash ?? 0) >= 0 ? '+' : ''}{money(receipt.effect.cash ?? 0)}</dd></div>
     <div><dt>收获</dt><dd>本事 +{receipt.effect.skill} · 人脉 +{receipt.effect.network}</dd></div>
     <div><dt>支出</dt><dd>{money(Math.max(0, receipt.cash - (receipt.effect.cash ?? 0)))}</dd></div>
     {run!.moves.at(-1)?.id === 'share' && <div><dt>分出的奖励</dt><dd>本次个人奖励减半</dd></div>}
     {script.id === 'pj-system-19' && run!.moves.at(-1)?.id === 'partners' && <div><dt>共同接单的取舍</dt><dd>个人报酬减半 · 保留团队机会</dd></div>}
     {!script.commission && isPujiangSystem(game) && <div><dt>成长保留</dt><dd>能力点 +1 · Lv.{systemLevel(game)}</dd></div>}
    </dl>
    {receipt.relationships.length > 0 && <section className="pj-relation-result"><h3>关系变化</h3>{receipt.relationships.map(t => <p key={t}>{t}</p>)}</section>}
    <p className="pj-next">{receipt.next}</p>
    <details className="pj-recap"><summary>回顾选择</summary>{view?.recent.map((t, i) => <p key={i}>{t}</p>)}</details>
    <button className="pj-primary" data-pj-done onClick={onDone}>回到街上 <span><Icon name="arrow" size={22}/></span></button>
   </> : <>
    <span className="pj-year-print" aria-hidden="true">{calendarYear(game)}</span>
    <div className="pj-topline"><span className="pj-index"><i aria-hidden="true"/>{series}{chapter > 0 && <> / <b>{String(chapter).padStart(2, '0')}</b></>}</span>
     <button type="button" className="pj-pause" aria-label="保存并回首页" onClick={onPause}><Icon name="save" size={14}/>存档离场</button></div>
    <h2 ref={heading} tabIndex={-1}>{script.title}</h2>
    {meeting && <details className="pj-aside"><summary>回想初见</summary><p className="pj-first-reply">{spokenText(meeting.then)}</p></details>}
    <p className="pj-prose">{script.teaser}</p>
    {episodeCarry(game, script).map(t => <p className="pj-carry" key={t}>{t}</p>)}
    <div className="pj-mission">
     <p className="pj-objective"><GameIcon name="mission" size={17}/>{script.goal}</p>
     <span><GameIcon name="action" size={16}/>{script.scenes.length} 回合{script.commission ? ' · 1 格行动' : ''}</span>
     {script.reward > 0 && <span className="pj-bounty"><GameIcon name="reward" size={16}/>最高 <b>{money(script.reward)}</b></span>}
    </div>
    {script.offline && <p className="pj-offline">今晚异能离线。</p>}
    {isPujiangSystem(game) && !script.offline && !script.commission && <AbilityLoadout game={game} onChange={onChange} onError={onError}/>}
    <button className="pj-primary" data-pj-start onClick={() => onStart(script.id)}>进入现场 <span><Icon name="arrow" size={22}/></span></button>
   </>}
  </div>
 </article>;

 // Coming back after using an ability skips the lines already read and returns to the question.
 const abilitiesHere = run.moves.slice(run.moves.map(move => move.kind).lastIndexOf('choice') + 1).some(move => move.kind === 'ability');
 const relationships = cinemaRelationships(game, script, view.relations, act);
 const feedback = view.recent.slice(view.stage).at(-1);
 const hud = <div className="vn-meters" aria-label="现场资源">
  <span>第 {act + 1}<small>/{script.scenes.length} 幕</small></span>
  <span>气势 <b key={'s' + view.score} className="vn-pop">{view.score}</b></span>
  <span>人心 <b key={'t' + view.team} className="vn-pop">{view.team}</b></span>
  <span>底牌 <b key={'b' + view.budget} className="vn-pop">{view.budget}</b></span>
 </div>;
 const tools: ReactNode = view.secret || view.abilities.length > 0 || feedback ? <>
  {view.secret && <p className="pj-secret" role="status"><b>识人</b>{view.secret}</p>}
  {feedback && !view.secret && <p className="pj-feedback" role="status">{feedback}</p>}
  {view.abilities.length > 0 && <div className="pj-powerbar" aria-label="本场能力">{view.abilities.map(a => <button key={a.id} data-ability={a.id} disabled={!!a.reason} onClick={() => { if (a.id === 'forecast' || a.id === 'resonate') setTargeting(targeting === a.id ? undefined : a.id); else onMove({ kind: 'ability', id: a.id }); }}><b>{a.name}</b><small>{a.reason ?? (targeting === a.id ? '取消选择' : a.id === 'forecast' ? '指定一个选择' : a.id === 'resonate' ? '安排协同行动' : '使用')}</small></button>)}</div>}
  {targeting === 'forecast' && <p className="pj-help" role="status">选择要推演的行动。</p>}
  {targeting === 'resonate' && <div className="pj-powerbar" aria-label="协同行动"><button data-pj-aid="team" onClick={() => useTarget('resonate', 'team')}><b>请伙伴留在现场补位</b><small>人心 +2 · 不消耗选择回合</small></button><button data-pj-aid="dispatch" onClick={() => useTarget('resonate', 'dispatch')}><b>请伙伴协调下一轮人手</b><small>人心 +1 · 底牌 +1</small></button></div>}
  <details className="pj-observation" key={script.id + act}><summary><span>查看</span><b>本场可借的力</b><span aria-hidden="true">＋</span></summary><p>{scene.support}</p></details>
  {relationships.length > 1 && <details className="pj-people"><summary>这场戏里的人 <span>{relationships.length} 位</span></summary><dl>{relationships.map(person => <div key={person.name}>
   <dt>{person.name}</dt><dd>{person.role}</dd>{person.trust !== undefined && <dd className="pj-trust">信任 {person.trust} {person.delta !== 0 && <em data-negative={person.delta < 0}>{person.delta > 0 ? '+' : ''}{person.delta}</em>}</dd>}
  </div>)}</dl></details>}
 </> : null;
 const choose = (id: string) => {
  const shown = choosing ? view.choices.find(item => item.id === id) : undefined;
  const luck = shown?.gamble ? rollLuck(game, script, act, id) : undefined;
  onMove({ kind: 'choice', id });
  if (id === STALL) return '被抢了话';
  if (luck === 'miss') return '没押中 · 底牌 −1';
  return luck === 'hit' ? `押中了 · ${shown?.gain ?? ''}` : shown?.gain;
 };
 return <DialogueStage key={script.id + '-' + act} beats={beats} startAt={choosing && abilitiesHere ? beats.length - 1 : 0} playerName={game.name}
  label={series + ' · ' + script.title} variant={script.route === 'system' ? 'system' : 'default'} hud={hud} tools={tools}
  live={choosing ? view.choices.map(toOption) : undefined} pressure={script.pressure} stall={scene.stall}
  predicting={targeting === 'forecast' ? id => useTarget('forecast', id) : undefined}
  onChoice={(_, id) => choose(id)} onEnd={() => setAct(view.stage)} onPause={onPause} audio={audio} onAudio={onAudio}/>;
}
