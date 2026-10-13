import type { Transaction } from '@/types/api'
import { Button } from '@/components/ui'
import { TransactionRow } from './TransactionRow'
import { StateMessage } from './StateMessage'
import type { ListState } from './transactionPageTypes'
import type { TransactionGroup } from './transactionUtils'
import styles from './TransactionsPageClient.module.css'

interface TransactionsListProps {
  state: ListState
  groups: TransactionGroup[]
  activeFilters: boolean
  clearFilters: () => void
  retry: () => void
  selectTransaction: (transaction: Transaction) => void
}

export function TransactionsList({
  state,
  groups,
  activeFilters,
  clearFilters,
  retry,
  selectTransaction,
}: TransactionsListProps) {
  if (state.status === 'loading') return <ListSkeleton />

  if (state.status === 'error' && state.data.length === 0) {
    return (
      <StateMessage
        tone="danger"
        icon="alert"
        title="We couldn't load your transactions"
        description="Check your connection and try again."
        action={
          <Button iconLeft="refresh" onClick={retry}>
            Try again
          </Button>
        }
      />
    )
  }

  if (state.data.length === 0) {
    return activeFilters ? (
      <StateMessage
        icon="search"
        title="No transactions match your filters"
        description="Try a different search term or remove some filters."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <StateMessage
        icon="inbox"
        title="No transactions yet"
        description="When you add money, send a transfer or pay with your card, it will show up here."
      />
    )
  }

  return (
    <>
      {state.error && (
        <div className={styles.inlineError} role="status">
          {state.error}
          <Button variant="ghost" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className={styles.dayHeading}>{group.label}</h3>
          {group.transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} onSelect={selectTransaction} />
          ))}
        </section>
      ))}
    </>
  )
}

function ListSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Loading transactions">
      <div className={styles.skeletonDay} />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={styles.skeletonCircle} />
          <span className={styles.skeletonMain}>
            <span />
            <span />
          </span>
          <span className={styles.skeletonEnd}>
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  )
}
