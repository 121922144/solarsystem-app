import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import '@/styles/game.scss';
import { GlobalStateProvider } from './lib/use-global-state';
import { TTSProvider } from './lib/use-tts';
import Planets from './planets';
import Chat from './chat';
import { useState, useEffect, useCallback } from 'react';
import musicSvg from '@/assets/images/music.svg';

export default function Game() {
  const copilotApiKey = import.meta.env.VITE_COPILOT_CLOUD_PUBLIC_API_KEY;
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = useCallback(() => {
    const audio = document.getElementById(
      'background-music'
    ) as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => {
          console.log('Audio play failed:', error);
        });
      }
    }
  }, [isPlaying]);

  // 监听音频的播放和暂停事件，确保状态与实际播放状态同步
  useEffect(() => {
    const audio = document.getElementById(
      'background-music'
    ) as HTMLAudioElement;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // 清理事件监听器
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <CopilotKit publicApiKey={copilotApiKey || ''}>
      <GlobalStateProvider>
        <TTSProvider>
          <div className="mask"></div>
          <div className="h-screen w-screen grid grid-cols-[1fr_500px] relative z-1">
            <div>
              <Planets />
            </div>
            <div className="py-5 pr-5 overflow-hidden">
              <Chat />
            </div>
          </div>

          <audio
            id="background-music"
            src="/music/gattina.mp3"
            preload="auto"
            loop={true}
            style={{
              display: 'none',
            }}
          />
          <audio
            id="jump-audio"
            src="/music/jump2.mp3"
            preload="auto"
            style={{ display: 'none' }}
          />
          <audio
            id="fireworks-audio"
            src="/music/fireworks.mp3"
            preload="auto"
            style={{ display: 'none' }}
          />
          <audio
            id="error-audio"
            src="/music/error.mp3"
            preload="auto"
            style={{ display: 'none' }}
          />
          <audio
            id="correct-audio"
            src="/music/correct.mp3"
            preload="auto"
            style={{ display: 'none' }}
          />
          <button
            onClick={togglePlayPause}
            className="absolute z-1 bottom-4 left-4 border-0 flex items-center justify-center rounded-full bg-white/20 cursor-pointer"
          >
            <img
              src={musicSvg}
              alt="音乐控制"
              className={`w-10 h-10 transition-transform duration-150 music-note-rotate ${
                isPlaying ? 'music-note-running' : 'music-note-paused'
              }`}
            />
          </button>
        </TTSProvider>
      </GlobalStateProvider>
    </CopilotKit>
  );
}
