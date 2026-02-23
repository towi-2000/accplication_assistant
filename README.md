# 🤖 AI Assistant & Website Research Tool

A modern, fully responsive browser-based chat and research application with SQLite database, Express backend and web crawler functionality.

## 🎯 Features

- 💬 **Moderne 3-Spalten-UI** mit intuitiver 3-Spalten-Layout (Chat | Suche | Ergebnisse)
- 🤖 **Multiple KI-Services** - OpenAI, Claude, Gemini, Ollama, Local
- 🔌 **KI-Service-Pluggability** - Unkompliziertes Wechseln zwischen Providern
- 🌐 **Web-Recherche & -Crawler** - Speichere und durchsuche bis zu 1000 Webseiten parallel
- 💾 **SQLite-Datenbank** - Pro-Chat isolierte Datenbanken für Webseiten-Inhalte
- 🔄 **8x paralleles Crawling** - Effiziente Verarbeitung großer URL-Mengen
- 📊 **Fortschritts-Tracking** - Live % Anzeige beim Speichern und Crawlen
- 🔐 **API-Key Management** - Verschlüsselte Speicherung von API-Keys
- 📱 **Vollständig Responsive** (Desktop bis 380px Mobile)
- 🎨 **5 Design-Themes** (Hell, Dunkel, Ozean, Wald, Sonnenuntergang)
- 🌍 **5 Sprachen** (Deutsch, Englisch, Französisch, Spanisch, Italienisch)
- ⚙️ **Erweiterte Einstellungen**: Temperature, KI-Service, Modellauswahl, Schreibstil, System-Prompts
- 🔒 **Typsicher** mit vollständigem TypeScript
- ♿ **Accessibility** Features (ARIA-Labels, Keyboard-Nav)

## 🚀 Quick Start

### Option 1: Unified Dev Server (Empfohlen für Development) ⭐
```bash
# Installation
npm install

# Alles auf einem Port (5173)
npm run dev

# Browser öffnen
# http://localhost:5173
```
✅ Schneller, einfacher, Hot-Reload funktioniert perfekt  
✅ API und Frontend auf demselben Server

### Option 2: Standalone Backend Server (für Full-Stack Debugging)
```bash
# Terminal 1 - Backend API (Port 5174)
npm run server

# Terminal 2 - Frontend (Port 5173)
npm run dev

# Browser öffnen
# http://localhost:5173
```
✅ Debugge Frontend und Backend separat  
✅ Ideal für API-Development  
✅ Vite proxied automatisch zu :5174

### Standalone Mode aktivieren

Falls Sie einen separaten Express-Server starten wollen, können Sie Environment Variablen setzen:

```bash
# .env Datei erstellen
VITE_API_BASE=http://localhost:5174
VITE_API_PROXY=true
```

Oder direkt in Terminal (Linux/Mac):
```bash
export VITE_API_BASE=http://localhost:5174
npm run dev
```

Windows PowerShell:
```powershell
$env:VITE_API_BASE = "http://localhost:5174"
npm run dev
```

> **HINWEIS:** Der Standard ist Unified Mode (Option 1). Beide Modi werden vollständig unterstützt!

## 📁 Projektstruktur

```
accplication_assistant/
├── src/
│   ├── App.tsx              # Hauptkomponente - UI & State Management
│   ├── Functions.tsx        # Business-Logik & Utilities (300+ Zeilen)
│   ├── type.tsx             # TypeScript-Typen (260+ Zeilen)
│   ├── App.css              # Responsive 3-Spalten Layout (1600+ Zeilen)
│   ├── index.css            # Globale Styles
│   ├── main.jsx             # React Entry Point
│   ├── data.json            # Sprachen & Themes
│   └── index.html           # HTML Shell
│
├── server/
│   ├── index.js             # Express API mit Crawling (400+ Zeilen)
│   ├── db.js                # SQLite3 Connection Manager (150+ Zeilen)
│   ├── schema.sql           # DB Initialisierungs-Schema
│   └── data/                # Per-Chat SQLite Datenbanken (chat-{id}.db)
│
├── package.json             # Dependencies & Scripts
├── vite.config.js           # Vite Bundler-Konfiguration
├── README.md                # API und Überblick
└── PROJECT_DOCUMENTATION.md # Ausführliche Dokumentation (500+ Zeilen)
```

## 🏗️ Architektur-Übersicht

### Frontend (React + TypeScript)
- **3-Spalten-Layout**: Chat | URL-Eingabe | Ergebnisse
- **State Management**: React Hooks (useState)
- **Type Safety**: 100% TypeScript typasiert
- **Responsive**: CSS Grid mit Breakpoints (1024px, 768px, 480px, 380px)
- **Internationalisierung**: 5 Sprachen aus data.json
- **Theming**: 5 CSS-Themes mit Variablen

### Backend (Express.js + SQLite3)
- **API-Endpoints**: 
  - `POST /api/crawl` - URLs speichern (max 1000, 8x parallel)
  - `POST /api/preview` - Web-Vorschau ohne Speichern
  - `GET /api/pages/search` - In Datenbank suchen
  - `POST /api/pages` - Seite manuell speichern
- **Datenbank**: Pro-Chat SQLite Isolation (`server/data/chat-{id}.db`)
- **Paralleles Fetching**: 8 concurrent Worker für 1000+ URLs
- **HTML-Parsing**: Titel und Text-Inhalt automatisch extrahieren

### Datenfluss
```
User gibt URLs ein
    ↓
Frontend sendet zu /api/crawl
    ↓
Backend fetcht parallel (max 8x)
    ↓
Extrahiert Titel, Content, Hash
    ↓
Speichert in chat-spezifischem SQLite
    ↓
Frontend zeigt Ergebnisse mit Progress-Bar
```

## 🎨 UI-Layout (3-Spalten)

```
┌─────────────────────────────────────────┐
│         🤖 HEADER (Full Width)          │
├──────────────┬──────────────┬───────────┤
│   Spalte 1   │   Spalte 2   │ Spalte 3  │
│   (Chat)     │   (Suche)    │(Ergebnis) │
│              │              │           │
│ Messages     │ URL-Bereich  │ DB-Treffer│
│              │              │           │
│ Input-Feld   │ Suchbegriff  │ Web-Hits  │
│              │              │ + Save    │
└──────────────┴──────────────┴───────────┘

Bei <= 1024px: 2 Spalten (rechts unter)
Bei <= 768px:  Spalten stapeln sich vertikal
Bei <= 480px:  Single-Column Mobile View
```

## 💾 Datenbank-Isolation

Jede Konversation hat ihre eigene SQLite-Datei:
```
server/data/
├── chat-1.db        # Chat 1: "Data Scientist Jobsuche"
├── chat-2.db        # Chat 2: "Neue Position Research"
└── chat-3.db        # Chat 3: ...

Jede DB enthält TABLE pages:
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT,
  status_code INTEGER,
  content_hash TEXT,
  fetched_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🔍 Webseiten-Recherche-Workflow

### 1. URLs Crawlen & Speichern
```
User gibt URLs ein (eine pro Zeile)
    ↓
Klick "Crawl & Speichern"
    ↓
Frontend validiert (max 1000)
    ↓
POST /api/crawl { urls: string[], chatId: number }
    ↓
Backend: Parallel fetch (8x gleichzeitig)
    ↓
Extract: Title + Content aus HTML
    ↓
Hash: MD5 für Duplikat-Erkennung
    ↓
Save: Insert/Update in chat-{id}.db
    ↓
UI: Progress-Bar mit % Anzeige
```

### 2. In Datenbank Suchen
```
User gibt Suchbegriff ein
    ↓
Klick "Suche"
    ↓
GET /api/pages/search?q=...&chatId=...
    ↓
Backend: LIKE-Query auf content+title
    ↓
UI: Ergebnisse mit Snippets
    ↓
Optional: Web-Suche als Fallback
```

### 3. Web-Vorschau & Manuelles Speichern
```
Wenn keine DB-Treffer:
    ↓
POST /api/preview { urls: string[], query: string }
    ↓
Backend: Fetcht + filtert
    ↓
UI: Checkboxes für Auswahl
    ↓
Select + Klick "Speichern"
    ↓
POST /api/pages { url, content, title }
    ↓
Speichert in Datenbank
```

## 🧪 Getestete Szenarien

### Browser & Devices
- [x] Chrome, Firefox, Safari Desktop
- [x] Responsive 1024px (Tablets)
- [x] Responsive 768px (kleine Tablets)
- [x] Responsive 480px (Phones)
- [x] Responsive 380px (sehr kleine Phones)
- [x] Dark Mode (`prefers-color-scheme: dark`)

### Funktionale Tests
- [x] URL-Eingabe validiert (min 1, max 1000)
- [x] Crawl parallel fetcht
- [x] Progress-Bar animiert % Anzeige
- [x] DB-Suche LIKE-Query
- [x] Web-Vorschau lädt Inhalte
- [x] Speichern mit Fortschritt
- [x] Spalten responsiv umordnen
- [x] Keyboard-Navigation (Tab, Enter)
- [x] Theme + Sprache wechseln
- [x] ARIA-Labels für Screen Reader

## 📚 Dokumentation

Das Projekt ist umfangreich dokumentiert:

### 📖 Hauptdokumente

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** ⭐ **LESEN SIE ZUERST**
  - High-Level System Design
  - Frontend + Backend Integration (Vite + Express)
  - Datenfluss Diagramme
  - Component Hierarchy
  - State Management
  - Performance Optimizations

- **[API.md](./API.md)** - Vollständige REST API Referenz
  - Alle 18 Endpoints dokumentiert
  - Request/Response Beispiele
  - Error Codes
  - Rate Limiting
  - cURL Testing Beispiele

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Datenbankstruktur
  - Table Schemas (pages, files)
  - Indizes & Constraints
  - Mit Beispiel-Queries
  - Performance Tips
  - Backup/Restore Guides

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Detaillierte Feature-Dokumentation
  - Datei-Übersicht
  - Type-Definitionen
  - CSS-Struktur & Grid
  - Best Practices
  - State Management Pattern

- **[AI_SERVICES.md](./AI_SERVICES.md)** - KI-Service Setup & Anleitung
  - Alle 5 Provider dokumentiert
  - API-Key Management
  - Feature Vergleiche
  - Setup Step-by-Step

## ✅ Code-Qualität

### Type Safety
- 100% TypeScript
- Alle Types in type.tsx zentral definiert
- IDE Intellisense vollständig

### Modularity & Separation of Concerns
- **App.tsx**: Nur UI & State Management
- **Functions.tsx**: Business-Logik & Utilities (300+ Zeilen)
- **type.tsx**: TypeScript-Typen (260+ Zeilen)
- **App.css**: Responsive Grid Styles (1600+ Zeilen)
- **server/**: Backend (Express + SQLite)

### Documentation
- JSDoc für alle öffentlichen Funktionen
- Inline-Kommentare für komplexe Logik
- Type-Dokumentation mit Beschreibungen
- Detailliertes PROJECT_DOCUMENTATION.md

### Error Handling
- Try-Catch auf alle API Calls
- User-freundliche Fehlermeldungen
- Validierungsfunktionen extrakt

### Accessibility
- ARIA-Labelsauf allen Inputs
- Keyboard-Navigation (Tab, Enter)
- Semantisches HTML

## 🤖 KI-Service Integration

Die Application unterstützt **5 verschiedene KI-Service Provider**:

### Unterstützte Providers

| Service | Kosten | Offline | Setup |
|---------|--------|---------|-------|
| **OpenAI** (GPT-4, GPT-3.5) | 💰 Credit-basiert | ❌ | ⭐⭐ |
| **Anthropic Claude** | 💰 Credit-basiert | ❌ | ⭐⭐ |
| **Google Gemini** | 🆓 (Limits) | ❌ | ⭐⭐ |
| **Ollama** (Local) | 🆓 | ✅ | ⭐⭐⭐ |
| **Local Echo** | 🆓 | ✅ | ⭐ |

### Setup-Übersicht

```
1. Chat-Einstellungen öffnen (⚙️ Icon)
2. "KI-Service" Dropdown auswählen
3. Für externe Services: API-Schlüssel eingeben
4. Modell wählen (z.B. gpt-4, claude-3-opus, llama2)
5. Nachricht senden!
```

### Empfehlungen nach Use-Case

- **Anfänger/Kostenlos**: Google Gemini (60 calls/min kostenfrei)
- **Best Quality**: Claude 3 Opus (Beste Antworten)
- **Budget**: GPT-3.5 Turbo (Günstig & Schnell)
- **Privat/Offline**: Ollama mit Llama2/Mistral
- **Testing**: Local Echo (Demo)

### API-Key Management

```typescript
// Keys werden im Browser verschlüsselt gespeichert
// Niemals in Code/Git speichern!

// Best Practice: Environment Variables (.env)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

**Für detaillierte Setup-Anleitung siehe [AI_SERVICES.md](AI_SERVICES.md)**

## 🔧 Technologie-Stack

| Layer | Technologie | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.0 |
| Build | Vite | 6.0+ |
| Language | TypeScript | 5.0+ |
| Styling | CSS Grid + Variables | - |
| Backend | Express.js | 4.18+ |
| Database | SQLite3 | 3.0+ |
| AI Services | OpenAI, Claude, Gemini, Ollama | Latest |
| Runtime | Node.js | 18+ |

## 📝 Scripts

```bash
npm run dev              # Frontend Dev Server (Port 5173)
npm run server          # Backend API Server (Port 5174)
npm run build           # Production Build
npm install             # Installiere Dependencies
```

## 📄 Lizenz

MIT

---

**Status**: Vollständig dokumentiert, Production Ready ✅  
**Typsicherheit**: 100% TypeScript ✅  
**Responsiv**: Desktop bis 380px ✅  
**API**: Express.js Backend ✅  
**Datenbank**: SQLite3 mit Pro-Chat Isolation ✅
