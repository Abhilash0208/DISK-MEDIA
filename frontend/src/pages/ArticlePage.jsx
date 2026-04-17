import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useContentStore from '@/store/contentStore'
import useAuthStore from '@/store/authStore'
import { feedAPI } from '@/services/api'
import { timeAgo, formatReadTime } from '@/utils/helpers'
import MediaCard from '@/components/content/MediaCard'
import SkeletonCard from '@/components/common/SkeletonCard'
import styles from './ArticlePage.module.css'

export default function ArticlePage() {
  const { slug }                         = useParams()
  const { currentItem: item, isLoading, fetchBySlug, toggleLike, toggleSave } = useContentStore()
  const { user, isPremium }              = useAuthStore()
  const navigate                         = useNavigate()

  useEffect(() => { fetchBySlug(slug) }, [slug])

  // Log completion on unmount
  useEffect(() => {
    if (!item) return
    const start = Date.now()
    return () => {
      const secs = (Date.now() - start) / 1000
      const rate = Math.min(secs / Math.max(item.duration || 300, 1), 1)
      feedAPI.logBehavior({ contentId: item._id, event: 'read', duration: secs, completionRate: rate })
        .catch(() => {})
    }
  }, [item?._id])

  if (isLoading) return <ArticleSkeleton />

  if (!item) return (
    <div className={styles.notFound}>
      <h1>Article not found</h1>
      <button onClick={() => navigate(-1)} className={styles.backBtn}>← Go back</button>
    </div>
  )

  const wordCount  = item.body?.split(/\s+/).length || 0
  const readTime   = formatReadTime(wordCount)
  const isGated    = item.gated && !isPremium()

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        {item.thumbnailUrl && (
          <div className={styles.heroImg}>
            <img src={item.thumbnailUrl} alt={item.title} />
            <div className={styles.heroOverlay} />
          </div>
        )}
        <div className={styles.heroContent}>
          <div className={styles.meta}>
            {item.category && (
              <Link to={`/category/${item.category.toLowerCase()}`} className={styles.category}>
                {item.category}
              </Link>
            )}
            {item.status === 'breaking' && (
              <span className={styles.breakingBadge}>
                <span className={styles.bDot} /> BREAKING
              </span>
            )}
            {item.isPremium && <span className={styles.premBadge}>PRO</span>}
          </div>

          <h1 className={styles.title}>{item.title}</h1>

          {item.excerpt && <p className={styles.excerpt}>{item.excerpt}</p>}

          <div className={styles.byline}>
            <div className={styles.author}>
              {item.author?.avatar
                ? <img src={item.author.avatar} alt={item.author.name} className={styles.avatar} />
                : <span className={styles.avatarInitial}>{item.author?.name?.[0]}</span>
              }
              <div>
                <p className={styles.authorName}>{item.author?.name}</p>
                <p className={styles.authorMeta}>{timeAgo(item.publishedAt)} · {readTime}</p>
              </div>
            </div>

            <div className={styles.actions}>
              {user && (
                <>
                  <button
                    className={`${styles.actionBtn} ${item.liked ? styles.liked : ''}`}
                    onClick={() => toggleLike(item._id)}
                  >
                    <HeartIcon filled={item.liked} />
                    {item.likes > 0 && item.likes}
                  </button>
                  <button className={styles.actionBtn} onClick={() => toggleSave(item._id)}>
                    <BookmarkIcon />
                  </button>
                </>
              )}
              <button
                className={styles.actionBtn}
                onClick={() => navigator.share?.({ title: item.title, url: window.location.href })}
              >
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles.layout}>
        <article className={styles.article}>
          {isGated ? (
            <div className={styles.gateWrap}>
              {/* Show teaser */}
              <div
                className={styles.teaser}
                dangerouslySetInnerHTML={{ __html: item.body?.slice(0, 800) + '…' }}
              />
              <div className={styles.gate}>
                <div className={styles.gateInner}>
                  <span className={styles.gateIcon}>🔒</span>
                  <h3 className={styles.gateTitle}>This is premium content</h3>
                  <p className={styles.gateSub}>
                    Subscribe to Disk Media Premium to read the full article, ad-free.
                  </p>
                  <Link to="/pricing" className={styles.gateBtn}>Unlock Premium — $9/mo</Link>
                  {!user && (
                    <p className={styles.gateLogin}>
                      Already a member? <Link to="/login">Sign in</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: item.body || '<p>No content available.</p>' }}
            />
          )}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className={styles.tags}>
              {item.tags.map(tag => (
                <Link key={tag} to={`/search?q=${tag}`} className={styles.tag}>#{tag}</Link>
              ))}
            </div>
          )}

          {/* Share row */}
          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank" rel="noopener noreferrer" className={styles.shareBtn}
            >Twitter</a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank" rel="noopener noreferrer" className={styles.shareBtn}
            >Facebook</a>
            <button
              className={styles.shareBtn}
              onClick={() => { navigator.clipboard.writeText(window.location.href) }}
            >Copy link</button>
          </div>
        </article>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.stickyAuthor}>
            <h3 className={styles.sidebarTitle}>About the author</h3>
            <div className={styles.sidebarAuthor}>
              {item.author?.avatar
                ? <img src={item.author.avatar} alt="" className={styles.sidebarAvatar} />
                : <span className={styles.sidebarInitial}>{item.author?.name?.[0]}</span>
              }
              <p className={styles.sidebarAuthorName}>{item.author?.name}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {item.related?.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>More in {item.category}</h2>
          <div className={styles.relatedGrid}>
            {item.related.map(r => <MediaCard key={r._id} item={r} variant="card" />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ArticleSkeleton() {
  return (
    <div style={{ maxWidth: 740, margin: '40px auto', padding: '0 24px' }}>
      <div className="skeleton" style={{ height: 380, borderRadius: 14, marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 16, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 48, marginBottom: 12, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 32, borderRadius: 6 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 16, marginBottom: 12, borderRadius: 4, width: i % 3 === 2 ? '60%' : '100%' }} />
      ))}
    </div>
  )
}

// Icons
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
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)
