import type { PlayerAppearance } from '../game/types';
import { LOOKS } from '../game/art';
import { PlayerPortrait } from './Portrait';
import Icon from './Icon';

export default function AppearancePicker({value,onChange}:{value:PlayerAppearance;onChange:(value:PlayerAppearance)=>void}){
 const selected=LOOKS.find(l=>l.id===value.looks)!;
 return <section className="appearance-picker" aria-label="选择人物形象">
  <div className="appearance-heading"><div><h2>选个长相</h2></div><div className="gender-picker" role="group" aria-label="选择性别">{(['female','male'] as const).map(g=><button key={g} aria-pressed={value.gender===g} onClick={()=>onChange({...value,gender:g})}>{g==='female'?'女性':'男性'}</button>)}</div></div>
  <div className="looks-options">{LOOKS.map((l,i)=><button key={l.id} className={'look-option '+(value.looks===l.id?'selected':'')} aria-pressed={value.looks===l.id} aria-label={'颜值 '+l.name} onClick={()=>onChange({...value,looks:l.id})}>
   <PlayerPortrait appearance={{gender:value.gender,looks:l.id}} full/>
   <span className="look-number">0{i+1}</span><span className="look-check"><Icon name="check" size={17}/></span>
   <div className="look-caption"><h3>{l.name}</h3></div>
  </button>)}</div>
  <div className="appearance-note"><p>{selected.face?`开局腔势 +${selected.face} · 初见好感 +${selected.attraction}`:'无外貌加成'}</p></div>
 </section>;
}
