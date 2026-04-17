import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { subscriptionAPI, contentAPI } from '@/services/api'
import { timeAgo } from '@/utils/helpers'
import { toast } from 'react-toastify'
import MediaCard from '@/components/content/MediaCard'
import styles from './DashboardPage.module.css'

const NAV = [
  { to: '/dashboard',           label: 'Overview',     icon: '📊' },
  { to: '/dashboard/saved',     label: 'Saved',        icon: '🔖' },
  { to: '/dashboard/settings',  label: 'Settings',     icon: '⚙️' },
  { to: '/dashboard/billing',   label: 'Billing',      icon: '💳' }
]

export default function DashboardPage() {
  const location = useLocation()
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Dashboard</h2>
        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.navItem} ${location.pathname === to ? styles.active : ''}`}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <Routes>
          <Route index             element={<Overview />} />
          <Route path="saved"      element={<SavedItems />} />
          <Route path="settings"   element={<Settings />} />
          <Route path="billing"    element={<Billing />} />
        </Routes>
      </main>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview() {
  const { user } = useAuthStore()
  return (
    <div>
      <h1 className={styles.pageTitle}>Welcome back, {user?.name?.split(' ')[0]}</h1>
      <div className={styles.statsGrid}>
        <StatCard label="Plan" value={user?.plan?.toUpperCase() || 'FREE'} accent />
        <StatCard label="Member since" value={new Date(user?.createdAt).getFullYear()} />
        <StatCard label="Interests" value={user?.interests?.length || 0} />
        <StatCard label="Saved items" value={user?.savedItems?.length || 0} />
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Your interests</h3>
        <div className={styles.interests}>
          {user?.interests?.length > 0
            ? user.interests.map(i => <span key={i} className={styles.interestChip}>{i}</span>)
            : <p className={styles.empty}>No interests set yet. Update in Settings.</p>
          }
        </div>
      </div>

      {user?.plan === 'free' && (
        <div className={styles.upgradeBanner}>
          <div>
            <h3>Upgrade to Premium</h3>
            <p>Get unlimited articles, HD video, ad-free experience and more for just $9/mo.</p>
          </div>
          <Link to="/pricing" className={styles.upgradeBtn}>Upgrade now →</Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${accent ? styles.accentValue : ''}`}>{value}</p>
    </div>
  )
}

// ── Saved Items ───────────────────────────────────────────────────────────────
function SavedItems() {
  const { user } = useAuthStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user?.savedItems?.length) { setLoading(false); return }
      try {
        const results = await Promise.all(
          user.savedItems.slice(0, 20).map(id => contentAPI.getBySlug(id).catch(() => null))
        )
        setItems(results.filter(Boolean).map(r => r.data.item))
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchSaved()
  }, [user?.savedItems])

  return (
    <div>
      <h1 className={styles.pageTitle}>Saved items</h1>
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <span>🔖</span>
          <p>Nothing saved yet. Tap the bookmark icon on any article or video.</p>
          <Link to="/" className={styles.emptyLink}>Browse content →</Link>
        </div>
      ) : (
        <div className={styles.savedGrid}>
          {items.map(item => <MediaCard key={item._id} item={item} variant="card" />)}
        </div>
      )}
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
const ALL_INTERESTS = ['Technology','Politics','Business','Science','Sports','Entertainment','Health','Travel','Culture','Finance','Environment','Education']

function Settings() {
  const { user, updateProfile, isLoading } = useAuthStore()
  const [form, setForm] = useState({
    name:      user?.name || '',
    bio:       user?.bio  || '',
    website:   user?.website || '',
    language:  user?.language || 'en',
    interests: user?.interests || []
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await updateProfile(form)
    if (result.success) toast.success('Profile updated!')
    else toast.error(result.message)
  }

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter(x => x !== i)
        : [...f.interests, i]
    }))
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Account settings</h1>
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formSection}>
          <h3 className={styles.sectionLabel}>Profile</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Full name</label>
              <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Website</label>
              <input className={styles.input} value={form.website} placeholder="https://yoursite.com" onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Bio</label>
              <textarea className={styles.textarea} rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself…" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Language</label>
              <select className={styles.input} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionLabel}>Interests ({form.interests.length} selected)</h3>
          <div className={styles.interestGrid}>
            {ALL_INTERESTS.map(i => (
              <button
                key={i} type="button"
                className={`${styles.interestBtn} ${form.interests.includes(i) ? styles.interestOn : ''}`}
                onClick={() => toggleInterest(i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

// ── Billing ───────────────────────────────────────────────────────────────────
function Billing() {
  const { user } = useAuthStore()
  const [sub, setSub]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    subscriptionAPI.getStatus()
      .then(r => setSub(r.data.subscription))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async () => {
    if (!window.confirm('Cancel at end of billing period?')) return
    setCanceling(true)
    try {
      await subscriptionAPI.cancel()
      toast.success('Subscription will cancel at period end')
      setSub(s => ({ ...s, cancelAtPeriodEnd: true }))
    } catch { toast.error('Could not cancel subscription') }
    finally { setCanceling(false) }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Billing & subscription</h1>
      {loading ? <p className={styles.empty}>Loading…</p> : (
        <>
          <div className={styles.card}>
            <div className={styles.billingRow}>
              <div>
                <p className={styles.billingLabel}>Current plan</p>
                <p className={styles.billingValue}>{user?.plan?.toUpperCase()}</p>
              </div>
              {sub && (
                <div>
                  <p className={styles.billingLabel}>Renews</p>
                  <p className={styles.billingValue}>
                    {sub.cancelAtPeriodEnd
                      ? `Cancels ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                      : new Date(sub.currentPeriodEnd).toLocaleDateString()
                    }
                  </p>
                </div>
              )}
              <div>
                <p className={styles.billingLabel}>Status</p>
                <p className={`${styles.billingValue} ${sub?.status === 'active' ? styles.statusActive : styles.statusWarning}`}>
                  {sub?.status || 'free'}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.billingActions}>
            {user?.plan === 'free' ? (
              <Link to="/pricing" className={styles.upgradeBtn}>Upgrade plan →</Link>
            ) : (
              <>
                <Link to="/pricing" className={styles.outlineBtn}>Change plan</Link>
                {!sub?.cancelAtPeriodEnd && (
                  <button className={styles.cancelBtn} onClick={handleCancel} disabled={canceling}>
                    {canceling ? 'Canceling…' : 'Cancel subscription'}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
