import type { PageMeta } from '@/types/api'
import { Button } from '@/components/ui'
import { getShowingSummary } from './transactionUtils'
import styles from './TransactionsPageClient.module.css'

interface TransactionsPaginationProps {
  meta: PageMeta
  count: number
  onPageChange: (page: number) => void
}

export function TransactionsPagination({ meta, count, onPageChange }: TransactionsPaginationProps) {
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

function getPaginationPages(current: number, total: number): Array<number | '…'> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, '…', total]
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', current, '…', total]
}
