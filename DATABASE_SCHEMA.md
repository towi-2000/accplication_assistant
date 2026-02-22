# 🗄️ Database Schema & Data Model

Vollständige Dokumentation der SQLite Datenbankstruktur, Tabellen, Indizes und Beziehungen.

---

## 📍 Database Location

Jeder Chat hat seine eigene isolierte SQLite-Datei:

```
server/data/
├── chat-1.db
├── chat-2.db
├── chat-3.db
└── chat-N.db
```

**Dateiname Format:** `chat-{chatId}.db`
- Automatisch erstellt beim ersten API Request
- Gelöscht wenn Chat aus Konversationsliste entfernt wird
- Enthält ~1-10MB Daten je nach Crawl-Größe

---

## 📊 Tables Overview

| Tabelle | Zeilen | Zweck | Größe |
|---------|--------|-------|-------|
| `pages` | Variabel (0-10000+) | Gecrawlte Webseiten | ~50-100MB |
| `files` | Klein (0-100) | Hochgeladene Template-Dateien | ~1-10MB |
| `sqlite_sequence` | 1 | Auto-increment Tracking | < 1KB |

---

## 📋 Table: `pages`

Speichert alle gecrawlten Webseiten und deren Inhalte.

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

### Spalten

| Spalte | Typ | Constraints | Beschreibung |
|--------|-----|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Eindeutige Seiten-ID |
| `url` | TEXT | UNIQUE, NOT NULL | URL der Webseite (eindeutig!) |
| `title` | TEXT | NOT NULL | Seitentitel (von `<title>` tag) |
| `content` | TEXT | NOT NULL | Extrahierter Text-Inhalt (ohne HTML) |
| `status_code` | INTEGER | Optional | HTTP Status Code (200, 404, 500, etc.) |
| `content_hash` | TEXT | Optional | SHA-256 Hash des Inhalts (Duplikat-Detection) |
| `fetched_at` | DATETIME | DEFAULT NOW | Zeitpunkt des Crawling |
| `created_at` | DATETIME | DEFAULT NOW | Erstellungsdatum |
| `updated_at` | DATETIME | DEFAULT NOW | Letzte Änderung |

### Besonderheiten

**UNIQUE Constraint auf `url`:**
- Verhindert Duplikate
- Crawling derselben URL → UPDATE statt INSERT
- Konflikt-Handling: Überwrite alt mit neu

**Content Hash:**
- SHA-256 Hash des `content`
- Nutzen: Detect wenn Inhalt identisch (Mirror-Seiten)
- Optional gespeichert für Analyse

### Indizes

```sql
CREATE INDEX idx_pages_url ON pages(url);
CREATE INDEX idx_pages_fetched_at ON pages(fetched_at DESC);
CREATE INDEX idx_pages_title ON pages(title);
```

**Performance:**
- `idx_pages_url` - Schneller `WHERE url = '...'`
- `idx_pages_fetched_at` - Sortierung nach Crawl-Zeit
- `idx_pages_title` - Full-text Search auf Title

### Beispiel-Daten

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

Speichert hochgeladene Template-Dateien mit Base64-kodierten Inhalten.

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

### Spalten

| Spalte | Typ | Constraints | Beschreibung |
|--------|-----|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Eindeutige Datei-ID (UUID oder file_xxxxx) |
| `name` | TEXT | NOT NULL | Originalname (z.B. "application-template.txt") |
| `mime` | TEXT | NOT NULL | MIME Type (text/plain, text/markdown, etc.) |
| `size` | INTEGER | NOT NULL | Dateigröße in Bytes |
| `content_base64` | TEXT | NOT NULL | Dateiinhalt Base64-kodiert |
| `content_hash` | TEXT | Optional | SHA-256 Hash (Duplikat-Detection) |
| `uploaded_at` | DATETIME | DEFAULT NOW | Upload-Zeitpunkt |

### Supported MIME Types

```
text/plain          .txt
text/markdown       .md
application/json    .json
text/csv            .csv
```

### Größenlimits

- **Max Dateigröße:** 10 MB (enforced in API)
- **Max Dateianzahl:** Unbegrenzt (aber praktisch ~100 sinnvoll)
- **Base64 Overhead:** ~33% größer als Original

### Beispiel-Daten

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
             ├─ Keine direkten Beziehungen
files (1) ───┘
```

**Keine Foreign Keys:**
- Einfache, flache Struktur
- Pages & Files sind unabhängig
- Ermöglicht Chat-Isolation einfach

---

## 📈 Data Volume Estimation

### Typical Database Sizes

| Verwendung | Pages | Größe |
|-----------|----------|-------|
| Light User | 50-200 | 2-5 MB |
| Regular User | 200-1000 | 10-50 MB |
| Power User | 1000-5000+ | 50-250+ MB |

### Growth Rate

Bei 100 Seiten pro Tag:
- **Monatlich:** 3000 Seiten (~150 MB)
- **Jährlich:** 36500 Seiten (~2 GB)

---

## 🔍 Query Examples

### Alle Seiten abrufen
```sql
SELECT id, url, title, fetched_at 
FROM pages 
ORDER BY fetched_at DESC 
LIMIT 50;
```

### Nach Suchtext suchen
```sql
SELECT id, url, title, 
       CASE 
         WHEN title LIKE '%React%' THEN 'In Title'
         WHEN content LIKE '%React%' THEN 'In Content'
       END as match_type
FROM pages 
WHERE title LIKE '%React%' OR content LIKE '%React%'
ORDER BY fetched_at DESC;
```

### Seiten filtern (Include Keywords)
```sql
SELECT * FROM pages 
WHERE (
  title LIKE '%JavaScript%' OR title LIKE '%TypeScript%' OR
  content LIKE '%JavaScript%' OR content LIKE '%TypeScript%'
)
ORDER BY fetched_at DESC;
```

### Seiten filtern (Exclude Keywords)
```sql
SELECT * FROM pages 
WHERE (
  title NOT LIKE '%deprecated%' AND 
  content NOT LIKE '%deprecated%'
)
ORDER BY fetched_at DESC;
```

### Duplikate finden
```sql
SELECT content_hash, COUNT(*) as count, GROUP_CONCAT(id) as ids
FROM pages 
WHERE content_hash IS NOT NULL
GROUP BY content_hash 
HAVING count > 1;
```

### Statistiken
```sql
SELECT 
  COUNT(*) as total_pages,
  COUNT(DISTINCT url) as unique_urls,
  AVG(LENGTH(content)) as avg_content_length,
  MIN(fetched_at) as oldest_crawl,
  MAX(fetched_at) as newest_crawl
FROM pages;
```

### Nach Status Code filtern
```sql
-- Alle erfolgreichen (200)
SELECT * FROM pages WHERE status_code = 200;

-- Alle Fehler (4xx, 5xx)
SELECT * FROM pages WHERE status_code >= 400;

-- Grouped by status
SELECT status_code, COUNT(*) 
FROM pages 
GROUP BY status_code 
ORDER BY COUNT(*) DESC;
```

### Älteste Einträge löschen
```sql
DELETE FROM pages 
WHERE fetched_at < datetime('now', '-30 days');
```

### Transfer Seiten zwischen Chats
```sql
-- Exportieren
SELECT * FROM pages;

-- Importieren (in anderer DB)
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

Keine Foreign Keys → Keine Orphans möglich:
- Pages sind eigenständig
- Files sind eigenständig
- Löschen eines Eintrags → Keine Abhängigkeiten

---

## 🛡️ Isolation Per Chat

**Implementation:**
```javascript
// server/index.js
const dbPath = `server/data/chat-${chatId}.db`;
const db = new Database(dbPath);
```

**Vorteile:**
- ✅ Vollständige Datenisolation
- ✅ Schnelle Chat-Löschung (Datei löschen)
- ✅ Keine Cross-Chat Abfragen
- ✅ Einfaches Backup (eine Datei = ein Chat)

**Nachteile:**
- ❌ Keine Chat-übergreifenden Queries
- ❌ Speicher-Overhead (multiple DB connections)

---

## 🔧 Maintenance Operations

### Optimize Database

```sql
-- Optimize auf Disk-Space
VACUUM;

-- Rebuild Indizes
REINDEX;

-- Analyze Query Optimizer
ANALYZE;
```

### Clear Old Data

```sql
-- Delete older than 90 days
DELETE FROM pages 
WHERE fetched_at < datetime('now', '-90 days');

-- Cleanup (required after DELETE)
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

1. **Paginate Queries**
   ```sql
   SELECT * FROM pages LIMIT 100 OFFSET 0;  -- Page 1
   SELECT * FROM pages LIMIT 100 OFFSET 100; -- Page 2
   ```

2. **Use Indexes**
   ```sql
   -- Fast: Uses index
   SELECT * FROM pages WHERE url = 'xxx';
   
   -- Slow: No index
   SELECT * FROM pages WHERE content LIKE '%xxx%';
   ```

3. **Limit Result Sets**
   ```sql
   -- Good: Returns 50 rows
   SELECT * FROM pages LIMIT 50;
   
   -- Bad: Returns everything!
   SELECT * FROM pages;
   ```

4. **Batch Operations**
   ```sql
   BEGIN TRANSACTION;
   INSERT INTO pages VALUES (...);
   INSERT INTO pages VALUES (...);
   INSERT INTO pages VALUES (...);
   COMMIT;
   ```

---

## 🗑️ Chat Deletion

Wenn Chat gelöscht wird:

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

**Ergebnis:**
- ✅ Datei `server/data/chat-1.db` gelöscht
- ✅ Alle pages & files für diesen Chat weg
- ✅ ~50-100 MB Speicher freigegeben

---

## 🔮 Future Improvements

1. **Shared Pages Database**
   - Zentrale DB für alle Chats
   - Foreign Keys für Chat-Zugehörigkeit
   - Deduplizierung über Chats

2. **Full-Text Search Index**
   - FTS5 (Full Text Search)
   - Schnellere Text-Suche
   - Better relevance ranking

3. **Caching Layer**
   - Redis für Query Cache
   - 5-Minuten TTL
   - Schnellere Responses

4. **Migrations System**
   - Schema versioning
   - Auto-upgrade DBs
   - Backward compatibility

5. **Audit Trail**
   - Track deletions/edits
   - User action logs
   - Data recovery

---

## 📋 Migration Guide (v1 to v2)

Falls Upgrade von v1 notwendig:

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
**Problem:** Seiten verschwunden plötzlich
```sql
-- Repair
PRAGMA integrity_check;
REINDEX;
VACUUM;
```

### Slow Queries
**Problem:** Suche dauert >5 Sekunden
```sql
-- Use EXPLAIN to analyze
EXPLAIN QUERY PLAN 
SELECT * FROM pages WHERE content LIKE '%term%';

-- Add indexes if missing
CREATE INDEX idx_pages_content ON pages(content);
```
