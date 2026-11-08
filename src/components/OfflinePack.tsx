import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import './offline-pack.css';

type PackStatus = {
 phase: 'checking' | 'idle' | 'downloading' | 'ready' | 'retry' | 'unavailable';
 done: number;
 total: number;
 bytes: number;
};

const initial: PackStatus = {phase: 'checking', done: 0, total: 0, bytes: 0};
const supported = import.meta.env.PROD && 'serviceWorker' in navigator;

function contactWorker(command: 'status' | 'download', receive: (status: PackStatus) => void) {
 const channel = new MessageChannel();
 let closed = false;
 const unavailable = () => receive({...initial, phase: 'unavailable'});
 const timer = window.setTimeout(() => { closed = true; channel.port1.close(); unavailable(); }, 8000);
 channel.port1.onmessage = event => {
  window.clearTimeout(timer);
  receive(event.data as PackStatus);
 };
 void navigator.serviceWorker.ready.then(registration => {
  if (!closed) registration.active?.postMessage({moduOffline: command}, [channel.port2]);
 }).catch(() => {
  if (!closed) {
   window.clearTimeout(timer);
   unavailable();
  }
 });
 return () => {
  closed = true;
  window.clearTimeout(timer);
  channel.port1.close();
 };
}

export default function OfflinePack() {
 const [pack, setPack] = useState(initial);
 const disconnect = useRef<() => void>(undefined);
 function request(command: 'status' | 'download') {
  disconnect.current?.();
  setPack(current => ({...current, phase: command === 'status' ? 'checking' : 'downloading'}));
  disconnect.current = contactWorker(command, setPack);
 }
 useEffect(() => {
  if (!supported) return;
  disconnect.current = contactWorker('status', setPack);
  return () => disconnect.current?.();
 }, []);
 if (!supported) return null;

 const percent = pack.total ? Math.floor(pack.done / pack.total * 100) : 0;
 const message = {
  checking: '正在检查已下载内容',
  idle: pack.bytes ? `完整包约 ${Math.ceil(pack.bytes / 1_000_000)} MB，含剧照、3D 地图和音乐` : '含剧照、3D 地图和音乐',
  downloading: `正在备好离线包 · ${percent}%`,
  ready: '已下载，可以断网继续玩',
  retry: '下载中断，已下载的内容留着',
  unavailable: '离线缓存暂未就绪',
 }[pack.phase];

 return <section className="offline-pack" aria-label="离线包">
  <div><h3><Icon name={pack.phase === 'ready' ? 'check' : 'download'} size={17}/>离线包</h3>
   <p role="status" aria-live="polite">{message}</p>
  </div>
  {pack.phase === 'downloading' && <progress aria-label="离线包下载进度" max={100} value={percent}/>}
  {(pack.phase === 'idle' || pack.phase === 'retry') && <button type="button" className="secondary small" onClick={() => request('download')}>
   {pack.phase === 'retry' ? '继续下载' : '下载离线包'}
  </button>}
  {pack.phase === 'unavailable' && <button type="button" className="secondary small" onClick={() => request('status')}>再检查</button>}
 </section>;
}
