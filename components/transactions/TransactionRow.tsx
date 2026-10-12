import type { Transaction, TransactionType } from '@/types/api'
import { Icon, type IconName } from '@/components/ui'
import { formatMoney, formatTime, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { StatusBadge } from './StatusBadge'
import styles from './TransactionRow.module.css'
import {
  formatSignedTransactionAmount,
  getCounterpartyInitials,
  isCreditTransaction,
} from './transactionUtils'

const TYPE_ICONS: Record<TransactionType, IconName> = {
  deposit: 'arrow-down-left',
  transfer_in: 'arrow-down-left',
  withdrawal: 'arrow-up-right',
  transfer_out: 'arrow-up-right',
  conversion: 'swap',
  card_payment: 'card',
  bill_payment: 'receipt',
}

export interface TransactionRowProps {
  transaction: Transaction
  onSelect?: (transaction: Transaction) => void
}

export function TransactionRow({ transaction: tx, onSelect }: TransactionRowProps) {
  const isCredit = isCreditTransaction(tx.type)
  const initials =
    tx.type === 'transfer_in' || tx.type === 'transfer_out' ? getCounterpartyInitials(tx.counterparty) : ''

  return (
    <button type="button" className={styles.row} onClick={() => onSelect?.(tx)}>
      {initials ? (
        <span className={styles.initials} aria-hidden>
          {initials}
        </span>
      ) : (
        <span className={styles.icon} aria-hidden>
          <Icon name={TYPE_ICONS[tx.type]} size={18} />
        </span>
      )}
      <span className={styles.main}>
        <span className={styles.title}>{TRANSACTION_TYPE_LABELS[tx.type]}</span>
        <span className={styles.narration}>{tx.narration}</span>
      </span>
      <span className={styles.status}>
        <StatusBadge status={tx.status} />
      </span>
      <span className={styles.end}>
        <span className={isCredit ? styles.credit : styles.amount}>{formatSignedTransactionAmount(tx)}</span>
        <span className={styles.mobileStatus}>
          <StatusBadge status={tx.status} />
        </span>
        <span className={styles.meta}>
          {formatTime(tx.createdAt)}
          {tx.fee > 0 && ` · Fee ${formatMoney(tx.fee, tx.currency)}`}
        </span>
      </span>
    </button>
  )
}
