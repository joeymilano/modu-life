import { useEffect, useRef, useState } from 'react';
import { setAudioEnabled, setMusicTrack } from '../game/audio';
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
  const playlist = PLAYLISTS[scene];
  const index = selection.scene === scene ? selection.index : 0;
  const track = SOUNDTRACK[playlist[index]];

  function nextTrack() {
    setSelection({ scene, index: (index + 1) % playlist.length });
  }

  useEffect(() => {
    setMusicTrack('/audio/' + track.file + '.mp3', nextTrack);
  }, [scene, index, track.file]);

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

  return { audio, toggleAudio, nextTrack, track };
}
