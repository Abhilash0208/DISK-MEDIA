import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import { searchAPI } from '@/services/api'
import { timeAgo, cx } from '@/utils/helpers'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { to: '/',         label: 'Home'     },
  { to: '/news',     label: 'News'     },
  { to: '/videos',   label: 'Videos'   },
  { to: '/podcasts', label: 'Podcasts' },
  { to: '/live',     label: 'Live',    live: true },
]

export default function Navbar() {
  const { user, isAdmin, isEditor } = useAuthStore()
  const { theme, toggleTheme, notifCount, notifs, clearNotifCount, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchRef = useRef()
  const notifRef  = useRef()
  const userRef   = useRef()
  const debounceTimer = useRef()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target))  setSearchOpen(false)
      if (!notifRef.current?.contains(e.target))   setNotifOpen(false)
      if (!userRef.current?.contains(e.target))    setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(debounceTimer.current)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const { data } = await searchAPI.search(q, { limit: 5 })
        setSearchResults(data.results)
      } catch (_) {}
      finally { setSearchLoading(false) }
    }, 350)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const handleNotifOpen = () => {
    setNotifOpen(o => !o)
    clearNotifCount()
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        {/* Hamburger on mobile */}
        <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Menu">
          <span /><span /><span />
        </button>

        <Link to="/" className={styles.logo}>
          <span className={styles.logoDot} />
          Disk
        </Link>

        <ul className={styles.links}>
          {NAV_LINKS.map(({ to, label, live }) => (
            <li key={to}>
              <Link
                to={to}
                className={cx(styles.link, location.pathname === to && styles.active)}
              >
                {label}
                {live && <span className={styles.livePulse} />}
              </Link>
            </li>
          ))}
          {(isEditor() || isAdmin()) && (
            <li>
              <Link to="/admin" className={cx(styles.link, styles.editorLink)}>
                Studio
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchWrap} ref={searchRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          {searchOpen && (
            <div className={styles.searchDropdown}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search news, videos, podcasts…"
                  className={styles.searchInput}
                />
              </form>
              {searchLoading && <div className={styles.searchHint}>Searching…</div>}
              {searchResults.length > 0 && (
                <ul className={styles.searchResults}>
                  {searchResults.map(r => (
                    <li key={r._id}>
                      <Link
                        to={`/content/${r.slug}`}
                        className={styles.searchResult}
                        onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                      >
                        <span className={styles.resultType}>{r.type}</span>
                        <span className={styles.resultTitle}>{r.title}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      className={styles.seeAll}
                      onClick={handleSearchSubmit}
                    >
                      See all results for "{searchQuery}" →
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {user ? (
          <>
            {/* Notifications */}
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                className={styles.iconBtn}
                onClick={handleNotifOpen}
                aria-label="Notifications"
              >
                <BellIcon />
                {notifCount > 0 && (
                  <span className={styles.badge}>{notifCount > 9 ? '9+' : notifCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>Notifications</div>
                  {notifs.length === 0 ? (
                    <div className={styles.notifEmpty}>No new notifications</div>
                  ) : (
                    <ul className={styles.notifList}>
                      {notifs.slice(0, 8).map((n, i) => (
                        <li key={i} className={styles.notifItem}>
                          <span className={cx(
                            styles.notifDot,
                            n.type === 'breaking' && styles.red,
                            n.type === 'live' && styles.green
                          )} />
                          <div>
                            <p className={styles.notifTitle}>{n.title}</p>
                            <p className={styles.notifTime}>{timeAgo(n.time)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className={styles.userWrap} ref={userRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setUserMenuOpen(o => !o)}
              >
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className={styles.avatar} />
                  : <span className={styles.avatarInitials}>{user.name?.[0]?.toUpperCase()}</span>
                }
              </button>
              {userMenuOpen && (
                <div className={styles.userMenu}>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>{user.email}</p>
                    {user.plan !== 'free' && (
                      <span className={styles.planBadge}>{user.plan.toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.menuDivider} />
                  <Link to="/dashboard" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                  <Link to="/dashboard/saved" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>Saved</Link>
                  <Link to="/dashboard/settings" className={styles.menuItem} onClick={() => setUserMenuOpen(false)}>Settings</Link>
                  {user.plan === 'free' && (
                    <Link to="/pricing" className={cx(styles.menuItem, styles.upgrade)} onClick={() => setUserMenuOpen(false)}>
                      Upgrade to Premium ↗
                    </Link>
                  )}
                  <div className={styles.menuDivider} />
                  <Link to="/logout" className={cx(styles.menuItem, styles.logout)} onClick={() => setUserMenuOpen(false)}>
                    Sign out
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.authBtns}>
            <Link to="/login" className={styles.loginBtn}>Sign in</Link>
            <Link to="/register" className={styles.registerBtn}>Get started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
