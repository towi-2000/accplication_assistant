import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'pages.db')
const schemaPath = path.join(__dirname, 'schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
const schema = fs.readFileSync(schemaPath, 'utf-8')

schema
  .split(/;\s*\n/)
  .map(statement => statement.trim())
  .filter(Boolean)
  .forEach(statement => db.exec(statement))

export default db
