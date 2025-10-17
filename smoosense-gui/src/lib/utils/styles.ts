/**
 * Centralized style utilities for common UI patterns
 */

// Base button styles
const BUTTON_BASE = 'px-4 py-2 rounded text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

// Icon button base styles
const ICON_BUTTON_BASE = 'rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-all'

// Button variants
const BUTTON_PRIMARY = 'bg-primary text-primary-foreground hover:bg-primary/90'
const BUTTON_SECONDARY = 'bg-secondary text-secondary-foreground hover:bg-primary/10'
const BUTTON_DESTRUCTIVE = 'bg-secondary text-secondary-foreground hover:bg-destructive/30'

// Icon button variants
const ICON_BUTTON_SUBTLE = 'bg-background/80 hover:bg-accent border border-border shadow-sm opacity-80 hover:opacity-100'

// Hyperlink styles
const HYPERLINK = 'dark:text-sky-400 dark:hover:text-sky-300 text-blue-600 hover:text-blue-800 underline underline-offset-4 transition-colors'

export const CLS = {
  // Base styles
  BUTTON: BUTTON_BASE,
  ICON_BUTTON: ICON_BUTTON_BASE,

  // Complete button styles (base + variant)
  BUTTON_PRIMARY: `${BUTTON_BASE} ${BUTTON_PRIMARY}`,
  BUTTON_SECONDARY: `${BUTTON_BASE} ${BUTTON_SECONDARY}`,
  BUTTON_DESTRUCTIVE: `${BUTTON_BASE} ${BUTTON_DESTRUCTIVE}`,

  // Icon button styles (base + variant + size)
  ICON_BUTTON_SM: `${ICON_BUTTON_BASE}`,
  ICON_BUTTON_SM_SUBTLE: `${ICON_BUTTON_BASE} ${ICON_BUTTON_SUBTLE} p-1`,

  // Hyperlink styles
  HYPERLINK: HYPERLINK,
} as const