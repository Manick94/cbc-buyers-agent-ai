import { getDb } from './database'
import { initSchema } from './schema'
import { randomUUID } from 'crypto'

const customers = [
  { name: 'Sarah Mitchell', budget: 850000, location: 'Sydney', preferences: { propertyType: 'apartment', bedrooms: 2, features: ['parking', 'gym', 'city views'], intent: 'investment' }, llm_source: 'cloud_gemini', status: 'qualified', ai_score: 82, notes: 'Interested in Inner West. Pre-approved finance.' },
  { name: 'James Nguyen', budget: 1200000, location: 'Melbourne', preferences: { propertyType: 'house', bedrooms: 4, features: ['backyard', 'garage', 'study'], intent: 'personal' }, llm_source: 'cloud_openai', status: 'active', ai_score: 67, notes: 'Family of 4, needs good school zone.' },
  { name: 'Emma Kowalski', budget: 650000, location: 'Brisbane', preferences: { propertyType: 'townhouse', bedrooms: 3, features: ['pool', 'courtyard'], intent: 'personal' }, llm_source: 'cloud_gemini', status: 'converted', ai_score: 95, notes: 'Purchased in Newstead. Contract signed.' },
  { name: 'David Chen', budget: 1800000, location: 'Sydney', preferences: { propertyType: 'house', bedrooms: 5, features: ['pool', 'views', 'double garage', 'home theatre'], intent: 'personal' }, llm_source: 'ollama', status: 'active', ai_score: 74, notes: 'Looking in Lower North Shore or Eastern Suburbs.' },
  { name: 'Priya Sharma', budget: 550000, location: 'Adelaide', preferences: { propertyType: 'apartment', bedrooms: 2, features: ['balcony', 'secure parking'], intent: 'investment' }, llm_source: 'cloud_gemini', status: 'active', ai_score: 58, notes: 'First-time investor.' },
  { name: 'Michael Thompson', budget: 2000000, location: 'Melbourne', preferences: { propertyType: 'house', bedrooms: 4, features: ['heritage features', 'large land'], intent: 'investment' }, llm_source: 'cloud_openai', status: 'qualified', ai_score: 88, notes: 'Experienced investor. Interested in Fitzroy/Collingwood.' },
  { name: 'Olivia Brown', budget: 720000, location: 'Perth', preferences: { propertyType: 'house', bedrooms: 3, features: ['backyard', 'solar panels', 'near beach'], intent: 'personal' }, llm_source: 'cloud_gemini', status: 'active', ai_score: 71, notes: 'Relocating from Brisbane. Wants coastal suburb.' },
  { name: "Liam O'Brien", budget: 480000, location: 'Brisbane', preferences: { propertyType: 'apartment', bedrooms: 1, features: ['gym', 'CBD access'], intent: 'investment' }, llm_source: 'local', status: 'lost', ai_score: 34, notes: 'Budget too low for desired area.' },
  { name: 'Chloe Anderson', budget: 950000, location: 'Sydney', preferences: { propertyType: 'townhouse', bedrooms: 3, features: ['courtyard', 'lock-up garage'], intent: 'personal' }, llm_source: 'cloud_gemini', status: 'qualified', ai_score: 79, notes: 'Wants North Shore or Northern Beaches.' },
  { name: 'Raj Patel', budget: 1500000, location: 'Melbourne', preferences: { propertyType: 'house', bedrooms: 4, features: ['modern kitchen', 'alfresco', 'double garage'], intent: 'personal' }, llm_source: 'cloud_openai', status: 'active', ai_score: 85, notes: 'Wants Bayside suburb.' },
]

function seedDb(): void {
  initSchema()
  const db = getDb()

  const existing = db.get('SELECT COUNT(*) as count FROM customers') as { count: number }
  if (existing.count > 0) {
    console.log(`Database already has ${existing.count} customers. Skipping seed.`)
    return
  }

  db.run('BEGIN')
  try {
    for (const c of customers) {
      const id = randomUUID()
      const now = new Date()
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()

      db.run(
        `INSERT INTO customers (customer_id, name, budget, location, preferences, conversation, llm_source, agent_id, status, ai_score, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, c.name, c.budget, c.location,
          JSON.stringify(c.preferences),
          JSON.stringify([
            { role: 'assistant', content: 'Welcome! How can I help you find your perfect property today?', timestamp: createdAt },
            { role: 'user', content: `I'm looking for a property in ${c.location}.`, timestamp: createdAt },
          ]),
          c.llm_source, 'agent_001', c.status, c.ai_score, c.notes, createdAt, createdAt,
        ]
      )

      db.run(
        'INSERT INTO analytics_events (event_id, customer_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), id, 'interaction', JSON.stringify({ message_count: 2 }), createdAt]
      )
    }
    db.run('COMMIT')
    console.log(`Seeded ${customers.length} customers successfully.`)
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }
}

if (require.main === module) {
  seedDb()
  process.exit(0)
}
