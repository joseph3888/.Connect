/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion';

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10, y: 5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -10, y: -5 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] // Custom premium cubic-bezier
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '4px', className = '' }) {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
        background: 'var(--surface-hover)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </div>
  );
}
