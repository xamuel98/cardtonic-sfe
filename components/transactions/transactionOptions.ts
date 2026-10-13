import type { SelectOption } from '@/components/ui'

export const TYPE_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer_in', label: 'Transfer in' },
  { value: 'transfer_out', label: 'Transfer out' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'card_payment', label: 'Card payment' },
  { value: 'bill_payment', label: 'Bill payment' },
]

export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]
