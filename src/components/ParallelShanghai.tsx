import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { downloadBlob, makeStoryComparison, makeStoryPhoto } from '../game/share';
import { playSound } from '../game/audio';
import { storyComparisons, type StoryComparison } from '../game/timelineComparison';
import MusicCredit from './MusicCredit';
import {
  CITY_TIMELINES, isTicketHash, readTickets, removeTicket, saveTicket, ticketFromHash, ticketLink, timelineShot, validateTicket, walk,
  type Move, type Ticket, type Timeline, type Turn,
} from '../game/timelines';
import { PHOTO_SHOP_STORY } from '../game/photoShop';
import StoryReceiptCompare from './StoryReceiptCompare';
import Icon from './Icon';
import './parallel.css';

const featuredStories = [
 { id:'last-photo', tab:'照相馆', hook:'房东七点来收钥匙。拍条告别短片，能拿四千。', action:'替阿宝做个决定' },
 { id:'pearl-signal', tab:'江边来信', hook:'四块钱的柠檬水还没喝，五年后的你先发来了语音。', action:'去轮渡口' },
 { id:'last-train', tab:'末班车', hook:'明早要去张江报到，爸的手被缝鞋机压了。闸机三分钟后关。', action:'走到闸机前' },
 { id:'staff-bed', tab:'那张门卡', hook:'莘庄空出一张床。补贴要不要续，表决单送到了外滩。', action:'看看那张门卡' },
].map(story => ({ ...story, timeline: CITY_TIMELINES.find(timeline => timeline.id === story.id)! }));

const blankTurn = (): Turn => ({
  date: '', place: '', scene: '',
  options: [{ move: '', after: '', next: null }, { move: '', after: '', next: null }],
});

function Field({ label, value, limit, change, placeholder, multiline = false, optional = false }: {
  label: string; value: string; limit: number; change: (value: string) => void;
  placeholder?: string; multiline?: boolean; optional?: boolean;
}) {
  const props = {
    value, maxLength: limit, placeholder, required: !optional,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(event.target.value),
  };
  return <label className="parallel-field">
    <span>{label}</span>
    {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
  </label>;
}

function Editor({ kind, preset, onSave }: { kind: Timeline['kind']; preset?: Timeline; onSave: (ticket: Ticket) => void }) {
  const [draft, setDraft] = useState<Timeline>(() => preset ?? ({
    id: crypto.randomUUID(), kind, title: '', author: '',
    turns: [kind === 'question' ? { ...blankTurn(), options: [] } : blankTurn()], original: '',
  }));
  const [error, setError] = useState('');
  const update = (fields: Partial<Timeline>) => setDraft(previous => ({ ...previous, ...fields }));
  const updateTurn = (index: number, patch: Partial<Turn>) => setDraft(previous => ({
    ...previous, turns: previous.turns.map((turn, i) => i === index ? { ...turn, ...patch } : turn),
  }));
  function removeLast() {
    const length = draft.turns.length - 1;
    update({ turns: draft.turns.slice(0, length).map(turn => ({
      ...turn, options: turn.options.map(option => option.next === length ? { ...option, next: null } : option),
    })) });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const ticket = validateTicket({ version: 1, timeline: draft });
      onSave(ticket);
    } catch (problem) {
      setError((problem as Error).message);
    }
  }
  return <form className="parallel-editor" onSubmit={submit}>
    <span className="parallel-kicker">{kind === 'life' ? '写一段人生' : '空降现实题'}</span>
    <h1>{kind === 'life' ? '从哪天开始重来' : '换个人来出主意'}</h1>
    <div className="parallel-fields">
      <Field label="这段故事叫什么" value={draft.title} limit={28} change={title => update({ title })} placeholder="比如 · 房东说周五要答复" />
      <Field label="怎么称呼你" value={draft.author} limit={16} change={author => update({ author })} placeholder="用个化名就好" />
    </div>
    {draft.turns.map((turn, index) => <fieldset key={index} className="parallel-fieldset">
      <legend>第 {index + 1} 幕</legend>
      <div className="parallel-fields">
        <Field label="什么时候" value={turn.date} limit={28} change={date => updateTurn(index, { date })} placeholder="2024年 · 28岁" />
        <Field label="在哪儿" value={turn.place} limit={24} change={place => updateTurn(index, { place })} placeholder="比如 · 虹口合租房" />
      </div>
      <Field label="当时出了什么事" value={turn.scene} limit={220} change={scene => updateTurn(index, { scene })} multiline />
      {kind === 'question' && <button type="button" className="parallel-quiet" onClick={() => updateTurn(index, {
        options: turn.options.length ? [] : blankTurn().options,
      })}>{turn.options.length ? '只收对方自己的解法' : '给两种走法（选填）'}</button>}
      <div className="parallel-fields">
        {turn.options.map((option, choice) => {
          const change = (patch: Partial<Turn['options'][number]>) => updateTurn(index, {
            options: turn.options.map((item, i) => i === choice ? { ...item, ...patch } : item),
          });
          return <div className="parallel-option-fields" key={choice}>
            <Field label={choice === 0 ? '走法 A' : '走法 B'} value={option.move} limit={32} change={move => change({ move })} />
            <Field label={choice === 0 ? '走法 A 的后果' : '走法 B 的后果'} value={option.after} limit={160} change={after => change({ after })} multiline />
            {index < draft.turns.length - 1 && <label className="parallel-field">
              <span>{choice === 0 ? '走法 A 接到' : '走法 B 接到'}</span>
              <select value={option.next ?? ''} onChange={event => change({ next: event.target.value ? Number(event.target.value) : null })}>
                <option value="">在这里结尾</option>
                {draft.turns.slice(index + 1).map((_, offset) => <option key={offset} value={index + 1 + offset}>第 {index + 2 + offset} 幕</option>)}
              </select>
            </label>}
          </div>;
        })}
      </div>
    </fieldset>)}
    <div className="parallel-actions">
      {kind === 'life' && draft.turns.length < 5 && <button type="button" className="parallel-quiet" onClick={() => update({ turns: [...draft.turns, blankTurn()] })}>＋ 再加一幕</button>}
      {draft.turns.length > 1 && <button type="button" className="parallel-quiet" onClick={removeLast}>删掉最后一幕</button>}
    </div>
    <Field label="原来那条线后来怎样了（选填）" value={draft.original} limit={160} change={original => update({ original })} multiline placeholder="还在犹豫的话，可以留空" optional />
    {error && <p role="alert">{error}</p>}
    <button className="parallel-primary">存到票夹 <Icon name="arrow" size={18} /></button>
  </form>;
}

function TicketCard({ ticket, index, onClick, illustrated = false }: { ticket: Ticket; index: number; onClick: () => void; illustrated?: boolean }) {
  const { timeline, route } = ticket;
  const first = timeline.turns[0];
  const label = route?.length
    ? (walk(timeline, route).next === null ? '回执' : '进行中') + ' · ' + route.map(move => 'ABC'[move.pick]).join('·')
    : timeline.kind === 'life' ? '人生线' : '现实题';
  const cover = illustrated ? timelineShot(timeline, 0) : undefined;
  return <button className={'parallel-ticket' + (cover ? ' illustrated-ticket' : '')} onClick={onClick}>
    {cover && <img className="parallel-ticket-cover" src={cover} alt="" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />}
    <span className="parallel-ticket-copy">
    <span className="parallel-ticket-meta">
      <b>{String(index + 1).padStart(2, '0')}</b>
      {label}
      <Icon name="arrow" size={21} />
    </span>
    <strong>{timeline.title}</strong>
    <span>{first.date} · {first.place}</span>
    {illustrated && <span className="parallel-ticket-preview">{first.scene}</span>}
    {!illustrated && <small>{timeline.author}</small>}
    </span>
  </button>;
}

export default function ParallelShanghai({ onClose, hash, preset, audio, onAudio }: {
  onClose: () => void; hash: string; preset?: Timeline; audio: boolean; onAudio: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [entries, setEntries] = useState(readTickets);
  const [editing, setEditing] = useState<Timeline['kind'] | null>(preset?.kind ?? null);
  const [status, setStatus] = useState('');
  const [shareValue, setShareValue] = useState('');
  const [answering, setAnswering] = useState(false);
  const [answer, setAnswer] = useState('');
  const [printing, setPrinting] = useState(false);
  const [featured, setFeatured] = useState(0);
  const [usePreset, setUsePreset] = useState(Boolean(preset));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const screen = ticket ? 'ticket' : editing ? 'edit' : 'hub';
  const titleKey = ticket ? ticket.timeline.id + JSON.stringify(ticket.route ?? []) : screen;

  const open = useCallback((next: Ticket | null, audible = true) => {
    setTicket(next ? validateTicket(next) : null);
    setStatus('');
    setShareValue('');
    setAnswering(false);
    setAnswer('');
    if (audible) playSound('tap');
  }, []);

  const showHub = useCallback(() => {
    open(null, false);
    setEditing(null);
    setUsePreset(false);
  }, [open]);

  useEffect(() => {
    if (hash === '#parallel') {
      showHub();
      return;
    }
    if (!isTicketHash(hash)) return;
    try {
      open(ticketFromHash(hash), false);
    } catch {
      showHub();
      setStatus('这张票打不开，请让对方重新发一张');
    }
  }, [hash, open, showHub]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [titleKey]);

  function keep(next: Ticket, announce = true) {
    try {
      setEntries(saveTicket(next));
      if (announce) setStatus('收到票夹里了');
    } catch {
      setStatus('这台设备存不下了，先下载这张票吧');
    }
  }

  function rewind(index: number) {
    if (!ticket?.route?.length) return;
    const previous = ticket;
    open({ ...previous, route: ticket.route.slice(0, index) });
    keep(previous, false);
  }

  async function copy(next: Ticket) {
    const url = ticketLink(next);
    try {
      await navigator.clipboard.writeText(url);
      setShareValue('');
      setStatus(next.route?.length ? '回执链接已复制，发回给对方吧' : '邀请链接已复制，拿到链接的人可以来玩');
    } catch {
      setShareValue(url);
      setStatus('长按或选中下面这条链接复制');
    }
  }

  async function printPhoto(timeline: Timeline, choice: Turn['options'][number], path: string) {
    if (!choice.shot) return;
    setPrinting(true);
    try {
      const invite = ticketLink({ version: 1, timeline });
      const photo = await makeStoryPhoto(choice.shot, timeline.title, choice.move, invite);
      downloadBlob(photo, `${timeline.title}-${path}.png`);
    } catch {
      setStatus('这张照片没洗出来，等会儿再试');
    } finally {
      setPrinting(false);
    }
  }

  async function printComparison(timeline: Timeline, comparison: StoryComparison) {
    setPrinting(true);
    try {
      const invite = ticketLink({ version: 1, timeline });
      const photo = await makeStoryComparison(timeline.title, comparison, invite);
      downloadBlob(photo, `${timeline.title}-两条走法.png`);
    } catch {
      setStatus('对照图没存下来，等会儿再试');
    } finally {
      setPrinting(false);
    }
  }

  async function importTicket(file?: File) {
    if (!file) return;
    try {
      if (file.size > 20000) throw new Error();
      const next = validateTicket(JSON.parse(await file.text()));
      open(next);
      keep(next);
    } catch {
      setStatus('这张票读不出来，请选一张从平行上海下载的票');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function pick(move: Move) {
    if (!ticket) return;
    const next = { ...ticket, route: [...(ticket.route ?? []), move] };
    open(next);
    if (walk(next.timeline, next.route).next === null) keep(next, false);
    playSound('good');
  }

  let content: ReactNode;
  if (ticket) {
    const { timeline, route = [] } = ticket;
    const { steps, next } = walk(timeline, route);
    const current = next === null ? null : timeline.turns[next];
    const photo = next === null ? undefined : timelineShot(timeline, next);
    const last = steps.at(-1);
    const number = route.length + 1;
    const movePath = route.map(move => 'ABC'[move.pick]).join('·') || '起点';
    const comparisons = next === null ? storyComparisons(ticket, entries) : [];
    const siblings = entries.filter(entry => entry.timeline.id === timeline.id && entry.route?.length && JSON.stringify(entry.route) !== JSON.stringify(route));
    const saved = entries.some(entry => JSON.stringify(entry) === JSON.stringify(ticket));
    const map = <aside className="parallel-map">
        <span className="parallel-kicker">时间线 · {movePath}</span>
        <h2>{timeline.title}</h2>
        <ol>
          {steps.map(({ turn, option }, index) => <li key={index}>
            <small>{turn.date}</small>
            <b>{option.move}</b><button className="parallel-fork-link" onClick={() => rewind(index)}>从这里开分支</button>
          </li>)}
          {current && <li aria-current="step"><small>{current.date}</small><b>{current.place}</b></li>}
        </ol>
        {siblings.length > 0 && <div className="parallel-siblings">
          <span>其他时间线</span>
          {siblings.map((entry, index) => <button key={index} onClick={() => open(entry)}>
            {entry.route!.map(move => 'ABC'[move.pick]).join('·')} · {walk(entry.timeline, entry.route!).steps.at(-1)?.option.move}
          </button>)}
        </div>}
      </aside>;
    content = <div className="parallel-layout">
      <div className="parallel-stage">
        <span className="parallel-kicker">{timeline.kind === 'life' ? '人生线' : '现实题'} ／ {timeline.author}</span>
        {current ? <>
          {last && <p className="parallel-previous" aria-live="polite">{last.option.after}</p>}
          <div className="parallel-scene" key={next}>
            <span className="parallel-stamp">{current.date}</span>
            <h1 ref={titleRef} tabIndex={-1}>{current.place}</h1>
            {photo && <img className="parallel-scene-photo" src={photo} alt="" decoding="async" />}
            <p>{current.scene}</p>
          </div>
          <div className="parallel-choices">
            {current.options.map((option, index) => <button key={index} onClick={() => pick({ pick: index })}>
              <b>{'AB'[index]}</b><span>{option.move}</span><Icon name="arrow" size={18} />
            </button>)}
          </div>
          {(answering || !current.options.length) ? <form className="parallel-answer" onSubmit={event => {
            event.preventDefault();
            if (answer.trim()) pick({ pick: 2, note: answer.trim() });
          }}>
            <Field label="换你会怎么做" value={answer} limit={160} change={setAnswer} multiline />
            <button className="parallel-primary" disabled={!answer.trim()}>写进回执 <Icon name="arrow" size={18} /></button>
          </form> : <button className="parallel-quiet" onClick={() => setAnswering(true)}>我有个别的办法</button>}
        </> : <>
          <div className="parallel-ending-head">
            <h1 ref={titleRef} tabIndex={-1}>{last?.option.shot ? '照片洗出来了' : '这条线走到了这儿'}</h1>
            {last?.option.shot && <button className="parallel-quiet" disabled={printing} onClick={() => void printPhoto(timeline, last.option, movePath)}>
              {printing ? '正在洗照片' : '洗一张带走'} <Icon name="download" size={17} />
            </button>}
          </div>
          {comparisons.length ? <StoryReceiptCompare key={titleKey} options={comparisons} printing={printing} endingPhoto={last?.option.shot}
            onPrint={comparison => void printComparison(timeline, comparison)} />
            : last?.option.shot && <img className="parallel-ending-photo" src={last.option.shot} alt="" decoding="async" />}
          <div className="parallel-results">
            <article><span className="parallel-stamp">这回的走法 · {movePath}</span>
              {steps.map(({ option, turn }, index) => <section key={index}>
                <small>{turn.date}</small><h3>{option.move}</h3><p>{option.after}</p>
              </section>)}
            </article>
            <article><span className="parallel-stamp">原来的那条线</span>
              <p>{timeline.original || '这道题还没写下原来的结局。'}</p>
            </article>
          </div>
          <div className="parallel-actions">
            <button className="parallel-primary" onClick={() => copy(ticket)}>复制回执链接 <Icon name="share" size={17} /></button>
            <button className="parallel-quiet" onClick={() => rewind(0)}>从头再走一次</button>
          </div>
        </>}
        <div className="parallel-tools">
          {current && <button className="parallel-quiet" onClick={() => copy({ version: 1, timeline })}>复制邀请链接</button>}
          <button className="parallel-quiet" onClick={() => downloadBlob(new Blob([JSON.stringify(ticket)], { type: 'application/json' }), '平行上海.json')}>下载这张票</button>
          {!saved && <button className="parallel-quiet" onClick={() => keep(ticket)}>收进票夹</button>}
          {saved && <button className="parallel-quiet" onClick={() => {
            try { setEntries(removeTicket(ticket)); setStatus('已从票夹取出'); }
            catch { setStatus('这台设备的票夹暂时改不了'); }
          }}>从票夹取出</button>}
        </div>
        {current && number > 1 && <button className="parallel-quiet" onClick={() => rewind(route.length - 1)}>← 从上一幕开分支</button>}
      </div>
      {map}
    </div>;
  } else if (editing) {
    content = <Editor key={editing} kind={editing} preset={usePreset ? preset : undefined} onSave={next => { setEditing(null); open(next); keep(next); }} />;
  } else {
    const selection = featuredStories[featured];
    content = <>
      <div className="parallel-hero" data-feature={selection.id}>
        <img key={selection.id} src={timelineShot(selection.timeline, 0)} alt="" fetchPriority="high" />
        <div className="parallel-hero-copy">
          <h1 ref={titleRef} tabIndex={-1}>重走别人的人生</h1>
          <h2>{selection.timeline.title}</h2>
          <p>{selection.hook}</p>
          <button className="parallel-primary" onClick={() => open({ version: 1, timeline: selection.timeline })}>{selection.action} <Icon name="arrow" size={18} /></button>
        </div>
      </div>
      <div className="parallel-reel" role="group" aria-label="精选故事">
        {featuredStories.map((story, index) => <button key={story.id} type="button" aria-pressed={index === featured}
          onClick={() => { setFeatured(index); playSound('tap'); }}>
          <img src={timelineShot(story.timeline, 0)} alt="" width={1320} height={880} decoding="async"/>
          <span><small>{String(index + 1).padStart(2, '0')}</small>{story.tab}</span>
        </button>)}
      </div>
      <section className="parallel-shelf">
        <div className="parallel-shelf-head">
          <h2 id="guest-stories" tabIndex={-1}>今晚的车次</h2>
          <div className="parallel-actions">
            <button className="parallel-quiet" onClick={() => setEditing('life')}>写一段人生 <Icon name="arrow" size={18} /></button>
            <button className="parallel-quiet" onClick={() => setEditing('question')}>空降现实题 <Icon name="bolt" size={17} /></button>
          </div>
        </div>
        <div className="parallel-grid parallel-catalog">{CITY_TIMELINES.filter(timeline => timeline !== PHOTO_SHOP_STORY).map((timeline, index) =>
          <TicketCard key={timeline.id} ticket={{ version: 1, timeline }} index={index} illustrated onClick={() => open({ version: 1, timeline })} />
        )}</div>
      </section>
      <section className="parallel-shelf">
        <div className="parallel-shelf-head"><h2>我的票夹</h2><button className="parallel-quiet" onClick={() => fileRef.current?.click()}>导入车票 <Icon name="download" size={16} /></button></div>
        {entries.length > 0 ? <div className="parallel-grid">{entries.map((entry, index) =>
          <TicketCard key={index} ticket={entry} index={index} onClick={() => open(entry)} />
        )}</div> : <p className="parallel-empty">写过的故事和走完的路线会留在这里</p>}
      </section>
    </>;
  }

  return <main className="parallel">
    <div className="parallel-bar">
      <button className="parallel-quiet" onClick={onClose}>← 回魔都</button>
      <div className="parallel-actions">{screen !== 'hub' && <button className="parallel-quiet" onClick={() => {
        showHub();
        playSound('tap');
        if (isTicketHash(window.location.hash)) window.location.hash = 'parallel';
      }}>回故事列表</button>}
      <button className="parallel-quiet" onClick={onAudio} aria-label={audio?'关闭声音':'打开声音'}><Icon name={audio?'sound':'mute'} size={17}/></button></div>
    </div>
    <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={event => importTicket(event.target.files?.[0])} />
    {content}
    {status && <div className="parallel-status" role="status">{status}</div>}
    {shareValue && <input className="parallel-link" aria-label="分享链接" value={shareValue} readOnly onFocus={event => event.target.select()} />}
    <footer className="parallel-music"><MusicCredit/></footer>
  </main>;
}
