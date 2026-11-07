import { lazy, Suspense, useState } from 'react';
import type { PlayerAppearance } from '../game/types';
import { LOOKS } from '../game/art';
import { PlayerPortrait } from './Portrait';
import Icon from './Icon';

const ModelPreview=lazy(()=>import('./OwlPreview').then(module=>({default:module.ModelPreview})));

export default function AppearancePicker({value,onChange}:{value:PlayerAppearance;onChange:(value:PlayerAppearance)=>void}){
 const [preview,setPreview]=useState(false);
 const canPreview=value.gender==='female'&&value.looks==='stunning';
 const selected=LOOKS.find(l=>l.id===value.looks)!;
 return <section className="appearance-picker" aria-label="选择人物形象">
  <div className="appearance-heading"><div><h2>选个长相</h2></div><div className="gender-picker" role="group" aria-label="选择性别">{(['female','male'] as const).map(g=><button key={g} aria-pressed={value.gender===g} onClick={()=>onChange({...value,gender:g})}>{g==='female'?'女性':'男性'}</button>)}</div></div>
  <div className="looks-options">{LOOKS.map(l=><button key={l.id} className={'look-option '+(value.looks===l.id?'selected':'')} aria-pressed={value.looks===l.id} aria-label={'颜值 '+l.name} onClick={()=>onChange({...value,looks:l.id})}>
   <PlayerPortrait appearance={{gender:value.gender,looks:l.id}} full/>
   <span className="look-check" aria-hidden="true"><Icon name="check" size={17}/></span>
   <div className="look-caption"><h3>{l.name}</h3></div>
  </button>)}</div>
  <div className="appearance-note">{canPreview&&<button className="secondary" aria-expanded={preview} onClick={()=>setPreview(open=>!open)}>{preview?'收起 3D':'看看 3D 形象'}</button>}<p>{selected.face?`开局腔势 +${selected.face} · 初见好感 +${selected.attraction}`:'无外貌加成'}</p></div>
  {canPreview&&preview&&<div className="player-model-preview"><Suspense fallback={<p>转台准备中</p>}><ModelPreview slot="player-female-stunning" rotationY={-Math.PI/2} label="绿裙角色三维模型，可以拖动旋转" /></Suspense></div>}
 </section>;
}
