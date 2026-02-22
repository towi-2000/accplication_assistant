import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const schemaPath = path.join(__dirname, 'schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const schema = fs.readFileSync(schemaPath, 'utf-8')
const dbCache = new Map()

const openDatabase = (dbPath) => {
  const db = new sqlite3.Database(dbPath)

  const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function handleRun(err) {
        if (err) {
          reject(err)
          return
        }
        resolve({ lastID: this.lastID, changes: this.changes })
      })
    })

  const get = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
          return
        }
        resolve(row)
      })
    })

  const all = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
          return
        }
        resolve(rows)
      })
    })

  return { db, run, get, all }
}

const ensureColumns = async (db, tableName, columns) => {
  const existingRows = await db.all(`PRAGMA table_info(${tableName})`)
  const existing = existingRows.map(row => row.name)

  for (const column of columns) {
    if (!existing.includes(column.name)) {
      await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${column.definition}`)
    }
  }
}

const initSchema = async (db) => {
  const statements = schema
    .split(/;\s*\n/)
    .map(statement => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await db.run(statement)
  }

  await ensureColumns(db, 'pages', [
    { name: 'title', definition: 'title TEXT' },
    { name: 'status_code', definition: 'status_code INTEGER' },
    { name: 'content_hash', definition: 'content_hash TEXT' },
    { name: 'fetched_at', definition: "fetched_at TEXT NOT NULL DEFAULT (datetime('now'))" }
  ])
}

const sanitizeChatId = (chatId) => {
  const safe = String(chatId || 'default').replace(/[^a-zA-Z0-9_-]/g, '')
  return safe.length > 0 ? safe : 'default'
}

export const getDb = async (chatId) => {
  const safeId = sanitizeChatId(chatId)
  if (dbCache.has(safeId)) {
    return dbCache.get(safeId)
  }

  const dbPath = path.join(dataDir, `chat-${safeId}.db`)
  const db = openDatabase(dbPath)
  await initSchema(db)
  dbCache.set(safeId, db)
  return db
}
