import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { adminAPI, contentAPI } from '@/services/api'
import { formatCount, timeAgo } from '@/utils/helpers'
import styles from './AdminPanel.module.css'

const NAV = [
  { to: '/admin',          label: 'Analytics', icon: '📊' },
  { to: '/admin/content',  label: 'Content',   icon: '📝' },
  { to: '/admin/users',    label: 'Users',      icon: '👥' }
]

export default function AdminPanel() {
  const location = useLocation()
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.dot} /> Disk Studio
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className={`${styles.navItem} ${location.pathname === to ? styles.active : ''}`}>
              <span>{icon}</span> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <Routes>
          <Route index          element={<Analytics />} />
          <Route path="content" element={<ContentManager />} />
          <Route path="users"   element={<UserManager />} />
        </Routes>
      </main>
    </div>
  )
}

function Analytics() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getAnalytics().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 24 }}>Loading analytics…</p>
  if (!data)   return <p style={{ color: 'var(--accent)', padding: 24 }}>Failed to load analytics</p>

  return (
    <div>
      <h1 className={styles.pageTitle}>Analytics</h1>
      <div className={styles.statsRow}>
        <StatBox label="Total users"   value={formatCount(data.totalUsers)} />
        <StatBox label="Published"     value={formatCount(data.totalContent)} />
        <StatBox label="Premium users" value={formatCount(data.totalPremium)} accent />
        <StatBox label="Revenue est."  value={`$${(data.totalPremium * 9).toLocaleString()}/mo`} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Content by type</h3>
          {data.contentByType?.map(c => (
            <div key={c._id} className={styles.typeRow}>
              <span className={styles.typeLabel}>{c._id}</span>
              <div className={styles.typeBar}>
                <div className={styles.typeBarFill} style={{ width: `${Math.min((c.count / data.totalContent) * 100, 100)}%` }} />
              </div>
              <span className={styles.typeCount}>{c.count}</span>
            </div>
          ))}
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Top content</h3>
          {data.topContent?.map((item, i) => (
            <div key={item._id} className={styles.topItem}>
              <span className={styles.topRank}>{i + 1}</span>
              <div className={styles.topInfo}>
                <p className={styles.topTitle}>{item.title}</p>
                <p className={styles.topMeta}>{formatCount(item.views)} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, accent }) {
  return (
    <div className={styles.statBox}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${accent ? styles.accentVal : ''}`}>{value}</p>
    </div>
  )
}

function ContentManager() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)

  useEffect(() => {
    contentAPI.getAll({ page, limit: 15, status: 'all', sort: '-createdAt' })
      .then(r => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await contentAPI.delete(id)
      setItems(prev => prev.filter(i => i._id !== id))
    } catch { alert('Failed to delete') }
  }

  return (
    <div>
      <div className={styles.tableHeader}>
        <h1 className={styles.pageTitle}>Content</h1>
        <Link to="/admin/content/new" className={styles.createBtn}>+ New content</Link>
      </div>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Title</span><span>Type</span><span>Status</span><span>Views</span><span>Date</span><span></span>
          </div>
          {items.map(item => (
            <div key={item._id} className={styles.tableRow}>
              <span className={styles.rowTitle}>{item.title}</span>
              <span className={styles.typePill}>{item.type}</span>
              <span className={`${styles.statusPill} ${item.status === 'published' ? styles.statusPub : item.status === 'breaking' ? styles.statusBreaking : styles.statusDraft}`}>
                {item.status}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatCount(item.views || 0)}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(item.createdAt)}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/content/${item.slug}`} className={styles.rowBtn}>View</Link>
                <button onClick={() => handleDelete(item._id)} className={`${styles.rowBtn} ${styles.rowBtnDanger}`}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserManager() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getUsers({ limit: 20 }).then(r => setUsers(r.data.users)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateRole = async (id, role) => {
    try {
      const { data } = await adminAPI.updateUser(id, { role })
      setUsers(prev => prev.map(u => u._id === id ? data.user : u))
    } catch { alert('Failed to update') }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Users</h1>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Name</span><span>Email</span><span>Plan</span><span>Role</span><span>Joined</span>
          </div>
          {users.map(u => (
            <div key={u._id} className={styles.tableRow}>
              <span className={styles.rowTitle}>{u.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</span>
              <span className={`${styles.typePill} ${u.plan !== 'free' ? styles.premPill : ''}`}>{u.plan}</span>
              <select
                value={u.role}
                onChange={e => updateRole(u._id, e.target.value)}
                className={styles.roleSelect}
              >
                <option value="user">user</option>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(u.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
