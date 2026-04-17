import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import useContentStore from '@/store/contentStore'
import useInfiniteScroll from '@/hooks/useInfiniteScroll'
import MediaCard from '@/components/content/MediaCard'
import HeroSection from '@/components/content/HeroSection'
import BreakingTicker from '@/components/content/BreakingTicker'
import TrendingSidebar from '@/components/content/TrendingSidebar'
import SkeletonCard from '@/components/common/SkeletonCard'
import styles from './HomePage.module.css'

export default function HomePage() {
  const {
    feed, trending, breaking,
    fetchFeed, fetchTrending, fetchBreaking,
    isLoading, hasMore
  } = useContentStore()

  useEffect(() => {
    fetchFeed(true)
    fetchTrending()
    fetchBreaking()
  }, [])

  const loadMore = () => { if (!isLoading && hasMore) fetchFeed() }
  const lastCardRef = useInfiniteScroll(loadMore, hasMore, isLoading)

  // Split feed by type for sections
  const videos   = feed.filter(i => i.type === 'video').slice(0, 8)
  const podcasts = feed.filter(i => i.type === 'podcast').slice(0, 6)
  const articles = feed.filter(i => i.type === 'article')

  const hero      = articles[0] || feed[0]
  const topStories = articles.slice(1, 6)

  return (
    <main className={styles.main}>
      {/* Breaking news ticker */}
      {breaking.length > 0 && <BreakingTicker items={breaking} />}

      {/* Hero */}
      {hero && <HeroSection item={hero} />}

      {/* Top stories + trending sidebar */}
      <section className={styles.storiesSection}>
        <div className={styles.storiesGrid}>
          <div className={styles.storiesLeft}>
            <SectionHeader title="Top Stories" link="/news" />
            <div className={styles.storyCards}>
              {topStories.map((item, i) => (
                <MediaCard key={item._id} item={item} variant="horizontal" index={i} />
              ))}
              {isLoading && !feed.length &&
                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} variant="horizontal" />)
              }
            </div>
          </div>
          <aside className={styles.sidebar}>
            <TrendingSidebar items={trending} />
          </aside>
        </div>
      </section>

      {/* Video row */}
      {videos.length > 0 && (
        <section className={styles.section}>
          <SectionHeader title="Videos" link="/videos" />
          <div className={styles.scrollRow}>
            {videos.map(item => (
              <MediaCard key={item._id} item={item} variant="video" />
            ))}
          </div>
        </section>
      )}

      {/* Podcast row */}
      {podcasts.length > 0 && (
        <section className={styles.section}>
          <SectionHeader title="Podcasts" link="/podcasts" />
          <div className={styles.scrollRow}>
            {podcasts.map(item => (
              <MediaCard key={item._id} item={item} variant="podcast" />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className={styles.section}>
        <SectionHeader title="Browse Topics" />
        <CategoryGrid />
      </section>

      {/* Main feed */}
      <section className={styles.section}>
        <SectionHeader title="For You" />
        <div className={styles.feedGrid}>
          {feed.map((item, i) => {
            const isLast = i === feed.length - 1
            return (
              <div key={item._id} ref={isLast ? lastCardRef : null}>
                <MediaCard item={item} variant="card" />
              </div>
            )
          })}
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} variant="card" />)
          }
        </div>
        {!hasMore && feed.length > 0 && (
          <p className={styles.endMsg}>You're all caught up 🎉</p>
        )}
      </section>
    </main>
  )
}

function SectionHeader({ title, link }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {link && <Link to={link} className={styles.sectionLink}>See all →</Link>}
    </div>
  )
}

const CATEGORIES = [
  { name: 'Technology', emoji: '💻', color: '#3B82F6' },
  { name: 'Politics',   emoji: '🏛',  color: '#8B5CF6' },
  { name: 'Business',   emoji: '📈',  color: '#22C55E' },
  { name: 'Science',    emoji: '🔬',  color: '#06B6D4' },
  { name: 'Sports',     emoji: '⚽',  color: '#FF8C42' },
  { name: 'Health',     emoji: '🏥',  color: '#EC4899' },
  { name: 'Culture',    emoji: '🎭',  color: '#F59E0B' },
  { name: 'Travel',     emoji: '✈️',  color: '#10B981' },
]

function CategoryGrid() {
  return (
    <div className={styles.categories}>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.name}
          to={`/category/${cat.name.toLowerCase()}`}
          className={styles.catChip}
          style={{ '--cat-color': cat.color }}
        >
          <span className={styles.catEmoji}>{cat.emoji}</span>
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
