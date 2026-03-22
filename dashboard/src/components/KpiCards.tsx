import { motion } from 'motion/react'
import type { MetricsResponse } from '../types'

interface KpiItem {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function formatCurrency(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toLocaleString()}`
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
      sub: 'all time',
      color: 'bg-indigo-50 text-indigo-600',
      icon: <PhoneIcon />,
    },
    {
      label: 'Total Minutes',
      value: data.total_minutes.toFixed(0),
      sub: 'call duration',
      color: 'bg-sky-50 text-sky-600',
      icon: <ClockIcon />,
    },
    {
      label: 'Avg Call Duration',
      value: `${avgCallDuration} min`,
      sub: 'per call',
      color: 'bg-amber-50 text-amber-600',
      icon: <RepeatIcon />,
    },
    // Row 2: Financials
    {
      label: 'Paid to Carriers WTD',
      value: formatCurrency(data.cost_wtd),
      sub: 'week to date',
      color: 'bg-teal-50 text-teal-600',
      icon: <DollarIcon />,
    },
    {
      label: 'Booking Rate',
      value: `${data.booking_rate}%`,
      sub: 'of all calls',
      color: 'bg-emerald-50 text-emerald-600',
      icon: <CheckIcon />,
    },
    {
      label: 'Avg Discount',
      value: `${data.avg_discount_pct}%`,
      sub: 'from loadboard rate',
      color: 'bg-rose-50 text-rose-600',
      icon: <TrendIcon />,
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
              {kpi.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}