import { getDb } from './database'

export function initSchema(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      budget REAL,
      location TEXT,
      preferences TEXT,
      conversation TEXT,
      llm_source TEXT DEFAULT 'cloud_gemini',
      agent_id TEXT,
      status TEXT DEFAULT 'active',
      ai_score REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(location);
    CREATE INDEX IF NOT EXISTS idx_customers_llm_source ON customers(llm_source);
    CREATE INDEX IF NOT EXISTS idx_customers_agent_id ON customers(agent_id);

    CREATE TABLE IF NOT EXISTS analytics_events (
      event_id TEXT PRIMARY KEY,
      customer_id TEXT,
      event_type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_customer ON analytics_events(customer_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);
  `)

  console.log('Database schema initialized.')
}

if (require.main === module) {
  initSchema()
  process.exit(0)
}
