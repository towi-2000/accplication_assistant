/**
 * Functions.tsx - Utility-Funktionen und Business-Logik für Job Assistant
 * 
 * Diese Datei enthält alle nicht-UI-Funktionen der Anwendung:
 * - Übersetzungs- und Theme-Management für mehrsprachige UI
 * - Jobsuche und Bewerbungsvalidierung
 * - Theme-Verwaltung für verschiedene Designs
 * - Sprachdaten-Management
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
  WebPreviewItem
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

const API_BASE = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || 'http://localhost:5174'

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
  title: string
): Conversation[] => {
  const nextTitle = title.trim() || 'Neue Konversation'
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

// ===== PROGRESS & ERROR UTILITIES =====

/**
 * Berechnet den Fortschrittsprozentsatz
 * Wird für Progress-Bars bei Speicher- und Crawl-Operationen verwendet
 * 
 * @param current - Aktuell verarbeitete Items
 * @param total - Gesamt Anzahl der Items
 * @returns Prozentsatz (0-100) gerundet auf ganze Zahl
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

/**
 * Generiert eine Fortschritts-Label für UI-Anzeige
 * Verschiedene Labels je nach Operation (Suche, Preview, Crawl, Speichern)
 * 
 * @param isSearching - Sucht die App aktuell
 * @param isPreviewing - Werden Web-URLs vorgeschaut
 * @param isCrawling - Crawlt die App aktuell
 * @param isSaving - Speichert die App aktuell
 * @returns Aussagekräftiger Label für den User
 */
export const getProgressLabel = (
  isSearching: boolean,
  isPreviewing: boolean,
  isCrawling: boolean,
  isSaving: boolean
): string => {
  if (isSearching) return 'Suche in Datenbank...'
  if (isPreviewing) return 'Pruefe Web-URLs...'
  if (isCrawling) return 'Speichere URLs...'
  if (isSaving) return 'Speichere Auswahl...'
  return ''
}

/**
 * Prüft ob eine Progress-Anzeige sichtbar sein sollte
 * True wenn eine beliebige Operation läuft
 * 
 * @param isSearching - Sucht die App aktuell
 * @param isPreviewing - Werden Web-URLs vorgeschaut
 * @param isCrawling - Crawlt die App aktuell
 * @param isSaving - Speichert die App aktuell
 * @returns true wenn Progress-Indikator angezeigt werden sollte
 */
export const shouldShowProgress = (
  isSearching: boolean,
  isPreviewing: boolean,
  isCrawling: boolean,
  isSaving: boolean
): boolean => {
  return isSearching || isPreviewing || isCrawling || isSaving
}

// ===== URL & VALIDATION UTILITIES =====

/**
 * Validiert eine URL-Liste auf Plausibilität
 * Prüft Länge, Format und Duplikate
 * 
 * @param urls - Zu validierende URL-Liste
 * @param maxCount - Maximale Anzahl (default 1000)
 * @returns { valid: boolean, count: number, error?: string }
 */
export const validateUrlList = (urls: string[], maxCount = 1000): { valid: boolean; count: number; error?: string } => {
  if (urls.length === 0) {
    return { valid: false, count: 0, error: 'Bitte mindestens eine URL eingeben.' }
  }
  if (urls.length > maxCount) {
    return { valid: false, count: urls.length, error: `Bitte maximal ${maxCount} URLs eingeben.` }
  }
  return { valid: true, count: urls.length }
}

/**
 * Validiert einen Suchbegriff
 * Prüft ob der String nicht leer ist
 * 
 * @param query - Zu validierender Suchbegriff
 * @returns { valid: boolean, error?: string }
 */
export const validateSearchQuery = (query: string): { valid: boolean; error?: string } => {
  if (!query.trim()) {
    return { valid: false, error: 'Bitte einen Suchbegriff eingeben.' }
  }
  return { valid: true }
}