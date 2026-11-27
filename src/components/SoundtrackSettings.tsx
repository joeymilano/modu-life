import Icon from './Icon';
import type { useSoundtrack } from './useSoundtrack';

export default function SoundtrackSettings({ soundtrack }: { soundtrack: ReturnType<typeof useSoundtrack> }) {
  const { audio, toggleAudio, track, station, nextTrack } = soundtrack;
  return <section className="soundtrack-settings" aria-label="背景音乐">
    <button className="icon-button" type="button" aria-label={audio ? '关闭声音' : '打开声音'} onClick={toggleAudio}>
      <Icon name={audio ? 'sound' : 'mute'} size={19}/>
    </button>
    <div>
      <small>{audio ? `${station.freq} · ${station.name}` : '声音已关闭'}</small>
      <b aria-live="polite">{track.title}</b>
    </div>
    <button className="text-button" type="button" onClick={nextTrack}>下一首 <Icon name="chevron" size={15}/></button>
  </section>;
}
