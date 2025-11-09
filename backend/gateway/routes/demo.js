const express = require('express')
const router = express.Router()
const axios = require('axios')
const { supabase, AI_SERVICE_URL } = require('../server')

// Trigger demo outage simulation
router.post('/trigger-outage', async (req, res) => {
  try {
    const { company_id } = req.body

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    console.log(`🚨 Triggering demo outage for ${company_id}...`)

    // Step 1: Inject rapid complaints
    const complaints = [
      "Can't log in! This is frustrating!",
      "Login page keeps timing out",
      "Authentication service is down",
      "Unable to access my account",
      "Login broken for the past 10 minutes",
      "Getting error 500 on login",
      "Is anyone else having login issues?",
      "Login completely broken",
      "Can't authenticate, tried multiple times",
      "Login service appears to be down",
      "Keep getting 'invalid credentials' but password is correct",
      "Login timeout errors constantly",
      "Unable to sign in to my account",
      "Authentication failing repeatedly",
      "Login has been down for 15 minutes now",
      "Can't access login page at all",
      "Login button doesn't work",
      "Getting connection timeout on login",
      "Login service completely unresponsive",
      "Authentication server appears to be offline",
    ]

    // Insert complaints rapidly
    const complaintInserts = complaints.map((text) => ({
      company_id,
      text,
      category: 'auth',
      sentiment: 'negative',
      sentiment_score: -0.8,
      timestamp: new Date().toISOString(),
    }))

    const { error: complaintsError } = await supabase
      .from('complaints')
      .insert(complaintInserts)

    if (complaintsError) throw complaintsError

    console.log(`✅ Injected ${complaints.length} complaints`)

    // Step 2: Drop happiness metric
    const happinessDrops = [
      { value: 85.0, delay: 0 },
      { value: 82.5, delay: 2000 },
      { value: 79.0, delay: 4000 },
      { value: 75.5, delay: 6000 },
      { value: 72.0, delay: 8000 },
    ]

    for (const drop of happinessDrops) {
      setTimeout(async () => {
        await supabase.from('metrics_timeseries').insert({
          company_id,
          metric_type: 'happiness',
          value: drop.value,
          timestamp: new Date().toISOString(),
        })
        console.log(`📉 Happiness dropped to ${drop.value}%`)
      }, drop.delay)
    }

    // Step 3: Trigger Sentinel analysis after a delay
    setTimeout(async () => {
      try {
        console.log('🤖 Triggering Sentinel analysis...')
        const sentinelResponse = await axios.post(`${AI_SERVICE_URL}/sentinel/analyze`, {
          company_id,
        })
        console.log('✅ Sentinel analysis complete:', sentinelResponse.data)
      } catch (error) {
        console.error('Error in Sentinel analysis:', error.message)
      }
    }, 10000) // Analyze after 10 seconds

    res.json({
      success: true,
      message: 'Demo outage triggered successfully',
      complaints_injected: complaints.length,
      happiness_trajectory: happinessDrops.map((d) => d.value),
    })
  } catch (error) {
    console.error('Error triggering demo outage:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reset demo data
router.post('/reset', async (req, res) => {
  try {
    const { company_id } = req.body

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' })
    }

    // Delete recent complaints
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    await supabase
      .from('complaints')
      .delete()
      .eq('company_id', company_id)
      .gte('timestamp', oneHourAgo)

    // Restore happiness to normal
    await supabase.from('metrics_timeseries').insert({
      company_id,
      metric_type: 'happiness',
      value: 87.2,
      timestamp: new Date().toISOString(),
    })

    // Resolve any open predictions
    await supabase
      .from('outage_predictions')
      .update({ resolved_at: new Date().toISOString() })
      .eq('company_id', company_id)
      .is('resolved_at', null)

    res.json({ success: true, message: 'Demo data reset successfully' })
  } catch (error) {
    console.error('Error resetting demo data:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
