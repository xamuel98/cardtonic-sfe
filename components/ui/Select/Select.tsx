import { useEffect, useId, useRef, useState, type KeyboardEvent, type SelectHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Field } from '../Field'
import { Icon } from '../Icon'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

type SelectChangeEvent = {
  target: { value: string; name?: string }
  currentTarget: { value: string; name?: string }
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'onChange' | 'size'
> {
  label: string
  hideLabel?: boolean
  options: readonly SelectOption[]
  fieldClassName?: string
  onChange?: (event: SelectChangeEvent) => void
}

export function Select({
  label,
  hideLabel,
  options,
  fieldClassName,
  className,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
}: SelectProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const listboxId = `${controlId}-listbox`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedValue = String(value ?? defaultValue ?? options[0]?.value ?? '')
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const commitValue = (nextValue: string) => {
    onChange?.({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
    })
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === selectedValue)
    )

    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((current) => !current)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (selectedIndex + direction + options.length) % options.length
      commitValue(options[nextIndex].value)
    }
  }

  return (
    <Field label={label} htmlFor={controlId} hideLabel={hideLabel} className={fieldClassName}>
      <div className={styles.control} ref={wrapperRef}>
        <button
          id={controlId}
          type="button"
          className={cx(styles.select, className)}
          disabled={disabled}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={hideLabel ? label : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
        >
          <span>{selectedOption?.label}</span>
        </button>
        <Icon name="chevron-down" size={16} className={styles.chevron} />
        {open && (
          <div id={listboxId} className={styles.options} role="listbox" aria-labelledby={controlId}>
            {options.map((option) => {
              const selected = option.value === selectedValue
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cx(styles.option, selected && styles.selected)}
                  onClick={() => commitValue(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Field>
  )
}
