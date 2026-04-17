import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { validators } from '@/utils/helpers'
import styles from './AuthPages.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validators.email(email)) { setError('Enter a valid email'); return }
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.card}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoDot} />
          Disk
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.subtitle} style={{ marginBottom: 24 }}>
              We sent a reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              The link expires in 1 hour.
            </p>
            <Link to="/login" className={styles.submitBtn} style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Reset password</h1>
              <p className={styles.subtitle}>
                Enter your email and we'll send a reset link
              </p>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reset-email">Email</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  : 'Send reset link'
                }
              </button>

              <p className={styles.switchText}>
                <Link to="/login" className={styles.switchLink}>← Back to sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
