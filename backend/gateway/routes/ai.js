const express = require('express')
const router = express.Router()
const axios = require('axios')
const { AI_SERVICE_URL } = require('../server')

// Analyze sentiment
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const { complaints, company_id } = req.body

    if (!complaints || !company_id) {
      return res.status(400).json({ error: 'complaints and company_id are required' })
    }

    const response = await axios.post(`${AI_SERVICE_URL}/ai/sentiment`, {
      complaints,
      company_id,
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate SWOT analysis
router.post('/swot/generate', async (req, res) => {
  try {
    const { company_id } = req.body

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    const response = await axios.post(`${AI_SERVICE_URL}/ai/swot`, {
      company_id,
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error generating SWOT:', error)
    res.status(500).json({ error: error.message })
  }
})

// Root cause analysis
router.post('/root-cause/analyze', async (req, res) => {
  try {
    const { company_id, start_time, end_time } = req.body

    if (!company_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'company_id, start_time, and end_time are required' })
    }

    const response = await axios.post(`${AI_SERVICE_URL}/ai/root-cause`, {
      company_id,
      start_time,
      end_time,
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error analyzing root cause:', error)
    res.status(500).json({ error: error.message })
  }
})

// Complaint summary
router.post('/complaint-summary', async (req, res) => {
  try {
    const { company_id, time_range } = req.body

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    const response = await axios.post(`${AI_SERVICE_URL}/ai/complaint-summary`, {
      company_id,
      time_range: time_range || '24h',
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error generating complaint summary:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
