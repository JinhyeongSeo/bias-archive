/**
 * Toss-style animation primitives for framer-motion
 *
 * Usage:
 * import { fadeIn, quickSpring, pressScale } from '@/lib/animations'
 * <motion.div variants={fadeIn} initial="initial" animate="animate" transition={quickSpring} />
 */

import type { Variants, Transition } from 'framer-motion'

// =============================================================================
// Transition Presets
// =============================================================================

/** Quick spring for buttons and small interactions (150-250ms feel) */
export const quickSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

/** Basic spring for cards and general transitions (250-400ms feel) */
export const basicSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
}

/** Smooth spring for modals and large elements (300-500ms feel) */
export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
}

/** Ease-out expo for fade and opacity changes */
export const easeOutExpo: Transition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
}

// =============================================================================
// Animation Variants
// =============================================================================

/** Fade in/out animation */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/** Scale + fade animation (zoom in effect) */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

/** Slide up + fade animation */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

/** Slide down + fade animation */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

/** Slide in from left */
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

/** Slide in from right */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

// =============================================================================
// Stagger Configurations
// =============================================================================

/** Container variant for staggered children animations */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

/** Slower stagger for larger lists */
export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

// =============================================================================
// Interactive Effects
// =============================================================================

/** Press scale effect for buttons and interactive elements */
export const pressScale = {
  whileTap: { scale: 0.97 },
  transition: quickSpring,
}

/** Hover scale effect */
export const hoverScale = {
  whileHover: { scale: 1.02 },
  transition: quickSpring,
}

/** Combined press and hover effect */
export const interactiveScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: quickSpring,
}

// =============================================================================
// Modal Animations
// =============================================================================

/** Modal overlay (backdrop) animation */
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/** Modal content animation (scale + slide) */
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
}

/** Bottom sheet animation for mobile */
export const bottomSheet: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
}

// =============================================================================
// List Item Animations
// =============================================================================

/** List item variant (use with staggerContainer parent) */
export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/** Card item variant with scale */
export const cardItem: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
}

// =============================================================================
// Utility
// =============================================================================

/**
 * Reduced motion variant - returns static state for users who prefer reduced motion
 * Use with useReducedMotion hook from framer-motion
 */
export const reducedMotion: Variants = {
  initial: {},
  animate: {},
  exit: {},
}
