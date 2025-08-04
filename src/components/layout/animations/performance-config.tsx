'use client'

import { MotionConfig } from 'framer-motion'

interface PerformanceConfigProps {
  children: React.ReactNode
}

// Optimized motion configuration for better performance
export function PerformanceConfig({ children }: PerformanceConfigProps) {
  return (
    <MotionConfig
      // Reduce motion for users who prefer reduced motion
      reducedMotion="user"
      // Use transform instead of layout animations for better performance
      transition={{
        type: "tween",
        ease: "easeInOut",
        duration: 0.3
      }}
    >
      {children}
    </MotionConfig>
  )
}

// Performance monitoring hook
export function useAnimationPerformance() {
  const measurePerformance = (animationName: string, callback: () => void) => {
    const start = performance.now()
    callback()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Animation "${animationName}" took ${end - start} milliseconds`)
      
      // Warn if animation is too slow
      if (end - start > 16.67) { // 60fps = 16.67ms per frame
        console.warn(`Animation "${animationName}" may cause frame drops`)
      }
    }
  }

  return { measurePerformance }
}

// Optimized animation presets for 60fps performance
export const performantAnimations = {
  // Fast micro-interactions
  quickFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' }
  },
  
  // Smooth hover effects
  hoverScale: {
    whileHover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeOut' }
    }
  },
  
  // Optimized slide animations
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
    }
  }
}

// CSS-based animations for better performance on simple animations
export const cssAnimations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  
  // Exit animations
  fadeOut: 'animate-out fade-out duration-200',
  slideOutToBottom: 'animate-out slide-out-to-bottom duration-200',
  slideOutToTop: 'animate-out slide-out-to-top duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200'
}
