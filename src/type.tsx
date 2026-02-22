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

// ===== JOB SEARCH TYPES =====

export type JobSearchItem = {
  id: string
  title: string
  company: string
  location: string | null
  url: string
  source: string
  description: string
  createdAt?: string
}

export type JobSearchResponse = {
  items: JobSearchItem[]
}

export type FileRecord = {
  id: string
  name: string
  mime: string | null
  size: number | null
  uploadedAt?: string
}

export type FileListResponse = {
  files: FileRecord[]
}

export type FileContentResponse = FileRecord & {
  contentBase64: string
}

export type DbFilterPreviewResponse = {
  items: WebPageRecord[]
  total: number
}

export type DbFilterDeleteResponse = {
  deletedCount: number
  deletedIds: number[]
}

export type PageListResponse = {
  items: WebPageRecord[]
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

// ===== AI SERVICE TYPES =====

/**
 * Unterstützte KI-Service Provider
 * Jeder Provider hat eigene API-Schnittstelle und Authentifizierung
 */
export type AiProviderType = 'openai' | 'claude' | 'gemini' | 'local' | 'ollama'

/**
 * KI-Service Konfiguration mit API Keys und Einstellungen
 * Eine Instanz pro Provider
 * Wird verschlüsselt gespeichert
 */
export type AiServiceConfig = {
  provider: AiProviderType         // Welcher Provider ('openai', 'claude', etc.)
  apiKey: string                   // API-Schlüssel (verschlüsselt)
  apiUrl?: string                  // Custom endpoint (für Ollama, Local, etc.)
  model: string                    // Modell-ID (z.B. 'gpt-4', 'claude-3-opus')
  maxTokens?: number               // Response Limit pro Anfrage
  temperature: number              // Kreativität: 0=präzise, 2=kreativ
  topP?: number                    // Nucleus sampling (0-1)
  frequencyPenalty?: number        // -2 bis 2
  presencePenalty?: number         // -2 bis 2
}

/**
 * Konfigurierte KI-Services des Benutzers
 * Key = Service-ID, Value = Config
 * Wird in localStorage gespeichert (verschlüsselt)
 */
export type AiServicesConfig = {
  [key: string]: AiServiceConfig
}

/**
 * Erweiterte Chat-Nachricht mit KI-Provider Metadaten
 * System soll wissen welcher Service die Antwort generiert hat
 */
export type ChatMessage = Message & {
  aiProvider?: AiProviderType      // Welcher Service hat geantwortet?
  aiModel?: string                 // Welches Modell?
  tokens?: {                       // Token-Verbrauch (für Kosten-Tracking)
    prompt: number
    completion: number
    total: number
  }
  generatedAt?: string             // ISO Timestamp
}

/**
 * Standardisierte Response aller KI-Services
 * Alle Provider werden auf diesen Format genormalisiert
 * Macht Provider-Wechsel transparent
 */
export type AiServiceResponse = {
  content: string                  // Antwort-Text
  provider: AiProviderType         // Welcher Provider
  model: string                    // Welches Modell
  tokens: {                        // Tokens für Billing + Limits
    prompt: number
    completion: number
    total: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  error?: string                   // Falls Fehler aufgetreten
}

/**
 * Standardisierter Request an AI Service
 * Wird in provider-spezifische Formate konvertiert
 */
export type AiServiceRequest = {
  messages: Array<{                // Nachrichten-Verlauf
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

/**
 * Metadaten zu verfügbarem Modell
 * Verwendet für Dropdown-Auswahl in UI
 */
export type AiModelInfo = {
  provider: AiProviderType
  modelId: string                  // Modell-Identifier für API
  name: string                     // Anzeigename
  maxTokens: number                // Context-Fenster-Größe
  costPer1kPromptTokens: number    // $ pro 1000 Prompt-Tokens
  costPer1kCompletionTokens: number// $ pro 1000 Completion-Tokens
  released: string                 // ISO Date
  deprecated?: string              // ISO Date (falls veraltet)
}

/**
 * Alle verfügbaren Models
 * Wird beim Laden der App initialisiert
 */
export type AvailableAiModels = AiModelInfo[]

/**
 * Validierungsergebnis für API-Keys
 * Vor Speichern prüfen ob Key funktioniert
 */
export type AiServiceValidation = {
  valid: boolean
  provider: AiProviderType
  error?: string
  message?: string
}

// ===== ENHANCED SEARCH TYPES =====

/**
 * Erweiterte Suchparameter für Datenbank-Abfragen
 * Nicht nur Volltext-Suche, sondern auch Filter
 */
export type AdvancedSearchParams = {
  query: string                          // Suchtext
  searchIn: ('url' | 'title' | 'content')[]  // In welche Felder suchen?
  startDate?: string                     // ISO Date
  endDate?: string                       // ISO Date
  minLength?: number                     // Minimum Content-Länge
  maxLength?: number                     // Maximum Content-Länge
  statusCode?: number                    // HTTP-Status filtern
  limit?: number                         // Limit
  offset?: number                        // Offset für Pagination
}

/**
 * Such-Ergebnis mit Ranking-Score
 * Zeigt wie relevant das Ergebnis ist (BM25/TF-IDF)
 */
export type SearchResultItem = WebPageRecord & {
  relevanceScore: number                 // 0-100 (höher = besser)
  matchedFields: ('url' | 'title' | 'content')[]  // Wo gefunden?
  snippets: string[]                     // Highlighted Matches
}

/**
 * Erweiterte Such-Antwort mit Metadaten
 */
export type AdvancedSearchResponse = {
  items: SearchResultItem[]
  totalCount: number
  limit: number
  offset: number
  query: string
  executionTime: number                  // Millisekunden
}

// ===== FILE UPLOAD TYPES =====

/**
 * Hochgeladene Datei mit Metadaten
 */
export type UploadedFile = {
  id: string                             // Eindeutige ID
  name: string                           // Dateiname
  type: string                           // MIME-Type (application/pdf, image/png, etc.)
  size: number                           // Dateigröße in Bytes
  base64Content: string                  // Base64-kodierter Inhalt
  uploadedAt: string                     // ISO Timestamp
  description?: string                   // Kurze Beschreibung
}

/**
 * Datei-Upload Response vom Server
 */
export type FileUploadResponse = {
  success: boolean
  fileId?: string
  fileName?: string
  message?: string
  error?: string
}

// ===== DATABASE FILTER TYPES =====

/**
 * Parameter für DB-Filter-Vorschau
 * Zeigt welche Einträge gelöscht würden
 */
export type DbFilterPreviewParams = {
  include: string      // Include-Keywords (newline/comma separated)
  exclude: string      // Exclude-Keywords (newline/comma separated)
  chatId: string       // Chat-ID für DB-Isolation
}

/**
 * Vorschau-Item davon was gelöscht würde
 */
export type DbFilterPreviewItem = {
  id: number
  url: string
  title: string
  snippet: string      // First 100 chars of content
}

/**
 * DB-Filter Preview Response
 */
export type DbFilterPreviewResponse = {
  items: DbFilterPreviewItem[]
  total: number
}

/**
 * Parameter für DB-Filter Delete
 * Löscht nicht-matching Einträge
 */
export type DbFilterDeleteParams = {
  include: string      // Keywords die bleiben sollen
  exclude: string      // Keywords die gelöscht werden sollen
  chatId: string
}

/**
 * DB-Filter Delete Response
 */
export type DbFilterDeleteResponse = {
  success: boolean
  deleted: number
}

// ===== BATCH APPLICATION TYPES =====

/**
 * Template-Datei für Bewerbungserstellung
 * Hochgeladene Dateien die als Vorlage dienen
 */
export type TemplateFile = {
  id: string
  name: string
  size?: number
  uploadedAt?: string
  mime?: string
}

/**
 * Generierte Bewerbung für einen DB-Eintrag
 * Output der Batch-Application-Generation
 */
export type GeneratedApplication = {
  pageId: number
  pageUrl: string
  pageTitle: string
  applicationText: string
  generatedAt: string
  template?: string     // Welche Template verwendet
}

/**
 * Parameter für Batch-Application Generation
 */
export type BatchApplicationParams = {
  selectedTemplateId?: string  // Template-ID falls verwendet
  chatId: string
  systemPrompt?: string        // Custom System-Prompt
  temperature?: number
}

/**
 * Response der Batch-Application Generation
 * Array von generierten Bewerbungen
 */
export type BatchApplicationResponse = GeneratedApplication[]

// ===== FILE CONTENT TYPES =====

/**
 * Datei mit Content
 * Wird beim Fetch der Datei-Details zurückbekommen
 */
export type FileWithContent = TemplateFile & {
  content: string              // Base64-encoded content
}

/**
 * File-Upload Payload für Server
 */
export type FileUploadPayload = {
  fileName: string
  fileContent: string          // Base64
  fileType?: string            // MIME-Type
  fileSize?: number
  chatId: string
}

// ===== CONSOLIDATED API RESPONSE TYPES =====

/**
 * Standardisierte API-Response für alle Operationen
 * Einheitliches Fehlerhandling und Daten-Format
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated Response für List-Operationen
 */
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}
