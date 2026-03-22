export interface MetricsResponse {
  total_calls: number
  total_minutes: number
  cost_wtd: number
  calls_by_outcome: Record<string, number>
  booking_rate: number
  avg_negotiation_rounds: number
  avg_discount_pct: number
  sentiment_distribution: Record<string, number>
  top_lanes: Array<{ lane: string; count: number }>
  loads_utilization: { total_loads: number; booked: number }
  call_volume_over_time: Array<{ date: string; count: number }>
  cost_over_time: Array<{ date: string; cost: number }>
  booked_routes: Array<{ origin: string; destination: string; count: number }>
  recent_bookings: Array<{
    timestamp: string
    carrier_name: string
    load_id: string
    origin: string
    destination: string
    agreed_price: number
    negotiation_rounds: number
  }>
}