'use client'

import { Card, Drawer } from '@/components/ui'
import { TransactionDetails } from './TransactionDetails'
import { TransactionsFilters } from './TransactionsFilters'
import { TransactionsList } from './TransactionsList'
import { TransactionsPagination } from './TransactionsPagination'
import { useTransactionDetail } from './hooks/useTransactionDetail'
import { useTransactionsList } from './hooks/useTransactionsList'
import { useTransactionsUrlState } from './hooks/useTransactionsUrlState'
import styles from './TransactionsPageClient.module.css'

export function TransactionsPageClient() {
  const {
    urlState,
    activeFilters,
    updateSearch,
    updateType,
    updateStatus,
    updatePage,
    replacePage,
    clearFilters,
    selectTransaction,
    closeDetails,
  } = useTransactionsUrlState()
  const { listState, groups, retryList } = useTransactionsList(urlState, replacePage)
  const { detailState, retryDetail } = useTransactionDetail(urlState.selectedId)
  const total = listState.meta?.total
  const subtitle =
    listState.status === 'loading' && total === undefined
      ? 'Loading transactions'
      : total === 1
        ? '1 transaction'
        : `${total ?? 0} transactions`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <TransactionsFilters
        urlState={urlState}
        activeFilters={activeFilters}
        onSearchChange={updateSearch}
        onTypeChange={updateType}
        onStatusChange={updateStatus}
        onClearFilters={clearFilters}
      />

      <Card padding="none" className={styles.listCard} aria-labelledby="transactions-heading">
        <h2 id="transactions-heading" className="visually-hidden">
          Transaction history
        </h2>
        <div aria-busy={listState.isRefetching || listState.status === 'loading'}>
          {listState.isRefetching && <div className={styles.refetching}>Updating transactions…</div>}
          <TransactionsList
            state={listState}
            groups={groups}
            activeFilters={activeFilters}
            clearFilters={clearFilters}
            retry={retryList}
            selectTransaction={selectTransaction}
          />
        </div>
      </Card>

      {listState.meta && listState.status !== 'error' && listState.data.length > 0 && (
        <TransactionsPagination
          meta={listState.meta}
          count={listState.data.length}
          onPageChange={updatePage}
        />
      )}

      <Drawer open={Boolean(urlState.selectedId)} title="Transaction details" onClose={closeDetails}>
        <TransactionDetails state={detailState} retry={retryDetail} close={closeDetails} />
      </Drawer>
    </div>
  )
}
