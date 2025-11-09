import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      metrics_timeseries: {
        Row: {
          id: number
          company_id: string
          metric_type: string
          value: number
          timestamp: string
        }
        Insert: {
          id?: number
          company_id: string
          metric_type: string
          value: number
          timestamp?: string
        }
        Update: {
          id?: number
          company_id?: string
          metric_type?: string
          value?: number
          timestamp?: string
        }
      }
      complaints: {
        Row: {
          id: number
          company_id: string
          text: string
          sentiment: string | null
          sentiment_score: number | null
          category: string | null
          timestamp: string
          audio_url: string | null
        }
        Insert: {
          id?: number
          company_id: string
          text: string
          sentiment?: string | null
          sentiment_score?: number | null
          category?: string | null
          timestamp?: string
          audio_url?: string | null
        }
        Update: {
          id?: number
          company_id?: string
          text?: string
          sentiment?: string | null
          sentiment_score?: number | null
          category?: string | null
          timestamp?: string
          audio_url?: string | null
        }
      }
      brand_profiles: {
        Row: {
          id: number
          company_name: string
          metrics: Record<string, any>
          last_updated: string
        }
        Insert: {
          id?: number
          company_name: string
          metrics?: Record<string, any>
          last_updated?: string
        }
        Update: {
          id?: number
          company_name?: string
          metrics?: Record<string, any>
          last_updated?: string
        }
      }
      outage_predictions: {
        Row: {
          id: number
          company_id: string
          risk_level: string
          confidence: number
          predicted_service: string | null
          estimated_impact: number | null
          time_to_critical: number | null
          action_plan: Record<string, any> | null
          similar_incident_id: number | null
          created_at: string
          resolved_at: string | null
          actual_outage: boolean | null
        }
        Insert: {
          id?: number
          company_id: string
          risk_level: string
          confidence: number
          predicted_service?: string | null
          estimated_impact?: number | null
          time_to_critical?: number | null
          action_plan?: Record<string, any> | null
          similar_incident_id?: number | null
          created_at?: string
          resolved_at?: string | null
          actual_outage?: boolean | null
        }
        Update: {
          id?: number
          company_id?: string
          risk_level?: string
          confidence?: number
          predicted_service?: string | null
          estimated_impact?: number | null
          time_to_critical?: number | null
          action_plan?: Record<string, any> | null
          similar_incident_id?: number | null
          created_at?: string
          resolved_at?: string | null
          actual_outage?: boolean | null
        }
      }
      swot_analyses: {
        Row: {
          id: number
          company_id: string
          content: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: number
          company_id: string
          content: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: number
          company_id?: string
          content?: Record<string, any>
          created_at?: string
        }
      }
      historical_incidents: {
        Row: {
          id: number
          company_id: string
          incident_type: string
          description: string | null
          metrics_snapshot: Record<string, any> | null
          resolution: Record<string, any> | null
          occurred_at: string
        }
        Insert: {
          id?: number
          company_id: string
          incident_type: string
          description?: string | null
          metrics_snapshot?: Record<string, any> | null
          resolution?: Record<string, any> | null
          occurred_at: string
        }
        Update: {
          id?: number
          company_id?: string
          incident_type?: string
          description?: string | null
          metrics_snapshot?: Record<string, any> | null
          resolution?: Record<string, any> | null
          occurred_at?: string
        }
      }
    }
  }
}
