'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SentinelAlertProps {
  companyId: string
}

interface Prediction {
  id: number
  risk_level: string
  confidence: number
  predicted_service: string | null
  estimated_impact: number | null
  time_to_critical: number | null
  action_plan: any
  created_at: string
}

export default function SentinelAlert({ companyId }: SentinelAlertProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/sentinel/status?company_id=${companyId}`)
        if (response.ok) {
          const data = await response.json()
          setPrediction(data.prediction)
        }
      } catch (error) {
        console.error('Error fetching sentinel status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
    const interval = setInterval(fetchPrediction, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [companyId])

  if (loading || !prediction || prediction.risk_level === 'low') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <div className="font-semibold text-green-900">All Systems Normal</div>
            <div className="text-sm text-green-700">MINERVA Sentinel is monitoring for anomalies</div>
          </div>
        </div>
      </div>
    )
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          subtext: 'text-red-700',
          icon: 'text-red-600',
        }
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-900',
          subtext: 'text-orange-700',
          icon: 'text-orange-600',
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          subtext: 'text-yellow-700',
          icon: 'text-yellow-600',
        }
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          subtext: 'text-green-700',
          icon: 'text-green-600',
        }
    }
  }

  const getIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <XCircle className="h-8 w-8" />
      case 'high':
      case 'medium':
        return <AlertTriangle className="h-8 w-8" />
      default:
        return <AlertCircle className="h-8 w-8" />
    }
  }

  const colors = getRiskColor(prediction.risk_level)

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 animate-pulse`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={colors.icon}>
            {getIcon(prediction.risk_level)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className={`text-xl font-bold ${colors.text}`}>
                {prediction.risk_level.toUpperCase()} Outage Predicted
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {prediction.confidence}% Confidence
              </span>
            </div>
            <div className={`${colors.subtext} space-y-1`}>
              {prediction.predicted_service && (
                <div>Service: <span className="font-semibold">{prediction.predicted_service}</span></div>
              )}
              {prediction.estimated_impact && (
                <div>Estimated Impact: <span className="font-semibold">{prediction.estimated_impact.toLocaleString()} users</span></div>
              )}
              {prediction.time_to_critical && (
                <div>Time to Critical: <span className="font-semibold">{prediction.time_to_critical} minutes</span></div>
              )}
            </div>
            {prediction.action_plan && Array.isArray(prediction.action_plan) && (
              <div className="mt-4">
                <div className={`font-semibold ${colors.text} mb-2`}>Recommended Actions:</div>
                <ul className={`list-disc list-inside space-y-1 ${colors.subtext}`}>
                  {prediction.action_plan.map((action: string, index: number) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <Button variant="outline" size="sm">
            Mark Resolved
          </Button>
        </div>
      </div>
    </div>
  )
}
