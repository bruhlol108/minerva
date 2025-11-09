'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import SentinelAlert from '@/components/sentinel-alert'
import HappinessWidget from '@/components/happiness-widget'
import ComplaintVelocityWidget from '@/components/complaint-velocity-widget'
import { AlertTriangle, TrendingUp, TrendingDown, Users, Loader2, Brain, Mic } from 'lucide-react'

export default function DashboardPage() {
  const [companyId] = useState('us')
  const [metrics, setMetrics] = useState<any>(null)
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  // Fetch real metrics
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [companyId])

  // Fetch complaints for categories
  useEffect(() => {
    fetchComplaints()
  }, [companyId])

  const fetchMetrics = async () => {
    try {
      // Get latest happiness metric
      const { data: happinessData } = await supabase
        .from('metrics_timeseries')
        .select('*')
        .eq('company_id', companyId)
        .eq('metric_type', 'happiness')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      setMetrics(happinessData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setLoading(false)
    }
  }

  const fetchComplaints = async () => {
    try {
      // Get complaints from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('company_id', companyId)
        .gte('timestamp', oneDayAgo)
        .order('timestamp', { ascending: false})

      setComplaints(data || [])
    } catch (error) {
      console.error('Error fetching complaints:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const triggerDemoOutage = async () => {
    setTriggering(true)
    setAiAnalyzing(false)

    try {
      const response = await fetch('/api/demo/trigger-outage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })

      const data = await response.json()
      console.log('✅ Demo outage triggered:', data)

      // Show AI is analyzing
      setTimeout(() => {
        setAiAnalyzing(true)
      }, 5000)

      // Refresh metrics immediately
      setTimeout(() => {
        fetchMetrics()
        fetchComplaints()
      }, 2000)

      setTimeout(() => {
        fetchMetrics()
        fetchComplaints()
      }, 5000)

      setTimeout(() => {
        setTriggering(false)
        setAiAnalyzing(false)
        fetchMetrics()
        fetchComplaints()
      }, 15000)

    } catch (error) {
      console.error('Error triggering demo outage:', error)
      setTriggering(false)
      setAiAnalyzing(false)
    }
  }

  // Calculate complaint categories
  const complaintCategories = complaints.reduce((acc: any, complaint) => {
    const category = complaint.category || 'other'
    if (!acc[category]) {
      acc[category] = { category, count: 0, complaints: [] }
    }
    acc[category].count++
    acc[category].complaints.push(complaint)
    return acc
  }, {})

  const topCategories = Object.values(complaintCategories)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 4)

  const totalComplaints = complaints.length
  const currentHappiness = metrics?.value ? Number(metrics.value).toFixed(1) : '...'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MINERVA
            </h1>
            <span className="text-sm text-muted-foreground">
              AI-Powered PM Productivity Platform
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerDemoOutage}
              disabled={triggering}
            >
              {triggering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Triggering...
                </>
              ) : (
                'Trigger Demo Outage'
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* AI Status Indicator */}
        {aiAnalyzing && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
                <div>
                  <div className="font-semibold text-purple-900">
                    🤖 Gemini AI Analyzing Anomaly...
                  </div>
                  <div className="text-sm text-purple-700">
                    Running statistical analysis and generating prediction
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sentinel Alert Banner */}
        <SentinelAlert companyId={companyId} />

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Happiness Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold">Loading...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{currentHappiness}%</div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <span>Real-time from database</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalComplaints}</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span>Last 24 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Market Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">34.5%</div>
              <div className="flex items-center text-sm text-blue-600 mt-1">
                <Users className="h-4 w-4 mr-1" />
                <span>12.4M users</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Gemini 2.5</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-2">
                <Mic className="h-5 w-5 text-blue-600" />
                <span className="font-medium">ElevenLabs</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HappinessWidget companyId={companyId} />
          <ComplaintVelocityWidget companyId={companyId} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Complaint Categories</CardTitle>
              <CardDescription>Issues reported in the last 24 hours (Real Data from DB)</CardDescription>
            </CardHeader>
            <CardContent>
              {topCategories.length === 0 ? (
                <div className="text-muted-foreground">No complaints in last 24 hours</div>
              ) : (
                <div className="space-y-4">
                  {topCategories.map((item: any) => {
                    const percent = totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0
                    const colors: any = {
                      auth: 'bg-red-500',
                      billing: 'bg-orange-500',
                      performance: 'bg-yellow-500',
                      support: 'bg-blue-500',
                      ui: 'bg-purple-500',
                    }
                    const color = colors[item.category] || 'bg-gray-500'

                    return (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium capitalize">{item.category} Issues</span>
                          <span className="text-muted-foreground">{item.count} complaints</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="min-w-[60px] text-muted-foreground">Live</div>
                  <div>Real-time monitoring active</div>
                </div>
                {aiAnalyzing && (
                  <div className="flex items-start space-x-2">
                    <Brain className="h-4 w-4 text-purple-600 mt-0.5 animate-pulse" />
                    <div className="font-semibold text-purple-600">Gemini AI analyzing...</div>
                  </div>
                )}
                {complaints.slice(0, 3).map((complaint, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className="min-w-[60px] text-muted-foreground">
                      {new Date(complaint.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="truncate">{complaint.text.substring(0, 50)}...</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
