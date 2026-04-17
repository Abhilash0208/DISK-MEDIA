import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { subscriptionAPI } from '@/services/api'
import useAuthStore from '@/store/authStore'
import { toast } from 'react-toastify'
import styles from './PricingPage.module.css'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: '',
    color: 'var(--text-muted)',
    features: [
      '5 premium articles/month',
      'Ad-supported experience',
      '480p video quality',
      'Public podcasts only',
      'Basic search',
      'Community access'
    ],
    cta: 'Get started free',
    highlighted: false
  },
  {
    id: 'premium', name: 'Premium', price: 9, period: '/mo',
    color: 'var(--accent)',
    features: [
      'Unlimited premium articles',
      'Completely ad-free',
      '1080p HD video quality',
      'All podcasts + offline download',
      'Live stream access',
      'Advanced search & filters',
      'Early access to new features',
      'Priority email support'
    ],
    cta: 'Start Premium',
    highlighted: true
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 29, period: '/mo',
    color: 'var(--blue)',
    features: [
      'Everything in Premium',
      '5 team member seats',
      'Content publishing access',
      'Creator analytics dashboard',
      'Revenue sharing (70/30)',
      'API access',
      'Custom integrations',
      'Dedicated account support'
    ],
    cta: 'Start Enterprise',
    highlighted: false
  }
]

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel at any time from your dashboard. Your subscription remains active until the end of the billing period.' },
  { q: 'Is there a free trial?', a: 'Premium includes a 7-day free trial. No charge until the trial ends — cancel before then and you won\'t be billed.' },
  { q: 'How does team billing work?', a: 'Enterprise plans cover 5 seats. You can invite team members via your dashboard. Additional seats can be purchased.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards via Stripe. Your payment info is never stored on our servers.' },
  { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time. Upgrades are prorated; downgrades take effect at the next billing cycle.' }
]

export default function PricingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [yearly,  setYearly]  = useState(false)

  const handleSubscribe = async (planId) => {
    if (planId === 'free') { navigate('/register'); return }
    if (!user) { navigate('/login'); return }
    if (user.plan === planId) { toast.info('You\'re already on this plan'); return }

    setLoading(planId)
    try {
      const { data } = await subscriptionAPI.createCheckout(planId)
      window.location.href = data.url  // Redirect to Stripe Checkout
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.tag}>Simple pricing</div>
        <h1 className={styles.title}>Invest in your media experience</h1>
        <p className={styles.subtitle}>
          Join thousands of readers, watchers, and listeners who get more from Disk Media.
        </p>

        {/* Billing toggle */}
        <div className={styles.toggle}>
          <span className={!yearly ? styles.toggleActive : styles.toggleLabel}>Monthly</span>
          <button
            className={styles.toggleBtn}
            onClick={() => setYearly(v => !v)}
            aria-label="Toggle billing period"
          >
            <span className={`${styles.toggleThumb} ${yearly ? styles.toggleOn : ''}`} />
          </button>
          <span className={yearly ? styles.toggleActive : styles.toggleLabel}>
            Yearly <span className={styles.saveBadge}>Save 20%</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className={styles.plans}>
        {PLANS.map(plan => {
          const displayPrice = yearly && plan.price > 0
            ? Math.round(plan.price * 0.8)
            : plan.price
          const isCurrent = user?.plan === plan.id

          return (
            <div
              key={plan.id}
              className={`${styles.plan} ${plan.highlighted ? styles.highlighted : ''}`}
            >
              {plan.highlighted && (
                <div className={styles.popularBadge}>Most popular</div>
              )}

              <div className={styles.planHeader}>
                <h2 className={styles.planName} style={{ color: plan.color }}>{plan.name}</h2>
                <div className={styles.planPrice}>
                  {displayPrice === 0
                    ? <span className={styles.priceNum}>Free</span>
                    : <>
                        <span className={styles.priceCurr}>$</span>
                        <span className={styles.priceNum}>{displayPrice}</span>
                        <span className={styles.pricePer}>
                          {yearly ? '/mo, billed yearly' : plan.period}
                        </span>
                      </>
                  }
                </div>
              </div>

              <ul className={styles.features}>
                {plan.features.map(f => (
                  <li key={f} className={styles.feature}>
                    <CheckIcon color={plan.color} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.cta} ${plan.highlighted ? styles.ctaAccent : styles.ctaOutline} ${isCurrent ? styles.ctaCurrent : ''}`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading || isCurrent}
              >
                {loading === plan.id
                  ? <Spinner />
                  : isCurrent
                    ? 'Current plan ✓'
                    : plan.cta
                }
              </button>

              {plan.id === 'premium' && (
                <p className={styles.trial}>7-day free trial · No credit card required</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature comparison note */}
      <div className={styles.note}>
        <LockIcon /> All plans include secure payments via Stripe. Cancel anytime from your dashboard.
      </div>

      {/* FAQ */}
      <section className={styles.faq}>
        <h2 className={styles.faqTitle}>Frequently asked questions</h2>
        <div className={styles.faqGrid}>
          {FAQS.map(({ q, a }) => (
            <div key={q} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{q}</h3>
              <p className={styles.faqA}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <div className={styles.bottom}>
        <p className={styles.bottomText}>Still have questions?</p>
        <a href="mailto:support@diskmedia.com" className={styles.bottomLink}>Contact support →</a>
      </div>
    </div>
  )
}

const CheckIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
