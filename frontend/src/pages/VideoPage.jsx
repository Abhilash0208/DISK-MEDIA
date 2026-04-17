import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Hls from 'hls.js'
import useContentStore from '@/store/contentStore'
import { feedAPI } from '@/services/api'
import { timeAgo, formatCount, formatDuration } from '@/utils/helpers'
import MediaCard from '@/components/content/MediaCard'
import styles from './VideoPage.module.css'

export default function VideoPage() {
  const { slug }   = useParams()
  const { currentItem: item, isLoading, fetchBySlug, toggleLike, toggleSave } = useContentStore()
  const videoRef   = useRef()
  const hlsRef     = useRef()
  const startRef   = useRef(Date.now())

  const [playing,   setPlaying]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [volume,    setVolume]    = useState(1)
  const [muted,     setMuted]     = useState(false)
  const [fullscreen,setFullscreen]= useState(false)
  const [showCtrl,  setShowCtrl]  = useState(true)
  const ctrlTimer = useRef()

  useEffect(() => { fetchBySlug(slug) }, [slug])

  // HLS setup
  useEffect(() => {
    if (!item?.mediaUrl || !videoRef.current) return
    const video = videoRef.current

    if (Hls.isSupported()) {
      hlsRef.current?.destroy()
      const hls = new Hls({ startLevel: -1 })
      hls.loadSource(item.mediaUrl)
      hls.attachMedia(video)
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = item.mediaUrl  // Safari native HLS
    } else {
      video.src = item.mediaUrl  // Fallback: direct video
    }

    return () => { hlsRef.current?.destroy() }
  }, [item?.mediaUrl])

  // Log behavior on unmount
  useEffect(() => {
    if (!item) return
    startRef.current = Date.now()
    return () => {
      const secs = (Date.now() - startRef.current) / 1000
      const rate = duration ? Math.min(secs / duration, 1) : 0
      feedAPI.logBehavior({ contentId: item._id, event: 'watch', duration: secs, completionRate: rate })
        .catch(() => {})
    }
  }, [item?._id, duration])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setProgress(v.currentTime)
    if (!duration && v.duration) setDuration(v.duration)
  }

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * duration
    setProgress(pct * duration)
  }

  const handleVolume = (e) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (videoRef.current) videoRef.current.volume = v
    setMuted(v === 0)
  }

  const handleFullscreen = () => {
    const el = videoRef.current?.closest('.' + styles.playerWrap)
    if (!document.fullscreenElement) {
      el?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const showControls = () => {
    setShowCtrl(true)
    clearTimeout(ctrlTimer.current)
    ctrlTimer.current = setTimeout(() => { if (playing) setShowCtrl(false) }, 2500)
  }

  const pct = duration ? (progress / duration) * 100 : 0

  if (isLoading) return <VideoSkeleton />
  if (!item)     return <div className={styles.notFound}>Video not found</div>

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        {/* Player */}
        <div
          className={styles.playerWrap}
          onMouseMove={showControls}
          onMouseLeave={() => playing && setShowCtrl(false)}
        >
          <video
            ref={videoRef}
            className={styles.video}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onClick={togglePlay}
            playsInline
          />

          {/* Controls overlay */}
          <div className={`${styles.controls} ${showCtrl || !playing ? styles.visible : ''}`}>
            {/* Progress */}
            <div className={styles.progressBar} onClick={handleSeek}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }}>
                <div className={styles.progressThumb} />
              </div>
            </div>

            <div className={styles.controlRow}>
              <button className={styles.ctrlBtn} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>

              <div className={styles.timeDisplay}>
                {formatDuration(progress)} / {formatDuration(duration)}
              </div>

              <div className={styles.volWrap}>
                <button className={styles.ctrlBtn} onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted }}>
                  {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className={styles.volSlider}
                />
              </div>

              <div style={{ flex: 1 }} />

              <button className={styles.ctrlBtn} onClick={handleFullscreen} aria-label="Fullscreen">
                <FullscreenIcon />
              </button>
            </div>
          </div>

          {/* Big play button when paused */}
          {!playing && (
            <button className={styles.bigPlay} onClick={togglePlay} aria-label="Play">
              <PlayIcon size={40} />
            </button>
          )}
        </div>

        {/* Video info */}
        <div className={styles.info}>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.meta}>
            <div className={styles.author}>
              {item.author?.avatar
                ? <img src={item.author.avatar} alt="" className={styles.avatar} />
                : <span className={styles.avatarI}>{item.author?.name?.[0]}</span>
              }
              <div>
                <p className={styles.authorName}>{item.author?.name}</p>
                <p className={styles.authorSub}>{timeAgo(item.publishedAt)} · {formatCount(item.views || 0)} views</p>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={`${styles.actionBtn} ${item.liked ? styles.liked : ''}`} onClick={() => toggleLike(item._id)}>
                <HeartIcon filled={item.liked} /> {item.likes || 0}
              </button>
              <button className={styles.actionBtn} onClick={() => toggleSave(item._id)}>
                <BookmarkIcon /> Save
              </button>
              <button className={styles.actionBtn} onClick={() => navigator.share?.({ title: item.title, url: window.location.href })}>
                <ShareIcon /> Share
              </button>
            </div>
          </div>

          {item.body && (
            <div className={styles.desc}>
              <p>{item.body.replace(/<[^>]+>/g, '').slice(0, 300)}</p>
            </div>
          )}

          {item.tags?.length > 0 && (
            <div className={styles.tags}>
              {item.tags.map(t => <Link key={t} to={`/search?q=${t}`} className={styles.tag}>#{t}</Link>)}
            </div>
          )}
        </div>
      </div>

      {/* Related sidebar */}
      {item.related?.length > 0 && (
        <aside className={styles.related}>
          <h2 className={styles.relatedTitle}>Up next</h2>
          <div className={styles.relatedList}>
            {item.related.map(r => <MediaCard key={r._id} item={r} variant="horizontal" />)}
          </div>
        </aside>
      )}
    </div>
  )
}

function VideoSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 32, width: '70%', borderRadius: 6, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4 }} />
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const PlayIcon  = ({ size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const VolumeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
const MuteIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const FullscreenIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
const HeartIcon = ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const BookmarkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
const ShareIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
