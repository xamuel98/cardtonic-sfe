'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui'
import styles from './TransactionsPageClient.module.css'

export function ReferenceValue({ reference }: { reference: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 1800)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  const copyReference = async () => {
    const copied = await copyText(reference)
    setCopyState(copied ? 'copied' : 'failed')
  }

  const label =
    copyState === 'copied'
      ? 'Reference copied'
      : copyState === 'failed'
        ? 'Reference could not be copied'
        : 'Copy reference'

  return (
    <span className={styles.referenceValue}>
      <span>{reference}</span>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={
          copyState === 'copied'
            ? styles.referenceCopied
            : copyState === 'failed'
              ? styles.referenceFailed
              : undefined
        }
        onClick={() => void copyReference()}
      >
        <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
      </button>
    </span>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard?.writeText(text)
    if (navigator.clipboard) return true
  } catch {
    // Fall through to the textarea-based fallback for browsers with stricter permissions.
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
