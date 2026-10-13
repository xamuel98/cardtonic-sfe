'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { Drawer as VaulDrawer } from 'vaul'
import { Icon } from '../Icon'
import styles from './Drawer.module.css'

const MOBILE_SNAP_POINTS = [0.82, 0.96]

export interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({ open, title, onClose, children, footer }: DrawerProps) {
  const direction = useDrawerDirection()
  const isMobile = direction === 'bottom'
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(MOBILE_SNAP_POINTS[0])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveSnapPoint(MOBILE_SNAP_POINTS[0])
      onClose()
    }
  }

  const mobileSnapProps = isMobile
    ? {
        snapPoints: MOBILE_SNAP_POINTS,
        activeSnapPoint,
        setActiveSnapPoint,
        fadeFromIndex: 0,
        snapToSequentialPoint: true,
      }
    : {}

  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      direction={direction}
      handleOnly={isMobile}
      closeThreshold={0.32}
      {...mobileSnapProps}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className={styles.overlay} />
        <VaulDrawer.Content
          className={styles.panel}
          aria-describedby={undefined}
          data-mobile-drawer={isMobile ? 'true' : undefined}
          data-desktop-drawer={!isMobile ? 'true' : undefined}
        >
          <div className={styles.grabberWrap} aria-hidden>
            <VaulDrawer.Handle className={styles.grabber} />
          </div>
          <div className={styles.header}>
            <VaulDrawer.Title className={styles.title}>{title}</VaulDrawer.Title>
            <VaulDrawer.Close asChild>
              <button type="button" className={styles.close} aria-label="Close drawer">
                <Icon name="close" size={20} />
              </button>
            </VaulDrawer.Close>
          </div>
          <div className={styles.body} data-vaul-no-drag>
            {children}
          </div>
          {footer && (
            <div className={styles.footer} data-vaul-no-drag>
              {footer}
            </div>
          )}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}

function useDrawerDirection() {
  const [direction, setDirection] = useState<'bottom' | 'right'>('right')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const updateDirection = () => setDirection(media.matches ? 'bottom' : 'right')

    updateDirection()
    media.addEventListener('change', updateDirection)
    return () => media.removeEventListener('change', updateDirection)
  }, [])

  return direction
}
