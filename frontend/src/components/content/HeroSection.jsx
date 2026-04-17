import { Link } from 'react-router-dom'
import useContentStore from '@/store/contentStore'
import useAuthStore from '@/store/authStore'
import { timeAgo, truncate, contentMeta } from '@/utils/helpers'
import styles from './HeroSection.module.css'

export default function HeroSection({ item }) {
  if (!item) return null
  const { toggleLike, toggleSave } = useContentStore()
  const { user } = useAuthStore()
  const meta = contentMeta[item.type] || contentMeta.article

  return (
    <section className={styles.hero}>
      {/* Background image */}
      {item.thumbnailUrl && (
        <div className={styles.bg}>
          <img src={item.thumbnailUrl} alt="" className={styles.bgImg} />
          <div className={styles.bgOverlay} />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.typeBadge} style={{ background: meta.color + '22', color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          {item.category && (
            <Link to={`/category/${item.category.toLowerCase()}`} className={styles.category}>
              {item.category}
            </Link>
          )}
          {item.status === 'breaking' && (
            <span className={styles.breakingBadge}>
              <span className={styles.breakingDot} />
              BREAKING
            </span>
          )}
        </div>

        <h1 className={styles.title}>
          <Link to={`/content/${item.slug}`}>{item.title}</Link>
        </h1>

        {item.body && (
          <p className={styles.excerpt}>
            {truncate(item.body.replace(/<[^>]+>/g, ''), 160)}
          </p>
        )}

        <div className={styles.footer}>
          <div className={styles.author}>
            {item.author?.avatar
              ? <img src={item.author.avatar} alt={item.author.name} className={styles.authorAvatar} />
              : <span className={styles.authorInitial}>{item.author?.name?.[0]}</span>
            }
            <div>
              <span className={styles.authorName}>{item.author?.name}</span>
              <span className={styles.time}>{timeAgo(item.publishedAt)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to={`/content/${item.slug}`} className={styles.readBtn}>
              {item.type === 'video' ? 'Watch now' : item.type === 'podcast' ? 'Listen now' : 'Read more'}
              <ArrowIcon />
            </Link>
            {user && (
              <>
                <button
                  className={styles.iconBtn}
                  onClick={() => toggleLike(item._id)}
                  aria-label="Like"
                >
                  <HeartIcon filled={item.liked} />
                  <span>{item.likes || 0}</span>
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={() => toggleSave(item._id)}
                  aria-label="Save"
                >
                  <BookmarkIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const BookmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
)
