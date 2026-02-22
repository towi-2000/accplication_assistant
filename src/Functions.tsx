/**
 * Functions.tsx - Utility-Funktionen und Business-Logik für Application Assistant
 * 
 * Diese Datei enthält alle nicht-UI-Funktionen der Anwendung:
 * - Übersetzungs- und Theme-Management für mehrsprachige UI
 * - Web-Recherche und Datenbankabfragen
 * - Konversationsverwaltung
 * 
 * Durch die Trennung von UI und Business-Logik wird der Code
 * wartbar, testbar und wiederverwendbar.
 */

import data from './data.json'
import type {
  DataFile,
  Theme,
  Themes,
  TranslationStrings,
  Translations,
  PageSearchResponse,
  CrawlResponse,
  WebPageRecord,
  Conversation,
  PreviewResponse,
  WebPreviewItem,
  JobSearchResponse,
  FileListResponse,
  FileContentResponse,
  DbFilterPreviewResponse,
  DbFilterDeleteResponse,
  PageListResponse
} from './type'

// Typsichere Deserialisierung der JSON-Konfigurationsdaten
const dataFile = data as DataFile
const { translations, themes } = dataFile

/**
 * Hilfsfunktion für Übersetzungen
 * Gibt den übersetzten Text für einen Key in der gewählten Sprache zurück
 * Falls Schlüssel nicht existiert, fällt zurück auf Deutsch (de)
 * 
 * @param key - Der Übersetzungsschlüssel (z.B. 'title', 'subtitle')
 * @param language - Die aktuelle Sprache ('de', 'en', 'fr', 'es', 'it')
 * @returns Der übersetzte Text oder der Schlüssel selbst als Fallback
 */
export const getTranslation = (key: string, language: string): string => {
  const languageData = translations[language as keyof Translations] as TranslationStrings | undefined
  if (languageData && key in languageData) {
    return languageData[key as keyof TranslationStrings]
  }
  const defaultData = translations['de'] as TranslationStrings
  if (key in defaultData) {
    return defaultData[key as keyof TranslationStrings]
  }
  return key
}

/**
 * Theme-Daten abrufen
 * Gibt die vollständige Theme-Konfiguration für ein Design zurück
 * Falls Theme nicht existiert, wird das Dark-Theme als Default zurückgegeben
 * 
 * @param themeName - Der Name des Themes (z.B. 'light', 'dark', 'ocean')
 * @returns Die Theme-Konfiguration mit Farben und Styling-Variablen
 */
export const getTheme = (themeName: string): Theme => {
  const theme = themes[themeName as keyof Themes] as Theme | undefined
  if (theme) {
    return theme
  }
  return themes['dark' as keyof Themes] as Theme
}

/**
 * CSS-Variablen für ein Theme setzen
 * Wendet alle Farben und Styling-Variablen eines Themes auf das Dokument an
 * Dies ermöglicht ein dynamisches Theme-Wechsel ohne Neustart
 * 
 * Mapping von JSON-Properties zu CSS-Variablen:
 * - primaryColor → --primary-color
 * - darkBg → --dark-bg
 * - sidebarBg → --sidebar-bg
 * - textColor → --text-color
 * - userMessageBg → --user-message-bg
 * - aiMessageBg → --ai-message-bg
 * - borderColor → --border-color
 * - secondaryColor → --secondary-color
 * 
 * @param themeName - Der Name des anzuwendenden Themes
 */
export const applyThemeToDocument = (themeName: string): void => {
  const theme = getTheme(themeName)
  
  // Mapping von camelCase JSON-Keys zu CSS-Variablen
  const cssVarMap: Record<string, string> = {
    primaryColor: '--primary-color',
    darkBg: '--dark-bg',
    sidebarBg: '--sidebar-bg',
    textColor: '--text-color',
    userMessageBg: '--user-message-bg',
    aiMessageBg: '--ai-message-bg',
    borderColor: '--border-color',
    secondaryColor: '--secondary-color'
  }
  
  // Alle Theme-Properties auf dem Dokument-Root setzen
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name' && cssVarMap[key]) {
      document.documentElement.style.setProperty(cssVarMap[key], value as string)
    }
  })
}

/**
 * Validiert eine Nachricht vor dem Senden
 * Prüft ob der Input nicht leer ist
 * 
 * @param input - Der zu validierende Text
 * @returns true wenn die Nachricht gültig ist und gesendet werden darf
 */
export const isMessageValid = (input: string): boolean => {
  return input.trim().length > 0
}

// API Base URL für Fetch Requests
// Im Unified Mode (Vite + Express): '/api' (relativ)
// Im Standalone Mode (separate Server): 'http://localhost:5174' (absolut)
// Kann mit VITE_API_BASE Environment Variable überschrieben werden
const API_BASE = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || ''

const ensureScheme = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value
  }
  return `https://${value}`
}

export const parseUrlList = (input: string): string[] => {
  const raw = input
    .split(/[\s,]+/)
    .map(entry => entry.trim())
    .filter(Boolean)

  const normalized = raw
    .map(ensureScheme)
    .filter((value, index, list) => list.indexOf(value) === index)

  return normalized
}

export const limitUrls = (urls: string[], max = 1000): string[] => {
  return urls.slice(0, max)
}

// ===== CORE API FUNCTIONS =====

/**
 * Durchsucht gecrawlte Seiten in der Datenbank
 * 
 * @param query - Suchtext
 * @param chatId - Chat-ID für Datenbank-Isolation
 * @param limit - Max Ergebnisse
 * @param offset - Pagination
 * @returns Suchergebnisse
 */
export const searchPages = async (query: string, chatId: number, limit = 1000, offset = 0): Promise<PageSearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    offset: String(offset),
    chatId: String(chatId)
  })
  const response = await fetch(`${API_BASE}/api/pages/search?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Search failed')
  }

  return response.json()
}

/**
 * Speichert eine einzelne Seite in der Datenbank
 * 
 * @param url - Seiten-URL
 * @param content - Extrahierter Text-Inhalt
 * @param chatId - Chat-ID
 * @param title - Optional: Seitentitel
 * @returns Gespeicherte Seite mit ID
 */
export const savePage = async (url: string, content: string, chatId: number, title?: string): Promise<WebPageRecord> => {
  const response = await fetch(`${API_BASE}/api/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, content, title, chatId })
  })

  if (!response.ok) {
    throw new Error('Save failed')
  }

  const payload = await response.json()
  return {
    id: payload.id,
    url,
    title: title ?? null,
    content,
    status_code: null,
    content_hash: payload.contentHash ?? null,
    fetched_at: '',
    created_at: '',
    updated_at: ''
  }
}

/**
 * Crawlt mehrere URLs parallel (max 8 gleichzeitig)
 * Extrahiert Titel und Text-Inhalt und speichert in DB
 * 
 * @param urls - URLs zum Crawlen
 * @param chatId - Chat-ID für Datenbank-Isolation
 * @returns Crawl-Ergebnisse mit erfolgreichen + fehlgeschlagenen URLs
 */
export const crawlUrls = async (urls: string[], chatId: number): Promise<CrawlResponse> => {
  const response = await fetch(`${API_BASE}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, chatId })
  })

  if (!response.ok) {
    throw new Error('Crawl failed')
  }

  return response.json()
}

/**
 * Web-Vorschau ohne zu speichern
 * Für User um URLs vor dem Speichern zu prüfen
 * 
 * @param urls - URLs zum Vorschauen
 * @param query - Optionaler Filter-Query
 * @returns Preview-Ergebnisse
 */
export const previewUrls = async (urls: string[], query: string): Promise<PreviewResponse> => {
  const response = await fetch(`${API_BASE}/api/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, query })
  })

  if (!response.ok) {
    throw new Error('Preview failed')
  }

  return response.json()
}

/**
 * Sucht in Job-APIs (6 Quellen parallel)
 * 
 * @param query - Suchtext z.B. "React Developer"
 * @param limit - Max Ergebnisse pro API
 * @returns Aggregierte Job-Ergebnisse
 */
export const searchJobs = async (query: string, limit = 50): Promise<JobSearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit)
  })
  const response = await fetch(`${API_BASE}/api/jobs/search?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Job search failed')
  }

  return response.json()
}

/**
 * Holt Liste der hochgeladenen Template-Dateien
 * 
 * @param chatId - Chat-ID
 * @returns Liste von Dateien mit Metadaten
 */
export const fetchFiles = async (chatId: number): Promise<FileListResponse> => {
  const response = await fetch(`${API_BASE}/api/files?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch files failed')
  }
  return response.json()
}

/**
 * Holt Inhalt einer hochgeladenen Datei
 * 
 * @param fileId - Datei-ID
 * @param chatId - Chat-ID
 * @returns Datei-Inhalt als Text
 */
export const fetchFileContent = async (fileId: string, chatId: number): Promise<FileContentResponse> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch file failed')
  }
  return response.json()
}

/**
 * Vorschau: Welche Einträge würden gelöscht?
 * Für Filter-Operationen auf Datenbank
 * 
 * @param include - Keywords die enthalten sein müssen
 * @param exclude - Keywords die ausgeschlossen werden
 * @param chatId - Chat-ID
 * @returns Preview welche Einträge gelöscht würden
 */
export const previewDbFilter = async (
  include: string[],
  exclude: string[],
  chatId: number
): Promise<DbFilterPreviewResponse> => {
  const response = await fetch(`${API_BASE}/api/pages/filter-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ include, exclude, chatId })
  })

  if (!response.ok) {
    throw new Error('Filter preview failed')
  }

  return response.json()
}

/**
 * Löscht gefilterte Einträge aus Datenbank
 * 
 * @param include - Keywords die enthalten sein müssen
 * @param exclude - Keywords die ausgeschlossen werden
 * @param chatId - Chat-ID
 * @returns Anzahl gelöschte Einträge
 */
export const deleteFilteredDb = async (
  include: string[],
  exclude: string[],
  chatId: number
): Promise<DbFilterDeleteResponse> => {
  const response = await fetch(`${API_BASE}/api/pages/filter-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ include, exclude, chatId })
  })

  if (!response.ok) {
    throw new Error('Filter delete failed')
  }

  return response.json()
}

/**
 * Holt alle Seiten für Batch-Operationen
 * Keine Pagination - alle Einträge
 * 
 * @param chatId - Chat-ID
 * @returns Alle Pages in DB
 */
export const fetchAllPages = async (chatId: number): Promise<PageListResponse> => {
  const response = await fetch(`${API_BASE}/api/pages/all?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch pages failed')
  }
  return response.json()
}

export const getNextConversationId = (conversations: Conversation[]): number => {
  if (conversations.length === 0) {
    return 1
  }
  return Math.max(...conversations.map(conv => conv.id)) + 1
}

export const filterConversations = (conversations: Conversation[], query: string): Conversation[] => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return conversations
  }
  return conversations.filter(conv => conv.title.toLowerCase().includes(normalized))
}

export const filterWebResults = (items: WebPageRecord[], query: string): WebPageRecord[] => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return items
  }
  return items.filter((item) => {
    const haystack = `${item.url} ${item.title ?? ''} ${item.content}`.toLowerCase()
    return haystack.includes(normalized)
  })
}

export const updateConversationTitle = (
  conversations: Conversation[],
  conversationId: number,
  title: string,
  fallbackTitle = 'Neue Konversation'
): Conversation[] => {
  const nextTitle = title.trim() || fallbackTitle
  return conversations.map(conv => (
    conv.id === conversationId ? { ...conv, title: nextTitle } : conv
  ))
}

export const buildSelectionMap = (items: WebPreviewItem[]): Record<string, boolean> => {
  return items.reduce((acc, item) => {
    acc[item.url] = false
    return acc
  }, {} as Record<string, boolean>)
}