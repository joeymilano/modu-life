import { useState, type ReactNode } from 'react';
import type { EventChoice } from '../game/types';
import Icon from './Icon';

export default function FirstNightChoices({clue, choices, render}: {
 clue?: {label: string; text: string}; choices: EventChoice[];
 render: (choice: EventChoice, index: number) => ReactNode;
}) {
 const [inspected, setInspected] = useState(false);
 return <>
  {clue && <div className="night-clue">
   <button className="text-button" aria-expanded={inspected} aria-controls="night-clue-text"
    onClick={() => setInspected(open => !open)}>
    <Icon name="eye" size={17}/>{clue.label}<Icon name="chevron" size={14}/>
   </button>
   <p id="night-clue-text" hidden={!inspected}>{clue.text}</p>
  </div>}
  <div className="event-choices">{choices.map((choice, index) =>
   clue && choice.id === '3' && !inspected ? null : render(choice, index)
  )}</div>
 </>;
}
