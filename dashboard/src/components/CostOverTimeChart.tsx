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
import { formatDate, formatCurrency, ChartTooltip } from '../utils'

interface Props {
  data: Array<{ date: string; cost: number }>
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
            <Tooltip
              content={
                <ChartTooltip
                  labelFormatter={formatDate}
                  valueFormatter={formatCurrency}
                  valueSuffix="paid"
                />
              }
            />
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
