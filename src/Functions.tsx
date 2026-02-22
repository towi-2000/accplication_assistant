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
  WebPreviewItem,
  SearchResultItem,
  AdvancedSearchResponse,
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

// ===== AI SERVICE TYPES & INTERFACES =====

/**
 * Schnittstelle für alle KI-Service-Provider
 * Jeder Provider muss diese Methoden implementieren
 */
interface IAiService {
  provider: string
  callApi(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, config: any): Promise<string>
  validateKey(key: string): Promise<boolean>
}

// ===== API KEY ENCRYPTION =====

/**
 * Einfache Verschlüsselung für API-Keys
 * WICHTIG: In Produktion sollte man robustere Läsungen wie libsodium verwenden
 * Diese ist nur für Demo-Zwecke
 * 
 * @param plainText - Zu verschlüsselnder Text
 * @returns Base64-Encoded verschlüsselter Text
 */
export const encryptApiKey = (plainText: string): string => {
  // Simple XOR mit zeitstempel für basis-sicherheit
  const timestamp = Date.now().toString()
  let encrypted = ''
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i)
    const xor = timestamp.charCodeAt(i % timestamp.length)
    encrypted += String.fromCharCode(char ^ xor)
  }
  return btoa(encrypted) // Base64 encoding
}

/**
 * Entschlüsselt einen API-Key
 * 
 * @param encrypted - Base64-Encoded verschlüsselter Text
 * @returns Entschlüsselter Original-Text
 */
export const decryptApiKey = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted) // Base64 decoding
    const timestamp = Date.now().toString()
    let decrypted = ''
    for (let i = 0; i < decoded.length; i++) {
      const char = decoded.charCodeAt(i)
      const xor = timestamp.charCodeAt(i % timestamp.length)
      decrypted += String.fromCharCode(char ^ xor)
    }
    return decrypted
  } catch (e) {
    console.error('Fehler beim Entschlüsseln des API-Keys:', e)
    return ''
  }
}

// ===== AI SERVICE IMPLEMENTATIONS =====

/**
 * OpenAI Service Implementation
 * Unterstützt GPT-4, GPT-3.5, etc.
 */
class OpenAiService implements IAiService {
  provider = 'openai'
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async callApi(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: { model: string; temperature: number; maxTokens?: number }
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens || 1000
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API error')
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'Keine Antwort erhalten'
    } catch (error) {
      console.error('OpenAI API Fehler:', error)
      throw error
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('OpenAI Key Validierungsfehler:', error)
      return false
    }
  }
}

/**
 * Anthropic Claude Service Implementation
 * Unterstützt Claude 3 Opus, Sonnet, Haiku
 */
class ClaudeService implements IAiService {
  provider = 'claude'
  private apiKey: string
  private baseUrl: string = 'https://api.anthropic.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async callApi(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: { model: string; temperature: number; maxTokens?: number }
  ): Promise<string> {
    try {
      // Claude benötigt System Message im eigenen Parameter
      const systemMessage = messages.find(m => m.role === 'system')?.content || ''
      const userMessages = messages.filter(m => m.role !== 'system')

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 1000,
          system: systemMessage,
          messages: userMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Claude API error')
      }

      const data = await response.json()
      return data.content[0]?.text || 'Keine Antwort erhalten'
    } catch (error) {
      console.error('Claude API Fehler:', error)
      throw error
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        }
      })
      return response.ok
    } catch (error) {
      console.error('Claude Key Validierungsfehler:', error)
      return false
    }
  }
}

/**
 * Google Gemini Service Implementation
 * Unterstützt Gemini Pro, Vision
 */
class GeminiService implements IAiService {
  provider = 'gemini'
  private apiKey: string
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async callApi(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: { model: string; temperature: number; maxTokens?: number }
  ): Promise<string> {
    try {
      // Gemini Format: alternation von user/model
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))

      const response = await fetch(
        `${this.baseUrl}/${config.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            safetySettings: [],
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens || 1000
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Gemini API error')
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'Keine Antwort erhalten'
    } catch (error) {
      console.error('Gemini API Fehler:', error)
      throw error
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/gemini-pro?key=${key}`)
      return response.ok
    } catch (error) {
      console.error('Gemini Key Validierungsfehler:', error)
      return false
    }
  }
}

/**
 * Ollama Service für Local LLMs
 * Alle Open-Source Modelle (Llama, Mistral, etc.)
 */
class OllamaService implements IAiService {
  provider = 'ollama'
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  async callApi(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: { model: string; temperature: number; maxTokens?: number }
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama Fehler: ${response.status}`)
      }

      const data = await response.json()
      return data.message?.content || 'Keine Antwort erhalten'
    } catch (error) {
      console.error('Ollama API Fehler:', error)
      throw error
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch (error) {
      console.error('Ollama Verbindungsfehler:', error)
      return false
    }
  }
}

/**
 * Local LLM Service (ohne externe API)
 * Falls kein externes AI verfügbar ist
 */
class LocalService implements IAiService {
  provider = 'local'

  async callApi(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: any
  ): Promise<string> {
    // Simpler Echo-Service für Demo
    const lastMessage = messages[messages.length - 1]?.content || ''
    return `[LOCAL ECHO] ${lastMessage}`
  }

  async validateKey(key: string): Promise<boolean> {
    return true // Local Service benötigt keinen Key
  }
}

// ===== SERVICE FACTORY =====

/**
 * Factory-Funktion zur Erstellung von AI Services
 * Basierend auf Provider-Typ und Konfiguration
 * 
 * @param provider - Service Provider ('openai', 'claude', etc.)
 * @param apiKey - API-Schlüssel (wenn erforderlich)
 * @param options - Provider-spezifische Optionen
 * @returns Initialisierter AI Service
 */
export const createAiService = (
  provider: string,
  apiKey?: string,
  options?: { baseUrl?: string }
): IAiService => {
  switch (provider) {
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API Key erforderlich')
      return new OpenAiService(apiKey)
    case 'claude':
      if (!apiKey) throw new Error('Claude API Key erforderlich')
      return new ClaudeService(apiKey)
    case 'gemini':
      if (!apiKey) throw new Error('Gemini API Key erforderlich')
      return new GeminiService(apiKey)
    case 'ollama':
      return new OllamaService(options?.baseUrl)
    case 'local':
      return new LocalService()
    default:
      throw new Error(`Unbekannter Provider: ${provider}`)
  }
}

// ===== AVAILABLE MODELS DEFINITIONS =====

/**
 * Alle verfügbaren AI Modelle mit Metadaten
 * Wird für Dropdown-Auswahl in UI verwendet
 * Preise sind approximate (Stand 2024)
 */
export const AVAILABLE_AI_MODELS = [
  // OpenAI Models
  {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    maxTokens: 128000,
    costPer1kPromptTokens: 0.01,
    costPer1kCompletionTokens: 0.03,
    released: '2024-04-09',
    deprecated: undefined
  },
  {
    provider: 'openai',
    modelId: 'gpt-4',
    name: 'GPT-4',
    maxTokens: 8192,
    costPer1kPromptTokens: 0.03,
    costPer1kCompletionTokens: 0.06,
    released: '2023-03-14'
  },
  {
    provider: 'openai',
    modelId: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    maxTokens: 4096,
    costPer1kPromptTokens: 0.0005,
    costPer1kCompletionTokens: 0.0015,
    released: '2023-03-15'
  },

  // Anthropic Claude Models
  {
    provider: 'claude',
    modelId: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    maxTokens: 200000,
    costPer1kPromptTokens: 0.015,
    costPer1kCompletionTokens: 0.075,
    released: '2024-02-29'
  },
  {
    provider: 'claude',
    modelId: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    maxTokens: 200000,
    costPer1kPromptTokens: 0.003,
    costPer1kCompletionTokens: 0.015,
    released: '2024-02-29'
  },

  // Google Gemini Models
  {
    provider: 'gemini',
    modelId: 'gemini-pro',
    name: 'Gemini Pro',
    maxTokens: 32768,
    costPer1kPromptTokens: 0.0005,
    costPer1kCompletionTokens: 0.0015,
    released: '2023-12-06'
  },

  // Ollama (Local Open Source Models)
  {
    provider: 'ollama',
    modelId: 'llama2',
    name: 'Llama 2 (Open Source)',
    maxTokens: 4096,
    costPer1kPromptTokens: 0,
    costPer1kCompletionTokens: 0,
    released: '2023-07-18'
  },
  {
    provider: 'ollama',
    modelId: 'mistral',
    name: 'Mistral (Open Source)',
    maxTokens: 8192,
    costPer1kPromptTokens: 0,
    costPer1kCompletionTokens: 0,
    released: '2023-12-08'
  },
  {
    provider: 'ollama',
    modelId: 'neural-chat',
    name: 'Neural Chat (Open Source)',
    maxTokens: 4096,
    costPer1kPromptTokens: 0,
    costPer1kCompletionTokens: 0,
    released: '2023-11-01'
  },

  // Local Service
  {
    provider: 'local',
    modelId: 'echo',
    name: 'Local Echo (Demo)',
    maxTokens: 2048,
    costPer1kPromptTokens: 0,
    costPer1kCompletionTokens: 0,
    released: '2024-01-01'
  }
]

// ===== ENHANCED SEARCH FUNCTIONS =====

/**
 * BM25 Ranking-Algorithmus für Suchresultate
 * Berechnet Relevanz-Score basierend auf:
 * - Term Frequency (wie oft kommt das Wort vor)
 * - Document Frequency (in wie vielen Dokumenten ist es)
 * - Document Length (ist das Dokument lang oder kurz)
 * 
 * @param query - Suchbegriff
 * @param document - Dokument-Inhalt
 * @param allDocuments - Alle Dokumente (für IDF Berechnung)
 * @param fieldName - Feld (title, content, url)
 * @returns Score 0-100
 */
export const calculateBm25Score = (
  query: string,
  document: string,
  allDocuments: string[],
  fieldName: string = 'content'
): number => {
  const k1 = 1.5 // BM25 Parameter
  const b = 0.75 // BM25 Parameter

  const queryTerms = query.toLowerCase().split(/\s+/)
  const docTerms = document.toLowerCase().split(/\s+/)
  const avgDocLength = allDocuments.reduce((sum, doc) => sum + doc.split(/\s+/).length, 0) / allDocuments.length
  const docLength = docTerms.length

  let score = 0

  for (const term of queryTerms) {
    // Term Frequency
    const tf = docTerms.filter(t => t.includes(term)).length

    // Inverse Document Frequency
    const docsWithTerm = allDocuments.filter(doc => 
      doc.toLowerCase().includes(term)
    ).length
    const idf = Math.log((allDocuments.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5))

    // BM25 Formula
    const numerator = tf * (k1 + 1)
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength))
    
    score += idf * (numerator / denominator)
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, (score / queryTerms.length) * 10))
}

/**
 * Erweiterte Suchfunktion mit Ranking
 * Nutzt BM25 Algorithmus für bessere Relevanz
 * 
 * @param query - Suchtext
 * @param items - Such-Ergebnisse
 * @param fields - Felder zum Durchsuchen
 * @returns Sortiert nach Relevanz
 */
export const rankSearchResults = (
  query: string,
  items: WebPageRecord[],
  fields: ('url' | 'title' | 'content')[] = ['title', 'content']
): SearchResultItem[] => {
  if (!items.length) return []

  // Collect all documents for IDF calculation
  const allContent = items.map(item => 
    fields.map(field => item[field as keyof WebPageRecord] || '').join(' ')
  )

  return items.map(item => {
    let totalScore = 0
    const matchedFields: ('url' | 'title' | 'content')[] = []

    // Score each field
    for (const field of fields) {
      const content = String(item[field as keyof WebPageRecord] || '')
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const score = calculateBm25Score(query, content, allContent, field)
        totalScore += score
        matchedFields.push(field)
      }
    }

    // Extract snippets (context around match)
    const snippets = extractSnippets(query, items.map(i => i.content).join('\n'))

    return {
      ...item,
      relevanceScore: Math.round(totalScore / Math.max(matchedFields.length, 1)),
      matchedFields,
      snippets
    }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Extrahiert Text-Snippets um gefundene Suchbegriffe
 * Für Inline-Anzeige in Suchergebnissen
 * 
 * @param query - Suchbegriff
 * @param text - Zu durchsuchender Text
 * @param contextLength - Charaktere vor/nach Match
 * @returns Array von Snippets
 */
export const extractSnippets = (
  query: string,
  text: string,
  contextLength: number = 100
): string[] => {
  const regex = new RegExp(`(.{0,${contextLength}})${query}(.{0,${contextLength}})`, 'gi')
  const matches = [...text.matchAll(regex)]
  
  return matches.slice(0, 3).map(match => {
    const before = match[1] || ''
    const after = match[2] || ''
    return `...${before}${query}${after}...`
  })
}

/**
 * Filterung von Suchresultaten mit erweiterten Parametern
 * 
 * @param items - Such-Ergebnisse
 * @param params - Filter-Parameter
 * @returns Gefilterte und sortierte Resultate
 */
export const filterWithAdvancedParams = (
  items: WebPageRecord[],
  params: {
    startDate?: string
    endDate?: string
    minLength?: number
    maxLength?: number
    statusCode?: number
  }
): WebPageRecord[] => {
  return items.filter(item => {
    // Date filter
    if (params.startDate && item.fetched_at < params.startDate) return false
    if (params.endDate && item.fetched_at > params.endDate) return false

    // Length filter
    if (params.minLength && item.content.length < params.minLength) return false
    if (params.maxLength && item.content.length > params.maxLength) return false

    // Status code filter
    if (params.statusCode && item.status_code !== params.statusCode) return false

    return true
  })
}

// ===== FILE UPLOAD & PROCESSING =====

/**
 * Konvertiert eine File zu Base64-String
 * Für sichere Übertragung zum Server
 * 
 * @param file - HTML File Objekt
 * @returns Promise<string> Base64-kodierter Inhalt
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Entferne "data:...;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64 || '')
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Validiert eine hochgeladene Datei
 * Prüft Größe, Format, etc.
 * 
 * @param file - Zu validierende Datei
 * @param maxSizeBytes - Maximum Dateigröße (default 10MB)
 * @param allowedTypes - Erlaubte MIME-Types
 * @returns { valid, error }
 */
export const validateFile = (
  file: File,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv']
): { valid: boolean; error?: string } => {
  // Check size
  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024))
    return { 
      valid: false, 
      error: `Datei zu groß. Maximal ${maxMB}MB erlaubt.` 
    }
  }

  // Check type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Dateityp nicht erlaubt. Unterstützte: ${allowedTypes.join(', ')}` 
    }
  }

  return { valid: true }
}

/**
 * Formatiert Dateigröße für Anzeige (1024 -> "1 KB")
 * 
 * @param bytes - Größe in Bytes
 * @returns Formatierter String
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Extrahiert Text aus verschiedenen Dateiformaten
 * Für Übertragung an KI-Services
 * 
 * @param file - Datei
 * @param base64Content - Base64-kodierter Inhalt
 * @returns Promise<string> Extrahierter Text
 */
export const extractTextFromFile = async (
  file: File,
  base64Content: string
): Promise<string> => {
  const fileType = file.type

  // Text-Dateien
  if (fileType === 'text/plain' || fileType === 'text/csv') {
    const binary = atob(base64Content)
    return binary
  }

  // PDF (vereinfacht - nur Text-Layer)
  if (fileType === 'application/pdf') {
    // Note: Volle PDF-Parsing würde pdfjs benötigen
    // Für Demo: Return Dateiname als Hinweis
    return `[PDF File: ${file.name}] - Volle PDF-Parsing benötigt pdfjs-Library`
  }

  // Bilder
  if (fileType.startsWith('image/')) {
    return `[Image: ${file.name}] - Image-Analyse benötigt Vision API`
  }

  return `[File: ${file.name}]`
}

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

export const fetchFiles = async (chatId: number): Promise<FileListResponse> => {
  const response = await fetch(`${API_BASE}/api/files?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch files failed')
  }
  return response.json()
}

export const fetchFileContent = async (fileId: string, chatId: number): Promise<FileContentResponse> => {
  const response = await fetch(`${API_BASE}/api/files/${fileId}?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch file failed')
  }
  return response.json()
}

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

export const fetchAllPages = async (chatId: number): Promise<PageListResponse> => {
  const response = await fetch(`${API_BASE}/api/pages/all?chatId=${chatId}`)
  if (!response.ok) {
    throw new Error('Fetch pages failed')
  }
  return response.json()
}