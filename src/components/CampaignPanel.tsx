import { DISTRICTS } from '../game/content';
import { campaignLead, campaignProgress } from '../game/lifeCampaign';
import type { GameState, LifeEvent } from '../game/types';
import Icon from './Icon';

export default function CampaignPanel({game,onVisit,onAdvance}: {
 game: GameState; onVisit: (event: LifeEvent) => void; onAdvance: () => void;
}) {
 const {name,timeline,current,status} = campaignProgress(game);
 const prep = campaignLead(game);
 return <section className="campaign-panel">
  <header><span>主线</span><h2>{name}</h2></header>
  <ol>{timeline.map(chapter=>{
   const district = DISTRICTS.find(place=>place.id===chapter.district)?.name;
   return <li key={chapter.id} aria-current={chapter.id===current?.id?'step':undefined}>
    <span>{chapter.age} 岁</span><div><b>{chapter.title}</b><small>{chapter.decision??district}</small></div>
    {chapter.decision&&<Icon name="check" size={17}/>}
   </li>;
  })}</ol>
  {status&&(status.proof||status.people)&&<p>{[status.proof&&'可出示原件',status.people&&'可请证人作证'].filter(Boolean).join(' · ')}</p>}
  {prep&&<button type="button" className="primary" onClick={()=>onVisit(prep.event)}>{prep.message}<Icon name="arrow" size={16}/></button>}
  {!game.ended&&!game.pendingYearEvent&&<div className="campaign-advance">
   <button type="button" className="secondary" onClick={onAdvance}>快进到下一场<Icon name="arrow" size={16}/></button>
   <small>跳过普通来信，照常结算各年账单。</small>
  </div>}
 </section>;
}
