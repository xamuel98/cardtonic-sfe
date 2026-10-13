'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Transaction } from '@/types/api'
import {
  DETAIL_PARAM,
  hasActiveFilters,
  parseTransactionsUrl,
  type TransactionsUrlState,
} from '@/components/transactions/transactionUtils'

export function useTransactionsUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const searchTimeoutRef = useRef<number | undefined>(undefined)

  const urlState = useMemo(() => parseTransactionsUrl(new URLSearchParams(searchKey)), [searchKey])
  const activeFilters = hasActiveFilters(urlState)

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

  const updateSearch = useCallback(
    (value: string) => {
      window.clearTimeout(searchTimeoutRef.current)

      searchTimeoutRef.current = window.setTimeout(() => {
        const query = value.trim()
        const params = new URLSearchParams(window.location.search)

        if ((params.get('q')?.trim() ?? '') === query) return

        setOptionalParam(params, 'q', query)
        params.delete('page')

        const next = params.toString()
        const href = next ? `${pathname}?${next}` : pathname

        router.replace(href, { scroll: false })
      }, 300)
    },
    [pathname, router]
  )

  const updateType = useCallback(
    (value: string) => {
      updateUrl((params) => {
        setOptionalParam(params, 'type', value)
        params.delete('page')
      })
    },
    [updateUrl]
  )

  const updateStatus = useCallback(
    (value: string) => {
      updateUrl((params) => {
        setOptionalParam(params, 'status', value)
        params.delete('page')
      })
    },
    [updateUrl]
  )

  const updatePage = useCallback(
    (page: number) => updateUrl((params) => setOptionalParam(params, 'page', String(page))),
    [updateUrl]
  )

  const replacePage = useCallback(
    (page: number) => updateUrl((params) => setOptionalParam(params, 'page', String(page)), 'replace'),
    [updateUrl]
  )

  const clearFilters = useCallback(() => {
    window.clearTimeout(searchTimeoutRef.current)
    updateUrl((params) => {
      params.delete('q')
      params.delete('type')
      params.delete('status')
      params.delete('page')
    })
  }, [updateUrl])

  const selectTransaction = useCallback(
    (transaction: Transaction) => updateUrl((params) => params.set(DETAIL_PARAM, transaction.id), 'push'),
    [updateUrl]
  )

  const closeDetails = useCallback(
    () => updateUrl((params) => params.delete(DETAIL_PARAM), 'replace'),
    [updateUrl]
  )

  useEffect(() => () => window.clearTimeout(searchTimeoutRef.current), [])

  return {
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
  }
}

function setOptionalParam(params: URLSearchParams, name: string, value: string) {
  if (value) params.set(name, value)
  else params.delete(name)
}

export type TransactionsUrlControls = ReturnType<typeof useTransactionsUrlState>
export type { TransactionsUrlState }
