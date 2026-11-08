import { useState, type ReactNode } from 'react';
import type { EventChoice } from '../game/types';
import Icon from './Icon';
import './paper-trace.css';

export default function SceneChoices({clue, choices, render}: {
 clue?: {label: string; text: string; choiceId: string; photo?: {src: string; alt: string}; papers?: readonly {label:string; value:string}[]}; choices: EventChoice[];
 render: (choice: EventChoice, index: number) => ReactNode;
}) {
 const [inspected, setInspected] = useState(false);
 const [documentIndex,setDocumentIndex] = useState(0);
 const paperShown = clue?.papers?.[documentIndex];
 const discovery = clue ? choices.find(choice => choice.id === clue.choiceId) : undefined;
 return <>
  {clue?.papers && paperShown ? <div className="paper-trace">
   <div className="paper-trace-tabs" role="group" aria-label={clue.label}>
    {clue.papers.map((paper,index)=><button key={paper.label} type="button" aria-pressed={index===documentIndex}
     onClick={()=>{setDocumentIndex(index);if(index===1)setInspected(true);}}>{paper.label}</button>)}
   </div>
   <blockquote data-forwarded={documentIndex===1}><span>{paperShown.label}</span><p>{paperShown.value}</p></blockquote>
   <p className="paper-trace-note" aria-live="polite">{inspected?clue.text:'看一眼群里那张，哪一行变了？'}</p>
  </div> : clue && <div className="night-clue">
   <button className="text-button" aria-expanded={inspected} aria-controls="night-clue-text"
    onClick={() => setInspected(open => !open)}>
    <Icon name="eye" size={17}/>{clue.label}<Icon name="chevron" size={14}/>
   </button>
   {clue.photo ? <div id="night-clue-text" className="scene-clue-photo" hidden={!inspected}>
    {inspected && <img src={clue.photo.src} alt={clue.photo.alt} decoding="async"/>}
    <p>{clue.text}</p>
   </div> : <p id="night-clue-text" hidden={!inspected}>{clue.text}</p>}
  </div>}
  <div className="event-choices">
   {inspected && discovery && render(discovery, choices.indexOf(discovery))}
   {choices.map((choice, index) => choice === discovery ? null : render(choice, index))}
  </div>
 </>;
}
