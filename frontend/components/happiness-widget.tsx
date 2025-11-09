'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

interface HappinessWidgetProps {
  companyId: string
}

interface DataPoint {
  timestamp: string
  value: number
}

export default function HappinessWidget({ companyId }: HappinessWidgetProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [currentValue, setCurrentValue] = useState<number>(87.2)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: metrics, error } = await supabase
          .from('metrics_timeseries')
          .select('*')
          .eq('company_id', companyId)
          .eq('metric_type', 'happiness')
          .order('timestamp', { ascending: false })
          .limit(100)

        if (error) throw error

        if (metrics && metrics.length > 0) {
          const formattedData = metrics
            .reverse()
            .map((m) => ({
              timestamp: new Date(m.timestamp).toLocaleTimeString(),
              value: Number(m.value),
            }))

          setData(formattedData)
          setCurrentValue(Number(metrics[0].value))
        }
      } catch (error) {
        console.error('Error fetching happiness data:', error)
      }
    }

    fetchData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('happiness-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'metrics_timeseries',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.new.metric_type === 'happiness') {
            setData((prev) => [
              ...prev,
              {
                timestamp: new Date(payload.new.timestamp).toLocaleTimeString(),
                value: Number(payload.new.value),
              },
            ])
            setCurrentValue(Number(payload.new.value))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [companyId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Happiness Index</CardTitle>
        <CardDescription>Real-time customer satisfaction tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-4xl font-bold">{currentValue.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Last updated just now</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
