import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { validators } from '@/utils/helpers'
import styles from './AuthPages.module.css'

const INTERESTS = [
  'Technology', 'Politics', 'Business', 'Science',
  'Sports', 'Entertainment', 'Health', 'Travel',
  'Culture', 'Finance', 'Environment', 'Education'
]

export default function RegisterPage() {
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = credentials, 2 = interests
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', interests: []
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => { if (isAuthenticated) navigate('/') }, [isAuthenticated])
  useEffect(() => { clearError() }, [])

  // Password strength meter
  useEffect(() => {
    const p = form.password
    let score = 0
    if (p.length >= 8)           score++
    if (/[A-Z]/.test(p))         score++
    if (/[0-9]/.test(p))         score++
    if (/[^A-Za-z0-9]/.test(p))  score++
    setPasswordStrength(score)
  }, [form.password])

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f97316', '#facc15', '#22c55e'][passwordStrength]

  const validateStep1 = () => {
    const e = {}
    if (!validators.required(form.name))      e.name     = 'Name is required'
    if (!validators.email(form.email))        e.email    = 'Enter a valid email'
    if (!validators.password(form.password))  e.password = 'At least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const toggleInterest = (interest) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest]
    }))
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.interests.length < 3) {
      setErrors({ interests: 'Select at least 3 interests' })
      return
    }
    const { confirmPassword, ...payload } = form
    await register(payload)
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.card} style={{ maxWidth: step === 2 ? 480 : 420 }}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoDot} />
          Disk
        </Link>

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1</div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>
            {step === 1 ? 'Create your account' : 'What are you into?'}
          </h1>
          <p className={styles.subtitle}>
            {step === 1
              ? 'Join Disk Media — free, always'
              : 'Pick 3+ topics to personalize your feed'
            }
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <ErrorIcon />
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className={styles.form}>
            {/* Name */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Full name</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><UserIcon /></span>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Jane Doe"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                />
              </div>
              {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-email">Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><MailIcon /></span>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                />
              </div>
              {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-password">Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><LockIcon /></span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                />
                <button
                  type="button"
                  className={styles.showPw}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password"
                >
                  <EyeIcon />
                </button>
              </div>
              {form.password && (
                <div className={styles.strengthRow}>
                  <div className={styles.strengthBar}>
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={styles.strengthSegment}
                        style={{ background: i <= passwordStrength ? strengthColor : undefined }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
              {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-pw">Confirm password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><LockIcon /></span>
                <input
                  id="confirm-pw"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className={styles.fieldError}>{errors.confirmPassword}</p>
              )}
            </div>

            <button type="button" className={styles.submitBtn} onClick={handleNext}>
              Continue →
            </button>

            <div className={styles.divider}><span>or</span></div>
            <button className={styles.googleBtn} type="button">
              <GoogleIcon />
              Continue with Google
            </button>

            <p className={styles.switchText}>
              Already have an account?{' '}
              <Link to="/login" className={styles.switchLink}>Sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.interestGrid}>
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`${styles.interestChip} ${
                    form.interests.includes(interest) ? styles.interestSelected : ''
                  }`}
                >
                  {form.interests.includes(interest) && <CheckIcon />}
                  {interest}
                </button>
              ))}
            </div>
            {errors.interests && (
              <p className={styles.fieldError} style={{ textAlign: 'center' }}>{errors.interests}</p>
            )}
            <div className={styles.interestCount}>
              {form.interests.length}/3 selected minimum
            </div>

            <div className={styles.row}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isLoading} style={{ flex: 1 }}>
                {isLoading ? <Spinner /> : 'Create account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:'spin 0.8s linear infinite'}}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)
