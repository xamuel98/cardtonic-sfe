'use client'

import { useEffect, useMemo, useState } from 'react'
import { getTransactions } from '@/lib/api/endpoints'
import {
  groupTransactions,
  TRANSACTIONS_LIMIT,
  type TransactionsUrlState,
} from '@/components/transactions/transactionUtils'
import type { ListState } from '@/components/transactions/transactionPageTypes'

export function useTransactionsList(urlState: TransactionsUrlState, replacePage: (page: number) => void) {
  const [retryToken, setRetryToken] = useState(0)
  const [listState, setListState] = useState<ListState>({
    status: 'idle',
    data: [],
    isRefetching: false,
  })

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
          replacePage(meta.totalPages)
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
  }, [replacePage, retryToken, urlState.page, urlState.q, urlState.status, urlState.type])

  return {
    listState,
    groups: useMemo(() => groupTransactions(listState.data), [listState.data]),
    retryList: () => setRetryToken((token) => token + 1),
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
