import { create } from 'zustand'

const usePlayerStore = create((set, get) => ({
  // Current media
  currentMedia:    null,   // { type, url, title, author, thumbnail, id }
  isPlaying:       false,
  currentTime:     0,
  duration:        0,
  volume:          0.8,
  isMuted:         false,
  playbackRate:    1.0,
  isMinimized:     false,   // mini player mode
  queue:           [],
  queueIndex:      0,

  // ── Controls ──────────────────────────────────────────────────────────────
  play:  (media) => {
    if (media) {
      set({ currentMedia: media, isPlaying: true, currentTime: 0, isMinimized: false })
    } else {
      set({ isPlaying: true })
    }
  },
  pause:           () => set({ isPlaying: false }),
  togglePlay:      () => set(s => ({ isPlaying: !s.isPlaying })),
  minimize:        () => set({ isMinimized: true }),
  maximize:        () => set({ isMinimized: false }),
  close:           () => set({ currentMedia: null, isPlaying: false, currentTime: 0 }),
  setCurrentTime:  (t)  => set({ currentTime: t }),
  setDuration:     (d)  => set({ duration: d }),
  setVolume:       (v)  => set({ volume: v, isMuted: v === 0 }),
  toggleMute:      ()   => set(s => ({ isMuted: !s.isMuted })),
  setPlaybackRate: (r)  => set({ playbackRate: r }),
  seek:            (s)  => set({ currentTime: s }),

  // ── Queue ─────────────────────────────────────────────────────────────────
  setQueue: (items, startIndex = 0) => {
    set({ queue: items, queueIndex: startIndex, currentMedia: items[startIndex] })
    get().play()
  },
  next: () => {
    const { queue, queueIndex } = get()
    if (queueIndex < queue.length - 1) {
      const next = queueIndex + 1
      set({ queueIndex: next, currentMedia: queue[next], isPlaying: true, currentTime: 0 })
    }
  },
  prev: () => {
    const { queue, queueIndex, currentTime } = get()
    if (currentTime > 3) {
      set({ currentTime: 0 })
    } else if (queueIndex > 0) {
      const prev = queueIndex - 1
      set({ queueIndex: prev, currentMedia: queue[prev], isPlaying: true, currentTime: 0 })
    }
  }
}))

export default usePlayerStore
