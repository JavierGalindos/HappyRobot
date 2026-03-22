import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader } from './Card'

interface Props {
  data: Array<{ date: string; cost: number }>
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-lg px-4 py-3">
      <p className="text-[11px] font-mono text-surface-500 mb-1">{formatDate(label)}</p>
      <p className="text-lg font-display font-bold text-surface-900">
        {formatCurrency(payload[0].value)} <span className="text-xs font-normal text-surface-400">paid</span>
      </p>
    </div>
  )
}

export function CostOverTimeChart({ data }: Props) {
  return (
    <Card delay={0.35} className="overflow-hidden">
      <CardHeader title="Carrier Payments" subtitle="Daily spend on booked loads" />
      <div className="px-4 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              dx={-8}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#costGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}