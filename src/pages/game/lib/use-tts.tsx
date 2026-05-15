import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * TTS Provider：负责
 * - 维护单一的 HTMLAudioElement，避免多条消息音频重叠
 * - 维护一个朗读队列，按顺序播放
 * - 用 Map 缓存"文本 -> blob URL"，相同文本只调用一次后端 TTS 接口
 * - 持久化静音开关到 localStorage
 *
 * 后端代理见 vite.config.ts 中的 volcanoTTSPlugin（火山引擎 TTS）
 */

const STORAGE_KEY = 'tts-muted';

interface SpeakOptions {
  /**
   * 唯一 id，用于去重：同一个 id 不会被重复加入队列。
   * 例如 AI 消息可以传 messageId；题目可以传 questionNumber。
   */
  id?: string;
  /** 火山引擎音色 voice_type，如 BV064_streaming（心心，活泼女童） */
  voice?: string;
  /** 兼容字段，火山引擎暂不使用，留作其他厂商扩展 */
  style?: string;
  /** 语速调整，支持 "-5%"、"+10%" 或 "0.95" 等格式，会在后端转成 speed_ratio */
  rate?: string;
}

interface TTSContextValue {
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  /**
   * 清空"已见 id"集合，让相同 id（例如 question:q1）的文本可以再次被朗读。
   * 用于"重新开始游戏"等需要复用同一组 id 但内容已经更新的场景。
   */
  resetSeen: () => void;
  /** 当前正在播放（或被暂停）的那条 id；没有则为 null */
  currentItemId: string | null;
  /** 当前 audio 是否处于暂停态（仅当 currentItemId 不为 null 时有意义） */
  paused: boolean;
  /** 暂停当前正在播的那条（若有） */
  pauseCurrent: () => void;
  /** 续播当前被暂停的那条（若有） */
  resumeCurrent: () => void;
  /**
   * 重新朗读某条（用于消息上的"播放"按钮）：
   * - 会先停掉当前播放和队列
   * - 绕过 seenIds 去重和全局 mute
   * - 立即开播这条
   */
  restart: (text: string, options?: SpeakOptions) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
}

const TTSContext = createContext<TTSContextValue | null>(null);

interface QueueItem {
  id: string;
  text: string;
  voice?: string;
  style?: string;
  rate?: string;
}

export function TTSProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });
  // 当前正在播 / 暂停的那条 id；用 state 让订阅者能跟着 React 重渲染
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  // audio 当前是否被暂停（true 表示有 src 但被 pause 了）
  const [paused, setPausedState] = useState<boolean>(false);

  // 单一 audio 元素：所有 TTS 共享，避免叠音
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 朗读队列
  const queueRef = useRef<QueueItem[]>([]);
  // 当前是否正在播放
  const playingRef = useRef<boolean>(false);
  // 已加入队列/已播放过的 id（去重，防止 React 渲染抖动重复入队）
  const seenIdsRef = useRef<Set<string>>(new Set());
  // 文本 -> objectURL 的缓存，相同文本不再重复请求 Azure
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  // 是否已经被用户与页面交互过（满足浏览器自动播放策略）
  const userInteractedRef = useRef<boolean>(false);
  // 待 muted 状态变化时使用的最新值（避免闭包陈旧）
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  // 引用 playNext，用于 mount 时的 effect 中访问到最新版本
  const playNextRef = useRef<((force?: boolean) => Promise<void>) | null>(null);

  // 初始化 audio 元素
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleEnded = () => {
      playingRef.current = false;
      setCurrentItemId(null);
      setPausedState(false);
      // 继续播放队列中的下一条
      void playNext();
    };
    const handleError = () => {
      playingRef.current = false;
      setCurrentItemId(null);
      setPausedState(false);
      void playNext();
    };
    const handlePlayEvt = () => {
      setPausedState(false);
    };
    const handlePauseEvt = () => {
      // 仅在 audio 仍有 src 且未播完时认定为"暂停"，避免 ended 时误标
      const a = audioRef.current;
      if (a && a.src && !a.ended) {
        setPausedState(true);
      }
    };
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlayEvt);
    audio.addEventListener('pause', handlePauseEvt);

    // 监听首次用户交互，解锁播放权限
    const markInteracted = () => {
      userInteractedRef.current = true;
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      // 解锁后立刻消化已积压的队列（例如首屏的欢迎语）
      void playNextRef.current?.();
    };
    window.addEventListener('pointerdown', markInteracted);
    window.addEventListener('keydown', markInteracted);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlayEvt);
      audio.removeEventListener('pause', handlePauseEvt);
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      // 释放所有缓存的 objectURL
      audioCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 调用后端代理获取音频 blob URL，命中缓存直接返回 */
  const fetchAudioUrl = useCallback(
    async (item: QueueItem): Promise<string | null> => {
      const cacheKey = `${item.voice || ''}|${item.style || ''}|${
        item.rate || ''
      }|${item.text}`;
      const cached = audioCacheRef.current.get(cacheKey);
      if (cached) return cached;
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: item.text,
            voice: item.voice,
            style: item.style,
            rate: item.rate,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.warn('[TTS] /api/tts 请求失败:', res.status, errText);
          return null;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, url);
        return url;
      } catch (err) {
        console.warn('[TTS] /api/tts 异常:', err);
        return null;
      }
    },
    []
  );

  /**
   * 播放下一条队列项
   * @param force 当 true 时绕过全局 mute（用于"重新朗读单条"场景）
   */
  const playNext = useCallback(
    async (force = false): Promise<void> => {
      if (playingRef.current) return;
      if (!force && mutedRef.current) {
        // 静音时清空队列
        queueRef.current = [];
        return;
      }
      const next = queueRef.current.shift();
      if (!next) return;
      const audio = audioRef.current;
      if (!audio) return;

      const url = await fetchAudioUrl(next);
      if (!url) {
        // 拉取失败，跳过
        return playNext(force);
      }
      // 如果在异步等待期间被 mute 了（且不是强制播放），直接跳过
      if (!force && mutedRef.current) {
        queueRef.current = [];
        return;
      }
      audio.src = url;
      playingRef.current = true;
      setCurrentItemId(next.id);
      setPausedState(false);
      try {
        await audio.play();
      } catch (err) {
        // 自动播放被拒：等待下一次交互后由用户触发
        console.warn('[TTS] audio.play() 被拒绝:', err);
        playingRef.current = false;
      }
    },
    [fetchAudioUrl]
  );
  playNextRef.current = playNext;

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return;
      if (mutedRef.current) return;
      const id = options.id || trimmed;
      if (seenIdsRef.current.has(id)) return;
      seenIdsRef.current.add(id);
      queueRef.current.push({
        id,
        text: trimmed,
        voice: options.voice,
        style: options.style,
        rate: options.rate,
      });
      void playNext();
    },
    [playNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    playingRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentItemId(null);
    setPausedState(false);
  }, []);

  const resetSeen = useCallback(() => {
    seenIdsRef.current.clear();
  }, []);

  const pauseCurrent = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && !audio.ended) {
      audio.pause();
    }
  }, []);

  const resumeCurrent = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.paused && audio.src && !audio.ended) {
      audio.play().catch(err => {
        console.warn('[TTS] resume play 被拒绝:', err);
      });
    }
  }, []);

  /**
   * 重新朗读某条：清掉当前播放与队列，绕过 seenIds 与全局 mute，
   * 单独把这条入队并强制开播。常用于消息上的"播放"按钮。
   */
  const restart = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return;
      const id = options.id || trimmed;

      // 清掉当前播放与队列
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      queueRef.current = [];
      playingRef.current = false;

      // 绕过去重
      seenIdsRef.current.delete(id);
      seenIdsRef.current.add(id);
      queueRef.current.push({
        id,
        text: trimmed,
        voice: options.voice,
        style: options.style,
        rate: options.rate,
      });
      // force=true：即便用户处于全局静音，也允许这条主动点击的播放
      void playNext(true);
    },
    [playNext]
  );

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    mutedRef.current = m;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, m ? '1' : '0');
    }
    const audio = audioRef.current;
    if (m) {
      // 静音：只暂停，**保留 src 与 currentTime**，便于取消静音后续播被打断的那条；
      // 同时清空尚未开播的队列项，避免恢复后一股脑念出静音期间堆积的旧内容。
      queueRef.current = [];
      playingRef.current = false;
      if (audio) {
        audio.pause();
      }
    } else {
      // 取消静音：若当前 audio 还有未播完的内容，立即续播；否则尝试消化队列。
      if (audio && audio.src && !audio.ended) {
        playingRef.current = true;
        audio.play().catch(err => {
          console.warn('[TTS] 取消静音续播被拒绝:', err);
          playingRef.current = false;
          void playNextRef.current?.();
        });
      } else {
        void playNextRef.current?.();
      }
    }
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted(!mutedRef.current);
  }, [setMuted]);

  return (
    <TTSContext.Provider
      value={{
        speak,
        stop,
        resetSeen,
        currentItemId,
        paused,
        pauseCurrent,
        resumeCurrent,
        restart,
        muted,
        setMuted,
        toggleMuted,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS(): TTSContextValue {
  const ctx = useContext(TTSContext);
  if (!ctx) {
    // 没有 Provider 时返回 noop，避免组件崩溃
    return {
      speak: () => {},
      stop: () => {},
      resetSeen: () => {},
      currentItemId: null,
      paused: false,
      pauseCurrent: () => {},
      resumeCurrent: () => {},
      restart: () => {},
      muted: false,
      setMuted: () => {},
      toggleMuted: () => {},
    };
  }
  return ctx;
}
