import type { PageMeta, Transaction, TransactionStatus, TransactionType } from '@/types/api'
import { formatMoney } from '@/lib/format'

export const TRANSACTIONS_LIMIT = 20
export const DETAIL_PARAM = 'transaction'

export const CREDIT_TYPES: readonly TransactionType[] = ['deposit', 'transfer_in', 'conversion']

export interface TransactionsUrlState {
  page: number
  q: string
  type?: TransactionType
  status?: TransactionStatus
  selectedId?: string
}

export interface TransactionGroup {
  key: string
  label: string
  transactions: Transaction[]
}

const VALID_TYPES: readonly TransactionType[] = [
  'deposit',
  'withdrawal',
  'transfer_in',
  'transfer_out',
  'conversion',
  'card_payment',
  'bill_payment',
]

const VALID_STATUSES: readonly TransactionStatus[] = ['successful', 'pending', 'failed']

const dayFormatter = new Intl.DateTimeFormat('en-CA')
const headingFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function parseTransactionsUrl(searchParams: URLSearchParams): TransactionsUrlState {
  const parsedPage = Number(searchParams.get('page') ?? 1)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  return {
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    q: searchParams.get('q')?.trim() ?? '',
    type: isTransactionType(type) ? type : undefined,
    status: isTransactionStatus(status) ? status : undefined,
    selectedId: searchParams.get(DETAIL_PARAM) || undefined,
  }
}

export function hasActiveFilters(state: TransactionsUrlState): boolean {
  return Boolean(state.q || state.type || state.status)
}

export function isCreditTransaction(type: TransactionType): boolean {
  return CREDIT_TYPES.includes(type)
}

export function formatSignedTransactionAmount(transaction: Transaction): string {
  const signedAmount = isCreditTransaction(transaction.type) ? transaction.amount : -transaction.amount
  return formatMoney(signedAmount, transaction.currency, { signDisplay: 'always' })
}

export function formatTransactionTotal(transaction: Transaction): string {
  return formatMoney(transaction.amount + transaction.fee, transaction.currency)
}

export function groupTransactions(
  transactions: readonly Transaction[],
  now = new Date()
): TransactionGroup[] {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const key = dayFormatter.format(new Date(transaction.createdAt))
    groups.set(key, [...(groups.get(key) ?? []), transaction])
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: formatDayHeading(key, now),
    transactions: items,
  }))
}

export function getCounterpartyInitials(counterparty: string | null): string {
  if (!counterparty) return ''
  const words = counterparty
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)

  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function getShowingSummary(meta: PageMeta | undefined, count: number): string {
  if (!meta || meta.total === 0) return '0 results'
  const start = (meta.page - 1) * meta.limit + 1
  const end = start + count - 1
  return `Showing ${start}-${end} of ${meta.total}`
}

function formatDayHeading(key: string, now: Date): string {
  const today = dayFormatter.format(now)
  const yesterday = dayFormatter.format(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  if (key === today) return 'Today'
  if (key === yesterday) return 'Yesterday'
  return headingFormatter.format(new Date(`${key}T00:00:00`))
}

function isTransactionType(value: string | null): value is TransactionType {
  return VALID_TYPES.includes(value as TransactionType)
}

function isTransactionStatus(value: string | null): value is TransactionStatus {
  return VALID_STATUSES.includes(value as TransactionStatus)
}
