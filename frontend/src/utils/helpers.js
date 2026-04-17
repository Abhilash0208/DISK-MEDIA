// ── Time ───────────────────────────────────────────────────────────────────────
export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  const map = [
    [31536000, 'y'], [2592000, 'mo'], [86400, 'd'],
    [3600, 'h'], [60, 'm'], [1, 's']
  ]
  for (const [div, unit] of map) {
    const val = Math.floor(seconds / div)
    if (val >= 1) return `${val}${unit} ago`
  }
  return 'just now'
}

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export const formatReadTime = (wordCount) => {
  const wpm = 200
  const mins = Math.ceil(wordCount / wpm)
  return `${mins} min read`
}

// ── Numbers ────────────────────────────────────────────────────────────────────
export const formatCount = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── Strings ────────────────────────────────────────────────────────────────────
export const truncate = (str, len = 120) =>
  str?.length > len ? str.slice(0, len) + '…' : str

export const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')

export const capitalize = (str) =>
  str?.charAt(0).toUpperCase() + str?.slice(1)

// ── Classes ────────────────────────────────────────────────────────────────────
export const cx = (...classes) => classes.filter(Boolean).join(' ')

// ── Local storage ─────────────────────────────────────────────────────────────
export const storage = {
  get:    (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
  },
  set:    (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
  remove: (key)      => { try { localStorage.removeItem(key) } catch {} }
}

// ── Validation ────────────────────────────────────────────────────────────────
export const validators = {
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  password: (v) => v.length >= 8,
  required: (v) => v?.toString().trim().length > 0
}

// ── Content type meta ─────────────────────────────────────────────────────────
export const contentMeta = {
  article: { label: 'Article',  icon: '📰', color: '#FF3B5C' },
  video:   { label: 'Video',    icon: '🎬', color: '#3B82F6' },
  podcast: { label: 'Podcast',  icon: '🎙', color: '#FF8C42' },
  live:    { label: 'Live',     icon: '📡', color: '#22C55E' }
}
