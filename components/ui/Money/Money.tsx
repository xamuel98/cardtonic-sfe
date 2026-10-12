import type { Currency } from '@/types/api'
import { cx } from '@/lib/cx'
import { formatMoney } from '@/lib/format'
import styles from './Money.module.css'

export interface MoneyProps {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Prefix with + or -. */
  sign?: 'credit' | 'debit'
  className?: string
}

export function Money({ amount, currency, sign, className }: MoneyProps) {
  const signedAmount = sign === 'debit' ? -amount : amount
  return (
    <span className={cx(styles.money, className)}>
      {formatMoney(signedAmount, currency, { signDisplay: sign ? 'always' : 'auto' })}
    </span>
  )
}
