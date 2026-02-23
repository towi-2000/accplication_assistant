# 🏗️ Architecture & Technical Design

A detailed overview of the application architecture, data flows and design patterns.

## 📐 High-Level Architecture

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

The system was migrated from a **Dual-Server Setup** (Frontend 5173 + Backend 5174) to a **Unified Server**:

### Before (v1.x)
```bash
npm run dev     # Vite on :5173 (with proxy to :5174)
npm run server  # Express on :5174 (separate process)
```

### Now (v2.0+) - Two modes available

**Mode 1: Unified Server** (Recommended)
```bash
npm run dev     # Vite + Express as Middleware on :5173
```

**Mode 2: Standalone Backend** (for full-stack debugging)
```bash
npm run server  # Express API server on :5174 (standalone)
npm run dev     # Vite on :5173 (auto-proxies to :5174)
```

**Implementation:**
- `server/index.js` exports Express app (Vite can import)
- App has standalone check: runs as server if called directly
- `vite.config.js` integrates app as plugin middleware (in unified mode)
- Vite proxy configured for standalone mode

**Benefits:**
- One terminal instead of two
- Faster hot-reload
- No CORS complexity
- Simpler deployment

## 📁 Project Structure

```
src/
├── App.tsx              # 1700+ lines - Main component
│                        # Manages: Chat, search, filter, applications, files
├── App.css              # 2000+ lines - 3-column layout + responsive
├── Functions.tsx        # Fetch wrapper + business logic
├── type.tsx             # 500+ lines - TypeScript types & interfaces
├── main.jsx             # React entry point
├── data.json            # Translations (5 languages) + Themes (5 designs)
└── vite-env.d.ts        # Vite type definitions

server/
├── index.js             # 1000+ lines - Express API server
│                        # Routes: /api/crawl, /api/search, /api/upload, /api/jobs/search
├── db.js                # SQLite database manager
├── schema.sql           # Database schema
└── data/                # Chat-specific SQLite DBs (auto-created)

docs/
└── README.md            # API documentation

public/
└── (static assets if any)

.
├── vite.config.js       # Bundler + Vite plugin config
├── eslint.config.js     # Linter configuration
├── package.json         # Dependencies + scripts
└── index.html           # HTML entry point
```

## 🔌 Data Flow Architecture

### 1️⃣ Chat Message Flow
```
User types message
    ↓
handleSendMessage()
    ↓
Add to messages array
    ↓
/api/ai/chat endpoint
    ↓
Dispatch to AI provider (OpenAI, Claude, etc.)
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
Display results in right column
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
Deduplicate + merge results
    ↓
Cache for 5 minutes
    ↓
Display in right column
```

### 4️⃣ Database Filter Flow
```
User sets Include/Exclude keywords
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
User selects template file
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

**Isolation:** Each chat (chatId) has its own SQLite file:
- `data/chat-1.db`
- `data/chat-2.db`
- `data/chat-N.db`

## 🎯 Component Hierarchy

```
App (Main)
├── Sidebar
│   ├── New chat button
│   ├── Conversation list
│   └── Footer (settings, docs, theme toggle)
├── Chat container (3-column grid)
│   ├── Header (title + settings)
│   ├── Left column (chat)
│   │   ├── Messages area
│   │   └── Input + buttons
│   ├── Center column (web database)
│   │   ├── URL input & crawl
│   │   ├── Search fields
│   │   └── Filter & applications
│   └── Right column (results)
│       ├── Job search results
│       ├── Web search results
│       └── Database results
└── Floating panels
    ├── Settings panel
    ├── Global settings panel
    └── Help modal
```

## 🔐 State Management

**All state in `App.tsx` with `useState`:**

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
   - `globalSettings` - Language, theme, system prompt
   - `chatSettings` - Temperature, model, writing style

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

**CSS structure:**
1. **Root variables** (`:root`) - CSS custom properties for colors
2. **Media queries** - Responsive breakpoints (768px, 480px)
3. **Component classes** - BEM-like naming
4. **Dark mode support** - `@media (prefers-color-scheme: dark)`

**3-column layout:**
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
   - Database queries: Always fresh (no caching)

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

**Production setup:**
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

**All TypeScript types in `type.tsx`:**
- Message, conversation types
- Settings (global + chat-specific)
- API response types (WebPageRecord, JobSearchItem, etc.)
- AI service types (AiServiceConfig, AiProviderType)
- File types (TemplateFile, FileUploadPayload)
- Database types (DbFilterParams, BatchApplicationParams)

**Key principles:**
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
- **Type checking:** TypeScript strict mode
- **Code organization:** By feature/concern
- **Documentation:** Inline comments + JSDoc for complex functions

## 🔮 Future Improvements

1. **Encryption** - API keys & sensitive data
2. **Rate limiting** - Prevent abuse of crawling/job search
3. **Advanced search** - Full-text search with ranking
4. **Offline mode** - Service workers + IndexedDB
5. **Multi-file upload** - Batch upload support
6. **Custom prompts** - Save & reuse prompts
7. **Analytics** - Track usage patterns
8. **Export** - SQLite → CSV/Excel export

---