'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

interface ComplaintVelocityWidgetProps {
  companyId: string
}

interface DataPoint {
  timestamp: string
  count: number
}

export default function ComplaintVelocityWidget({ companyId }: ComplaintVelocityWidgetProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [velocity, setVelocity] = useState<number>(12)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch complaints from last hour, grouped by minute
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: complaints, error } = await supabase
          .from('complaints')
          .select('timestamp')
          .eq('company_id', companyId)
          .gte('timestamp', oneHourAgo)
          .order('timestamp', { ascending: true })

        if (error) throw error

        if (complaints && complaints.length > 0) {
          // Group by 5-minute intervals
          const grouped = complaints.reduce((acc: any, complaint) => {
            const time = new Date(complaint.timestamp)
            const interval = Math.floor(time.getMinutes() / 5) * 5
            const key = `${time.getHours()}:${interval.toString().padStart(2, '0')}`

            if (!acc[key]) {
              acc[key] = { timestamp: key, count: 0 }
            }
            acc[key].count++
            return acc
          }, {})

          const formattedData = Object.values(grouped) as DataPoint[]
          setData(formattedData)

          // Calculate velocity (rate of change)
          if (formattedData.length >= 2) {
            const recent = formattedData.slice(-2)
            const change = ((recent[1].count - recent[0].count) / recent[0].count) * 100
            setVelocity(Math.round(change))
          }
        }
      } catch (error) {
        console.error('Error fetching complaint velocity data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [companyId])

  const getVelocityColor = () => {
    if (velocity > 50) return 'text-red-600'
    if (velocity > 20) return 'text-orange-600'
    if (velocity > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getVelocityIndicator = () => {
    if (velocity > 50) return '🔴'
    if (velocity > 20) return '🟠'
    if (velocity > 0) return '🟡'
    return '🟢'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Velocity</CardTitle>
        <CardDescription>Rate of incoming complaints (last hour)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline space-x-2">
          <div className={`text-4xl font-bold ${getVelocityColor()}`}>
            {velocity > 0 ? '+' : ''}{velocity}%
          </div>
          <div className="text-2xl">{getVelocityIndicator()}</div>
          <div className="text-sm text-muted-foreground">last 10 minutes</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#f97316"
              fill="#fb923c"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
