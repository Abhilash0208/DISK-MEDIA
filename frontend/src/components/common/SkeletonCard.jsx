import styles from './SkeletonCard.module.css'

export default function SkeletonCard({ variant = 'card' }) {
  if (variant === 'horizontal') {
    return (
      <div className={styles.horizontal}>
        <div className={`${styles.hThumb} skeleton`} />
        <div className={styles.hBody}>
          <div className={`${styles.line} ${styles.short} skeleton`} />
          <div className={`${styles.line} ${styles.full} skeleton`} />
          <div className={`${styles.line} ${styles.medium} skeleton`} />
          <div className={`${styles.line} ${styles.short} skeleton`} />
        </div>
      </div>
    )
  }
  return (
    <div className={styles.card}>
      <div className={`${styles.thumb} skeleton`} />
      <div className={styles.body}>
        <div className={`${styles.line} ${styles.short} skeleton`} />
        <div className={`${styles.line} ${styles.full} skeleton`} />
        <div className={`${styles.line} ${styles.medium} skeleton`} />
        <div className={`${styles.line} ${styles.short} skeleton`} />
      </div>
    </div>
  )
}
