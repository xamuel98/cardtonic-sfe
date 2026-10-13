'use client'

import { useEffect, useRef, useState } from 'react'
import type { Transaction } from '@/types/api'
import { ApiError } from '@/lib/api/client'
import { getTransaction } from '@/lib/api/endpoints'
import type { DetailState } from '../transactionPageTypes'

export function useTransactionDetail(selectedId: string | undefined) {
  const detailCacheRef = useRef(new Map<string, Transaction>())
  const [detailRetryToken, setDetailRetryToken] = useState(0)
  const [detailState, setDetailState] = useState<DetailState>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    if (!selectedId) {
      queueMicrotask(() => {
        if (active) setDetailState({ status: 'idle' })
      })
      return () => {
        active = false
      }
    }

    const cachedTransaction = detailCacheRef.current.get(selectedId)
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

    getTransaction(selectedId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return
        if (isTerminalTransaction(response.data)) {
          detailCacheRef.current.set(response.data.id, response.data)
        }
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
  }, [detailRetryToken, selectedId])

  return {
    detailState,
    retryDetail: () => setDetailRetryToken((token) => token + 1),
  }
}

function isTerminalTransaction(transaction: Transaction) {
  return transaction.status === 'successful' || transaction.status === 'failed'
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
