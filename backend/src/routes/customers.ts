import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDb } from '../db/database'
import { randomUUID } from 'crypto'

const router = Router()

type DbRow = Record<string, unknown>

function parseCustomer(row: DbRow) {
  return {
    ...row,
    preferences: row.preferences ? JSON.parse(row.preferences as string) : null,
    conversation: row.conversation ? JSON.parse(row.conversation as string) : [],
  }
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { location, min_budget, max_budget, status, llm_source, agent_id, limit = '100', offset = '0' } = req.query

  let sql = "SELECT * FROM customers WHERE status != 'deleted'"
  const params: unknown[] = []

  if (location) { sql += ' AND location LIKE ?'; params.push(`%${location}%`) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (llm_source) { sql += ' AND llm_source = ?'; params.push(llm_source) }
  if (agent_id) { sql += ' AND agent_id = ?'; params.push(agent_id) }
  if (min_budget) { sql += ' AND budget >= ?'; params.push(Number(min_budget)) }
  if (max_budget) { sql += ' AND budget <= ?'; params.push(Number(max_budget)) }

  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const rows = db.all(sql, params) as DbRow[]
  const total = (db.get("SELECT COUNT(*) as count FROM customers WHERE status != 'deleted'") as { count: number }).count

  res.json({ data: rows.map(parseCustomer), meta: { total, limit: Number(limit), offset: Number(offset) } })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.get('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]) as DbRow | undefined

  if (!row) { res.status(404).json({ error: 'Customer not found' }); return }
  res.json({ data: parseCustomer(row) })
})

router.post('/', (req: Request, res: Response) => {
  const { name, budget, location, preferences, conversation, llm_source, agent_id, status, ai_score, notes } = req.body

  if (!name) { res.status(400).json({ error: 'name is required' }); return }

  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO customers (customer_id, name, budget, location, preferences, conversation, llm_source, agent_id, status, ai_score, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, name, budget ?? null, location ?? null,
      preferences ? JSON.stringify(preferences) : null,
      conversation ? JSON.stringify(conversation) : JSON.stringify([]),
      llm_source ?? 'cloud_gemini',
      agent_id ?? null,
      status ?? 'active',
      ai_score ?? null,
      notes ?? null,
      now, now,
    ]
  )

  const row = db.get('SELECT * FROM customers WHERE customer_id = ?', [id]) as DbRow
  res.status(201).json({ data: parseCustomer(row) })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const existing = db.get('SELECT customer_id FROM customers WHERE customer_id = ?', [req.params.id])

  if (!existing) { res.status(404).json({ error: 'Customer not found' }); return }

  const { name, budget, location, preferences, conversation, llm_source, agent_id, status, ai_score, notes } = req.body
  const now = new Date().toISOString()

  db.run(
    `UPDATE customers SET
      name = COALESCE(?, name),
      budget = COALESCE(?, budget),
      location = COALESCE(?, location),
      preferences = COALESCE(?, preferences),
      conversation = COALESCE(?, conversation),
      llm_source = COALESCE(?, llm_source),
      agent_id = COALESCE(?, agent_id),
      status = COALESCE(?, status),
      ai_score = COALESCE(?, ai_score),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE customer_id = ?`,
    [
      name ?? null, budget ?? null, location ?? null,
      preferences ? JSON.stringify(preferences) : null,
      conversation ? JSON.stringify(conversation) : null,
      llm_source ?? null, agent_id ?? null, status ?? null,
      ai_score ?? null, notes ?? null, now, req.params.id,
    ]
  )

  const row = db.get('SELECT * FROM customers WHERE customer_id = ?', [req.params.id]) as DbRow
  res.json({ data: parseCustomer(row) })
})

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const now = new Date().toISOString()
  db.run("UPDATE customers SET status = 'deleted', updated_at = ? WHERE customer_id = ?", [now, req.params.id])
  const row = db.get('SELECT customer_id FROM customers WHERE customer_id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Customer not found' }); return }
  res.json({ data: { deleted: true } })
})

export default router
