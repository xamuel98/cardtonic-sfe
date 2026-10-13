import type { ReactNode } from 'react'
import { Icon } from '@/components/ui'
import styles from './TransactionsPageClient.module.css'

interface StateMessageProps {
  tone?: 'primary' | 'danger'
  icon: 'alert' | 'inbox' | 'search'
  title: string
  description: string
  action?: ReactNode
}

export function StateMessage({ tone = 'primary', icon, title, description, action }: StateMessageProps) {
  return (
    <div className={styles.state}>
      <span className={tone === 'danger' ? styles.stateIconDanger : styles.stateIcon}>
        <Icon name={icon} size={24} />
      </span>
      <div className={styles.stateText}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
