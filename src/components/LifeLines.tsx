import { useState } from 'react';
import { CAREERS, CAST } from '../game/content';
import { activeLine, lineName, MAX_LINES, type LifeBook } from '../game/lifeLines';
import Icon from './Icon';

export default function LifeLines({ book, onFork, onSwitch, onDrop }: {
  book: LifeBook; onFork: (index: number) => void; onSwitch: (id: number) => void; onDrop: (id: number) => void;
}) {
  const line = activeLine(book);
  const [deleting, setDeleting] = useState<number | null>(null);
  return <div className="life-lines">
    <div className="life-lines-heading">
      <span className="eyebrow">我的人生</span>
      <h2>时间线</h2>
    </div>
    <div className="life-line-grid">
      {book.lines.map(item => {
        const { state, id, from } = item;
        const job = CAREERS.find(job => job.id === state.jobId);
        const partner = CAST.find(person => person.id === state.partnerId);
        return <article key={id} className={id === line.id ? 'current' : ''}>
          <div className="life-line-name"><b>{lineName(id)}</b>{id === line.id && <span>正在走</span>}</div>
          <p>{state.age}岁 · ¥{state.cash.toLocaleString('zh-CN')}</p>
          <small>{job?.name || '待业'} · {partner ? '和'+partner.name+'在一起' : '单身'}</small>
          {from && <small>从{lineName(from.line)}的{from.age}岁岔出 · {from.title}</small>}
          {id !== line.id && <div className="life-line-actions">
            <button className="secondary" onClick={() => onSwitch(id)}>回到{lineName(id)} <Icon name="arrow" size={15}/></button>
            {id !== 0 && book.lines.length >= MAX_LINES && (deleting === id ? <>
              <button className="text-button" onClick={() => { onDrop(id); setDeleting(null); }}>确认删除</button>
              <button className="text-button" onClick={() => setDeleting(null)}>取消</button>
            </> : <button className="text-button" onClick={() => setDeleting(id)}>删掉{lineName(id)}</button>)}
          </div>}
        </article>;
      })}
    </div>
    <div className="life-line-points">
      <h3>{lineName(line.id)}的岔路</h3>
      {line.points.length === 0 && <p>做过剧情选择后，可以回来另走一条线。</p>}
      {book.lines.length >= MAX_LINES && <p>已存满八条时间线。删掉一条支线就能再开。</p>}
      <ol>
        {line.points.map((point, index) => ({ point, index })).reverse().map(({ point, index }) =>
          <li key={index}>
            <div><small>{point.before.age}岁</small><b>{point.title}</b><span>那时选了「{point.choice}」</span></div>
            <button className="secondary" disabled={book.lines.length >= MAX_LINES} onClick={() => onFork(index)}>
              从这里开分支 <Icon name="arrow" size={15}/>
            </button>
          </li>
        )}
      </ol>
    </div>
  </div>;
}
