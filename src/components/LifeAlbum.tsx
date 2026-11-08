import { useRef, useState } from 'react';
import { LIFE_ALBUM_AGES } from '../game/art';
import type { GameState } from '../game/types';
import Icon from './Icon';
import { PlayerPortrait } from './Portrait';

type AlbumAge = (typeof LIFE_ALBUM_AGES)[number];

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
  <dialog className="album-dialog" ref={dialog} aria-label="人生相册">
   <div className="album-lightbox">
    <header><h2>{game.name} · {selected} 岁</h2>
     <button type="button" className="icon-button" autoFocus aria-label="关闭相册" onClick={() => dialog.current?.close()}><Icon name="close"/></button>
    </header>
    <PlayerPortrait appearance={game.appearance} age={selected} full/>
    <div className="album-lightbox-tabs" role="group" aria-label="照片年龄">
     {LIFE_ALBUM_AGES.map(age => <button type="button" key={age} aria-pressed={selected===age} onClick={() => setSelected(age)}>{age} 岁</button>)}
    </div>
   </div>
  </dialog>
 </>;
}
