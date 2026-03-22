import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader } from './Card'
import { ChartTooltip } from '../utils'

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#f43f5e',
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

export function SentimentChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card delay={0.45}>
      <CardHeader title="Carrier Sentiment" subtitle="Caller tone classification" />
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
                  <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || '#9ca3b4'} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    labelFormatter={(name) => SENTIMENT_LABELS[name] || name}
                    valueSuffix="calls"
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-4">
          {chartData.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            return (
              <div key={entry.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 capitalize">{entry.name}</span>
                  <span className="text-sm font-mono font-medium text-surface-900">{pct}%</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SENTIMENT_COLORS[entry.name] || '#9ca3b4',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
