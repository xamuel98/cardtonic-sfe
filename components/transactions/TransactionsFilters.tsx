import { Button, Input, Select } from '@/components/ui'
import { STATUS_OPTIONS, TYPE_OPTIONS } from './transactionOptions'
import type { TransactionsUrlState } from './transactionUtils'
import styles from './TransactionsPageClient.module.css'

interface TransactionsFiltersProps {
  urlState: TransactionsUrlState
  activeFilters: boolean
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClearFilters: () => void
}

export function TransactionsFilters({
  urlState,
  activeFilters,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onClearFilters,
}: TransactionsFiltersProps) {
  return (
    <div className={styles.filters}>
      <Input
        key={urlState.q}
        label="Search"
        leadingIcon="search"
        defaultValue={urlState.q}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by reference, name or narration"
        className={styles.searchInput}
      />
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={urlState.type ?? ''}
        onChange={(event) => onTypeChange(event.target.value)}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={urlState.status ?? ''}
        onChange={(event) => onStatusChange(event.target.value)}
      />
      {activeFilters && (
        <Button variant="ghost" className={styles.clearButton} onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
