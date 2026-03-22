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
import { formatDate, ChartTooltip } from '../utils'

interface Props {
  data: Array<{ date: string; count: number }>
}

export function CallVolumeChart({ data }: Props) {
  return (
    <Card delay={0.3} className="overflow-hidden">
      <CardHeader title="Call Volume" subtitle="Inbound carrier calls over time" />
      <div className="px-4 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            <YAxis axisLine={false} tickLine={false} dx={-8} />
            <Tooltip
              content={
                <ChartTooltip
                  labelFormatter={formatDate}
                  valueSuffix="calls"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#volumeGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
