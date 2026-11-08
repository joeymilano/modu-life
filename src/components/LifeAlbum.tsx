import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { LIFE_ALBUM_AGES } from '../game/art';
import type { GameState } from '../game/types';
import Icon from './Icon';
import { PlayerPortrait } from './Portrait';

type AlbumAge = (typeof LIFE_ALBUM_AGES)[number];

function LifePhotoViewer({dialog, game, age, label, showPhoto = true, children}: {
 dialog: RefObject<HTMLDialogElement | null>; game: GameState; age: number;
 label: string; showPhoto?: boolean; children?: ReactNode;
}) {
 return <dialog className="album-dialog" ref={dialog} aria-label={label}
  onKeyDown={event => {if (event.key === 'Escape') event.stopPropagation();}}>
  <div className="album-lightbox">
   <header><h2>{game.name} · {age} 岁</h2>
    <button type="button" className="icon-button" autoFocus aria-label={'关闭' + label} onClick={() => dialog.current?.close()}><Icon name="close"/></button>
   </header>
   {showPhoto && <PlayerPortrait appearance={game.appearance} age={age} full/>}
   {children}
  </div>
 </dialog>;
}

export function PlayerSnapshot({game}: {game: GameState}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [seen, setSeen] = useState(false);
 return <>
  <button type="button" className="player-photo-trigger" aria-label="看现在的照片" aria-haspopup="dialog"
   onClick={() => {setSeen(true); dialog.current?.showModal();}}>
   <PlayerPortrait appearance={game.appearance} age={game.age} size={49}/>
   <Icon name="eye" size={12}/>
  </button>
  <LifePhotoViewer dialog={dialog} game={game} age={game.age} label="照片" showPhoto={seen}/>
 </>;
}

export default function LifeAlbum({game}: {game: GameState}) {
 const [selected, setSelected] = useState<AlbumAge>(18);
 const dialog = useRef<HTMLDialogElement>(null);
 function open(age: AlbumAge) {
  setSelected(age);
  dialog.current?.showModal();
 }
 return <>
  <div className="ending-portraits">
   {LIFE_ALBUM_AGES.map(age => <button type="button" key={age} onClick={() => open(age)} aria-label={'看' + age + '岁的照片'}>
    <PlayerPortrait appearance={game.appearance} age={age} full/>
    <span className="album-thumbnail-caption">{age} 岁 <Icon name="eye" size={16}/></span>
   </button>)}
  </div>
  <LifePhotoViewer dialog={dialog} game={game} age={selected} label="人生相册">
    <div className="album-lightbox-tabs" role="group" aria-label="照片年龄">
     {LIFE_ALBUM_AGES.map(age => <button type="button" key={age} aria-pressed={selected===age} onClick={() => setSelected(age)}>{age} 岁</button>)}
    </div>
  </LifePhotoViewer>
 </>;
}
