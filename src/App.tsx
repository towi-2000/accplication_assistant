/**
 * App.tsx - Hauptkomponente des Bewerbungs-Assistenten
 * 
 * Diese Komponente ist das Herzstück der Anwendung und verwaltet:
 * - Die Job-Such-Konversationen
 * - Globale Einstellungen (Sprache, Theme, Job-Suchkriterien)
 * - Job-spezifische Einstellungen (Kreativität bei Vorschlägen, Modell, Ton, Recruiter-Anleitung)
 * - Die Benutzeroberfläche (Sidebar, Header, Messages, Settings-Panels)
 * 
 * Struktur:
 * - Sidebar: Navigation und Jobsuche-Historie
 * - Chat-Container: Hauptbereich mit Konversationen und Eingabefeld
 * - Settings-Panels: Floating Panels für Job-Such-Einstellungen und globale Einstellungen
 */

import React, { useState, ChangeEvent, KeyboardEvent } from 'react'
import './App.css'
import data from './data.json'
import type {
  Message,
  Conversation,
  GlobalSettings,
  ChatSettings,
  DataFile,
  WebPageRecord,
  CrawlResultItem,
  WebPreviewItem
} from './type'
import {
  getTranslation,
  applyThemeToDocument,
  isMessageValid,
  parseUrlList,
  limitUrls,
  crawlUrls,
  searchPages,
  previewUrls,
  getNextConversationId,
  filterConversations,
  updateConversationTitle,
  buildSelectionMap,
  savePage,
  filterWebResults
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
  // messages: Alle Nachrichten in der aktuellen Jobsuche (User-Fragen + Assistenten-Antworten)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hallo! Ich helfe dir bei der Jobsuche, Bewerbungserstellung und Unternehmensforschung. Beschreib dein Profil, dann kann ich dir passende Stellen finden und Bewerbungen optimieren. Los geht\'s! 🚀', sender: 'ai' }
  ])
  // input: Aktuell eingegebener Text im Eingabefeld
  const [input, setInput] = useState<string>('')
  // conversations: Liste aller bisherigen Konversationen in der Sidebar
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, title: 'Data Scientist Jobsuche' }
  ])
  const [activeConversationId, setActiveConversationId] = useState<number>(1)
  const [conversationSearch, setConversationSearch] = useState<string>('')
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null)
  const [editingConversationTitle, setEditingConversationTitle] = useState<string>('')
  // systemPromptApplied: Flag ob der globale Anfangsprompt bereits zur AI gesendet wurde
  const [systemPromptApplied, setSystemPromptApplied] = useState<boolean>(false)

  // ========== WEB PAGE DB STATE ==========
  const [urlInput, setUrlInput] = useState<string>('')
  const [crawlResults, setCrawlResults] = useState<CrawlResultItem[]>([])
  const [crawlBusy, setCrawlBusy] = useState<boolean>(false)
  const [crawlError, setCrawlError] = useState<string>('')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<WebPageRecord[]>([])
  const [searchBusy, setSearchBusy] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string>('')
  const [dbResultsQuery, setDbResultsQuery] = useState<string>('')
  const [previewResults, setPreviewResults] = useState<WebPreviewItem[]>([])
  const [previewSelected, setPreviewSelected] = useState<Record<string, boolean>>({})
  const [previewBusy, setPreviewBusy] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string>('')
  const [saveBusy, setSaveBusy] = useState<boolean>(false)
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })

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
    globalSystemPrompt: 'Ich suche eine Stelle im Bereich Tech/Data Science in Deutschland, mit Fokus auf innovative Unternehmen.'
  })
  // chatSettings: Einstellungen die nur für die aktuelle Jobsuche gelten
  // - temperature: Wie präzise vs. kreativ die Vorschläge sein sollen (0=präzise, 1=kreativ)
  // - model: Welches KI-Modell verwendet werden soll
  // - writingStyle: Ton der Bewerbungsschreiben (Professionell, Standard, Enthusiastisch, Technisch)
  // - systemPrompt: Recruiter-Anleitung für diese Jobsuche
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    temperature: 0.5,
    model: 'gpt-4',
    writingStyle: 'formal',
    systemPrompt: 'Ich bin ein erfahrener Recruiter und Karriereberater. Ich helfe bei der Jobsuche, Bewerbungserstellung und Unternehmensrecherche.'
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
    const nextId = getNextConversationId(conversations)
    const nextConversation: Conversation = {
      id: nextId,
      title: `Neue Konversation ${nextId}`
    }
    setConversations((prev) => [...prev, nextConversation])
    setActiveConversationId(nextId)
    setMessages([
      { id: 1, text: 'Hallo! Neue Jobsuche gestartet. Was für eine Position interessiert dich? 📋', sender: 'ai' }
    ])
    setSystemPromptApplied(false)
    setSidebarOpen(false)
  }

  const handleStartEditConversation = (conv: Conversation): void => {
    setEditingConversationId(conv.id)
    setEditingConversationTitle(conv.title)
  }

  const handleCommitConversationTitle = (): void => {
    if (editingConversationId === null) {
      return
    }
    setConversations((prev) => updateConversationTitle(prev, editingConversationId, editingConversationTitle))
    setEditingConversationId(null)
    setEditingConversationTitle('')
  }

  const handleCancelConversationEdit = (): void => {
    setEditingConversationId(null)
    setEditingConversationTitle('')
  }

  const handleDeleteConversation = (id: number): void => {
    setConversations((prev) => {
      const next = prev.filter(conv => conv.id !== id)

      if (id === activeConversationId) {
        if (next.length > 0) {
          setActiveConversationId(next[0].id)
          setMessages([
            { id: 1, text: 'Hallo! Neue Jobsuche gestartet. Was fuer eine Position interessiert dich? 📋', sender: 'ai' }
          ])
          setSystemPromptApplied(false)
        } else {
          const newId = getNextConversationId(prev)
          const newConversation: Conversation = {
            id: newId,
            title: `Neue Konversation ${newId}`
          }
          setActiveConversationId(newId)
          setMessages([
            { id: 1, text: 'Hallo! Neue Jobsuche gestartet. Was fuer eine Position interessiert dich? 📋', sender: 'ai' }
          ])
          setSystemPromptApplied(false)
          return [newConversation]
        }
      }

      return next
    })
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
          text: 'Basierend auf deinem Profil habe ich einige passende Stellen gefunden. Die wichtigsten Anforderungen sind meist: 5+ Jahre Erfahrung, Python/SQL-Kenntnisse, und Interesse an ML. Möchtest du Hilfe bei der Bewerbung?',
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

  const handleCrawl = async (): Promise<void> => {
    const urls = parseUrlList(urlInput)
    if (urls.length === 0) {
      setCrawlError('Bitte mindestens eine URL eingeben.')
      return
    }
    if (urls.length > 1000) {
      setCrawlError('Bitte maximal 1000 URLs eingeben.')
      return
    }

    setCrawlBusy(true)
    setCrawlError('')
    try {
      const response = await crawlUrls(limitUrls(urls, 1000), activeConversationId)
      setCrawlResults(response.items)
    } catch (error) {
      setCrawlError('Crawl fehlgeschlagen. Bitte Server pruefen.')
    } finally {
      setCrawlBusy(false)
    }
  }

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) {
      setSearchError('Bitte einen Suchbegriff eingeben.')
      return
    }

    setSearchBusy(true)
    setSearchError('')
    setPreviewError('')
    setPreviewResults([])
    setPreviewSelected({})
    try {
      const response = await searchPages(searchQuery.trim(), activeConversationId, 1000, 0)
      setSearchResults(response.items)
      setDbResultsQuery('')

      if (response.items.length === 0) {
        const urls = parseUrlList(urlInput)
        if (urls.length === 0) {
          setSearchError('Keine Treffer in der Datenbank. Bitte URLs angeben.')
          return
        }
        if (urls.length > 1000) {
          setSearchError('Bitte maximal 1000 URLs eingeben.')
          return
        }

        setPreviewBusy(true)
        const preview = await previewUrls(limitUrls(urls, 1000), searchQuery.trim())
        setPreviewResults(preview.items)
        setPreviewSelected(buildSelectionMap(preview.items))
      }
    } catch (error) {
      setSearchError('Suche fehlgeschlagen. Bitte Server pruefen.')
    } finally {
      setSearchBusy(false)
      setPreviewBusy(false)
    }
  }

  const handleTogglePreview = (url: string): void => {
    setPreviewSelected((prev) => ({
      ...prev,
      [url]: !prev[url]
    }))
  }

  const handleSelectAllPreview = (value: boolean): void => {
    setPreviewSelected((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        next[key] = value
      })
      return next
    })
  }

  const handleSaveSelected = async (): Promise<void> => {
    const toSave = previewResults.filter((item) => previewSelected[item.url])
    if (toSave.length === 0) {
      setPreviewError('Bitte mindestens eine URL auswaehlen.')
      return
    }

    setSaveBusy(true)
    setSaveProgress({ current: 0, total: toSave.length })
    setPreviewError('')
    try {
      let saved = 0
      for (const item of toSave) {
        await savePage(item.url, item.content, activeConversationId, item.title || undefined)
        saved += 1
        setSaveProgress({ current: saved, total: toSave.length })
      }

      const refreshed = await searchPages(searchQuery.trim(), activeConversationId, 20, 0)
      setSearchResults(refreshed.items)
      setDbResultsQuery('')
      setPreviewResults([])
      setPreviewSelected({})
    } catch (error) {
      setPreviewError('Speichern fehlgeschlagen. Bitte Server pruefen.')
    } finally {
      setSaveBusy(false)
    }
  }

  const filteredDbResults = filterWebResults(searchResults, dbResultsQuery)
  const showProgress = searchBusy || previewBusy || crawlBusy || saveBusy
  const progressLabel = searchBusy
    ? 'Suche in Datenbank...'
    : previewBusy
      ? 'Pruefe Web-URLs...'
      : crawlBusy
        ? 'Speichere URLs...'
        : saveBusy
          ? 'Speichere Auswahl...'
          : ''
  const savePercent = saveProgress.total > 0
    ? Math.round((saveProgress.current / saveProgress.total) * 100)
    : 0

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
          <input
            type="text"
            className="conversation-search"
            placeholder="Chat suchen"
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            aria-label="Search chats"
          />
          {filterConversations(conversations, conversationSearch).map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
              onClick={() => {
                setActiveConversationId(conv.id)
                setSidebarOpen(false)
              }}
            >
              <span className="conversation-title">{conv.title}</span>
              <button
                className="conversation-delete"
                onClick={(event) => {
                  event.stopPropagation()
                  handleDeleteConversation(conv.id)
                }}
                aria-label="Delete chat"
              >
                ✕
              </button>
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
          Floating Panel auf der rechten Seite für Jobsuche-spezifische Einstellungen:
          - Temperature Slider: Wie präzise vs. kreativ die Vorschläge sein sollen
          - Model Selector: Welches KI-Modell verwenden
          - Writing Style Buttons: Ton der Bewerbungsschreiben (Professionell, Standard, Enthusiastisch, Technisch)
          - System Prompt: Wie die KI sich selbst in diesem Chat vorstellen sollte
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
              <label className="setting-label">🎯 {t('globalSystemPrompt')}</label>
              <textarea
                value={globalSettings.globalSystemPrompt}
                onChange={handleGlobalSystemPromptChange}
                placeholder={t('globalSystemPromptPlaceholder')}
                className="setting-textarea"
                aria-label="Job search profile"
              />
              <p className="setting-hint">Beschreibe deine Jobsuche-Kriterien und Karriereziele</p>
            </div>
          </div>
        </div>

        {/* ===== WEB PAGE DATABASE ===== */}
        <section className="webdb-panel">
          <div className="webdb-section">
            <h3 className="webdb-title">Webseiten speichern</h3>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Eine URL pro Zeile"
              className="webdb-textarea"
              aria-label="URL list"
            />
            <button
              className="webdb-action"
              onClick={handleCrawl}
              disabled={crawlBusy}
            >
              {crawlBusy ? 'Crawle...' : 'Crawl & speichern'}
            </button>
            {crawlError && <p className="webdb-error">{crawlError}</p>}
            {crawlResults.length > 0 && (
              <div className="webdb-results">
                {crawlResults.map((result) => (
                  <div key={`${result.url}-${result.status}`} className={`webdb-result ${result.status}`}>
                    <span className="webdb-result-url">{result.url}</span>
                    <span className="webdb-result-status">{result.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="webdb-section">
            <h3 className="webdb-title">Suche</h3>
            <div className="webdb-row">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchbegriff"
                className="webdb-input"
                aria-label="Search query"
              />
              <button
                className="webdb-action"
                onClick={handleSearch}
                disabled={searchBusy}
              >
                {searchBusy ? 'Suche...' : 'Suche'}
              </button>
            </div>
            {searchError && <p className="webdb-error">{searchError}</p>}
            {showProgress && (
              <div className="webdb-progress">
                <div className={`webdb-progress-bar ${saveBusy ? 'determinate' : 'indeterminate'}`}>
                  {saveBusy && (
                    <span className="webdb-progress-fill" style={{ width: `${savePercent}%` }}></span>
                  )}
                </div>
                <span className="webdb-progress-label">{progressLabel}</span>
                {saveBusy && (
                  <span className="webdb-progress-count">
                    {saveProgress.current}/{saveProgress.total}
                  </span>
                )}
              </div>
            )}
            <div className="webdb-results">
              {searchResults.length === 0 && !searchBusy && (
                <span className="webdb-empty">Keine Treffer in der Datenbank</span>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="webdb-db">
                <div className="webdb-db-search">
                  <input
                    type="text"
                    className="webdb-input"
                    placeholder="Treffer filtern"
                    value={dbResultsQuery}
                    onChange={(event) => setDbResultsQuery(event.target.value)}
                    aria-label="Filter database results"
                  />
                </div>
                <div className="webdb-results-db">
                  {filteredDbResults.map((item, index) => (
                    <div key={item.id} className="webdb-result-row">
                      <span className="webdb-result-index">{index + 1}</span>
                      <div className="webdb-result-content">
                        <span className="webdb-result-url">{item.url}</span>
                        <span className="webdb-result-title">{item.title || 'Ohne Titel'}</span>
                        <span className="webdb-result-snippet">
                          {item.content.slice(0, 160)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {previewError && <p className="webdb-error">{previewError}</p>}
            {previewResults.length > 0 && (
              <div className="webdb-preview">
                <div className="webdb-preview-header">
                  <span>Web-Treffer</span>
                  <div className="webdb-preview-actions">
                    <button className="webdb-link" onClick={() => handleSelectAllPreview(true)}>
                      Alle auswaehlen
                    </button>
                    <button className="webdb-link" onClick={() => handleSelectAllPreview(false)}>
                      Keine
                    </button>
                  </div>
                </div>
                <div className="webdb-preview-list">
                  {previewResults.map((item) => (
                    <label key={item.url} className="webdb-preview-item">
                      <input
                        type="checkbox"
                        checked={Boolean(previewSelected[item.url])}
                        onChange={() => handleTogglePreview(item.url)}
                      />
                      <div className="webdb-preview-content">
                        <span className="webdb-result-url">{item.url}</span>
                        <span className="webdb-result-title">{item.title || 'Ohne Titel'}</span>
                        <span className="webdb-result-snippet">
                          {item.content.slice(0, 120)}...
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  className="webdb-action"
                  onClick={handleSaveSelected}
                  disabled={saveBusy}
                >
                  {saveBusy ? 'Speichere...' : 'Ausgewaehlte speichern'}
                </button>
              </div>
            )}
          </div>
        </section>

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
