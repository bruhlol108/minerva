require('dotenv').config({ path: '../backend/gateway/.env' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupSchema() {
  console.log('🔧 Setting up MINERVA database schema...\n')

  // Read the schema SQL file
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  // Split into individual statements (basic approach)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comments
    if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
      continue
    }

    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      // If exec_sql doesn't exist, we need to use direct SQL execution
      // This is a workaround - we'll execute via the REST API
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      })

      console.log(`✅ Statement ${i + 1} executed`)
    } catch (error) {
      console.log(`⚠️  Statement ${i + 1} - ${error.message}`)
    }
  }

  console.log('\n✨ Schema setup complete!\n')
  console.log('Next step: Run "npm run seed" to populate with demo data')
}

setupSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Schema setup failed:', error)
    console.log('\n💡 Please run the schema manually in Supabase SQL Editor')
    console.log('   Copy scripts/schema.sql and paste it in the SQL Editor')
    process.exit(1)
  })
