'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import SentinelAlert from '@/components/sentinel-alert'
import HappinessWidget from '@/components/happiness-widget'
import ComplaintVelocityWidget from '@/components/complaint-velocity-widget'
import { AlertTriangle, TrendingUp, TrendingDown, Users } from 'lucide-react'

export default function DashboardPage() {
  const [companyId] = useState('us') // Default to "us" company
  const [prediction, setPrediction] = useState<any>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const triggerDemoOutage = async () => {
    try {
      const response = await fetch('/api/demo/trigger-outage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })
      const data = await response.json()
      console.log('Demo outage triggered:', data)
    } catch (error) {
      console.error('Error triggering demo outage:', error)
    }
  }

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
            >
              Trigger Demo Outage
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
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
              <div className="text-3xl font-bold">87.2%</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+2.1% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Complaint Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">+12%</div>
              <div className="flex items-center text-sm text-orange-600 mt-1">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Last 10 minutes</span>
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
                Active Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span>2 critical, 1 medium</span>
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
              <CardDescription>Issues reported in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Login Issues', count: 45, percent: 45, color: 'bg-red-500' },
                  { category: 'Slow Response', count: 23, percent: 23, color: 'bg-orange-500' },
                  { category: 'Billing Errors', count: 18, percent: 18, color: 'bg-yellow-500' },
                  { category: 'UI Bugs', count: 14, percent: 14, color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.count} complaints</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="min-w-[60px] text-muted-foreground">2 min ago</div>
                  <div>Sentinel detected anomaly</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="min-w-[60px] text-muted-foreground">15 min ago</div>
                  <div>SWOT analysis updated</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="min-w-[60px] text-muted-foreground">1 hour ago</div>
                  <div>Daily briefing ready</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="min-w-[60px] text-muted-foreground">2 hours ago</div>
                  <div>Happiness index increased by 3%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
