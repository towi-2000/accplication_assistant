/**
 * type.tsx - TypeScript Type-Definitionen für Job Assistant
 * 
 * Diese Datei definiert alle TypeScript-Typen und Interfaces der Jobsuche-Anwendung.
 * Das sorgt für:
 * - Vollständige Typsicherheit während der Entwicklung
 * - Bessere Intellisense und Autocompletion in IDEs
 * - Fehler zur Compile-Zeit statt zur Runtime
 * - Selbstedokumentation des Codes
 * 
 * Struktur:
 * 1. Message Types - Job-Such-Konversationen
 * 2. Conversation Types - Jobsuche-Sessions
 * 3. Settings Types - Globale und jobsuche-spezifische Einstellungen
 * 4. Theme Types - Design-Konfigurationen
 * 5. Translation Types - Sprach-Daten (5 Sprachen)
 * 6. Data Types - JSON-Dateiformat
 */

// ===== MESSAGE TYPES =====

/**
 * Nachricht im Chat
 * Repräsentiert sowohl User- als auch AI-Nachrichten
 */
export type Message = {
  id: number              // Eindeutige ID (fortlaufend)
  text: string            // Inhalt der Nachricht
  sender: 'user' | 'ai'   // Wer die Nachricht gesendet hat
}

// ===== CONVERSATION TYPES =====

/**
 * Eine Konversation/Chat
 * Repräsentiert einen eigenen Chat-Thread in der Sidebar
 */
export type Conversation = {
  id: number      // Eindeutige ID
  title: string   // Anzeigename der Konversation
}

// ===== SETTINGS TYPES =====

/**
 * Globale Anwendungseinstellungen
 * Diese Einstellungen gelten über alle Chats hinweg
 * und werden über ein Overlay-Panel angepasst
 */
export type GlobalSettings = {
  language: string               // Aktuelle Sprache ('de', 'en', 'fr', 'es', 'it')
  theme: string                  // Aktuelles Design-Theme
  globalSystemPrompt: string      // Standard-Anweisung für alle neuen Chats
}

/**
 * Chat-spezifische Einstellungen
 * Diese Einstellungen beeinflussen nur die aktuelle Konversation
 * und werden über das Chat-Einstellungs-Panel angepasst
 */
export type ChatSettings = {
  temperature: number   // Kreativität der AI (0=präzise, 1=kreativ)
  model: string         // Welches KI-Modell verwenden
  writingStyle: string  // Schreibstil der Antworten
  systemPrompt: string  // Chat-spezifische Anweisung für die AI
}

// ===== THEME TYPES =====

/**
 * Konfiguration für ein einzelnes Design-Theme
 * Definiert alle Farben und visuellen Variablen für das Theme
 */
export type Theme = {
  name: string              // Anzeigename des Themes
  primaryColor: string      // Hauptfarbe (Buttons, Links)
  darkBg: string            // Hintergrundfarbe
  sidebarBg: string         // Sidebar-Hintergrund
  textColor: string         // Textfarbe
  userMessageBg: string     // Hintergrund für User-Nachrichten
  aiMessageBg: string       // Hintergrund für AI-Nachrichten
  borderColor: string       // Farbe für Borders und Trennlinien
  secondaryColor: string    // Sekundäre Akzentfarbe
}

/**
 * Map von Theme-Namen zu Theme-Konfigurationen
 * Ermöglicht einfaches Lookup: themes['dark']
 */
export type Themes = {
  [key: string]: Theme
}

// ===== TRANSLATION TYPES =====

/**
 * Übersetzungen für eine einzelne Sprache
 * Enthält alle UI-Texte für die Sprache als Key-Value Paare
 */
export type TranslationStrings = {
  title: string
  subtitle: string
  newChat: string
  chats: string
  settings: string
  help: string
  chatSettings: string
  temperature: string
  precise: string
  creative: string
  model: string
  writingStyle: string
  formal: string
  normal: string
  casual: string
  technical: string
  systemPrompt: string
  systemPromptPlaceholder: string
  inputPlaceholder: string
  disclaimer: string
  globalSettings: string
  language: string
  theme: string
  globalSystemPrompt: string
  globalSystemPromptPlaceholder: string
  [key: string]: string  // Fallback für zusätzliche Keys
}

/**
 * Alle Sprachen und ihre Übersetzungen
 * Ermöglicht einfaches Lookup: translations['de']['title']
 */
export type Translations = {
  [key: string]: TranslationStrings
}

// ===== DATA TYPES =====

/**
 * Struktur der data.json Konfigurationsdatei
 * Dies ist die zentrale Datei für alle externalisierten Daten
 */
export type DataFile = {
  translations: Translations  // Alle Sprach-Übersetzungen
  themes: Themes              // Alle Design-Themes
}

// ===== WEB PAGE TYPES =====

export type WebPageRecord = {
  id: number
  url: string
  title: string | null
  content: string
  status_code: number | null
  content_hash: string | null
  fetched_at: string
  created_at: string
  updated_at: string
}

export type PageSearchResponse = {
  items: WebPageRecord[]
  limit: number
  offset: number
}

export type CrawlResultItem = {
  url: string
  status: 'ok' | 'failed' | 'skipped'
  id?: number
  statusCode?: number
  contentHash?: string
  reason?: string
}

export type CrawlResponse = {
  items: CrawlResultItem[]
}

export type WebPreviewItem = {
  url: string
  title: string | null
  content: string
  statusCode?: number
  reason?: string
}

export type PreviewResponse = {
  items: WebPreviewItem[]
}

// ===== PROGRESS & STATE TYPES =====

/**
 * Fortschritts-Tracking für lange Operationen
 * Wird verwendet beim Speichern von URLs und anderen Batch-Operationen
 */
export type ProgressState = {
  current: number   // Bereits verarbeitete Items
  total: number     // Gesamt Anzahl der Items
}

/**
 * Filter- und Suchzustände für die Web-Datenbank
 * Verwaltet die aktuelle Suchanfrage und Filterung
 */
export type DatabaseQueryState = {
  searchQuery: string     // Aktueller Suchbegriff
  filterQuery: string     // Filter für Treffer
  selectedUrls: Record<string, boolean>  // Ausgewählte URLs für Speicherung
}

/**
 * Konfiguration für API-Verbindungen
 * Zentrale Verwaltung aller API-Endpoints
 */
export type ApiConfig = {
  baseUrl: string
  endpoints: {
    crawl: string
    search: string
    preview: string
    savePage: string
  }
}

/**
 * Aggregierte Fehler- und Erfolgsmeldungen
 * Für zentrale Fehlerbehandlung und Feedback
 */
export type OperationResult<T> = {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}
