import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useContentStore from '@/store/contentStore'
import usePlayerStore from '@/store/playerStore'
import { feedAPI } from '@/services/api'
import { timeAgo, formatDuration, formatCount } from '@/utils/helpers'
import styles from './PodcastPage.module.css'

export default function PodcastPage() {
  const { slug } = useParams()
  const { currentItem: item, isLoading, fetchBySlug } = useContentStore()
  const { play, currentMedia, isPlaying, togglePlay }  = usePlayerStore()

  useEffect(() => { fetchBySlug(slug) }, [slug])

  const handlePlay = () => {
    if (currentMedia?.id === item?._id) {
      togglePlay()
    } else {
      play({
        id:        item._id,
        type:      'podcast',
        url:       item.mediaUrl,
        title:     item.title,
        author:    item.author?.name,
        thumbnail: item.thumbnailUrl
      })
      feedAPI.logBehavior({ contentId: item._id, event: 'listen' }).catch(() => {})
    }
  }

  if (isLoading) return <PodcastSkeleton />
  if (!item)     return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Podcast not found</div>

  const isThisPlaying = currentMedia?.id === item._id && isPlaying

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.artwork}>
          {item.thumbnailUrl
            ? <img src={item.thumbnailUrl} alt={item.title} />
            : <span className={styles.artworkIcon}>🎙</span>
          }
        </div>

        <div className={styles.info}>
          <span className={styles.typeTag}>PODCAST</span>
          <h1 className={styles.title}>{item.title}</h1>

          <div className={styles.meta}>
            {item.author?.avatar
              ? <img src={item.author.avatar} alt="" className={styles.authorAvatar} />
              : <span className={styles.authorInitial}>{item.author?.name?.[0]}</span>
            }
            <span className={styles.authorName}>{item.author?.name}</span>
            <span className={styles.sep}>·</span>
            {item.duration && <span>{formatDuration(item.duration)}</span>}
            <span className={styles.sep}>·</span>
            <span>{timeAgo(item.publishedAt)}</span>
            <span className={styles.sep}>·</span>
            <span>{formatCount(item.views || 0)} plays</span>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.playBtn} ${isThisPlaying ? styles.playBtnPause : ''}`}
              onClick={handlePlay}
            >
              {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
              {isThisPlaying ? 'Pause' : 'Play episode'}
            </button>

            <button className={styles.secondaryBtn}>
              <DownloadIcon /> Download
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => navigator.share?.({ title: item.title, url: window.location.href })}
            >
              <ShareIcon /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Waveform placeholder */}
      <div className={styles.waveform}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{ height: `${20 + Math.sin(i * 0.4) * 15 + Math.random() * 20}px` }}
          />
        ))}
      </div>

      {/* Description */}
      {item.body && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About this episode</h2>
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.tags}>
            {item.tags.map(tag => (
              <Link key={tag} to={`/search?q=${tag}`} className={styles.tag}>#{tag}</Link>
            ))}
          </div>
        </div>
      )}

      {/* Related episodes */}
      {item.related?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>More episodes</h2>
          <div className={styles.relatedList}>
            {item.related.map(r => (
              <Link key={r._id} to={`/podcast/${r.slug}`} className={styles.relatedItem}>
                <div className={styles.relatedThumb}>
                  {r.thumbnailUrl
                    ? <img src={r.thumbnailUrl} alt="" />
                    : <span>🎙</span>
                  }
                </div>
                <div className={styles.relatedInfo}>
                  <p className={styles.relatedTitle}>{r.title}</p>
                  <p className={styles.relatedMeta}>{formatDuration(r.duration)} · {timeAgo(r.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PodcastSkeleton() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 200, height: 200, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 36, marginBottom: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 24, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 44, width: 160, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  )
}

// Icons
const PlayIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const DownloadIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const ShareIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
