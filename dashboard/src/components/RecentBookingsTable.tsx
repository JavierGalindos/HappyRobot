import { Card, CardHeader } from './Card'
import { formatTimestamp, formatTime } from '../utils'

interface Booking {
  timestamp: string
  carrier_name: string
  load_id: string
  origin: string
  destination: string
  agreed_price: number
  negotiation_rounds: number
}

interface Props {
  data: Booking[]
}

export function RecentBookingsTable({ data }: Props) {
  return (
    <Card delay={0.5} className="overflow-hidden">
      <CardHeader title="Recent Bookings" subtitle="Latest loads booked by carriers" />
      <div className="px-6 pb-5 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 pr-4">Date</th>
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 pr-4">Load</th>
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 pr-4">Carrier</th>
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 pr-4">Lane</th>
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 pr-4 text-right">Price</th>
              <th className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider py-2.5 text-right">Rounds</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b, i) => (
              <tr
                key={`${b.load_id}-${b.timestamp}-${i}`}
                className="border-b border-surface-100 last:border-0 hover:bg-surface-100/50 transition-colors"
              >
                <td className="py-2.5 pr-4">
                  <p className="text-xs font-medium text-surface-800">{formatTimestamp(b.timestamp)}</p>
                  <p className="text-[10px] text-surface-400 font-mono">{formatTime(b.timestamp)}</p>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs font-mono font-medium text-brand-600">{b.load_id}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs text-surface-700">{b.carrier_name}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs text-surface-600">
                    {b.origin.split(',')[0]} → {b.destination.split(',')[0]}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="text-xs font-mono font-medium text-surface-900">
                    ${b.agreed_price?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-100 text-[10px] font-mono font-medium text-surface-600">
                    {b.negotiation_rounds}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}