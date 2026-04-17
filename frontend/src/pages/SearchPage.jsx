import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchAPI } from '@/services/api'
import MediaCard from '@/components/content/MediaCard'
import SkeletonCard from '@/components/common/SkeletonCard'
import styles from './SearchPage.module.css'

const TYPES      = ['', 'article', 'video', 'podcast', 'live']
const CATEGORIES = ['', 'Technology', 'Politics', 'Business', 'Science', 'Sports', 'Entertainment', 'Health', 'Travel']

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q        = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || ''
  const catParam  = searchParams.get('category') || ''

  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [total,    setTotal]    = useState(0)
  const [type,     setType]     = useState(typeParam)
  const [category, setCategory] = useState(catParam)

  useEffect(() => {
    if (!q.trim()) return
    const run = async () => {
      setLoading(true)
      try {
        const { data } = await searchAPI.search(q, { type: type || undefined, category: category || undefined })
        setResults(data.results)
        setTotal(data.total)
      } catch (_) {}
      finally { setLoading(false) }
    }
    run()
  }, [q, type, category])

  const setFilter = (key, val) => {
    const params = new URLSearchParams(searchParams)
    if (val) params.set(key, val)
    else params.delete(key)
    setSearchParams(params)
    if (key === 'type')     setType(val)
    if (key === 'category') setCategory(val)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.query}>
          {q ? <>Results for <span>"{q}"</span></> : 'Search'}
        </h1>
        {total > 0 && <p className={styles.count}>{total} results found</p>}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type</span>
          {TYPES.map(t => (
            <button
              key={t || 'all'}
              className={`${styles.filterChip} ${type === t ? styles.active : ''}`}
              onClick={() => setFilter('type', t)}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>
          <select
            className={styles.select}
            value={category}
            onChange={e => setFilter('category', e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c || 'all'} value={c}>{c || 'All categories'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} variant="card" />)}
        </div>
      ) : results.length > 0 ? (
        <div className={styles.grid}>
          {results.map(item => <MediaCard key={item._id} item={item} variant="card" />)}
        </div>
      ) : q ? (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>No results for "<strong>{q}</strong>"</p>
          <p className={styles.emptySub}>Try different keywords or remove filters.</p>
        </div>
      ) : (
        <div className={styles.empty}>
          <span>💡</span>
          <p>Start typing to search across all content</p>
        </div>
      )}
    </div>
  )
}
