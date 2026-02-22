# 🔌 API Endpoints Reference

Vollständige Dokumentation aller REST API Endpoints des Application Assistant Servers.

**Base URL:** `http://localhost:5173` (im Development)

---

## 📋 Übersicht

| Kategorie | Endpoints | Zweck |
|-----------|-----------|-------|
| Health | 1 | Server Status |
| Pages (DB) | 6 | CRUD Operationen auf Crawl-Ergebnisse |
| Filtering | 2 | Filter & Löschen von DB-Einträgen |
| Job Search | 1 | Aggregierte Job-Suche |
| Files | 3 | Template Upload & Management |
| AI Services | 3 | Chat, Service-Infos, Key Validation |
| Docs | 1 | Markdown-Dokumentation |

**Total: 18 Endpoints**

---

## 🏥 Health Check

### `GET /api/health`
Server Status überprüfen.

**Request:**
```bash
curl http://localhost:5173/api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0"
}
```

---

## 🌐 Web Pages Database

### `GET /api/pages`
Alle gecrawlten Seiten abrufen (mit Pagination).

**Query Parameters:**
- `skip` (optional): Anzahl zu überspringe (default: 0)
- `limit` (optional): Max Einträge (default: 50)
- `sort` (optional): Sortierfeld (default: `fetched_at`)
- `order` (optional): `asc` oder `desc` (default: `desc`)

**Request:**
```bash
curl "http://localhost:5173/api/pages?skip=0&limit=20&sort=fetched_at&order=desc"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example Website",
      "content": "Lorem ipsum dolor sit amet...",
      "status_code": 200,
      "content_hash": "abc123def456",
      "fetched_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "skip": 0,
  "limit": 20
}
```

---

### `GET /api/pages/:id`
Einzelne Seite nach ID abrufen.

**URL Parameter:**
- `id` (required): Page ID (integer)

**Request:**
```bash
curl http://localhost:5173/api/pages/1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://example.com",
    "title": "Example Website",
    "content": "Full page content...",
    "status_code": 200,
    "content_hash": "abc123def456",
    "fetched_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `404 Not Found` - Page doesn't exist
- `500 Internal Server Error` - Database error

---

### `GET /api/pages/search?q=query`
Full-text Suche in gecrawlten Seiten.

**Query Parameters:**
- `q` (required): Suchtext
- `limit` (optional): Max Ergebnisse (default: 50)

**Request:**
```bash
curl "http://localhost:5173/api/pages/search?q=React+tutorial&limit=10"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "query": "React tutorial",
  "results": [
    {
      "id": 5,
      "url": "https://react.dev/learn",
      "title": "React - Learn to build with React",
      "content": "React is a JavaScript library...",
      "relevance_score": 0.95,
      "fetched_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 23
}
```

---

### `POST /api/pages`
Einzelne Seite manuell speichern.

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "content": "Extracted page content here...",
  "status_code": 200
}
```

**Request:**
```bash
curl -X POST http://localhost:5173/api/pages \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Example",
    "content": "Some content",
    "status_code": 200
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 42,
    "url": "https://example.com",
    "title": "Example",
    "content": "Some content",
    "status_code": 200,
    "content_hash": "xyz789",
    "fetched_at": "2024-01-15T10:35:00Z",
    "created_at": "2024-01-15T10:35:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - URL already exists
- `500 Internal Server Error` - Database error

---

### `POST /api/crawl`
Mehrere URLs parallel crawlen (bis zu 8 gleichzeitig).

**Request Body:**
```json
{
  "urls": [
    "https://example.com",
    "https://example.com/about",
    "https://example.com/blog"
  ]
}
```

**Request:**
```bash
curl -X POST http://localhost:5173/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com", "https://example.com/about"]
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "crawled": 2,
  "results": [
    {
      "id": 100,
      "url": "https://example.com",
      "title": "Example - Home",
      "content": "Welcome to our website...",
      "status_code": 200,
      "content_hash": "abc123",
      "fetched_at": "2024-01-15T10:40:00Z"
    },
    {
      "id": 101,
      "url": "https://example.com/about",
      "title": "About Us",
      "content": "We are Company X...",
      "status_code": 200,
      "content_hash": "def456",
      "fetched_at": "2024-01-15T10:40:00Z"
    }
  ],
  "failed": [
    {
      "url": "https://invalid.url.test",
      "error": "ERR_NAME_NOT_RESOLVED"
    }
  ]
}
```

**Limits:**
- Max 50 URLs per request
- Timeout: 30 Sekunden pro URL
- Parallel: 8 requests gleichzeitig

---

### `GET /api/pages/all`
Alle Seiten für Batch-Operationen abrufen (keine Pagination).

**Request:**
```bash
curl http://localhost:5173/api/pages/all
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": 1, "url": "...", "title": "...", "content": "..." },
    { "id": 2, "url": "...", "title": "...", "content": "..." },
    ...
  ],
  "total": 150
}
```

**Warning:** Für große Datenbanken (>1000 Einträge) kann dies langsam sein!

---

## 🔍 Database Filtering

### `POST /api/pages/filter-preview`
Vorschau welche Einträge gelöscht würden.

**Request Body:**
```json
{
  "includeKeywords": ["JavaScript", "React"],
  "excludeKeywords": ["outdated", "deprecated"],
  "operator": "OR"
}
```

**Options:**
- `includeKeywords` (array): Mindestens eines dieser Wörter im Text/Titel
- `excludeKeywords` (array): Keines dieser Wörter im Text/Titel
- `operator` (string): `AND` oder `OR` für Keywords (default: `OR`)

**Request:**
```bash
curl -X POST http://localhost:5173/api/pages/filter-preview \
  -H "Content-Type: application/json" \
  -d '{
    "includeKeywords": ["tutorial"],
    "excludeKeywords": ["paid", "premium"],
    "operator": "OR"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "totalPages": 100,
  "wouldDelete": 23,
  "willKeep": 77,
  "preview": [
    {
      "id": 5,
      "url": "https://example.com/old-post",
      "title": "Outdated Tutorial",
      "reason": "Contains 'outdated' (excluded keyword)"
    },
    {
      "id": 8,
      "url": "https://example.com/premium-course",
      "title": "Premium Course",
      "reason": "Contains 'premium' (excluded keyword)"
    }
  ]
}
```

---

### `POST /api/pages/filter-delete`
Einträge basierend auf Filter löschen.

**Request Body:** (identisch wie filter-preview)
```json
{
  "includeKeywords": ["JavaScript", "React"],
  "excludeKeywords": ["outdated", "deprecated"],
  "operator": "OR"
}
```

**Request:**
```bash
curl -X POST http://localhost:5173/api/pages/filter-delete \
  -H "Content-Type: application/json" \
  -d '{
    "includeKeywords": ["tutorial"],
    "excludeKeywords": ["paid"],
    "operator": "OR"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": 23,
  "remaining": 77,
  "message": "Successfully deleted 23 pages"
}
```

**Errors:**
- `400 Bad Request` - Invalid filter parameters
- `500 Internal Server Error` - Database error

---

## 💼 Job Search

### `GET /api/jobs/search?q=query`
Aggregierte Jobsuche über 6 APIs parallel.

**Query Parameters:**
- `q` (required): Suchbegriff (z.B. "React Developer")
- `limit` (optional): Max Ergebnisse pro API (default: 10, max: 50)
- `cache` (optional): Cache wiederverwenden? (default: true)

**Supported APIs:**
1. **Arbeitnow** - Deutsche Jobs
2. **Remotive** - Remote Jobs
3. **The Muse** - Tech & Startup Jobs
4. **Adzuna** - UK Jobs
5. **Reed** - UK Jobs
6. **RemoteOK** - Remote Jobs

**Request:**
```bash
curl "http://localhost:5173/api/jobs/search?q=JavaScript+Developer&limit=20"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "query": "JavaScript Developer",
  "timestamp": "2024-01-15T10:45:00Z",
  "results": [
    {
      "id": "arbeitnow_12345",
      "source": "arbeitnow",
      "title": "Senior JavaScript Developer",
      "company": "Tech Company GmbH",
      "location": "Berlin, Germany",
      "url": "https://arbeitnow.com/view/12345",
      "salary": "€60,000 - €80,000",
      "posted_at": "2024-01-15"
    },
    {
      "id": "remotive_67890",
      "source": "remotive",
      "title": "React Specialist",
      "company": "StartUp Inc",
      "location": "Remote",
      "url": "https://remotive.com/jobs/67890",
      "salary": "$80,000 - $120,000",
      "posted_at": "2024-01-14"
    }
  ],
  "total": 156,
  "sources": {
    "arbeitnow": 25,
    "remotive": 32,
    "the_muse": 18,
    "adzuna": 45,
    "reed": 28,
    "remoteok": 8
  },
  "cached": false
}
```

**Cache:**
- Ergebnisse werden 5 Minuten gecacht
- `cached: true` bedeutet keine neuen Requests gesendet
- Gleiche Query innerhalb 5 min → Cache Hit

**Errors:**
- `400 Bad Request` - Missing search query
- `500 Internal Server Error` - API errors

---

## 📁 File Management

### `POST /api/upload`
Template-Datei uploadm.

**Request Body:** (form-data)
- `file` (required): Die hochzuladende Datei (max 10MB)
  - Unterstützte Formate: `.txt`, `.md`, `.json`, `.csv`

**Request:**
```bash
curl -X POST http://localhost:5173/api/upload \
  -F "file=@template.txt"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "file": {
    "id": "file_abc123def456",
    "name": "template.txt",
    "mime": "text/plain",
    "size": 2048,
    "content_hash": "xyz789",
    "uploaded_at": "2024-01-15T10:50:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - No file provided
- `413 Payload Too Large` - File > 10MB
- `415 Unsupported Media Type` - File format not allowed
- `500 Internal Server Error` - Storage error

---

### `GET /api/files`
Alle hochgeladenen Dateien auflisten.

**Request:**
```bash
curl http://localhost:5173/api/files
```

**Response:** `200 OK`
```json
{
  "success": true,
  "files": [
    {
      "id": "file_abc123def456",
      "name": "application-template.txt",
      "mime": "text/plain",
      "size": 2048,
      "content_hash": "xyz789",
      "uploaded_at": "2024-01-15T10:50:00Z"
    },
    {
      "id": "file_def456ghi789",
      "name": "cover-letter-template.md",
      "mime": "text/markdown",
      "size": 1024,
      "content_hash": "abc123",
      "uploaded_at": "2024-01-14T15:30:00Z"
    }
  ],
  "total": 2
}
```

---

### `GET /api/files/:id`
Datei-Inhalt abrufen.

**URL Parameter:**
- `id` (required): File ID

**Request:**
```bash
curl http://localhost:5173/api/files/file_abc123def456
```

**Response:** `200 OK`
```json
{
  "success": true,
  "file": {
    "id": "file_abc123def456",
    "name": "application-template.txt",
    "mime": "text/plain",
    "size": 2048,
    "content": "Dear Hiring Manager,\n\nI am interested in...",
    "uploaded_at": "2024-01-15T10:50:00Z"
  }
}
```

**Errors:**
- `404 Not Found` - File doesn't exist
- `500 Internal Server Error` - Storage error

---

## 🤖 AI Services

### `POST /api/ai/chat`
Chat-Nachricht zu AI Service schicken (OpenAI, Claude, Gemini, etc.).

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Schreibe eine Bewerbung für eine JavaScript Developer Position"
    }
  ],
  "settings": {
    "temperature": 0.7,
    "model": "gpt-4",
    "system_prompt": "Du bist ein hilfreicher Assistent..."
  }
}
```

**Available Models:**
- `gpt-4` / `gpt-3.5-turbo` (OpenAI)
- `claude-3-opus` / `claude-3-sonnet` (Anthropic)
- `gemini-pro` (Google)
- `flan-t5` (HuggingFace)

**Request:**
```bash
curl -X POST http://localhost:5173/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "settings": {"temperature": 0.7, "model": "gpt-4"}
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "Generated response text here..."
  },
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "model": "gpt-4",
  "timestamp": "2024-01-15T10:55:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid messages format
- `401 Unauthorized` - Invalid or missing API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Service error

---

### `GET /api/ai/services`
Verfügbare AI-Services und deren Modelle auflisten.

**Request:**
```bash
curl http://localhost:5173/api/ai/services
```

**Response:** `200 OK`
```json
{
  "success": true,
  "services": [
    {
      "id": "openai",
      "name": "OpenAI",
      "models": [
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "context_window": 8192,
          "pricing": "0.03 / 0.06 per 1k tokens"
        },
        {
          "id": "gpt-3.5-turbo",
          "name": "GPT-3.5 Turbo",
          "context_window": 4096,
          "pricing": "0.0015 / 0.002 per 1k tokens"
        }
      ]
    },
    {
      "id": "anthropic",
      "name": "Anthropic Claude",
      "models": [
        {
          "id": "claude-3-opus",
          "name": "Claude 3 Opus",
          "context_window": 200000,
          "pricing": "0.015 / 0.075 per 1k tokens"
        }
      ]
    }
  ]
}
```

---

### `POST /api/ai/validate-key`
API-Schlüssel validieren.

**Request Body:**
```json
{
  "service": "openai",
  "api_key": "sk-...",
  "model": "gpt-4"
}
```

**Request:**
```bash
curl -X POST http://localhost:5173/api/ai/validate-key \
  -H "Content-Type: application/json" \
  -d '{
    "service": "openai",
    "api_key": "sk-abc123...",
    "model": "gpt-4"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "valid": true,
  "service": "openai",
  "model": "gpt-4",
  "details": {
    "organization": "My Organization",
    "usage": {
      "requests": 1500,
      "tokens": 250000
    }
  }
}
```

**Errors:**
- `400 Bad Request` - Missing service or key
- `401 Unauthorized` - Invalid API key
- `500 Internal Server Error` - Service validation failed

---

## 📚 Documentation

### `GET /docs/:filename`
Markdown-Dokumentationsdatei abrufen.

**URL Parameter:**
- `filename` (required): Dateiname ohne `.md` Erweiterung

**Supported Documents:**
- `readme` → README.md
- `architecture` → ARCHITECTURE.md
- `api` → API.md (diese Datei)
- `database` → DATABASE_SCHEMA.md (optional)

**Request:**
```bash
curl http://localhost:5173/docs/architecture
```

**Response:** `200 OK`
```json
{
  "success": true,
  "filename": "ARCHITECTURE.md",
  "content": "# Architecture & Technical Design\n\nContent here..."
}
```

**Errors:**
- `404 Not Found` - Documentation file doesn't exist
- `500 Internal Server Error` - File read error

---

## 🔄 Common Response Format

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 🔐 Authentication

**Methoden:**
1. **Bearer Token** (für AI Services)
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **Query Parameter**
   ```
   GET /api/pages?api_key=xyz123
   ```

3. **Cookie** (für Browser)
   ```
   Cookie: api_key=xyz123
   ```

---

## 📊 Rate Limiting

- **Job Search:** 10 requests pro 5 Minuten
- **Crawling:** Max 8 parallel, 30s timeout pro URL
- **File Upload:** Max 10MB pro Datei
- **AI Services:** Abhängig vom Provider

---

## 🧪 Testing mit curl

**Alle Endpoints testen:**
```bash
# Health
curl http://localhost:5173/api/health

# List pages
curl http://localhost:5173/api/pages

# Search pages
curl "http://localhost:5173/api/pages/search?q=test"

# Crawl URLs
curl -X POST http://localhost:5173/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"]}'

# List files
curl http://localhost:5173/api/files

# List AI services
curl http://localhost:5173/api/ai/services

# Get docs
curl http://localhost:5173/docs/architecture
```

---

## 📝 Changelog

### Version 2.0.0
- Unified server (Vite + Express)
- Single port 5173
- Enhanced type safety
- Improved API documentation

### Version 1.0.0
- Initial release
- Dual server architecture (Vite + Express)
