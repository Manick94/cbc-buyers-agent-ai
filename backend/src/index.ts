import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { initSchema } from './db/schema'
import customersRouter from './routes/customers'
import analyticsRouter from './routes/analytics'
import queryRouter from './routes/query'
import { errorHandler, notFound } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

initSchema()

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/customers', customersRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/query', queryRouter)

const modelsDir = process.env.MODELS_PATH ?? path.resolve(__dirname, '../../models')
app.use('/models', express.static(modelsDir, { maxAge: '1d' }))

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Buyers Agent API running on http://localhost:${PORT}`)
})

export default app
