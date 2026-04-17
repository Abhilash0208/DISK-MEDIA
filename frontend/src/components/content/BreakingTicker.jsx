import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './BreakingTicker.module.css'

export default function BreakingTicker({ items }) {
  const trackRef = useRef()

  // Pause animation on hover
  const handleMouseEnter = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'paused' }
  const handleMouseLeave = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'running' }

  if (!items?.length) return null

  // Duplicate items for seamless loop
  const loopItems = [...items, ...items]

  return (
    <div className={styles.ticker}>
      <div className={styles.label}>
        <span className={styles.dot} />
        BREAKING
      </div>
      <div
        className={styles.track}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.inner} ref={trackRef}>
          {loopItems.map((item, i) => (
            <span key={i} className={styles.item}>
              <Link to={`/content/${item.slug}`} className={styles.link}>
                {item.title}
              </Link>
              <span className={styles.sep} aria-hidden>•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
