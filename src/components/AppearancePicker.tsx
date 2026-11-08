import { lazy, Suspense, useState, type ReactNode } from 'react';
import type { PlayerAppearance } from '../game/types';
import { LOOKS, playerArt } from '../game/art';
import { PlayerPortrait } from './Portrait';
import Icon from './Icon';

const ModelPreview = lazy(() => import('./OwlPreview').then(module => ({default: module.ModelPreview})));

export default function AppearancePicker({value, onChange, children}: {
 value: PlayerAppearance; onChange: (value: PlayerAppearance) => void; children: ReactNode;
}) {
 const [preview, setPreview] = useState(false);
 const canPreview = value.gender === 'female' && value.looks === 'stunning';
 const selected = LOOKS.find(look => look.id === value.looks)!;
 function pick(next: PlayerAppearance) {
  setPreview(false);
  onChange(next);
 }
 return <section className="casting-room" aria-label="选择人物形象">
  <div className="casting-view">
   {canPreview && preview ? <div className="player-model-preview casting-model-view">
    <Suspense fallback={<p>转台准备中</p>}><ModelPreview slot="player-female-stunning" rotationY={-Math.PI / 2}
     label="绿裙角色三维模型，可以拖动旋转"/></Suspense>
   </div> : <div className="casting-photo" key={value.gender + value.looks}>
    <PlayerPortrait appearance={value} full/>
   </div>}
   <div className="casting-plate" aria-live="polite">
    <strong>{selected.name}</strong>
    <span>{selected.face ? `腔势 +${selected.face} · 初见好感 +${selected.attraction}` : '无外貌加成'}</span>
   </div>
   {canPreview && <button className="casting-model" aria-expanded={preview} onClick={() => setPreview(open => !open)}>
    <Icon name="eye" size={16}/>{preview ? '收起 3D' : '看看 3D 形象'}
   </button>}
  </div>
  <div className="casting-panel">
   <div className="casting-toolbar">
    <h2>长相</h2>
    <div className="gender-picker" role="group" aria-label="选择性别">
     {(['female','male'] as const).map(gender => <button key={gender} aria-pressed={value.gender === gender}
      onClick={() => pick({...value, gender})}>{gender === 'female' ? '女性' : '男性'}</button>)}
    </div>
   </div>
   <div className="casting-options" role="group" aria-label="选择颜值">
    {LOOKS.map(look => <button key={look.id} className="casting-option" aria-pressed={value.looks === look.id}
     aria-label={'颜值 ' + look.name} onClick={() => pick({...value, looks: look.id})}>
     <img src={playerArt({gender: value.gender, looks: look.id}, false)} alt="" width={240} height={240} decoding="async"/>
     <span>{look.name}</span>
    </button>)}
   </div>
   {children}
  </div>
 </section>;
}
