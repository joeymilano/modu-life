import { RELOCATION_CAP, relocationBudget } from '../game/relocation';
import type { GameState, LifeEvent } from '../game/types';
import './relocation.css';

const yuan = (amount: number) => '¥'+amount.toLocaleString('zh-CN');

export default function RelocationPapers({game,event}: {game: GameState; event: LifeEvent}) {
 if (event.id==='life-start-move-worker-opening') return <aside className="relocation-paper" aria-label="搬仓排班单">
  <header><b>莘庄收货组</b><span>班车试跑</span></header>
  <dl>
   <div><dt>六点二十</dt><dd>老门口发车 · 松江新库</dd></div>
   <div><dt>留三个月</dt><dd>莘庄旧库 · 就近收货</dd></div>
   <div><dt>盘三天</dt><dd>原库结工钱 · 不换工作</dd></div>
  </dl>
 </aside>;
 if (event.speakerId!=='father') return null;
 const balance=relocationBudget(game)?.remaining??RELOCATION_CAP;
 return <aside className="relocation-paper relocation-company" aria-label="公司搬仓预算">
  <header><b>公司搬仓预算</b><span>公司账</span></header>
  <dl>
   <div><dt>总额</dt><dd>{yuan(RELOCATION_CAP)}</dd></div>
   <div><dt>已用</dt><dd>{yuan(RELOCATION_CAP-balance)}</dd></div>
   <div><dt>还剩</dt><dd>{yuan(balance)}</dd></div>
  </dl>
  <div className="relocation-meter" aria-hidden="true"><i style={{width:(RELOCATION_CAP-balance)/RELOCATION_CAP*100+'%'}}/></div>
 </aside>;
}
