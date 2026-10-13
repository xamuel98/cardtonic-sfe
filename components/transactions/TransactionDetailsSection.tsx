import type { ReactNode } from 'react'
import styles from './TransactionsPageClient.module.css'

interface TransactionDetailsSectionProps {
  title: string
  rows: Array<[string, ReactNode]>
  emphasizeLast?: boolean
}

export function TransactionDetailsSection({ title, rows, emphasizeLast }: TransactionDetailsSectionProps) {
  return (
    <section className={styles.detailsSection}>
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={emphasizeLast && index === rows.length - 1 ? styles.totalRow : undefined}
          >
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function TransactionDetailsSkeleton() {
  return (
    <div className={styles.detailsSkeleton} aria-label="Loading transaction details">
      <div className={styles.detailsHero}>
        <span className={styles.skeletonDetailsCircle} />
        <span className={styles.skeletonDetailsTitle} />
        <span className={styles.skeletonDetailsAmount} />
        <span className={styles.skeletonDetailsBadge} />
      </div>
      <div className={styles.skeletonDetailsRows}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  )
}
