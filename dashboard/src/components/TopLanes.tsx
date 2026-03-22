import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from './Card'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-lg px-4 py-3">
      <p className="text-[11px] font-mono text-surface-500 mb-1">{payload[0].payload.lane}</p>
      <p className="text-lg font-display font-bold text-surface-900">
        {payload[0].value} <span className="text-xs font-normal text-surface-400">calls</span>
      </p>
    </div>
  )
}

function shortenLane(lane: string) {
  return lane
    .replace(/ -> /g, ' > ')
    .replace(/, [A-Z]{2}/g, '')
}

export function TopLanes({ data }: { data: Array<{ lane: string; count: number }> }) {
  const chartData = data.slice(0, 7).map((d) => ({
    ...d,
    short: shortenLane(d.lane),
  }))

  return (
    <Card delay={0.5}>
      <CardHeader title="Top Lanes" subtitle="Most requested origin-destination pairs" />
      <div className="px-4 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="short"
              width={140}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fontFamily: 'Outfit' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f3f7' }} />
            <Bar
              dataKey="count"
              fill="#6366f1"
              radius={[0, 6, 6, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}