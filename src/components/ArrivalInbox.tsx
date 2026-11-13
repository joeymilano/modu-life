import { useState, type Ref } from 'react';
import { CAST, DISTRICTS } from '../game/content';
import { firstNightThread } from '../game/firstNight';
import { arrivalPhoto, streetPhoto } from '../game/art';
import type { LifeEvent, PlayerAppearance } from '../game/types';
import Icon from './Icon';
import { Portrait } from './Portrait';
import './first-night.css';

export default function ArrivalInbox({event, appearance, heading, onReply, nineties}: {
 event: LifeEvent; nineties?:boolean; appearance: PlayerAppearance; heading: Ref<HTMLHeadingElement>; onReply: (id: string) => void;
}) {
 const firstReply = event.objective ? event.choices[0]?.id : undefined;
 const [current, setCurrent] = useState(firstReply);
 const [read, setRead] = useState<string[]>(firstReply?[firstReply]:[]);
 const [stationView, setStationView] = useState(true);
 const messages = event.choices.flatMap(choice => {
  const sender = CAST.find(person => person.id === choice.senderId);
  const thread = sender && firstNightThread(sender.id,Boolean(event.objective),nineties);
  return sender && thread ? [{ choice, sender, thread }] : [];
 });
 const active = messages.find(item => item.choice.id === current);
 const attachment = stationView ? undefined : active;
 const photo = attachment?.thread.photo ?? (nineties?event.illustration:undefined) ?? arrivalPhoto(appearance);
 return <>
  <div className="event-visual event-photo arrival-snapshot" data-station={!attachment}>
   <img key={photo} src={photo} alt={attachment?.thread.alt ?? (nineties?'1992 年，提着行李走出上海站':'你拖着箱子站在上海南站出口，看手机里的消息')}
    onError={attachment ? undefined : event => {
     const image = event.currentTarget;
     const fallback = streetPhoto('first-night-arrival');
     if (image.getAttribute('src') !== fallback) {
      image.src = fallback;
      image.alt = nineties?'上海站出站口':'上海南站出口，行李箱的轮子卡住了';
     }
    }}/>
   <div className="arrival-photo-footer">
    <span className="snapshot-credit">{attachment ? attachment.sender.name + '发来的照片' : nineties?'上海站 · 1992':'上海南站 · 出站口'}</span>
    {active && <button type="button" onClick={() => setStationView(value => !value)}>
     <Icon name="eye" size={14}/>{attachment ? '回看车站' : '看消息照片'}
    </button>}
   </div>
  </div>
  <div className="event-content arrival-desk">
   <header>
    <div className="arrival-kicker"><span aria-live="polite">{messages.length - read.length} 条未读</span></div>
    <h2 ref={heading} tabIndex={-1}>{event.title}</h2>
    <p>{event.text}</p>
    {event.objective&&<div className="scene-objective"><Icon name="map" size={15}/><b>{event.objective}</b></div>}
   </header>
   <div className="arrival-inbox" role="group" aria-label="收到的消息">
    {messages.map(({choice, sender, thread}) => {
     const open = current === choice.id;
     const unread = !read.includes(choice.id);
     const district = DISTRICTS.find(place => place.id === thread.district)?.name;
     return <button type="button" key={choice.id} className="arrival-contact" aria-pressed={open}
      aria-label={'看' + sender.name + '的消息'} onClick={() => {
       setCurrent(choice.id);
       setStationView(false);
       setRead(items => items.includes(choice.id) ? items : [...items, choice.id]);
      }}>
      <Portrait person={sender} size={40} decorative/>
      <span><b>{sender.name}</b><small>{district}</small></span>
      {unread && <i aria-hidden="true"/>}
     </button>;
    })}
   </div>
   {active ? <div className="arrival-thread" key={active.choice.id} role="region" aria-label={active.sender.name + '的消息'}>
    <p>{active.choice.hint}</p><p>{active.thread.note}</p>
    <div className="event-choices">
     <button type="button" className="primary arrival-send" onClick={() => onReply(active.choice.id)}>
      {active.choice.label} <Icon name="arrow" size={17}/>
     </button>
    </div>
   </div> : null}
  </div>
 </>;
}
