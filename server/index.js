import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { getDb } from './db.js'

const app = express()
const port = process.env.PORT || 5174

const MAX_URLS = 1000
const FETCH_CONCURRENCY = 8

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const sanitizeText = (text) => text.replace(/\s+/g, ' ').trim()

const extractTitle = (html) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) {
    return null
  }
  return sanitizeText(match[1])
}

const extractText = (html) => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const noTags = withoutScripts.replace(/<[^>]+>/g, ' ')
  return sanitizeText(noTags)
}

const hashContent = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex')
}

const runWithConcurrency = async (items, limit, iterator) => {
  const results = new Array(items.length)
  let nextIndex = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = nextIndex
      if (current >= items.length) {
        break
      }
      nextIndex += 1
      results[current] = await iterator(items[current])
    }
  })

  await Promise.all(workers)
  return results.filter(Boolean)
}

const upsertPage = async (db, { url, title, content, statusCode }) => {
  const contentHash = hashContent(content)
  await db.run(
    `INSERT INTO pages (url, title, content, status_code, content_hash, fetched_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(url) DO UPDATE SET
       title = excluded.title,
       content = excluded.content,
       status_code = excluded.status_code,
       content_hash = excluded.content_hash,
       fetched_at = datetime('now'),
       updated_at = datetime('now')`,
    [url, title, content, statusCode, contentHash]
  )

  const row = await db.get('SELECT id FROM pages WHERE url = ?', [url])
  return { id: row?.id ?? null, contentHash }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/pages', async (req, res) => {
  const { chatId } = req.query
  const db = await getDb(chatId)
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0)

  const rows = await db.all(
    'SELECT id, url, title, content, status_code, content_hash, fetched_at, created_at, updated_at FROM pages ORDER BY id DESC LIMIT ? OFFSET ?',
    [limit, offset]
  )

  res.json({ items: rows, limit, offset })
})

app.get('/api/pages/:id', async (req, res) => {
  const { chatId } = req.query
  const db = await getDb(chatId)
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const row = await db.get(
    'SELECT id, url, title, content, status_code, content_hash, fetched_at, created_at, updated_at FROM pages WHERE id = ?',
    [id]
  )

  if (!row) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.json(row)
})

app.get('/api/pages/search', async (req, res) => {
  const { chatId } = req.query
  const db = await getDb(chatId)
  const query = (req.query.q || '').toString().trim()
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0)

  if (!query) {
    return res.json({ items: [], limit, offset })
  }

  const like = `%${query}%`
  const rows = await db.all(
    'SELECT id, url, title, content, status_code, content_hash, fetched_at, created_at, updated_at FROM pages WHERE content LIKE ? OR title LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
    [like, like, limit, offset]
  )

  return res.json({ items: rows, limit, offset })
})

app.post('/api/pages', async (req, res) => {
  const { url, content, title, statusCode, chatId } = req.body || {}
  const db = await getDb(chatId)

  if (!url || !content) {
    return res.status(400).json({ error: 'url and content are required' })
  }

  const result = await upsertPage(db, { url, title: title || null, content, statusCode: statusCode ?? null })

  return res.status(201).json({ id: result.id, contentHash: result.contentHash })
})

app.post('/api/crawl', async (req, res) => {
  const { urls, chatId } = req.body || {}
  const db = await getDb(chatId)

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls must be a non-empty array' })
  }
  if (urls.length > MAX_URLS) {
    return res.status(400).json({ error: `urls must not exceed ${MAX_URLS}` })
  }

  const results = await runWithConcurrency(urls, FETCH_CONCURRENCY, async (url) => {
    try {
      const response = await fetch(url, { redirect: 'follow' })
      const statusCode = response.status
      const html = await response.text()
      const title = extractTitle(html)
      const content = extractText(html)

      if (!content) {
        return { url, status: 'skipped', reason: 'no_content' }
      }

      const { id, contentHash } = await upsertPage(db, {
        url: response.url || url,
        title,
        content,
        statusCode
      })

      return { url, status: 'ok', id, statusCode, contentHash }
    } catch (error) {
      return { url, status: 'failed', reason: error.message }
    }
  })

  return res.json({ items: results })
})

app.post('/api/preview', async (req, res) => {
  const { urls, query } = req.body || {}
  const normalizedQuery = (query || '').toString().trim().toLowerCase()

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls must be a non-empty array' })
  }
  if (urls.length > MAX_URLS) {
    return res.status(400).json({ error: `urls must not exceed ${MAX_URLS}` })
  }

  const results = await runWithConcurrency(urls, FETCH_CONCURRENCY, async (url) => {
    try {
      const response = await fetch(url, { redirect: 'follow' })
      const statusCode = response.status
      const html = await response.text()
      const title = extractTitle(html)
      const content = extractText(html)

      if (!content) {
        return null
      }

      if (normalizedQuery && !content.toLowerCase().includes(normalizedQuery)) {
        return null
      }

      return {
        url: response.url || url,
        title,
        content,
        statusCode
      }
    } catch (error) {
      return null
    }
  })

  return res.json({ items: results })
})

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
