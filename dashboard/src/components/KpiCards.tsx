import { motion } from 'motion/react'
import type { MetricsResponse } from '../types'
import { formatCurrency } from '../utils'

interface KpiItem {
  label: string
  value: string
  sub?: string
  color: string
  icon: keyof typeof ICONS
}

const ICONS: Record<string, string> = {
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v6l4 2',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
}

function Icon({ name }: { name: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  )
}

export function KpiCards({ data }: { data: MetricsResponse }) {
  const avgCallDuration = data.total_calls > 0
    ? (data.total_minutes / data.total_calls).toFixed(1)
    : '0'

  const kpis: KpiItem[] = [
    // Row 1: Call activity
    {
      label: 'Total Calls',
      value: data.total_calls.toLocaleString(),
      sub: 'month to date',
      color: 'bg-indigo-50 text-indigo-600',
      icon: 'phone',
    },
    {
      label: 'Total Minutes',
      value: data.total_minutes.toFixed(0),
      sub: 'call duration',
      color: 'bg-sky-50 text-sky-600',
      icon: 'clock',
    },
    {
      label: 'Avg Call Duration',
      value: `${avgCallDuration} min`,
      sub: 'per call',
      color: 'bg-amber-50 text-amber-600',
      icon: 'repeat',
    },
    {
      label: 'Paid to Carriers',
      value: formatCurrency(data.cost_wtd),
      sub: 'month to date',
      color: 'bg-teal-50 text-teal-600',
      icon: 'dollar',
    },
    {
      label: 'Booking Rate',
      value: `${data.booking_rate}%`,
      sub: 'of all calls',
      color: 'bg-emerald-50 text-emerald-600',
      icon: 'check',
    },
    {
      label: 'Avg Discount',
      value: `${data.avg_discount_pct}%`,
      sub: 'from loadboard rate',
      color: 'bg-rose-50 text-rose-600',
      icon: 'trend',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-2xl border border-surface-200 shadow-card hover:shadow-card-hover transition-all duration-300 p-5 group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wider font-mono">
                {kpi.label}
              </p>
              <div>
                <p className="text-3xl font-display font-bold text-surface-900 tracking-tight">
                  {kpi.value}
                </p>
                {kpi.sub && (
                  <p className="text-[11px] text-surface-400 font-mono mt-1">{kpi.sub}</p>
                )}
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon name={kpi.icon} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}