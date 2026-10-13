import type { PageMeta, Transaction } from '@/types/api'

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'
export type DetailStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error'

export interface ListState {
  status: RequestStatus
  data: Transaction[]
  meta?: PageMeta
  error?: string
  isRefetching: boolean
}

export interface DetailState {
  status: DetailStatus
  transaction?: Transaction
  error?: string
}
