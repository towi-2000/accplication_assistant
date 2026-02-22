import express from 'express'
import cors from 'cors'
import db from './db.js'

const app = express()
const port = process.env.PORT || 5174

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/pages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0)

  const rows = db
    .prepare('SELECT id, url, content, created_at, updated_at FROM pages ORDER BY id DESC LIMIT ? OFFSET ?')
    .all(limit, offset)

  res.json({ items: rows, limit, offset })
})

app.get('/api/pages/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const row = db
    .prepare('SELECT id, url, content, created_at, updated_at FROM pages WHERE id = ?')
    .get(id)

  if (!row) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.json(row)
})

app.get('/api/pages/search', (req, res) => {
  const query = (req.query.q || '').toString().trim()
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0)

  if (!query) {
    return res.json({ items: [], limit, offset })
  }

  const like = `%${query}%`
  const rows = db
    .prepare(
      'SELECT id, url, content, created_at, updated_at FROM pages WHERE content LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?'
    )
    .all(like, limit, offset)

  return res.json({ items: rows, limit, offset })
})

app.post('/api/pages', (req, res) => {
  const { url, content } = req.body || {}

  if (!url || !content) {
    return res.status(400).json({ error: 'url and content are required' })
  }

  const stmt = db.prepare(
    `INSERT INTO pages (url, content)
     VALUES (?, ?)
     ON CONFLICT(url) DO UPDATE SET
       content = excluded.content,
       updated_at = datetime('now')`
  )

  const result = stmt.run(url, content)

  return res.status(201).json({ id: result.lastInsertRowid })
})

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
