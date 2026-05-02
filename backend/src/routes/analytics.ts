import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDb } from '../db/database'

const router = Router()

router.get('/summary', (_req: Request, res: Response) => {
  const db = getDb()

  const totalCustomers = (db.get("SELECT COUNT(*) as count FROM customers WHERE status != 'deleted'") as { count: number }).count
  const activeConversations = (db.get("SELECT COUNT(*) as count FROM customers WHERE status = 'active'") as { count: number }).count
  const converted = (db.get("SELECT COUNT(*) as count FROM customers WHERE status = 'converted'") as { count: number }).count
  const conversionRate = totalCustomers > 0 ? Math.round((converted / totalCustomers) * 100) : 0

  const avgStats = db.get("SELECT AVG(budget) as avgBudget, AVG(ai_score) as avgAiScore FROM customers WHERE status != 'deleted'") as { avgBudget: number; avgAiScore: number }

  const llmRows = db.all("SELECT llm_source, COUNT(*) as count FROM customers WHERE status != 'deleted' GROUP BY llm_source") as { llm_source: string; count: number }[]
  const llmUsage: Record<string, number> = {}
  for (const row of llmRows) llmUsage[row.llm_source] = row.count

  const statusRows = db.all("SELECT status, COUNT(*) as count FROM customers GROUP BY status") as { status: string; count: number }[]
  const statusBreakdown: Record<string, number> = {}
  for (const row of statusRows) statusBreakdown[row.status] = row.count

  res.json({
    data: {
      totalCustomers,
      activeConversations,
      conversionRate,
      avgBudget: Math.round(avgStats.avgBudget ?? 0),
      avgAiScore: Math.round(avgStats.avgAiScore ?? 0),
      llmUsage,
      statusBreakdown,
    }
  })
})

router.get('/trends', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.all(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'interaction'
      AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `) as { date: string; count: number }[]

  res.json({ data: rows })
})

router.get('/budget-distribution', (_req: Request, res: Response) => {
  const db = getDb()
  const buckets = [
    { label: 'Under $500K', min: 0, max: 500000 },
    { label: '$500K–$750K', min: 500000, max: 750000 },
    { label: '$750K–$1M', min: 750000, max: 1000000 },
    { label: '$1M–$1.5M', min: 1000000, max: 1500000 },
    { label: 'Over $1.5M', min: 1500000, max: 99999999 },
  ]

  const data = buckets.map(b => ({
    label: b.label,
    count: (db.get("SELECT COUNT(*) as count FROM customers WHERE budget >= ? AND budget < ? AND status != 'deleted'", [b.min, b.max]) as { count: number }).count,
  }))

  res.json({ data })
})

router.get('/location-breakdown', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.all(`
    SELECT location, COUNT(*) as count, AVG(budget) as avg_budget
    FROM customers
    WHERE status != 'deleted' AND location IS NOT NULL
    GROUP BY location
    ORDER BY count DESC
    LIMIT 10
  `) as { location: string; count: number; avg_budget: number }[]

  res.json({ data: rows.map(r => ({ ...r, avg_budget: Math.round(r.avg_budget) })) })
})

export default router
