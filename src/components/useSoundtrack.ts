import { useEffect, useRef, useState } from 'react';
import { setAudioEnabled, setMusicTrack } from '../game/audio';
import { MODU_STATIONS, stationForTrack, type SongKey } from '../game/moduRadio';
import { PLAYLISTS, SOUNDTRACK, type MusicScene } from '../game/soundtrack';

const AUDIO_KEY = 'modu-life-audio';

function audioPreference() {
  try { return localStorage.getItem(AUDIO_KEY) !== 'off'; }
  catch { return true; }
}

export function useSoundtrack(scene: MusicScene) {
  const [audio, setAudio] = useState(audioPreference);
  const audioEnabled = useRef(audio);
  audioEnabled.current = audio;
  const [selection, setSelection] = useState({ scene, index: 0 });
  const [manualStation, setManualStation] = useState<SongKey | null>(null);
  const playlist = PLAYLISTS[scene];
  const index = selection.scene === scene ? selection.index : 0;
  const activeKey: SongKey = manualStation ?? playlist[index];
  const track = SOUNDTRACK[activeKey];
  const station = stationForTrack(track.file);

  function nextTrack() {
    if (manualStation) {
      const at = MODU_STATIONS.findIndex(item => item.key === manualStation);
      setManualStation(MODU_STATIONS[(at + 1) % MODU_STATIONS.length].key);
      return;
    }
    setSelection({ scene, index: (index + 1) % playlist.length });
  }

  function tuneStation(key?: SongKey) {
    if (key) {
      setManualStation(key);
    } else {
      const at = MODU_STATIONS.findIndex(item => item.key === activeKey);
      setManualStation(MODU_STATIONS[(at + 1) % MODU_STATIONS.length].key);
    }
    if (!audioEnabled.current) {
      setAudio(true);
      audioEnabled.current = true;
      try { localStorage.setItem(AUDIO_KEY, 'on'); } catch {}
    }
    setAudioEnabled(true);
  }

  useEffect(() => {
    setMusicTrack('/audio/' + track.file + '.mp3', nextTrack);
  }, [scene, index, track.file, manualStation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function unlock(event: Event) {
      if (event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return;
      if (event.isTrusted && audioEnabled.current) setAudioEnabled(true);
    }
    document.addEventListener('click', unlock, true);
    document.addEventListener('keydown', unlock, true);
    return () => {
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      setAudioEnabled(false);
    };
  }, []);

  function toggleAudio() {
    const next = !audio;
    setAudio(next);
    try { localStorage.setItem(AUDIO_KEY, next ? 'on' : 'off'); } catch {}
    setAudioEnabled(next);
  }

  return { audio, toggleAudio, nextTrack, tuneStation, track, station, manualStation };
}
