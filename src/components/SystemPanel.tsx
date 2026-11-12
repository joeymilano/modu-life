import { systemLead, systemPoints, systemRedemption } from '../game/systemStory';
import type { GameState, LifeEvent } from '../game/types';
import Icon from './Icon';

export default function SystemPanel({game,onVisit}: {game: GameState; onVisit: (event: LifeEvent) => void}) {
 const task = systemLead(game);
 const redemption = systemRedemption(game);
 const points = systemPoints(game);
 return <section className="campaign-panel system-panel">
  <header><span>任务终端</span><h2>系统</h2></header>
  <div className="system-wallet"><span>可用点数</span><strong>{points}</strong></div>
  {task&&<button type="button" className="primary" onClick={()=>onVisit(task.event)}>{task.message}<Icon name="arrow" size={16}/></button>}
  {redemption&&<div className="campaign-advance"><button type="button" className="secondary" onClick={()=>onVisit(redemption)}>兑换点数<Icon name="arrow" size={16}/></button></div>}
  {!game.flags.includes('laser_master')&&<p>外滩 · 四元柠檬水挑战无失误通关 +1 点</p>}
 </section>;
}
