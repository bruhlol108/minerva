require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Service URLs
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:8001'

// Routes
const metricsRoutes = require('./routes/metrics')
const sentinelRoutes = require('./routes/sentinel')
const aiRoutes = require('./routes/ai')
const demoRoutes = require('./routes/demo')

app.use('/api/metrics', metricsRoutes)
app.use('/api/sentinel', sentinelRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/demo', demoRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MINERVA API Gateway' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`🚀 MINERVA API Gateway running on port ${PORT}`)
})

module.exports = { app, supabase, AI_SERVICE_URL, VOICE_SERVICE_URL }
