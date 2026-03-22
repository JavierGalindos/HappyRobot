import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader } from './Card'

const OUTCOME_COLORS: Record<string, string> = {
  booked: '#10b981',
  rejected: '#f43f5e',
  no_match: '#f59e0b',
  no_agreement: '#6366f1',
  not_authorized: '#9ca3b4',
}

const OUTCOME_LABELS: Record<string, string> = {
  booked: 'Booked',
  rejected: 'Rejected',
  no_match: 'No Match',
  no_agreement: 'No Agreement',
  not_authorized: 'Not Authorized',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-lg px-4 py-3">
      <p className="text-[11px] font-mono text-surface-500 mb-1">{OUTCOME_LABELS[name] || name}</p>
      <p className="text-lg font-display font-bold text-surface-900">
        {value} <span className="text-xs font-normal text-surface-400">calls</span>
      </p>
    </div>
  )
}

export function OutcomeChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card delay={0.4}>
      <CardHeader title="Calls by Outcome" subtitle="Distribution across all calls" />
      <div className="flex items-center gap-4 px-6 pb-5 pt-2">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name] || '#9ca3b4'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                className="fill-surface-900 font-display"
                style={{ fontSize: '24px', fontWeight: 700 }}
              >
                {total}
              </text>
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                className="fill-surface-400 font-mono"
                style={{ fontSize: '10px' }}
              >
                TOTAL
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: OUTCOME_COLORS[entry.name] || '#9ca3b4' }}
                />
                <span className="text-sm text-surface-700">
                  {OUTCOME_LABELS[entry.name] || entry.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-medium text-surface-900">{entry.value}</span>
                <span className="text-[11px] font-mono text-surface-400 w-10 text-right">
                  {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}