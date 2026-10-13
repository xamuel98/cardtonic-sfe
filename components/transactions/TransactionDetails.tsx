'use client'

import { formatDateTime, formatMoney, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { Button, Icon } from '@/components/ui'
import { ReferenceValue } from './ReferenceValue'
import { StatusBadge } from './StatusBadge'
import { StateMessage } from './StateMessage'
import { TransactionDetailsSection, TransactionDetailsSkeleton } from './TransactionDetailsSection'
import type { DetailState } from './transactionPageTypes'
import {
  formatSignedTransactionAmount,
  formatTransactionTotal,
  getCounterpartyInitials,
  isCreditTransaction,
} from './transactionUtils'
import styles from './TransactionsPageClient.module.css'

interface TransactionDetailsProps {
  state: DetailState
  retry: () => void
  close: () => void
}

export function TransactionDetails({ state, retry, close }: TransactionDetailsProps) {
  if (state.status === 'loading') return <TransactionDetailsSkeleton />

  if (state.status === 'not-found') {
    return (
      <StateMessage
        icon="search"
        title="Transaction not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Button variant="secondary" onClick={close}>
            Back to transactions
          </Button>
        }
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StateMessage
        tone="danger"
        icon="alert"
        title="We couldn’t load this transaction"
        description={state.error ?? 'Check your connection and try again.'}
        action={
          <Button iconLeft="refresh" onClick={retry}>
            Try again
          </Button>
        }
      />
    )
  }

  if (!state.transaction) return null

  const transaction = state.transaction
  const isCredit = isCreditTransaction(transaction.type)
  const initials = getCounterpartyInitials(transaction.counterparty)
  const heroTitle = transaction.counterparty
    ? `${TRANSACTION_TYPE_LABELS[transaction.type]} ${isCredit ? 'from' : 'to'} ${transaction.counterparty}`
    : transaction.narration

  return (
    <div className={styles.details}>
      <div className={styles.detailsHero}>
        <span className={styles.detailsAvatar}>{initials || <Icon name="receipt" size={22} />}</span>
        <p>{heroTitle}</p>
        <strong className={isCredit ? styles.detailsCredit : undefined}>
          {formatSignedTransactionAmount(transaction)}
        </strong>
        <StatusBadge status={transaction.status} />
      </div>

      <TransactionDetailsSection
        title="Details"
        rows={[
          ['Reference', <ReferenceValue key="reference" reference={transaction.reference} />],
          ['Date', formatDateTime(transaction.createdAt)],
          ['Type', TRANSACTION_TYPE_LABELS[transaction.type]],
          ['Counterparty', transaction.counterparty ?? '—'],
          ['Narration', transaction.narration],
        ]}
      />

      <TransactionDetailsSection
        title="Summary"
        rows={[
          ['Amount', formatMoney(transaction.amount, transaction.currency)],
          ['Fee', formatMoney(transaction.fee, transaction.currency)],
          ['Total', formatTransactionTotal(transaction)],
        ]}
        emphasizeLast
      />
    </div>
  )
}
