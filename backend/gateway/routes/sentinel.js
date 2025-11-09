const express = require('express')
const router = express.Router()
const axios = require('axios')
const { supabase, AI_SERVICE_URL } = require('../server')

// Get current sentinel status
router.get('/status', async (req, res) => {
  try {
    const { company_id } = req.query

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    // Get most recent unresolved prediction
    const { data, error } = await supabase
      .from('outage_predictions')
      .select('*')
      .eq('company_id', company_id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      res.json({ prediction: data[0] })
    } else {
      res.json({ prediction: null })
    }
  } catch (error) {
    console.error('Error fetching sentinel status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get recent predictions
router.get('/predictions', async (req, res) => {
  try {
    const { company_id, limit = 10 } = req.query

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    const { data, error } = await supabase
      .from('outage_predictions')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) throw error

    res.json({ predictions: data })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    res.status(500).json({ error: error.message })
  }
})

// Trigger sentinel analysis
router.post('/analyze', async (req, res) => {
  try {
    const { company_id } = req.body

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    // Call AI service to run sentinel analysis
    const response = await axios.post(`${AI_SERVICE_URL}/sentinel/analyze`, {
      company_id,
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error triggering sentinel analysis:', error)
    res.status(500).json({ error: error.message })
  }
})

// Mark prediction as resolved
router.put('/predictions/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params
    const { actual_outage } = req.body

    const { data, error } = await supabase
      .from('outage_predictions')
      .update({
        resolved_at: new Date().toISOString(),
        actual_outage: actual_outage || false,
      })
      .eq('id', id)
      .select()

    if (error) throw error

    res.json({ prediction: data[0] })
  } catch (error) {
    console.error('Error resolving prediction:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
