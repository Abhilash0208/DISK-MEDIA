import { Link } from 'react-router-dom'
import usePlayerStore from '@/store/playerStore'
import useContentStore from '@/store/contentStore'
import useAuthStore from '@/store/authStore'
import { timeAgo, truncate, formatCount, formatDuration, contentMeta } from '@/utils/helpers'
import styles from './MediaCard.module.css'

/**
 * variants:
 *  - "card"       = grid card (default)
 *  - "horizontal" = list row (articles)
 *  - "video"      = scroll row card
 *  - "podcast"    = scroll row card
 */
export default function MediaCard({ item, variant = 'card', index }) {
  const { play } = usePlayerStore()
  const { toggleLike, toggleSave } = useContentStore()
  const { user } = useAuthStore()
  const meta = contentMeta[item.type] || contentMeta.article

  const handlePlay = (e) => {
    e.preventDefault()
    play({
      id:        item._id,
      type:      item.type,
      url:       item.mediaUrl,
      title:     item.title,
      author:    item.author?.name,
      thumbnail: item.thumbnailUrl
    })
  }

  if (variant === 'horizontal') {
    return (
      <article
        className={styles.horizontal}
        style={{ animationDelay: `${(index || 0) * 60}ms` }}
      >
        <Link to={`/content/${item.slug}`} className={styles.hThumb}>
          {item.thumbnailUrl
            ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
            : <div className={styles.thumbPlaceholder}>{meta.icon}</div>
          }
          <span className={styles.hTypeBadge} style={{ color: meta.color }}>
            {meta.label}
          </span>
        </Link>
        <div className={styles.hBody}>
          {item.category && (
            <Link to={`/category/${item.category.toLowerCase()}`} className={styles.hCat}>
              {item.category}
            </Link>
          )}
          <h3 className={styles.hTitle}>
            <Link to={`/content/${item.slug}`}>{item.title}</Link>
          </h3>
          <div className={styles.hMeta}>
            <span>{item.author?.name}</span>
            <span className={styles.dot}>·</span>
            <span>{timeAgo(item.publishedAt)}</span>
            {item.isPremium && <span className={styles.premBadge}>PRO</span>}
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'video') {
    return (
      <article className={styles.videoCard}>
        <button className={styles.videoThumb} onClick={handlePlay}>
          {item.thumbnailUrl
            ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
            : <div className={styles.thumbPlaceholder}>{meta.icon}</div>
          }
          <div className={styles.playOverlay}>
            <PlayIcon />
          </div>
          {item.duration && (
            <span className={styles.duration}>{formatDuration(item.duration)}</span>
          )}
        </button>
        <div className={styles.vcBody}>
          <h3 className={styles.vcTitle}>
            <Link to={`/content/${item.slug}`}>{truncate(item.title, 60)}</Link>
          </h3>
          <div className={styles.vcMeta}>
            <span>{item.author?.name}</span>
            <span className={styles.dot}>·</span>
            <span>{formatCount(item.views || 0)} views</span>
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'podcast') {
    return (
      <article className={styles.podcastCard}>
        <div className={styles.podThumb}>
          {item.thumbnailUrl
            ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
            : <div className={styles.thumbPlaceholder} style={{ fontSize: 32 }}>🎙</div>
          }
        </div>
        <div className={styles.podBody}>
          <h3 className={styles.podTitle}>{truncate(item.title, 50)}</h3>
          <p className={styles.podAuthor}>{item.author?.name}</p>
          {item.duration && (
            <p className={styles.podDuration}>{formatDuration(item.duration)}</p>
          )}
          <button className={styles.podPlayBtn} onClick={handlePlay}>
            <PlayIcon small /> Play
          </button>
        </div>
      </article>
    )
  }

  // Default: card
  return (
    <article className={styles.card}>
      <Link to={`/content/${item.slug}`} className={styles.thumb}>
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
          : <div className={styles.thumbPlaceholder}>{meta.icon}</div>
        }
        <span className={styles.typePill} style={{ background: meta.color + '22', color: meta.color }}>
          {meta.icon} {meta.label}
        </span>
        {item.isPremium && <span className={styles.premPill}>PRO</span>}
        {(item.type === 'video' || item.type === 'podcast') && (
          <button className={styles.playBtn} onClick={handlePlay}>
            <PlayIcon />
          </button>
        )}
        {item.duration && (
          <span className={styles.durationPill}>{formatDuration(item.duration)}</span>
        )}
      </Link>

      <div className={styles.body}>
        {item.category && (
          <Link to={`/category/${item.category.toLowerCase()}`} className={styles.cat}>
            {item.category}
          </Link>
        )}
        <h3 className={styles.title}>
          <Link to={`/content/${item.slug}`}>{truncate(item.title, 80)}</Link>
        </h3>
        {item.body && variant !== 'compact' && (
          <p className={styles.excerpt}>
            {truncate(item.body.replace(/<[^>]+>/g, ''), 100)}
          </p>
        )}

        <div className={styles.footer}>
          <div className={styles.authorRow}>
            {item.author?.avatar
              ? <img src={item.author.avatar} alt="" className={styles.authorAvatar} />
              : <span className={styles.authorInitial}>{item.author?.name?.[0]}</span>
            }
            <span className={styles.authorName}>{item.author?.name}</span>
            <span className={styles.time}>{timeAgo(item.publishedAt)}</span>
          </div>

          {user && (
            <div className={styles.cardActions}>
              <button
                className={`${styles.actionBtn} ${item.liked ? styles.liked : ''}`}
                onClick={(e) => { e.preventDefault(); toggleLike(item._id) }}
                aria-label="Like"
              >
                <HeartIcon filled={item.liked} />
                {item.likes > 0 && <span>{formatCount(item.likes)}</span>}
              </button>
              <button
                className={styles.actionBtn}
                onClick={(e) => { e.preventDefault(); toggleSave(item._id) }}
                aria-label="Save"
              >
                <BookmarkIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const PlayIcon = ({ small }) => (
  <svg width={small ? 12 : 18} height={small ? 12 : 18} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const HeartIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const BookmarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
)
