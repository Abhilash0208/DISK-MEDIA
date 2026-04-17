import styles from './PageLoader.module.css'

export default function PageLoader() {
  return (
    <div className={styles.wrap} role="status" aria-label="Loading">
      <div className={styles.logo}>
        <span className={styles.dot} />
        Disk
      </div>
      <div className={styles.spinner} />
    </div>
  )
}
