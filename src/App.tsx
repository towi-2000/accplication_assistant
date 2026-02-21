/**
 * App.tsx - Hauptkomponente der AI Assistant Anwendung
 * 
 * Diese Komponente ist das Herzstück der Anwendung und verwaltet:
 * - Den Chat-/Nachrichtenverlauf
 * - Globale Einstellungen (Sprache, Theme, globaler System-Prompt)
 * - Chat-spezifische Einstellungen (Temperatur, Modell, Schreibstil)
 * - Die Benutzeroberfläche (Sidebar, Header, Messages, Settings-Panels)
 * 
 * Struktur:
 * - Sidebar: Navigation und Konversationshistorie
 * - Chat-Container: Hauptbereich mit Nachrichten und Eingabefeld
 * - Settings-Panels: Floating Panels für Chat- und globale Einstellungen
 */

import React, { useState, ChangeEvent, KeyboardEvent } from 'react'
import './App.css'
import data from './data.json'
import type {
  Message,
  Conversation,
  GlobalSettings,
  ChatSettings,
  DataFile
} from './type'
import {
  getTranslation,
  applyThemeToDocument,
  isMessageValid
} from './Functions'

// Typsichere Deserialisierung der JSON-Konfigurationsdaten
const dataFile = data as DataFile
const { themes, translations } = dataFile

/**
 * Hauptkomponente der Anwendung
 * Verwaltet alle States und rendert die Benutzeroberfläche
 */
function App(): React.ReactElement {
  // ========== MESSAGE STATE ==========
  // messages: Alle Nachrichten in der aktuellen Konversation (User + AI)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' }
  ])
  // input: Aktuell eingegebener Text im Eingabefeld
  const [input, setInput] = useState<string>('')
  // conversations: Liste aller bisherigen Konversationen in der Sidebar
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, title: 'Neue Konversation' }
  ])
  // systemPromptApplied: Flag ob der globale Anfangsprompt bereits zur AI gesendet wurde
  const [systemPromptApplied, setSystemPromptApplied] = useState<boolean>(false)

  // ========== UI STATE ==========
  // sidebarOpen: Sidebar ist auf mobilen Geräten ausblenbar (hamburger menu)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  // settingsPanelOpen: Chat-spezifische Einstellungen sind sichtbar
  const [settingsPanelOpen, setSettingsPanelOpen] = useState<boolean>(false)
  // globalSettingsOpen: Globale Einstellungen (Sprache, Theme) sind sichtbar
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState<boolean>(false)

  // ========== SETTINGS STATE ==========
  // globalSettings: Einstellungen die über alle Chats hinweg gelten
  // - language: Aktuelle Sprache ('de', 'en', 'fr', 'es', 'it')
  // - theme: Aktuelles Design ('light', 'dark', 'ocean', 'forest', 'sunset')
  // - globalSystemPrompt: Standard-Anweisungen für alle neuen Chats
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    language: 'de',
    theme: 'dark',
    globalSystemPrompt: ''
  })
  // chatSettings: Einstellungen die nur für den aktuellen Chat gelten
  // - temperature: Kreativität des Modells (0=präzise, 1=kreativ)
  // - model: Welches KI-Modell verwendet werden soll
  // - writingStyle: Schreibstil der Antworten
  // - systemPrompt: Chat-spezifische Anweisungen für die KI
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    temperature: 0.7,
    model: 'gpt-4',
    writingStyle: 'normal',
    systemPrompt: ''
  })

  /**
   * Translation helper function
   * Gibt den übersetzten Text für einen Key in der aktuellen Sprache zurück
   */
  const t = (key: string): string => {
    return getTranslation(key, globalSettings.language)
  }

  // ========== EVENT HANDLER ==========

  /**
   * Handle theme change
   * Wendet ein neues Design-Theme an und speichert es in globalSettings
   * Aktualisiert auch die CSS-Variablen des Dokumentes
   */
  const handleThemeChange = (themeName: string): void => {
    setGlobalSettings({ ...globalSettings, theme: themeName })
    applyThemeToDocument(themeName)
  }

  /**
   * Handle language change
   * Wechselt die Anwendungssprache und aktualisiert alle UI-Texte
   */
  const handleLanguageChange = (lang: string): void => {
    setGlobalSettings({ ...globalSettings, language: lang })
  }

  /**
   * Start a new chat
   * Setzt den Chat zurück auf den Anfangszustand
   * Löscht alte Nachrichten und schließt die Sidebar
   */
  const handleNewChat = (): void => {
    setMessages([
      { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' }
    ])
    setSystemPromptApplied(false)
    setSidebarOpen(false)
  }

  /**
   * Send a new message
   * Validiert die Eingabe, erstellt eine User-Nachricht,
   * speichert sie und simuliert eine KI-Antwort (TODO: echte API)
   */
  const handleSendMessage = (): void => {
    if (isMessageValid(input)) {
      // Globales System-Prompt einmalig beim ersten Senden anwenden
      if (globalSettings.globalSystemPrompt && !systemPromptApplied) {
        // TODO: Send global system prompt to AI backend
        // sendToAI(globalSettings.globalSystemPrompt)
        setSystemPromptApplied(true)
      }

      // User-Nachricht erstellen und zu Historia hinzufügen
      const newMessage: Message = {
        id: messages.length + 1,
        text: input,
        sender: 'user'
      }
      setMessages([...messages, newMessage])

      // Simulate AI response
      // TODO: Replace with actual API call including globalSystemPrompt + chatSettings.systemPrompt
      // Würde in echtem System hier die API aufrufen statt setTimeout
      setTimeout(() => {
        const aiResponse: Message = {
          id: messages.length + 2,
          text: 'Das ist eine tolle Frage! Ich bin hier um dir zu helfen...',
          sender: 'ai'
        }
        setMessages((prev) => [...prev, aiResponse])
      }, 500)

      setInput('')
    }
  }

  /**
   * Handle Enter key press for sending message
   * Shift+Enter erstellt eine neue Zeile statt abzusenden
   */
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  /**
   * Handle input change
   * Speichert den eingegebenen Text im input State
   */
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value)
  }

  /**
   * Handle temperature change
   * Temperature kontrolliert die Kreativität der KI-Antworten
   * 0 = präzise/konsistent, 1 = kreativ/variabel
   */
  const handleTemperatureChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setChatSettings({
      ...chatSettings,
      temperature: parseFloat(e.target.value)
    })
  }

  /**
   * Handle model selection change
   * Wählt welches KI-Modell für Antworten verwendet wird
   */
  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setChatSettings({
      ...chatSettings,
      model: e.target.value
    })
  }

  /**
   * Handle writing style change
   * Definiert den Ton und Stil der KI-Antworten
   * (formal, normal, casual, technisch)
   */
  const handleWritingStyleChange = (style: string): void => {
    setChatSettings({
      ...chatSettings,
      writingStyle: style
    })
  }

  /**
   * Handle system prompt change
   * Chat-spezifische Anweisung für die KI in diesem Chat
   */
  const handleSystemPromptChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setChatSettings({
      ...chatSettings,
      systemPrompt: e.target.value
    })
  }

  /**
   * Handle global system prompt change
   * Standard-Anweisung die für alle neuen Chats verwendet wird
   */
  const handleGlobalSystemPromptChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setGlobalSettings({
      ...globalSettings,
      globalSystemPrompt: e.target.value
    })
  }

  return (
    <div className="app-container">
      {/* ===== MOBILE MENU TOGGLE ===== */}
      {/* Hamburger-Menü für Mobile: Zeigt/Versteckt die Sidebar */}
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* ===== SIDEBAR ===== */}
      {/* 
        Linke Seitenleiste mit Navigation
        - Neuer Chat Button
        - Liste der bisherigen Konversationen
        - Links zu Einstellungen und Hilfe
      */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span className="icon">💬</span> {t('newChat')}
          </button>
        </div>

        <div className="conversations">
          <h3 className="conversations-title">{t('chats')}</h3>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-item active"
              onClick={() => setSidebarOpen(false)}
            >
              {conv.title}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            className="sidebar-btn"
            onClick={() => setGlobalSettingsOpen(true)}
            aria-label="Global settings"
          >
            ⚙️ {t('settings')}
          </button>
          <button className="sidebar-btn" aria-label="Help">
            ❓ {t('help')}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      {/* 
        Hauptbereich der Anwendung mit:
        - Header mit Titel und Einstellungsbutton
        - Nachrichtenbereich (Chat-Verlauf)
        - Input-Bereich für neue Nachrichten
        - Settings-Panels (werden über Overlay angezeigt)
      */}
      <main className="chat-container">
        {/* ===== HEADER ===== */}
        {/* Kopfzeile mit Anwendungstitel und Chat-Einstellungs-Button */}
        <header className="chat-header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="app-title">🤖 {t('title')}</h1>
              <button
                className="settings-btn"
                onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                title={t('chatSettings')}
                aria-label="Chat settings"
              >
                ⚙️
              </button>
            </div>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
        </header>

        {/* ===== MESSAGES AREA ===== */}
        {/* 
          Zeigt den gesamten Chat-Verlauf an
          - Jede Nachricht wird mit Avatar und Text angezeigt
          - User-Nachrichten sind rechts, AI-Nachrichten sind links
        */}
        <div className="messages-area">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                {message.sender === 'ai' && <span className="avatar">🤖</span>}
                <div className="message-text">{message.text}</div>
                {message.sender === 'user' && <span className="avatar">👤</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ===== OVERLAY LAYERS ===== */}
        {/* 
          Halbdurchsichtige Overlay-Layer hinter den Settings-Panels
          Dient als visueller Hintergrund und zum Schließen beim Klick
        */}
        {settingsPanelOpen && (
          <div
            className="settings-overlay"
            onClick={() => setSettingsPanelOpen(false)}
            aria-hidden="true"
          />
        )}

        {globalSettingsOpen && (
          <div
            className="settings-overlay"
            onClick={() => setGlobalSettingsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ===== CHAT SETTINGS PANEL ===== */}
        {/* 
          Floating Panel auf der rechten Seite für Chat-spezifische Einstellungen:
          - Temperature Slider: Kreativität der AI (0=präzise, 1=kreativ)
          - Model Selector: Welches KI-Modell verwenden
          - Writing Style Buttons: Tonalität der Antworten
          - System Prompt: Custom Anweisung für diese Konversation
        */}
        <div className={`settings-panel ${settingsPanelOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h2 className="settings-title">{t('chatSettings')}</h2>
            <button
              className="settings-close"
              onClick={() => setSettingsPanelOpen(false)}
              aria-label="Close chat settings"
            >
              ✕
            </button>
          </div>

          <div className="settings-content">
            {/* Temperature Slider */}
            <div className="setting-item">
              <div className="setting-label-container">
                <label className="setting-label">🎚️ {t('temperature')}</label>
                <span className="setting-value">{chatSettings.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={chatSettings.temperature}
                onChange={handleTemperatureChange}
                className="slider"
                aria-label="Temperature"
              />
              <p className="setting-hint">
                0 = {t('precise')}, 1 = {t('creative')}
              </p>
            </div>

            {/* Model Selection */}
            <div className="setting-item">
              <label className="setting-label">🤖 {t('model')}</label>
              <select
                value={chatSettings.model}
                onChange={handleModelChange}
                className="setting-select"
                aria-label="AI Model"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5">GPT-3.5 Turbo</option>
                <option value="claude">Claude</option>
                <option value="local">{t('model')} lokal</option>
              </select>
            </div>

            {/* Writing Style */}
            <div className="setting-item">
              <label className="setting-label">✍️ {t('writingStyle')}</label>
              <div className="setting-buttons">
                {[
                  { key: 'formal', label: t('formal') },
                  { key: 'normal', label: t('normal') },
                  { key: 'locker', label: t('casual') },
                  { key: 'technisch', label: t('technical') }
                ].map((style) => (
                  <button
                    key={style.key}
                    className={`style-btn ${chatSettings.writingStyle === style.key ? 'active' : ''}`}
                    onClick={() => handleWritingStyleChange(style.key)}
                    aria-pressed={chatSettings.writingStyle === style.key}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div className="setting-item">
              <label className="setting-label">📝 {t('systemPrompt')}</label>
              <textarea
                value={chatSettings.systemPrompt}
                onChange={handleSystemPromptChange}
                placeholder={t('systemPromptPlaceholder')}
                className="setting-textarea"
                aria-label="Chat system prompt"
              />
            </div>
          </div>
        </div>

        {/* ===== GLOBAL SETTINGS PANEL ===== */}
        {/* 
          Floating Panel für globale Anwendungseinstellungen:
          - Language Selector: Sprache der UI wechseln
          - Theme Selector: Design-Theme wechseln
          - Global System Prompt: Standard-Anweisung für alle neuen Chats
        */}
        <div className={`settings-panel ${globalSettingsOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h2 className="settings-title">{t('globalSettings')}</h2>
            <button
              className="settings-close"
              onClick={() => setGlobalSettingsOpen(false)}
              aria-label="Close global settings"
            >
              ✕
            </button>
          </div>

          <div className="settings-content">
            {/* Language Selection */}
            <div className="setting-item">
              <label className="setting-label">🌍 {t('language')}</label>
              <div className="language-grid">
                {Object.keys(translations).map((lang) => (
                  <button
                    key={lang}
                    className={`language-btn ${globalSettings.language === lang ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                    aria-pressed={globalSettings.language === lang}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div className="setting-item">
              <label className="setting-label">🎨 {t('theme')}</label>
              <div className="theme-grid">
                {Object.entries(themes).map(([themeKey, themeData]) => (
                  <button
                    key={themeKey}
                    className={`theme-btn ${globalSettings.theme === themeKey ? 'active' : ''}`}
                    onClick={() => handleThemeChange(themeKey)}
                    title={themeData.name}
                    aria-pressed={globalSettings.theme === themeKey}
                  >
                    <span
                      className="theme-preview"
                      style={{ backgroundColor: themeData.primaryColor }}
                    ></span>
                    {themeData.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Global System Prompt */}
            <div className="setting-item">
              <label className="setting-label">📝 {t('globalSystemPrompt')}</label>
              <textarea
                value={globalSettings.globalSystemPrompt}
                onChange={handleGlobalSystemPromptChange}
                placeholder={t('globalSystemPromptPlaceholder')}
                className="setting-textarea"
                aria-label="Global system prompt"
              />
              <p className="setting-hint">Wird als Standard für alle neuen Chats verwendet</p>
            </div>
          </div>
        </div>

        {/* ===== INPUT AREA ===== */}
        {/* 
          Unterer Bereich mit:
          - Textarea für Nachrichteneingabe
          - Send-Button (mit Pfeil ➤)
          - Disclaimer/Disclaimer-Text
        */}
        <div className="input-area">
          <div className="input-container">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              className="message-input"
              aria-label="Message input"
            />
            <button
              onClick={handleSendMessage}
              className="send-btn"
              aria-label="Send message"
              disabled={!isMessageValid(input)}
            >
              ➤
            </button>
          </div>
          <p className="input-hint">{t('disclaimer')}</p>
        </div>
      </main>
    </div>
  )
}

export default App
