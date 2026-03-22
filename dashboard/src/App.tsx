import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { MetricsResponse } from './types'
import { KpiCards } from './components/KpiCards'
import { CallVolumeChart } from './components/CallVolumeChart'
import { OutcomeChart } from './components/OutcomeChart'
import { SentimentChart } from './components/SentimentChart'
import { TopLanes } from './components/TopLanes'
import { LoadsUtilization } from './components/LoadsUtilization'
import { CostOverTimeChart } from './components/CostOverTimeChart'
import { BookedRoutesMap } from './components/BookedRoutesMap'
import { RecentBookingsTable } from './components/RecentBookingsTable'

const API_BASE = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

type Tab = 'metrics' | 'loads'

export default function App() {
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('metrics')

  useEffect(() => {
    fetch(`${API_BASE}/api/metrics`, {
        headers: API_KEY ? { 'x-api-key': API_KEY } : {},
      })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch((err) => {
        setError(err.message || 'Failed to load metrics')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-surface-300 border-t-brand-600 rounded-full"
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <p className="text-surface-600 font-display">{error || 'No data available'}</p>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'metrics', label: 'Metrics' },
    { key: 'loads', label: 'Loads' },
  ]

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Header */}
      <header className="bg-white border-b border-surface-300 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h1 className="font-display font-700 text-surface-900 text-[15px] tracking-tight leading-none">
                  Acme Logistics
                </h1>
                <p className="text-[11px] font-mono text-surface-500 tracking-wide uppercase mt-0.5">
                  Command Center
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE
              </span>
              <span className="text-xs text-surface-500 font-mono">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium font-display transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-brand-600'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <KpiCards data={data} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CallVolumeChart data={data.call_volume_over_time} />
                <CostOverTimeChart data={data.cost_over_time} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OutcomeChart data={data.calls_by_outcome} />
                <SentimentChart data={data.sentiment_distribution} />
              </div>
            </motion.div>
          )}

          {activeTab === 'loads' && (
            <motion.div
              key="loads"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <BookedRoutesMap data={data.booked_routes} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TopLanes data={data.top_lanes} />
                </div>
                <LoadsUtilization data={data.loads_utilization} />
              </div>

              <RecentBookingsTable data={data.recent_bookings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}