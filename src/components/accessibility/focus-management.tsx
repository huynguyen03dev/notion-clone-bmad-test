'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for managing focus within a component
 * Useful for modals, dropdowns, and other interactive components
 */
export function useFocusManagement(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }, [])

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [getFocusableElements])

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }, [getFocusableElements])

  // Handle tab key navigation within the container
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab (forward)
      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [isActive, getFocusableElements])

  // Store previous focus when component becomes active
  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the first element after a brief delay to ensure DOM is ready
      setTimeout(focusFirst, 0)
    } else {
      // Restore previous focus when component becomes inactive
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [isActive, focusFirst])

  // Add event listener for tab navigation
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, handleKeyDown])

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements
  }
}

/**
 * Hook for managing focus trapping within a modal or dialog
 */
export function useFocusTrap(isActive: boolean = true) {
  const { containerRef, focusFirst, focusLast, handleKeyDown } = useFocusManagement(isActive)
  
  return {
    containerRef,
    focusFirst,
    focusLast
  }
}

/**
 * Component that provides focus management for its children
 */
interface FocusManagerProps {
  children: React.ReactNode
  isActive?: boolean
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function FocusManager({ 
  children, 
  isActive = true, 
  className,
  as: Component = 'div'
}: FocusManagerProps) {
  const { containerRef } = useFocusManagement(isActive)

  return (
    <Component
      ref={containerRef as any}
      className={className}
      role="region"
      aria-label="Interactive content"
    >
      {children}
    </Component>
  )
}

/**
 * Hook for managing focus announcements for screen readers
 */
export function useFocusAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove the announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return { announce }
}

/**
 * Hook for managing focus restoration after route changes
 */
export function useFocusRestoration() {
  const focusMainContent = useCallback(() => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const focusHeading = useCallback((level: number = 1) => {
    const heading = document.querySelector(`h${level}`) as HTMLElement
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus()
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return {
    focusMainContent,
    focusHeading
  }
}
