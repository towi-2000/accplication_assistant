/**
 * type.tsx - TypeScript Type-Definitionen für die gesamte Anwendung
 * 
 * Diese Datei definiert alle TypeScript-Typen und Interfaces der Anwendung.
 * Das sorgt für:
 * - Vollständige Typsicherheit während der Entwicklung
 * - Besser Intellisense und Autocompletion in IDEs
 * - Fehler zur Compile-Zeit statt zur Runtime
 * - Selbstedokumentation des Codes
 * 
 * Struktur:
 * 1. Message Types - Chat-Nachrichten
 * 2. Conversation Types - Konversationen/Chats
 * 3. Settings Types - Globale und Chat-spezifische Einstellungen
 * 4. Theme Types - Design-Konfigurationen
 * 5. Translation Types - Sprach-Daten
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
