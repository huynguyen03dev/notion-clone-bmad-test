'use client'

import { useId } from 'react'

/**
 * Hook for generating unique IDs for ARIA relationships
 */
export function useAriaIds(prefix: string = 'aria') {
  const baseId = useId()
  
  return {
    labelId: `${prefix}-label-${baseId}`,
    descriptionId: `${prefix}-description-${baseId}`,
    errorId: `${prefix}-error-${baseId}`,
    helpId: `${prefix}-help-${baseId}`,
    contentId: `${prefix}-content-${baseId}`,
    headingId: `${prefix}-heading-${baseId}`
  }
}

/**
 * Props for accessible form fields
 */
export interface AccessibleFieldProps {
  label: string
  description?: string
  error?: string
  help?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Hook for generating ARIA attributes for form fields
 */
export function useAccessibleField({
  label,
  description,
  error,
  help,
  required = false,
  disabled = false
}: AccessibleFieldProps) {
  const { labelId, descriptionId, errorId, helpId } = useAriaIds('field')

  const describedBy = [
    description && descriptionId,
    error && errorId,
    help && helpId
  ].filter(Boolean).join(' ')

  return {
    fieldProps: {
      'aria-labelledby': labelId,
      'aria-describedby': describedBy || undefined,
      'aria-required': required,
      'aria-disabled': disabled,
      'aria-invalid': !!error
    },
    labelProps: {
      id: labelId,
      htmlFor: undefined // Will be set by the consuming component
    },
    descriptionProps: description ? {
      id: descriptionId,
      role: 'note'
    } : undefined,
    errorProps: error ? {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite'
    } : undefined,
    helpProps: help ? {
      id: helpId,
      role: 'note'
    } : undefined
  }
}

/**
 * Props for accessible buttons
 */
export interface AccessibleButtonProps {
  label?: string
  description?: string
  expanded?: boolean
  pressed?: boolean
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  controls?: string
  disabled?: boolean
}

/**
 * Hook for generating ARIA attributes for buttons
 */
export function useAccessibleButton({
  label,
  description,
  expanded,
  pressed,
  hasPopup,
  controls,
  disabled = false
}: AccessibleButtonProps) {
  const { descriptionId } = useAriaIds('button')

  return {
    buttonProps: {
      'aria-label': label,
      'aria-describedby': description ? descriptionId : undefined,
      'aria-expanded': expanded,
      'aria-pressed': pressed,
      'aria-haspopup': hasPopup,
      'aria-controls': controls,
      'aria-disabled': disabled,
      disabled
    },
    descriptionProps: description ? {
      id: descriptionId,
      className: 'sr-only'
    } : undefined
  }
}

/**
 * Props for accessible navigation
 */
export interface AccessibleNavProps {
  label: string
  current?: string
}

/**
 * Hook for generating ARIA attributes for navigation
 */
export function useAccessibleNav({ label, current }: AccessibleNavProps) {
  return {
    navProps: {
      role: 'navigation',
      'aria-label': label
    },
    itemProps: (href: string, isCurrent: boolean = href === current) => ({
      'aria-current': isCurrent ? 'page' : undefined
    })
  }
}

/**
 * Props for accessible dialogs/modals
 */
export interface AccessibleDialogProps {
  title: string
  description?: string
}

/**
 * Hook for generating ARIA attributes for dialogs
 */
export function useAccessibleDialog({ title, description }: AccessibleDialogProps) {
  const { labelId, descriptionId } = useAriaIds('dialog')

  return {
    dialogProps: {
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': labelId,
      'aria-describedby': description ? descriptionId : undefined
    },
    titleProps: {
      id: labelId
    },
    descriptionProps: description ? {
      id: descriptionId
    } : undefined
  }
}

/**
 * Props for accessible lists
 */
export interface AccessibleListProps {
  label?: string
  itemCount?: number
}

/**
 * Hook for generating ARIA attributes for lists
 */
export function useAccessibleList({ label, itemCount }: AccessibleListProps) {
  const { labelId } = useAriaIds('list')

  return {
    listProps: {
      role: 'list',
      'aria-label': label,
      'aria-labelledby': label ? undefined : labelId,
      'aria-setsize': itemCount
    },
    itemProps: (index: number) => ({
      role: 'listitem',
      'aria-posinset': index + 1
    }),
    labelProps: label ? undefined : {
      id: labelId
    }
  }
}

/**
 * Props for accessible status/live regions
 */
export interface AccessibleStatusProps {
  priority?: 'polite' | 'assertive'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

/**
 * Hook for generating ARIA attributes for status/live regions
 */
export function useAccessibleStatus({
  priority = 'polite',
  atomic = true,
  relevant = 'all'
}: AccessibleStatusProps = {}) {
  return {
    statusProps: {
      role: 'status',
      'aria-live': priority,
      'aria-atomic': atomic,
      'aria-relevant': relevant
    }
  }
}

/**
 * Utility function to announce messages to screen readers
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }, 1000)
}
