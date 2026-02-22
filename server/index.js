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

// ===== FILE UPLOAD ENDPOINTS =====

/**
 * POST /api/upload
 * Speichert hochgeladene Dateien für die AI
 * Body: { fileName, fileContent (base64), chatId }
 */
app.post('/api/upload', async (req, res) => {
  const { fileName, fileContent, chatId } = req.body || {}

  if (!fileName || !fileContent) {
    return res.status(400).json({
      success: false,
      error: 'fileName and fileContent are required'
    })
  }

  try {
    // Validate file size (max 10MB base64 ≈ 7.5MB binary)
    if (fileContent.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Datei zu groß (Max. 10MB)'
      })
    }

    // Generate file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store file metadata (in production: use real file storage or S3)
    const fileData = {
      id: fileId,
      name: fileName,
      contentHash: crypto.createHash('sha256').update(fileContent).digest('hex'),
      uploadedAt: new Date().toISOString()
    }

    return res.status(201).json({
      success: true,
      fileId,
      fileName,
      message: 'Datei erfolgreich hochgeladen'
    })
  } catch (error) {
    console.error('File upload error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/files
 * Ruft hochgeladene Dateien für einen Chat ab
 */
app.get('/api/files', (req, res) => {
  const { chatId } = req.query
  
  // Note: In production würde man Dateien aus DB oder File Storage abrufen
  // Für Demo: Return leeres Array
  
  return res.json({
    files: [],
    message: 'Datei-Storage ist in dieser Demo-Version nicht implementiert'
  })
})

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})

// ===== AI SERVICE ENDPOINTS =====

/**
 * POST /api/ai/chat
 * Sendet eine Nachricht an den ausgewählten AI Service
 * Body: { provider, apiKey, model, temperature, messages, chatId }
 */
app.post('/api/ai/chat', async (req, res) => {
  const { provider, apiKey, model, temperature, messages, chatId } = req.body || {}

  if (!provider || !model || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'provider, model, and messages are required',
      success: false
    })
  }

  try {
    // Dispatch zum richtigen Service
    let response

    if (provider === 'openai') {
      response = await callOpenAI(apiKey, model, messages, temperature)
    } else if (provider === 'claude') {
      response = await callClaude(apiKey, model, messages, temperature)
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, model, messages, temperature)
    } else if (provider === 'ollama') {
      response = await callOllama(req.body.apiUrl || 'http://localhost:11434', model, messages, temperature)
    } else if (provider === 'local') {
      response = await callLocal(messages)
    } else {
      return res.status(400).json({
        error: `Unknown provider: ${provider}`,
        success: false
      })
    }

    return res.json({
      success: true,
      content: response,
      provider,
      model
    })
  } catch (error) {
    console.error(`AI Service Error (${provider}):`, error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/ai/services
 * Gibt eine Liste aller verfügbaren AI Services zurück
 */
app.get('/api/ai/services', (req, res) => {
  const services = [
    {
      provider: 'openai',
      name: 'OpenAI',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      requiresKey: true,
      description: 'Professional AI models from OpenAI'
    },
    {
      provider: 'claude',
      name: 'Anthropic Claude',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      requiresKey: true,
      description: 'Advanced AI models from Anthropic'
    },
    {
      provider: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-pro'],
      requiresKey: true,
      description: 'Multimodal AI models from Google'
    },
    {
      provider: 'ollama',
      name: 'Ollama (Local)',
      models: ['llama2', 'mistral', 'neural-chat'],
      requiresKey: false,
      description: 'Local open-source models via Ollama'
    },
    {
      provider: 'local',
      name: 'Local Echo',
      models: ['echo'],
      requiresKey: false,
      description: 'Simple local echo service for testing'
    }
  ]

  return res.json({ services })
})

/**
 * POST /api/ai/validate-key
 * Validiert einen API-Key für einen Service
 * Body: { provider, apiKey }
 */
app.post('/api/ai/validate-key', async (req, res) => {
  const { provider, apiKey } = req.body || {}

  if (!provider) {
    return res.status(400).json({ valid: false, error: 'provider is required' })
  }

  try {
    let valid = false

    if (provider === 'openai') {
      valid = await validateOpenAIKey(apiKey)
    } else if (provider === 'claude') {
      valid = await validateClaudeKey(apiKey)
    } else if (provider === 'gemini') {
      valid = await validateGeminiKey(apiKey)
    } else if (provider === 'ollama') {
      valid = await validateOllamaConnection(req.body.apiUrl || 'http://localhost:11434')
    } else if (provider === 'local') {
      valid = true
    }

    return res.json({
      valid,
      provider,
      message: valid ? 'Key is valid' : 'Key is invalid'
    })
  } catch (error) {
    console.error(`Key validation error (${provider}):`, error)
    return res.status(500).json({
      valid: false,
      error: error.message
    })
  }
})

// ===== AI SERVICE IMPLEMENTATIONS =====

/**
 * OpenAI API Call
 */
async function callOpenAI(apiKey, model, messages, temperature = 0.7) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response'
}

/**
 * Claude API Call
 */
async function callClaude(apiKey, model, messages, temperature = 0.7) {
  // Filter system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      temperature
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Claude API error')
  }

  const data = await response.json()
  return data.content[0]?.text || 'No response'
}

/**
 * Gemini API Call
 */
async function callGemini(apiKey, model, messages, temperature = 0.7) {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: 1000
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gemini API error')
  }

  const data = await response.json()
  return data.candidates[0]?.content?.parts[0]?.text || 'No response'
}

/**
 * Ollama API Call (Local)
 */
async function callOllama(baseUrl, model, messages, temperature = 0.7) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`)
  }

  const data = await response.json()
  return data.message?.content || 'No response'
}

/**
 * Local Echo Service (für Demo/Testing)
 */
async function callLocal(messages) {
  const lastMessage = messages[messages.length - 1]?.content || ''
  return `[LOCAL RESPONSE] You said: ${lastMessage}`
}

// ===== API KEY VALIDATION FUNCTIONS =====

/**
 * Validiert OpenAI API Key
 */
async function validateOpenAIKey(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    return response.ok
  } catch (e) {
    return false
  }
}

/**
 * Validiert Claude API Key
 */
async function validateClaudeKey(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    })
    return response.ok
  } catch (e) {
    return false
  }
}

/**
 * Validiert Gemini API Key
 */
async function validateGeminiKey(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=${apiKey}`
    )
    return response.ok
  } catch (e) {
    return false
  }
}

/**
 * Validiert Ollama Connection
 */
async function validateOllamaConnection(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    return response.ok
  } catch (e) {
    return false
  }
}
