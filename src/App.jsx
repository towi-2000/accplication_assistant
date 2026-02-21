import { useState } from 'react'
import './App.css'
import data from './data.json'
import {
  getTranslation,
  getTheme,
  applyThemeToDocument,
  processChatMessage,
  isMessageValid,
  getAvailableThemes,
  createMessage
} from './Functions'

const { themes } = data

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Neue Konversation' }
  ])
  const [systemPromptApplied, setSystemPromptApplied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false)
  const [globalSettings, setGlobalSettings] = useState({
    language: 'de',
    theme: 'dark',
    globalSystemPrompt: ''
  })
  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    model: 'gpt-4',
    writingStyle: 'normal',
    systemPrompt: ''
  })

  // Hilfsfunktion für Übersetzungen
  const t = (key) => {
    return getTranslation(key, globalSettings.language)
  }

  const handleThemeChange = (themeName) => {
    setGlobalSettings({...globalSettings, theme: themeName})
    applyThemeToDocument(themeName)
  }

  const handleLanguageChange = (lang) => {
    setGlobalSettings({...globalSettings, language: lang})
  }

  // Anfangsprompt beim Start anwenden
  // TODO: In echtem Backend mit API-Call ersetzen
  // const applySystemPrompt = () => {
  //   if (globalSettings.globalSystemPrompt && !systemPromptApplied) {
  //     // Hier würde der globale Anfangsprompt an das Modell gesendet
  //     // z.B. als System Message in einem Chat Completion API Call
  //     setSystemPromptApplied(true)
  //   }
  // }

  const handleNewChat = () => {
    setMessages([
      { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' },
    ])
    setSystemPromptApplied(false)
    setSidebarOpen(false)
  }

  const handleSendMessage = () => {
    if (isMessageValid(input)) {
      // Anfangsprompt beim ersten Senden anwenden (falls vorhanden)
      if (globalSettings.globalSystemPrompt && !systemPromptApplied) {
        // TODO: Hier würde der globale Anfangsprompt an das Modell gesendet
        // z.B. als System Message beim ersten API-Call nach dem Chat-Start
        // sendToAI(globalSettings.globalSystemPrompt)
        setSystemPromptApplied(true)
      }

      const newMessage = { 
        id: messages.length + 1, 
        text: input, 
        sender: 'user' 
      }
      setMessages([...messages, newMessage])
      
      // Simulierte AI-Antwort
      // TODO: Der echte API-Call würde den globalSystemPrompt + chatSettings.systemPrompt
      // als Systeminstruktionen mitgeben
      setTimeout(() => {
        const aiResponse = { 
          id: messages.length + 2, 
          text: 'Das ist eine tolle Frage! Ich bin hier um dir zu helfen...', 
          sender: 'ai' 
        }
        setMessages(prev => [...prev, aiResponse])
      }, 500)
      
      setInput('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle */}
      <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span className="icon">💬</span> {t('newChat')}
          </button>
        </div>
        
        <div className="conversations">
          <h3 className="conversations-title">{t('chats')}</h3>
          {conversations.map(conv => (
            <div key={conv.id} className="conversation-item active" onClick={() => setSidebarOpen(false)}>
              {conv.title}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button 
            className="sidebar-btn"
            onClick={() => setGlobalSettingsOpen(true)}
          >
            ⚙️ {t('settings')}
          </button>
          <button className="sidebar-btn">❓ {t('help')}</button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="app-title">🤖 {t('title')}</h1>
              <button 
                className="settings-btn"
                onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                title={t('chatSettings')}
              >
                ⚙️
              </button>
            </div>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
        </header>

        {/* Messages Area */}
        <div className="messages-area">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                {message.sender === 'ai' && <span className="avatar">🤖</span>}
                <div className="message-text">{message.text}</div>
                {message.sender === 'user' && <span className="avatar">👤</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Settings Panel Overlay */}
        {settingsPanelOpen && (
          <div className="settings-overlay" onClick={() => setSettingsPanelOpen(false)} />
        )}

        {/* Global Settings Overlay */}
        {globalSettingsOpen && (
          <div className="settings-overlay" onClick={() => setGlobalSettingsOpen(false)} />
        )}

        {/* Settings Panel */}
        <div className={`settings-panel ${settingsPanelOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h2 className="settings-title">{t('chatSettings')}</h2>
            <button 
              className="settings-close"
              onClick={() => setSettingsPanelOpen(false)}
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
                onChange={(e) => setChatSettings({...chatSettings, temperature: parseFloat(e.target.value)})}
                className="slider"
              />
              <p className="setting-hint">0 = {t('precise')}, 1 = {t('creative')}</p>
            </div>

            {/* Model Selection */}
            <div className="setting-item">
              <label className="setting-label">🤖 {t('model')}</label>
              <select 
                value={chatSettings.model}
                onChange={(e) => setChatSettings({...chatSettings, model: e.target.value})}
                className="setting-select"
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
                ].map(style => (
                  <button
                    key={style.key}
                    className={`style-btn ${chatSettings.writingStyle === style.key ? 'active' : ''}`}
                    onClick={() => setChatSettings({...chatSettings, writingStyle: style.key})}
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
                onChange={(e) => setChatSettings({...chatSettings, systemPrompt: e.target.value})}
                placeholder={t('systemPromptPlaceholder')}
                className="setting-textarea"
              />
            </div>
          </div>
        </div>

        {/* Global Settings Panel */}
        <div className={`settings-panel ${globalSettingsOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h2 className="settings-title">{t('globalSettings')}</h2>
            <button 
              className="settings-close"
              onClick={() => setGlobalSettingsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="settings-content">
            {/* Language Selection */}
            <div className="setting-item">
              <label className="setting-label">🌍 {t('language')}</label>
              <div className="language-grid">
                {Object.entries(translations).map(([lang, _]) => (
                  <button
                    key={lang}
                    className={`language-btn ${globalSettings.language === lang ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
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
                  >
                    <span className="theme-preview" style={{backgroundColor: themeData.primaryColor}}></span>
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
                onChange={(e) => setGlobalSettings({...globalSettings, globalSystemPrompt: e.target.value})}
                placeholder={t('globalSystemPromptPlaceholder')}
                className="setting-textarea"
              />
              <p className="setting-hint">Wird als Standard für alle neuen Chats verwendet</p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              className="message-input"
            />
            <button 
              onClick={handleSendMessage}
              className="send-btn"
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