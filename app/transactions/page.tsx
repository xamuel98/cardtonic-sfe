import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TransactionsPageClient } from '@/components/transactions/TransactionsPageClient'

export const metadata: Metadata = {
  title: 'Transactions',
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsPageClient />
    </Suspense>
  )
}
