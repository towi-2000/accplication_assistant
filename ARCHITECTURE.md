# 🏗️ Architecture & Technical Design

Eine detaillierte Übersicht der Anwendungsarchitektur, Datenflüsse und Design-Patterns.

## 📐 High-Level Architektur

```
┌─────────────────────────────────────────────────────┐
│                 VITE DEV SERVER (5173)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────┐    ┌──────────────────┐    │
│  │   React Frontend  │    │ Express Middleware│    │
│  │   (Hot Reload)    │    │  (API Routes)    │    │
│  └───────────────────┘    └──────────────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│              SQLite Database (per Chat)             │
│              with CORS enabled                      │
└─────────────────────────────────────────────────────┘
```

## 🔄 Unified Server Architecture (v2.0+)

Das System wurde von einem **Dual-Server Setup** (Frontend 5173 + Backend 5174) zu einem **Unified Server** migriert:

### Vorher (v1.x)
```bash
npm run dev     # Vite on :5173 (with proxy to :5174)
npm run server  # Express on :5174 (separate process)
```

### Jetzt (v2.0+) - Zwei Modi verfügbar

**Mode 1: Unified Server** (Empfohlen)
```bash
npm run dev     # Vite + Express as Middleware on :5173
```

**Mode 2: Standalone Backend** (für Full-Stack Debugging)
```bash
npm run server  # Express API Server on :5174 (standalone)
npm run dev     # Vite on :5173 (auto-proxies to :5174)
```

**Implementierung:**
- `server/index.js` exportiert Express App (Vite kann importieren)
- App hat Standalone-Check: läuft als Server wenn direkt aufgerufen
- `vite.config.js` integriert App als Plugin-Middleware (bei Unified Mode)
- Vite proxy konfiguriert für Standalone Mode

**Vorteile:**
- Ein Terminal statt zwei
- Schnelleres Hot-Reload
- Keine CORS-Komplexität
- Einfacherer Deployment

## 📁 Projektstruktur

```
src/
├── App.tsx              # 1700+ Zeilen - Hauptkomponente
│                        # Verwaltet: Chat, Search, Filter, Applications, Files
├── App.css              # 2000+ Zeilen - 3-Spalten Layout + Responsive
├── Functions.tsx        # Fetch-Wrapper + Business Logic
├── type.tsx             # 500+ Zeilen - TypeScript Typen & Interfaces
├── main.jsx             # React Entry Point
├── data.json            # Translations (5 Sprachen) + Themes (5 Designs)
└── vite-env.d.ts        # Vite Type Definitions

server/
├── index.js             # 1000+ Zeilen - Express API Server
│                        # Routes: /api/crawl, /api/search, /api/upload, /api/jobs/search
├── db.js                # SQLite Database Manager
├── schema.sql           # Database Schema
└── data/                # Chat-specific SQLite DBs (auto-created)

docs/
└── README.md            # API Documentation

public/
└── (static assets if any)

.
├── vite.config.js       # Bundler + Vite Plugin Config
├── eslint.config.js     # Linter Configuration
├── package.json         # Dependencies + Scripts
└── index.html           # HTML Entry Point
```

## 🔌 Data Flow Architecture

### 1️⃣ Chat Message Flow
```
User Types Message
    ↓
handleSendMessage()
    ↓
Add to messages array
    ↓
/api/ai/chat endpoint
    ↓
Dispatch to AI Provider (OpenAI, Claude, etc.)
    ↓
Response → messages array
    ↓
UI updated
```

### 2️⃣ Web Crawling Flow
```
User enters URLs
    ↓
handleCrawl()
    ↓
POST /api/crawl with 8 concurrent requests
    ↓
Extract title & text from HTML
    ↓
Save to SQLite (pages table)
    ↓
Display results in Right Column
```

### 3️⃣ Job Search Flow
```
User searches for jobs
    ↓
handleSearchAll()
    ↓
Parallel requests to 6 job APIs:
  - Arbeitnow
  - Remotive
  - The Muse
  - Adzuna
  - Reed
  - RemoteOK
    ↓
Dedupe + merge results
    ↓
Cache for 5 minutes
    ↓
Display in Right Column
```

### 4️⃣ Database Filter Flow
```
User sets Include/Exclude Keywords
    ↓
handleFilterPreview()
    ↓
POST /api/pages/filter-preview
    ↓
SQL WHERE clause constructed
    ↓
Show entries that would be deleted
    ↓
User confirms
    ↓
handleFilterDelete()
    ↓
DELETE FROM pages WHERE ...
```

### 5️⃣ Batch Application Generation Flow
```
User selects Template File
    ↓
handleGenerateApplications()
    ↓
Fetch all pages from DB
    ↓
For each page:
  - Build prompt with page content
  - Call /api/ai/chat
  - Generate application text
    ↓
Aggregate results
    ↓
Download as TXT file
```

## 🗄️ Database Schema

### `pages` Table
```sql
CREATE TABLE pages (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE,
  title TEXT,
  content TEXT,
  status_code INTEGER,
  content_hash TEXT,
  fetched_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
)
```

### `files` Table
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT,
  mime TEXT,
  size INTEGER,
  content_base64 TEXT,
  content_hash TEXT,
  uploaded_at DATETIME
)
```

**Isolation:** Jeder Chat (chatId) hat seine eigene SQLite-Datei:
- `data/chat-1.db`
- `data/chat-2.db`
- `data/chat-N.db`

## 🎯 Component Hierarchy

```
App (Main)
├── Sidebar
│   ├── New Chat Button
│   ├── Conversation List
│   └── Footer (Settings, Docs, Theme Toggle)
├── Chat Container (3-Column Grid)
│   ├── Header (Title + Settings)
│   ├── Left Column (Chat)
│   │   ├── Messages Area
│   │   └── Input + Buttons
│   ├── Center Column (Web Database)
│   │   ├── URL Input & Crawl
│   │   ├── Search Fields
│   │   └── Filter & Applications
│   └── Right Column (Results)
│       ├── Job Search Results
│       ├── Web Search Results
│       └── Database Results
└── Floating Panels
    ├── Settings Panel
    ├── Global Settings Panel
    └── Help Modal
```

## 🔐 State Management

**Alle State in `App.tsx` mit `useState`:**

1. **Message State**
   - `messages` - Chat history
   - `input` - Current input text
   - `aiLoading` - AI is generating response

2. **Conversation State**
   - `conversations` - List of chats
   - `activeConversationId` - Current chat
   - `editingConversationId` - In edit mode?

3. **Web Database State**
   - `crawlResults` - Crawl operation results
   - `searchResults` - Full-text search results
   - `previewResults` - Filter preview results
   - `dbResultsQuery` - Current search query

4. **Job Search State**
   - `jobResults` - Job search results
   - `lastSearchQueries` - History

5. **File Upload State**
   - `uploadedFiles` - List of uploaded templates
   - `templateFiles` - Files from /api/files
   - `selectedTemplateId` - Current template choice

6. **UI State**
   - `sidebarOpen` - Mobile sidebar toggle
   - `settingsPanelOpen` - Chat settings panel
   - `globalSettingsOpen` - Global settings panel

7. **Settings State**
   - `globalSettings` - Language, Theme, System Prompt
   - `chatSettings` - Temperature, Model, Writing Style

8. **AI Service State**
   - `aiProvider` - Current provider (openai, claude, etc.)
   - `aiApiKey` - API key for auth
   - `aiApiUrl` - Custom endpoint

## 🌐 API Endpoints

### Health
- `GET /api/health` - Server status check

### Web Database
- `GET /api/pages` - List all pages
- `GET /api/pages/:id` - Get page details
- `GET /api/pages/search?q=query` - Full-text search
- `GET /api/pages/all` - Get all for batch operations
- `POST /api/pages` - Save single page
- `POST /api/crawl` - Crawl multiple URLs
- `POST /api/preview` - Preview URLs before saving

### Database Filtering
- `POST /api/pages/filter-preview` - Preview deletions
- `POST /api/pages/filter-delete` - Delete non-matching entries

### Job Search
- `GET /api/jobs/search?q=query&limit=50` - Search 6 job APIs concurrently

### File Upload
- `POST /api/upload` - Upload template file
- `GET /api/files` - List uploaded files
- `GET /api/files/:id` - Download file content

### AI Services
- `POST /api/ai/chat` - Chat with AI service
- `GET /api/ai/services` - List available services
- `POST /api/ai/validate-key` - Validate API key

### Documentation
- `GET /docs/:filename` - Serve markdown docs

## 🎨 Styling Architecture

**CSS Structure:**
1. **Root Variables** (`:root`) - CSS custom properties for colors
2. **Media Queries** - Responsive breakpoints (768px, 480px)
3. **Component Classes** - BEM-like naming
4. **Dark Mode Support** - `@media (prefers-color-scheme: dark)`

**3-Column Layout:**
```css
.chat-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto 1fr;
}

/* Mobile: Stack everything vertically */
@media (max-width: 768px) {
  .chat-container {
    grid-template-columns: 1fr;
  }
}
```

## 🚀 Performance Optimizations

1. **Parallel Requests**
   - Web crawling: 8 concurrent requests
   - Job searching: 6 job APIs in parallel
   - Results deduplicated

2. **Caching**
   - Job search results: 5-minute cache (in-memory)
   - Database queries: No caching (always fresh)

3. **Lazy Loading**
   - Components render only when needed
   - Modal panels use React fragments

4. **Database Optimization**
   - SQLite UNIQUE constraint on URL (pages table)
   - Content hash prevents duplicate content
   - Index on url + title for search

## 🔄 Build & Deployment

### Development
```bash
npm run dev    # Start Vite + Express on :5173
npm run lint   # Run ESLint
```

### Production
```bash
npm run build        # Build with Vite (creates dist/)
npm run server       # Run Express standalone on :5174
                     # Serve dist/ folder as static files
npm run preview      # Preview built bundle locally
```

**Production Setup:**
- Run `npm run build` to generate optimized bundle
- Deploy `dist/` folder to static hosting (CDN, S3, GitHub Pages)
- Run `npm run server` on backend server
- Point API requests to backend server
- Use environment variables for API endpoint

## 🔐 Security Considerations

1. **API Key Storage**
   - Stored in localStorage (not encrypted in current version)
   - Consider encrypting in future versions
   - Never expose in network requests

2. **Input Validation**
   - URL validation before crawling
   - Content length limits (10MB for files)
   - SQL injection prevention via parameterized queries

3. **CORS**
   - Enabled via `express.cors()`
   - Frontend can request from same origin (Vite proxy)

4. **Content Security**
   - HTML content stripped of scripts/styles before saving
   - File upload size limits enforced

## 📚 Type Safety

**All TypeScript Types in `type.tsx`:**
- Message, Conversation Types
- Settings (Global + Chat-specific)
- API Response Types (WebPageRecord, JobSearchItem, etc.)
- AI Service Types (AiServiceConfig, AiProviderType)
- File Types (TemplateFile, FileUploadPayload)
- Database Types (DbFilterParams, BatchApplicationParams)

**Key Principles:**
- No `any` types
- Strict null checks
- Readonly collections where appropriate
- Union types for discriminated variations

## 🧪 Testing

No automated tests yet. Considerations for future:
- Unit tests for Functions.tsx helpers
- Integration tests for API endpoints
- E2E tests for user flows (crawl → search → generate apps)
- Consider Jest + React Testing Library

## 📊 Code Quality

- **Linting:** ESLint (eslint.config.js)
- **Type Checking:** TypeScript strict mode
- **Code Organization:** By feature/concern
- **Documentation:** Inline comments + JSDoc for complex functions

## 🔮 Future Improvements

1. **Encryption** - API keys & sensitive data
2. **Rate Limiting** - Prevent abuse of crawling/job search
3. **Advanced Search** - Full-text search with ranking
4. **Offline Mode** - Service workers + IndexedDB
5. **Multi-File Upload** - Batch upload support
6. **Custom Prompts** - Save & reuse prompts
7. **Analytics** - Track usage patterns
8. **Export** - SQLite → CSV/Excel export
