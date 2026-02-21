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
  Translations
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