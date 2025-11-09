const express = require('express')
const router = express.Router()
const { supabase } = require('../server')

// Get current happiness metric
router.get('/happiness/current', async (req, res) => {
  try {
    const { company_id } = req.query

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    const { data, error } = await supabase
      .from('metrics_timeseries')
      .select('*')
      .eq('company_id', company_id)
      .eq('metric_type', 'happiness')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    res.json({ metric: data })
  } catch (error) {
    console.error('Error fetching happiness metric:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get historical happiness data
router.get('/happiness/historical', async (req, res) => {
  try {
    const { company_id, range = '7d' } = req.query

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    // Parse range (7d, 24h, 30d, etc.)
    const rangeMap = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }

    const hours = rangeMap[range] || 24 * 7
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('metrics_timeseries')
      .select('*')
      .eq('company_id', company_id)
      .eq('metric_type', 'happiness')
      .gte('timestamp', since)
      .order('timestamp', { ascending: true })

    if (error) throw error

    res.json({ metrics: data })
  } catch (error) {
    console.error('Error fetching historical happiness:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all current metrics for a company
router.get('/all', async (req, res) => {
  try {
    const { company_id } = req.query

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    // Get latest metric of each type
    const { data, error } = await supabase
      .from('metrics_timeseries')
      .select('*')
      .eq('company_id', company_id)
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) throw error

    // Group by metric_type and get the most recent
    const latestMetrics = {}
    data.forEach((metric) => {
      if (!latestMetrics[metric.metric_type]) {
        latestMetrics[metric.metric_type] = metric
      }
    })

    res.json({ metrics: latestMetrics })
  } catch (error) {
    console.error('Error fetching all metrics:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
