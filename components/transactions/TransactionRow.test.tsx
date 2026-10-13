import { render, screen } from '@testing-library/react'
import type { Transaction } from '@/types/api'
import { TransactionRow } from './TransactionRow'

const transaction: Transaction = {
  id: 'txn_1',
  reference: 'ACM-123',
  type: 'bill_payment',
  status: 'successful',
  currency: 'NGN',
  amount: 1850000,
  fee: 0,
  narration: 'Bill payment <img src="x" onerror="alert(1)">',
  counterparty: null,
  createdAt: '2026-10-12T08:41:00.000Z',
}

describe('TransactionRow', () => {
  it('renders narration as text, not HTML', () => {
    const { container } = render(<TransactionRow transaction={transaction} />)

    expect(screen.getByText(transaction.narration)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
