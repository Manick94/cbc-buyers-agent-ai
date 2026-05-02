import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

type DbRow = Record<string, unknown>

function parseQuery(query: string): { sql: string; params: unknown[]; insights: string } {
  const lower = query.toLowerCase()
  let sql = "SELECT * FROM customers WHERE status != 'deleted'"
  const params: unknown[] = []
  const notes: string[] = []

  const locationMatch = lower.match(/\b(sydney|melbourne|brisbane|perth|adelaide|canberra|hobart|darwin)\b/)
  if (locationMatch) { sql += ' AND location LIKE ?'; params.push(`%${locationMatch[1]}%`); notes.push(`in ${locationMatch[1]}`) }

  const above = lower.match(/(?:above|over|more than|budget over)\s*\$?(\d[\d,]*)\s*([km]?)/i)
  if (above) {
    const n = parseFloat(above[1].replace(/,/g, '')) * (above[2]?.toLowerCase() === 'k' ? 1000 : above[2]?.toLowerCase() === 'm' ? 1000000 : 1)
    sql += ' AND budget >= ?'; params.push(n); notes.push(`budget above $${n.toLocaleString()}`)
  }

  const below = lower.match(/(?:under|below|less than|budget under)\s*\$?(\d[\d,]*)\s*([km]?)/i)
  if (below) {
    const n = parseFloat(below[1].replace(/,/g, '')) * (below[2]?.toLowerCase() === 'k' ? 1000 : below[2]?.toLowerCase() === 'm' ? 1000000 : 1)
    sql += ' AND budget <= ?'; params.push(n); notes.push(`budget under $${n.toLocaleString()}`)
  }

  if (lower.includes('convert') || lower.includes('closed')) { sql += " AND status = 'converted'"; notes.push('converted') }
  else if (lower.includes('active')) { sql += " AND status = 'active'"; notes.push('active') }
  else if (lower.includes('qualified')) { sql += " AND status = 'qualified'"; notes.push('qualified') }

  if (lower.includes('apartment') || lower.includes('unit')) { sql += " AND preferences LIKE '%apartment%'"; notes.push('apartments') }
  else if (lower.includes('house')) { sql += " AND preferences LIKE '%house%'"; notes.push('houses') }
  else if (lower.includes('townhouse')) { sql += " AND preferences LIKE '%townhouse%'"; notes.push('townhouses') }

  if (lower.includes('gemini')) { sql += " AND llm_source = 'cloud_gemini'"; notes.push('via Gemini') }
  else if (lower.includes('openai') || lower.includes('chatgpt')) { sql += " AND llm_source = 'cloud_openai'"; notes.push('via OpenAI') }
  else if (lower.includes('ollama')) { sql += " AND llm_source = 'ollama'"; notes.push('via Ollama') }

  if (lower.includes('high score') || lower.includes('high intent') || lower.includes('likely to convert')) {
    sql += ' AND ai_score >= 75'; notes.push('high AI score (≥75)')
  }

  sql += ' ORDER BY ai_score DESC, updated_at DESC LIMIT 50'
  const insights = notes.length > 0
    ? `Showing customers ${notes.join(', ')}.`
    : 'Showing all customers. Try filtering by location, budget, status, or property type.'

  return { sql, params, insights }
}

router.post('/', (req: Request, res: Response) => {
  const { query } = req.body
  if (!query || typeof query !== 'string') { res.status(400).json({ error: 'query string is required' }); return }

  const db = getDb()
  const { sql, params, insights } = parseQuery(query)
  const rows = db.all(sql, params) as DbRow[]
  const customers = rows.map(row => ({
    ...row,
    preferences: row.preferences ? JSON.parse(row.preferences as string) : null,
    conversation: row.conversation ? JSON.parse(row.conversation as string) : [],
  }))

  res.json({ data: { customers, insights, total: customers.length } })
})

export default router
