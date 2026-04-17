// CategoryPage.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useContentStore from '@/store/contentStore'
import useInfiniteScroll from '@/hooks/useInfiniteScroll'
import MediaCard from '@/components/content/MediaCard'
import SkeletonCard from '@/components/common/SkeletonCard'
import { capitalize } from '@/utils/helpers'

export function CategoryPage({ type }) {
  const { slug } = useParams()
  const category  = slug ? capitalize(slug) : undefined
  const contentType = type

  const { feed, fetchFeed, isLoading, hasMore, reset } = useContentStore()

  useEffect(() => {
    reset()
    // fetchFeed accepts a filter — in a real app you'd extend the store to accept params
    fetchFeed(true)
  }, [slug, type])

  const lastRef = useInfiniteScroll(() => fetchFeed(), hasMore, isLoading)
  const title   = category || (contentType ? capitalize(contentType) + 's' : 'Browse')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 32 }}>
        {title}
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {feed.map((item, i) => (
          <div key={item._id} ref={i === feed.length - 1 ? lastRef : null}>
            <MediaCard item={item} variant="card" />
          </div>
        ))}
        {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      {!hasMore && feed.length > 0 && (
        <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
          You're all caught up 🎉
        </p>
      )}
    </div>
  )
}

// LivePage.jsx

import { contentAPI } from '@/services/api'

export function LivePage() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentAPI.getAll({ type: 'live', status: 'published' })
      .then(r => setStreams(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>Live Now</h1>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading streams…</p>
      ) : streams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>📡</p>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>No live streams right now</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Check back soon or enable notifications to get alerted.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {streams.map(stream => (
            <div key={stream._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {stream.thumbnailUrl && (
                <div style={{ position: 'relative' }}>
                  <img src={stream.thumbnailUrl} alt={stream.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontFamily: 'var(--font-display)' }}>● LIVE</span>
                </div>
              )}
              <div style={{ padding: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{stream.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{stream.author?.name}</p>
                {stream.streamUrl && (
                  <a href={stream.streamUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    Watch live →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// NotFoundPage.jsx
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 800, color: 'var(--accent)', lineHeight: 1, marginBottom: 16 }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Page not found</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360 }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" style={{ padding: '12px 28px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        Go home →
      </Link>
    </div>
  )
}

// ResetPasswordPage.jsx

import { useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'

export function ResetPasswordPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const token       = params.get('token') || ''
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (pw.length < 8) { setErr('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword({ token, password: pw })
      navigate('/')
    } catch (e) {
      setErr(e.response?.data?.message || 'Invalid or expired token')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Set new password</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Enter your new password below.</p>
        {err && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>{err}</p>}
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="password" value={pw} onChange={e => { setPw(e.target.value); setErr('') }}
            placeholder="New password (min. 8 chars)"
            style={{ padding: '11px 14px', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" disabled={loading}
            style={{ padding: 13, background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CategoryPage
