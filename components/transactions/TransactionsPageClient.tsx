'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { PageMeta, Transaction } from '@/types/api'
import { ApiError } from '@/lib/api/client'
import { getTransaction, getTransactions } from '@/lib/api/endpoints'
import { formatDateTime, formatMoney, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { Button, Card, Drawer, Icon, Input, Select, type SelectOption } from '@/components/ui'
import { TransactionRow } from './TransactionRow'
import { StatusBadge } from './StatusBadge'
import {
  DETAIL_PARAM,
  TRANSACTIONS_LIMIT,
  formatSignedTransactionAmount,
  formatTransactionTotal,
  getCounterpartyInitials,
  getShowingSummary,
  groupTransactions,
  hasActiveFilters,
  isCreditTransaction,
  parseTransactionsUrl,
} from './transactionUtils'
import styles from './TransactionsPageClient.module.css'

const TYPE_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer_in', label: 'Transfer in' },
  { value: 'transfer_out', label: 'Transfer out' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'card_payment', label: 'Card payment' },
  { value: 'bill_payment', label: 'Bill payment' },
]

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const isTerminalTransaction = (transaction: Transaction) =>
  transaction.status === 'successful' || transaction.status === 'failed'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'
type DetailStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error'

interface ListState {
  status: RequestStatus
  data: Transaction[]
  meta?: PageMeta
  error?: string
  isRefetching: boolean
}

interface DetailState {
  status: DetailStatus
  transaction?: Transaction
  error?: string
}

export function TransactionsPageClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const urlState = useMemo(() => parseTransactionsUrl(new URLSearchParams(searchKey)), [searchKey])
  const activeFilters = hasActiveFilters(urlState)
  const searchTimeoutRef = useRef<number | undefined>(undefined)
  const detailCacheRef = useRef(new Map<string, Transaction>())

  const [retryToken, setRetryToken] = useState(0)
  const [detailRetryToken, setDetailRetryToken] = useState(0)
  const [listState, setListState] = useState<ListState>({
    status: 'idle',
    data: [],
    isRefetching: false,
  })
  const [detailState, setDetailState] = useState<DetailState>({ status: 'idle' })

  const updateUrl = useCallback(
    (mutate: (params: URLSearchParams) => void, mode: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      if (params.get('page') === '1') params.delete('page')
      const next = params.toString()
      const href = next ? `${pathname}?${next}` : pathname
      router[mode](href, { scroll: false })
    },
    [pathname, router, searchParams]
  )
  const updateUrlRef = useRef(updateUrl)

  useEffect(() => {
    updateUrlRef.current = updateUrl
  }, [updateUrl])

  const updateSearch = useCallback(
    (value: string) => {
      window.clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = window.setTimeout(() => {
        if (value.trim() === urlState.q) return
        updateUrl((params) => {
          setOptionalParam(params, 'q', value.trim())
          params.delete('page')
        }, 'replace')
      }, 300)
    },
    [updateUrl, urlState.q]
  )

  useEffect(() => () => window.clearTimeout(searchTimeoutRef.current), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    queueMicrotask(() => {
      if (!active) return
      setListState((current) => {
        const hasData = current.data.length > 0 || current.meta !== undefined
        return {
          ...current,
          status: hasData ? current.status : 'loading',
          error: undefined,
          isRefetching: hasData,
        }
      })
    })

    getTransactions(
      {
        page: urlState.page,
        limit: TRANSACTIONS_LIMIT,
        q: urlState.q || undefined,
        type: urlState.type,
        status: urlState.status,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return
        const meta = response.meta
        if (meta && response.data.length === 0 && meta.total > 0 && urlState.page > meta.totalPages) {
          updateUrlRef.current(
            (params) => setOptionalParam(params, 'page', String(meta.totalPages)),
            'replace'
          )
          return
        }

        setListState({
          status: 'success',
          data: response.data,
          meta,
          isRefetching: false,
        })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setListState((current) => ({
          ...current,
          status: current.data.length ? current.status : 'error',
          error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          isRefetching: false,
        }))
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [retryToken, urlState.page, urlState.q, urlState.status, urlState.type])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    if (!urlState.selectedId) {
      queueMicrotask(() => {
        if (active) setDetailState({ status: 'idle' })
      })
      return () => {
        active = false
      }
    }

    const cachedTransaction = detailCacheRef.current.get(urlState.selectedId)
    if (cachedTransaction) {
      queueMicrotask(() => {
        if (active) setDetailState({ status: 'success', transaction: cachedTransaction })
      })
      return () => {
        active = false
      }
    }

    queueMicrotask(() => {
      if (active) setDetailState({ status: 'loading' })
    })

    getTransaction(urlState.selectedId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return
        if (isTerminalTransaction(response.data)) detailCacheRef.current.set(response.data.id, response.data)
        setDetailState({ status: 'success', transaction: response.data })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        if (error instanceof ApiError && error.status === 404) {
          setDetailState({ status: 'not-found' })
          return
        }
        setDetailState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [detailRetryToken, urlState.selectedId])

  const groups = useMemo(() => groupTransactions(listState.data), [listState.data])
  const total = listState.meta?.total
  const subtitle =
    listState.status === 'loading' && total === undefined
      ? 'Loading transactions'
      : total === 1
        ? '1 transaction'
        : `${total ?? 0} transactions`

  const clearFilters = () => {
    window.clearTimeout(searchTimeoutRef.current)
    updateUrl((params) => {
      params.delete('q')
      params.delete('type')
      params.delete('status')
      params.delete('page')
    })
  }

  const closeDetails = () => {
    updateUrl((params) => params.delete(DETAIL_PARAM), 'replace')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div className={styles.filters}>
        <Input
          key={urlState.q}
          label="Search"
          leadingIcon="search"
          defaultValue={urlState.q}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search by reference, name or narration"
          className={styles.searchInput}
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={urlState.type ?? ''}
          onChange={(event) =>
            updateUrl((params) => {
              setOptionalParam(params, 'type', event.target.value)
              params.delete('page')
            })
          }
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={urlState.status ?? ''}
          onChange={(event) =>
            updateUrl((params) => {
              setOptionalParam(params, 'status', event.target.value)
              params.delete('page')
            })
          }
        />
        {activeFilters && (
          <Button variant="ghost" className={styles.clearButton} onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <Card padding="none" className={styles.listCard} aria-labelledby="transactions-heading">
        <h2 id="transactions-heading" className="visually-hidden">
          Transaction history
        </h2>
        <div aria-busy={listState.isRefetching || listState.status === 'loading'}>
          {listState.isRefetching && <div className={styles.refetching}>Updating transactions…</div>}
          <ListContent
            state={listState}
            groups={groups}
            activeFilters={activeFilters}
            clearFilters={clearFilters}
            retry={() => setRetryToken((token) => token + 1)}
            selectTransaction={(transaction) =>
              updateUrl((params) => params.set(DETAIL_PARAM, transaction.id), 'push')
            }
          />
        </div>
      </Card>

      {listState.meta && listState.status !== 'error' && listState.data.length > 0 && (
        <Pagination
          meta={listState.meta}
          count={listState.data.length}
          onPageChange={(page) => updateUrl((params) => setOptionalParam(params, 'page', String(page)))}
        />
      )}

      <Drawer open={Boolean(urlState.selectedId)} title="Transaction details" onClose={closeDetails}>
        <TransactionDetails
          state={detailState}
          retry={() => setDetailRetryToken((token) => token + 1)}
          close={closeDetails}
        />
      </Drawer>
    </div>
  )
}

function ListContent({
  state,
  groups,
  activeFilters,
  clearFilters,
  retry,
  selectTransaction,
}: {
  state: ListState
  groups: ReturnType<typeof groupTransactions>
  activeFilters: boolean
  clearFilters: () => void
  retry: () => void
  selectTransaction: (transaction: Transaction) => void
}) {
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

function StateMessage({
  tone = 'primary',
  icon,
  title,
  description,
  action,
}: {
  tone?: 'primary' | 'danger'
  icon: 'alert' | 'inbox' | 'search'
  title: string
  description: string
  action?: ReactNode
}) {
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

function Pagination({
  meta,
  count,
  onPageChange,
}: {
  meta: PageMeta
  count: number
  onPageChange: (page: number) => void
}) {
  const pages = getPaginationPages(meta.page, meta.totalPages)
  const canGoBack = meta.page > 1
  const canGoForward = meta.page < meta.totalPages

  return (
    <nav className={styles.pagination} aria-label="Transactions pagination">
      <span className={styles.showing}>{getShowingSummary(meta, count)}</span>
      <div className={styles.desktopPages}>
        <Button
          variant="secondary"
          size="sm"
          iconLeft="chevron-left"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        {pages.map((page, index) =>
          page === '…' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={page === meta.page ? styles.currentPage : styles.pageButton}
              onClick={() => onPageChange(page)}
              aria-current={page === meta.page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron-right"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
      <div className={styles.mobilePages}>
        <Button
          variant="secondary"
          size="sm"
          iconLeft="chevron-left"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Prev
        </Button>
        <span>
          Page {meta.page} of {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron-right"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}

function TransactionDetails({
  state,
  retry,
  close,
}: {
  state: DetailState
  retry: () => void
  close: () => void
}) {
  if (state.status === 'loading') return <DetailsSkeleton />

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

      <DetailsSection
        title="Details"
        rows={[
          ['Reference', <ReferenceValue key="reference" reference={transaction.reference} />],
          ['Date', formatDateTime(transaction.createdAt)],
          ['Type', TRANSACTION_TYPE_LABELS[transaction.type]],
          ['Counterparty', transaction.counterparty ?? '—'],
          ['Narration', transaction.narration],
        ]}
      />

      <DetailsSection
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

function ReferenceValue({ reference }: { reference: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 1800)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  const copyReference = async () => {
    const copied = await copyText(reference)
    setCopyState(copied ? 'copied' : 'failed')
  }

  const label =
    copyState === 'copied'
      ? 'Reference copied'
      : copyState === 'failed'
        ? 'Reference could not be copied'
        : 'Copy reference'

  return (
    <span className={styles.referenceValue}>
      <span>{reference}</span>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={
          copyState === 'copied'
            ? styles.referenceCopied
            : copyState === 'failed'
              ? styles.referenceFailed
              : undefined
        }
        onClick={() => void copyReference()}
      >
        <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
      </button>
    </span>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard?.writeText(text)
    if (navigator.clipboard) return true
  } catch {
    // Fall through to the textarea-based fallback for browsers with stricter permissions.
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

function DetailsSection({
  title,
  rows,
  emphasizeLast,
}: {
  title: string
  rows: Array<[string, ReactNode]>
  emphasizeLast?: boolean
}) {
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

function DetailsSkeleton() {
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

function getPaginationPages(current: number, total: number): Array<number | '…'> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, '…', total]
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', current, '…', total]
}

function setOptionalParam(params: URLSearchParams, name: string, value: string) {
  if (value) params.set(name, value)
  else params.delete(name)
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
