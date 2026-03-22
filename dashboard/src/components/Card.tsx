import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`bg-white rounded-2xl border border-surface-200 shadow-card hover:shadow-card-hover transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 pt-5 pb-1">
      <h3 className="font-display font-semibold text-surface-900 text-[15px]">{title}</h3>
      {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}