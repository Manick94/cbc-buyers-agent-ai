import { Database as SQLiteDB } from 'node-sqlite3-wasm'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const DB_PATH = process.env.DATABASE_PATH ?? path.join(__dirname, '../../data/buyers_agent.db')

// Ensure the directory exists (needed on hosts without persistent disk)
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

let db: SQLiteDB | null = null

export function getDb(): SQLiteDB {
  if (!db) {
    db = new SQLiteDB(DB_PATH)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
