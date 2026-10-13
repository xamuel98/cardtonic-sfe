import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Field } from '../Field'
import { Icon, type IconName } from '../Icon'
import styles from './Input.module.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hideLabel?: boolean
  hint?: ReactNode
  error?: string
  leadingIcon?: IconName
  fieldClassName?: string
}

export function Input({
  label,
  hideLabel,
  hint,
  error,
  leadingIcon,
  fieldClassName,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const controlId = rest.id ?? generatedId

  return (
    <Field
      label={label}
      htmlFor={controlId}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      <div className={styles.control}>
        {leadingIcon && <Icon name={leadingIcon} size={16} className={styles.icon} />}
        <input
          id={controlId}
          className={cx(styles.input, leadingIcon && styles.withIcon, error && styles.invalid, className)}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </div>
    </Field>
  )
}
