CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  status_code INTEGER,
  content_hash TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  content_base64 TEXT NOT NULL,
  content_hash TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
