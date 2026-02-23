# 🗄️ Database Schema & Data Model

Complete documentation of SQLite database structure, tables, indexes and relationships.

---

## 📍 Database Location

Each chat has its own isolated SQLite file:

```
server/data/
├── chat-1.db
├── chat-2.db
├── chat-3.db
└── chat-N.db
```

**File name format:** `chat-{chatId}.db`
- Automatically created on first API request
- Deleted when chat removed from conversation list
- Contains ~1-10MB of data depending on crawl size

---

## 📊 Tables Overview

| Table | Rows | Purpose | Size |
|-------|------|---------|------|
| `pages` | Variable (0-10000+) | Crawled web pages | ~50-100MB |
| `files` | Small (0-100) | Uploaded template files | ~1-10MB |
| `sqlite_sequence` | 1 | Auto-increment tracking | < 1KB |

---

## 📋 Table: `pages`

Stores all crawled web pages and their content.

### Schema

```sql
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status_code INTEGER,
  content_hash TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique page ID |
| `url` | TEXT | UNIQUE, NOT NULL | Website URL (unique!) |
| `title` | TEXT | NOT NULL | Page title (from `<title>` tag) |
| `content` | TEXT | NOT NULL | Extracted text content (without HTML) |
| `status_code` | INTEGER | Optional | HTTP status code (200, 404, 500, etc.) |
| `content_hash` | TEXT | Optional | SHA-256 hash of content (duplicate detection) |
| `fetched_at` | DATETIME | DEFAULT NOW | Time of crawling |
| `created_at` | DATETIME | DEFAULT NOW | Creation date |
| `updated_at` | DATETIME | DEFAULT NOW | Last modification |

### Special Features

**UNIQUE constraint on `url`:**
- Prevents duplicates
- Crawling same URL → UPDATE instead of INSERT
- Conflict handling: Overwrite old with new

**Content hash:**
- SHA-256 hash of `content`
- Use: detect if content is identical (mirror sites)
- Optionally stored for analysis

### Indexes

```sql
CREATE INDEX idx_pages_url ON pages(url);
CREATE INDEX idx_pages_fetched_at ON pages(fetched_at DESC);
CREATE INDEX idx_pages_title ON pages(title);
```

**Performance:**
- `idx_pages_url` - Faster `WHERE url = '...'`
- `idx_pages_fetched_at` - Sorting by crawl time
- `idx_pages_title` - Full-text search on title

### Example Data

```sql
INSERT INTO pages (url, title, content, status_code, content_hash)
VALUES (
  'https://example.com',
  'Example - The Premier Website',
  'Welcome to our website. We provide...',
  200,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
);
```

---

## 📁 Table: `files`

Stores uploaded template files with Base64-encoded content.

### Schema

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_base64 TEXT NOT NULL,
  content_hash TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique file ID (UUID or file_xxxxx) |
| `name` | TEXT | NOT NULL | Original name (e.g., "application-template.txt") |
| `mime` | TEXT | NOT NULL | MIME type (text/plain, text/markdown, etc.) |
| `size` | INTEGER | NOT NULL | File size in bytes |
| `content_base64` | TEXT | NOT NULL | File content base64-encoded |
| `content_hash` | TEXT | Optional | SHA-256 hash (duplicate detection) |
| `uploaded_at` | DATETIME | DEFAULT NOW | Upload timestamp |

### Supported MIME Types

```
text/plain          .txt
text/markdown       .md
application/json    .json
text/csv            .csv
```

### Size Limits

- **Max file size:** 10 MB (enforced in API)
- **Max file count:** Unlimited (but practically ~100 reasonable)
- **Base64 overhead:** ~33% larger than original

### Example Data

```sql
INSERT INTO files (id, name, mime, size, content_base64)
VALUES (
  'file_abc123def456',
  'application-template.txt',
  'text/plain',
  2048,
  'RGVhciBIaXJpbmcgTWFuYWdlciwKCkkgYW0gaW50ZXJlc3RlZCBpbi4uLg=='
);
```

---

## 🔄 Relationships

```
pages (1) ───┐
             ├─ No direct relationships
files (1) ───┘
```

**No foreign keys:**
- Simple, flat structure
- Pages & files are independent
- Enables chat isolation easily

---

## 📈 Data Volume Estimation

### Typical Database Sizes

| Usage | Pages | Size |
|-------|-------|------|
| Light user | 50-200 | 2-5 MB |
| Regular user | 200-1000 | 10-50 MB |
| Power user | 1000-5000+ | 50-250+ MB |

### Growth Rate

At 100 pages per day:
- **Monthly:** 3000 pages (~150 MB)
- **Yearly:** 36500 pages (~2 GB)

---

## 🔍 Query Examples

### Retrieve all pages
```sql
SELECT id, url, title, fetched_at 
FROM pages 
ORDER BY fetched_at DESC 
LIMIT 50;
```

### Search for text
```sql
SELECT id, url, title, 
       CASE 
         WHEN title LIKE '%React%' THEN 'In title'
         WHEN content LIKE '%React%' THEN 'In content'
       END as match_type
FROM pages 
WHERE title LIKE '%React%' OR content LIKE '%React%'
ORDER BY fetched_at DESC;
```

### Filter pages (include keywords)
```sql
SELECT * FROM pages 
WHERE (
  title LIKE '%JavaScript%' OR title LIKE '%TypeScript%' OR
  content LIKE '%JavaScript%' OR content LIKE '%TypeScript%'
)
ORDER BY fetched_at DESC;
```

### Filter pages (exclude keywords)
```sql
SELECT * FROM pages 
WHERE (
  title NOT LIKE '%deprecated%' AND 
  content NOT LIKE '%deprecated%'
)
ORDER BY fetched_at DESC;
```

### Find duplicates
```sql
SELECT content_hash, COUNT(*) as count, GROUP_CONCAT(id) as ids
FROM pages 
WHERE content_hash IS NOT NULL
GROUP BY content_hash 
HAVING count > 1;
```

### Get statistics
```sql
SELECT 
  COUNT(*) as total_pages,
  COUNT(DISTINCT url) as unique_urls,
  AVG(LENGTH(content)) as avg_content_length,
  MIN(fetched_at) as oldest_crawl,
  MAX(fetched_at) as newest_crawl
FROM pages;
```

### Filter by status code
```sql
-- All successful (200)
SELECT * FROM pages WHERE status_code = 200;

-- All errors (4xx, 5xx)
SELECT * FROM pages WHERE status_code >= 400;

-- Grouped by status
SELECT status_code, COUNT(*) 
FROM pages 
GROUP BY status_code 
ORDER BY COUNT(*) DESC;
```

### Delete old entries
```sql
DELETE FROM pages 
WHERE fetched_at < datetime('now', '-30 days');
```

### Transfer pages between chats
```sql
-- Export
SELECT * FROM pages;

-- Import (in other DB)
ATTACH DATABASE 'server/data/chat-2.db' AS other;
INSERT INTO other.pages SELECT * FROM pages;
```

---

## 🔐 Data Integrity

### Constraints

1. **PRIMARY KEY (id)**
   - Every row must have unique id
   - Auto-incremented
   - Cannot be NULL

2. **UNIQUE (url)**
   - No duplicate URLs
   - Enforced at INSERT/UPDATE
   - Conflict strategy: REPLACE (update instead)

3. **NOT NULL (title, content)**
   - Required fields
   - Must always have value

### Orphan Prevention

No foreign keys → No orphans possible:
- Pages are self-contained
- Files are self-contained
- Deleting entry → No dependencies

---

## 🛡️ Isolation Per Chat

**Implementation:**
```javascript
// server/index.js
const dbPath = `server/data/chat-${chatId}.db`;
const db = new Database(dbPath);
```

**Advantages:**
- ✅ Complete data isolation
- ✅ Fast chat deletion (delete file)
- ✅ No cross-chat queries
- ✅ Easy backup (one file = one chat)

**Disadvantages:**
- ❌ No cross-chat queries
- ❌ Storage overhead (multiple DB connections)

---

## 🔧 Maintenance Operations

### Optimize Database

```sql
-- Optimize for disk space
VACUUM;

-- Rebuild indexes
REINDEX;

-- Analyze query optimizer
ANALYZE;
```

### Clear Old Data

```sql
-- Delete older than 90 days
DELETE FROM pages 
WHERE fetched_at < datetime('now', '-90 days');

-- Clean up (required after DELETE)
VACUUM;
```

### Export/Backup

```bash
# Copy database file
cp server/data/chat-1.db server/data/chat-1.db.backup

# Export as SQL
sqlite3 server/data/chat-1.db .dump > backup.sql

# Export as CSV
sqlite3 server/data/chat-1.db "SELECT * FROM pages;" > pages.csv
```

### Import/Restore

```bash
# Restore from SQL
sqlite3 server/data/chat-1.db < backup.sql

# Restore from file copy
cp server/data/chat-1.db.backup server/data/chat-1.db
```

---

## 📊 Performance Tips

### For Large Databases (>100K entries)

1. **Paginate queries**
   ```sql
   SELECT * FROM pages LIMIT 100 OFFSET 0;  -- Page 1
   SELECT * FROM pages LIMIT 100 OFFSET 100; -- Page 2
   ```

2. **Use indexes**
   ```sql
   -- Fast: Uses index
   SELECT * FROM pages WHERE url = 'xxx';
   
   -- Slow: No index
   SELECT * FROM pages WHERE content LIKE '%xxx%';
   ```

3. **Limit result sets**
   ```sql
   -- Good: Returns 50 rows
   SELECT * FROM pages LIMIT 50;
   
   -- Bad: Returns everything!
   SELECT * FROM pages;
   ```

4. **Batch operations**
   ```sql
   BEGIN TRANSACTION;
   INSERT INTO pages VALUES (...);
   INSERT INTO pages VALUES (...);
   INSERT INTO pages VALUES (...);
   COMMIT;
   ```

---

## 🗑️ Chat Deletion

When chat is deleted:

```javascript
// server/index.js
app.delete('/api/chats/:chatId', (req, res) => {
  const dbPath = `server/data/chat-${chatId}.db`;
  fs.unlink(dbPath, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});
```

**Result:**
- ✅ File `server/data/chat-1.db` deleted
- ✅ All pages & files for this chat deleted
- ✅ ~50-100 MB storage freed

---

## 🔮 Future Improvements

1. **Shared pages database**
   - Central DB for all chats
   - Foreign keys for chat membership
   - Deduplication across chats

2. **Full-text search index**
   - FTS5 (full-text search)
   - Faster text search
   - Better relevance ranking

3. **Caching layer**
   - Redis for query cache
   - 5-minute TTL
   - Faster responses

4. **Migrations system**
   - Schema versioning
   - Auto-upgrade DBs
   - Backward compatibility

5. **Audit trail**
   - Track deletions/edits
   - User action logs
   - Data recovery

---

## 📋 Migration Guide (v1 to v2)

If upgrade from v1 necessary:

### v1 Schema
```sql
CREATE TABLE crawled_urls (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE,
  title TEXT,
  content TEXT,
  crawled_at DATETIME
);
```

### Migration Script

```sql
-- Create new table with v2 schema
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status_code INTEGER,
  content_hash TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migrate data
INSERT INTO pages (url, title, content, fetched_at, created_at, updated_at)
SELECT url, title, content, crawled_at, crawled_at, crawled_at 
FROM crawled_urls;

-- Drop old table
DROP TABLE crawled_urls;

-- Optimize
VACUUM;
ANALYZE;
```

---

## 📞 Support & Troubleshooting

### Database Locked
**Problem:** "database is locked" error
```
SOLUTION: Close any other connections to database
```

### Corrupt Database
**Problem:** Pages suddenly disappeared
```sql
-- Repair
PRAGMA integrity_check;
REINDEX;
VACUUM;
```

### Slow Queries
**Problem:** Search takes >5 seconds
```sql
-- Use EXPLAIN to analyze
EXPLAIN QUERY PLAN 
SELECT * FROM pages WHERE content LIKE '%term%';

-- Add indexes if missing
CREATE INDEX idx_pages_content ON pages(content);
```

---