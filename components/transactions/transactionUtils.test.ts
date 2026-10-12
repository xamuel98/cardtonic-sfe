import type { Transaction } from '@/types/api'
import {
  formatSignedTransactionAmount,
  getCounterpartyInitials,
  groupTransactions,
  parseTransactionsUrl,
} from './transactionUtils'

const baseTransaction: Transaction = {
  id: 'txn_1',
  reference: 'ACM-123',
  type: 'transfer_out',
  status: 'successful',
  currency: 'GHS',
  amount: 120000,
  fee: 1200,
  narration: 'Transfer to Kwame Mensah',
  counterparty: 'Kwame Mensah',
  createdAt: '2026-10-05T10:15:00.000Z',
}

describe('transactionUtils', () => {
  it('parses supported URL state and ignores unsupported values', () => {
    const state = parseTransactionsUrl(
      new URLSearchParams('page=3&q=netflix&type=card_payment&status=reversed&transaction=txn_1')
    )

    expect(state).toEqual({
      page: 3,
      q: 'netflix',
      type: 'card_payment',
      status: undefined,
      selectedId: 'txn_1',
    })
  })

  it('formats transaction signs from transaction direction', () => {
    expect(formatSignedTransactionAmount(baseTransaction)).toBe('-GH₵1,200.00')
    expect(formatSignedTransactionAmount({ ...baseTransaction, type: 'transfer_in', currency: 'NGN' })).toBe(
      '+₦1,200.00'
    )
  })

  it('derives defensive transfer initials', () => {
    expect(getCounterpartyInitials('Kwame Mensah')).toBe('KM')
    expect(getCounterpartyInitials('Okonkwo-Adeyemi Logistics')).toBe('OA')
    expect(getCounterpartyInitials(null)).toBe('')
  })

  it('groups transactions by local day headings', () => {
    const groups = groupTransactions(
      [
        { ...baseTransaction, id: 'txn_today', createdAt: '2026-10-12T08:00:00.000Z' },
        { ...baseTransaction, id: 'txn_yesterday', createdAt: '2026-10-11T08:00:00.000Z' },
        { ...baseTransaction, id: 'txn_old', createdAt: '2026-10-05T08:00:00.000Z' },
      ],
      new Date('2026-10-12T12:00:00.000Z')
    )

    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday', 'Mon, 5 Oct 2026'])
  })
})
