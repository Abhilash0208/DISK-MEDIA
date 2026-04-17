import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import usePlayerStore from '@/store/playerStore'
import { formatDuration, truncate } from '@/utils/helpers'
import styles from './MiniPlayer.module.css'

export default function MiniPlayer() {
  const {
    currentMedia, isPlaying, currentTime, duration, volume, isMuted,
    playbackRate, isMinimized,
    pause, togglePlay, close, setCurrentTime, setDuration,
    setVolume, toggleMute, setPlaybackRate, maximize, next, prev
  } = usePlayerStore()

  const audioRef = useRef()
  const progressRef = useRef()

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.play().catch(() => {})
    else           audioRef.current.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current && currentMedia) {
      audioRef.current.src = currentMedia.url
      audioRef.current.load()
      if (isPlaying) audioRef.current.play().catch(() => {})
    }
  }, [currentMedia?.url])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  if (!currentMedia) return null

  const progress = duration ? (currentTime / duration) * 100 : 0

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = pct * duration
    if (audioRef.current) audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const isAudio = currentMedia.type === 'podcast'

  return (
    <>
      {isAudio && (
        <audio
          ref={audioRef}
          onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
          onLoadedMetadata={e => setDuration(e.target.duration)}
          onEnded={next}
        />
      )}

      <div className={`${styles.player} ${isMinimized ? styles.minimized : ''}`}>
        {/* Progress bar */}
        <div
          className={styles.progress}
          ref={progressRef}
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.inner}>
          {/* Thumbnail + info */}
          <div className={styles.info}>
            <div className={styles.thumb}>
              {currentMedia.thumbnail
                ? <img src={currentMedia.thumbnail} alt="" />
                : <span>{currentMedia.type === 'podcast' ? '🎙' : '🎬'}</span>
              }
            </div>
            <div className={styles.meta}>
              <p className={styles.title}>{truncate(currentMedia.title, 40)}</p>
              <p className={styles.author}>{currentMedia.author}</p>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button className={styles.ctrlBtn} onClick={prev} aria-label="Previous">
              <PrevIcon />
            </button>
            <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className={styles.ctrlBtn} onClick={next} aria-label="Next">
              <NextIcon />
            </button>
          </div>

          {/* Time */}
          <div className={styles.time}>
            <span>{formatDuration(currentTime)}</span>
            <span className={styles.timeSep}>/</span>
            <span>{formatDuration(duration)}</span>
          </div>

          {/* Right controls */}
          <div className={styles.right}>
            {/* Playback rate */}
            <select
              className={styles.rateSelect}
              value={playbackRate}
              onChange={e => setPlaybackRate(Number(e.target.value))}
              aria-label="Playback speed"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                <option key={r} value={r}>{r}×</option>
              ))}
            </select>

            {/* Volume */}
            <button className={styles.ctrlBtn} onClick={toggleMute} aria-label="Mute">
              {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </button>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(Number(e.target.value))}
              className={styles.volumeSlider}
              aria-label="Volume"
            />

            <button className={styles.ctrlBtn} onClick={close} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const PlayIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const PrevIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
const NextIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
const VolumeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
const MuteIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
