import { motion } from 'motion/react'
import { Card, CardHeader } from './Card'

export function LoadsUtilization({
  data,
}: {
  data: { total_loads: number; booked: number }
}) {
  const pct = data.total_loads > 0 ? Math.round((data.booked / data.total_loads) * 100) : 0
  const available = data.total_loads - data.booked
  const circumference = 2 * Math.PI * 70

  return (
    <Card delay={0.55}>
      <CardHeader title="Loads Utilization" subtitle="Booked vs available loads" />
      <div className="flex flex-col items-center justify-center px-6 pb-6 pt-2">
        {/* Ring gauge */}
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#f1f3f7"
              strokeWidth="12"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#6366f1"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-surface-900">{pct}%</span>
            <span className="text-[11px] font-mono text-surface-400 mt-0.5">UTILIZED</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-600" />
            <div>
              <p className="text-lg font-display font-bold text-surface-900 leading-none">{data.booked}</p>
              <p className="text-[11px] font-mono text-surface-400">Booked</p>
            </div>
          </div>
          <div className="w-px h-8 bg-surface-200" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-200" />
            <div>
              <p className="text-lg font-display font-bold text-surface-900 leading-none">{available}</p>
              <p className="text-[11px] font-mono text-surface-400">Available</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}