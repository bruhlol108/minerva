require('dotenv').config({ path: '../backend/gateway/.env' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const COMPANIES = ['us', 'competitor_a', 'competitor_b']

const COMPLAINT_TEMPLATES = {
  auth: [
    "Can't log in to my account",
    "Login page keeps timing out",
    "Authentication service is down",
    "Unable to access my account",
    "Getting error 500 on login",
    "Login broken",
    "Password reset not working",
    "Two-factor authentication failing",
  ],
  billing: [
    "Was charged twice this month",
    "Billing error on my account",
    "Can't update payment method",
    "Subscription not cancelled properly",
    "Invoice is incorrect",
    "Payment failed but service stopped",
  ],
  performance: [
    "App is extremely slow today",
    "Pages take forever to load",
    "Constant lag and freezing",
    "Performance has degraded significantly",
    "Dashboard won't load",
    "Timeout errors constantly",
  ],
  support: [
    "Support hasn't responded in 3 days",
    "Can't reach customer service",
    "Support ticket was closed without resolution",
    "No response from support team",
  ],
  ui: [
    "Button doesn't work on mobile",
    "UI is broken on Safari",
    "Can't click submit button",
    "Layout is messed up",
  ],
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  // Step 1: Create brand profiles
  console.log('📊 Creating brand profiles...')
  for (const company of COMPANIES) {
    const { data, error } = await supabase
      .from('brand_profiles')
      .upsert({
        company_name: company,
        metrics: {
          market_share: company === 'us' ? 34.5 : Math.random() * 30 + 10,
          user_base: Math.floor(Math.random() * 10000000) + 1000000,
        },
        last_updated: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error(`Error creating ${company}:`, error)
    } else {
      console.log(`✅ Created profile for ${company}`)
    }
  }

  // Step 2: Generate 30 days of metrics
  console.log('\n📈 Generating 30 days of metrics...')
  const metricsToInsert = []

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (const company of COMPANIES) {
    let currentHappiness = company === 'us' ? 87 : 70 + Math.random() * 15

    // Generate hourly metrics for 30 days
    for (let i = 0; i < 30 * 24; i++) {
      const timestamp = new Date(thirtyDaysAgo.getTime() + i * 60 * 60 * 1000)

      // Add natural variation
      const variation = (Math.random() - 0.5) * 3
      currentHappiness = Math.max(60, Math.min(95, currentHappiness + variation))

      // Inject a "crisis pattern" at day 25 for 'us' company
      if (company === 'us' && i >= 25 * 24 && i <= 25 * 24 + 2) {
        currentHappiness -= 7.5 // Drop from 87% to 72% over 2 hours
      } else if (company === 'us' && i > 25 * 24 + 2 && i <= 25 * 24 + 12) {
        // Gradual recovery
        currentHappiness += 1.5
      }

      metricsToInsert.push({
        company_id: company,
        metric_type: 'happiness',
        value: currentHappiness,
        timestamp: timestamp.toISOString(),
      })
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < metricsToInsert.length; i += 100) {
    const batch = metricsToInsert.slice(i, i + 100)
    const { error } = await supabase.from('metrics_timeseries').insert(batch)

    if (error) {
      console.error(`Error inserting metrics batch ${i / 100}:`, error)
    } else {
      console.log(`✅ Inserted metrics batch ${i / 100 + 1}/${Math.ceil(metricsToInsert.length / 100)}`)
    }
  }

  // Step 3: Generate complaints
  console.log('\n💬 Generating complaints...')
  const complaintsToInsert = []

  for (const company of COMPANIES) {
    const numComplaints = company === 'us' ? 100 : 50 + Math.floor(Math.random() * 50)

    for (let i = 0; i < numComplaints; i++) {
      const categories = Object.keys(COMPLAINT_TEMPLATES)
      const category = categories[Math.floor(Math.random() * categories.length)]
      const templates = COMPLAINT_TEMPLATES[category]
      const text = templates[Math.floor(Math.random() * templates.length)]

      const timestamp = new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
      )

      complaintsToInsert.push({
        company_id: company,
        text,
        category,
        sentiment: 'negative',
        sentiment_score: -0.6 - Math.random() * 0.4, // -0.6 to -1.0
        timestamp: timestamp.toISOString(),
      })
    }
  }

  // Insert complaints in batches
  for (let i = 0; i < complaintsToInsert.length; i += 100) {
    const batch = complaintsToInsert.slice(i, i + 100)
    const { error } = await supabase.from('complaints').insert(batch)

    if (error) {
      console.error(`Error inserting complaints batch ${i / 100}:`, error)
    } else {
      console.log(`✅ Inserted complaints batch ${i / 100 + 1}/${Math.ceil(complaintsToInsert.length / 100)}`)
    }
  }

  // Step 4: Create historical incidents
  console.log('\n📜 Creating historical incidents...')
  const incidents = [
    {
      company_id: 'us',
      incident_type: 'auth_outage',
      description: 'Authentication service outage affecting login',
      metrics_snapshot: {
        happiness_before: 87,
        happiness_during: 72,
        complaint_spike: 400,
        duration_minutes: 120,
      },
      resolution: {
        root_cause: 'Database connection pool exhaustion',
        fix: 'Increased connection pool size and added circuit breaker',
        time_to_resolve: 90,
      },
      occurred_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      company_id: 'us',
      incident_type: 'performance_degradation',
      description: 'Slow response times across all services',
      metrics_snapshot: {
        happiness_before: 85,
        happiness_during: 78,
        complaint_spike: 150,
        duration_minutes: 60,
      },
      resolution: {
        root_cause: 'Memory leak in caching layer',
        fix: 'Restarted services and deployed hotfix',
        time_to_resolve: 45,
      },
      occurred_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  for (const incident of incidents) {
    const { error } = await supabase.from('historical_incidents').insert(incident)

    if (error) {
      console.error('Error inserting incident:', error)
    } else {
      console.log(`✅ Created incident: ${incident.incident_type}`)
    }
  }

  console.log('\n✨ Database seeding complete!\n')
  console.log('Summary:')
  console.log(`- ${COMPANIES.length} brand profiles created`)
  console.log(`- ${metricsToInsert.length} metrics data points inserted`)
  console.log(`- ${complaintsToInsert.length} complaints inserted`)
  console.log(`- ${incidents.length} historical incidents created`)
  console.log('\n🎉 Ready for demo!')
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
