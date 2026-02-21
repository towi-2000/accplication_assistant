import { useState } from 'react'
import './App.css'

// Übersetzungen für alle unterstützten Sprachen
const translations = {
  de: {
    title: 'AI Assistant',
    subtitle: 'Dein intelligenter Helfer',
    newChat: 'Neuer Chat',
    chats: 'Chats',
    settings: 'Einstellungen',
    help: 'Hilfe',
    chatSettings: 'Chat-Einstellungen',
    temperature: 'Temperatur',
    precise: 'Präzise',
    creative: 'Kreativ',
    model: 'Modell',
    writingStyle: 'Schreibstil',
    formal: 'Formal',
    normal: 'Normal',
    casual: 'Locker',
    technical: 'Technisch',
    systemPrompt: 'System-Prompt',
    systemPromptPlaceholder: 'Definiere die Rolle und Persönlichkeit der KI...',
    inputPlaceholder: 'Schreib eine Nachricht... (Shift + Enter für neue Zeile)',
    disclaimer: 'Die KI kann Fehler machen. Überprüfe wichtige Informationen.',
    globalSettings: 'Globale Einstellungen',
    language: 'Sprache',
    theme: 'Design',
    globalSystemPrompt: 'Globaler Anfangsprompt',
    globalSystemPromptPlaceholder: 'Standard-Rolle für alle neuen Chats...'
  },
  en: {
    title: 'AI Assistant',
    subtitle: 'Your intelligent helper',
    newChat: 'New Chat',
    chats: 'Chats',
    settings: 'Settings',
    help: 'Help',
    chatSettings: 'Chat Settings',
    temperature: 'Temperature',
    precise: 'Precise',
    creative: 'Creative',
    model: 'Model',
    writingStyle: 'Writing Style',
    formal: 'Formal',
    normal: 'Normal',
    casual: 'Casual',
    technical: 'Technical',
    systemPrompt: 'System Prompt',
    systemPromptPlaceholder: 'Define the role and personality of the AI...',
    inputPlaceholder: 'Write a message... (Shift + Enter for new line)',
    disclaimer: 'AI can make mistakes. Verify important information.',
    globalSettings: 'Global Settings',
    language: 'Language',
    theme: 'Theme',
    globalSystemPrompt: 'Global Initial Prompt',
    globalSystemPromptPlaceholder: 'Default role for all new chats...'
  },
  fr: {
    title: 'Assistant IA',
    subtitle: 'Votre assistant intelligent',
    newChat: 'Nouveau Chat',
    chats: 'Chats',
    settings: 'Paramètres',
    help: 'Aide',
    chatSettings: 'Paramètres du Chat',
    temperature: 'Température',
    precise: 'Précis',
    creative: 'Créatif',
    model: 'Modèle',
    writingStyle: 'Style d\'Écriture',
    formal: 'Formel',
    normal: 'Normal',
    casual: 'Décontracté',
    technical: 'Technique',
    systemPrompt: 'Invite Système',
    systemPromptPlaceholder: 'Définir le rôle et la personnalité de l\'IA...',
    inputPlaceholder: 'Écrivez un message... (Maj + Entrée pour nouvelle ligne)',
    disclaimer: 'L\'IA peut faire des erreurs. Vérifiez les informations importantes.',
    globalSettings: 'Paramètres Globaux',
    language: 'Langue',
    theme: 'Thème',
    globalSystemPrompt: 'Invite Initiale Globale',
    globalSystemPromptPlaceholder: 'Rôle par défaut pour tous les nouveaux chats...'
  },
  es: {
    title: 'Asistente IA',
    subtitle: 'Tu asistente inteligente',
    newChat: 'Nuevo Chat',
    chats: 'Chats',
    settings: 'Configuración',
    help: 'Ayuda',
    chatSettings: 'Configuración del Chat',
    temperature: 'Temperatura',
    precise: 'Preciso',
    creative: 'Creativo',
    model: 'Modelo',
    writingStyle: 'Estilo de Escritura',
    formal: 'Formal',
    normal: 'Normal',
    casual: 'Casual',
    technical: 'Técnico',
    systemPrompt: 'Indicación del Sistema',
    systemPromptPlaceholder: 'Define el rol y la personalidad de la IA...',
    inputPlaceholder: 'Escribe un mensaje... (Mayús + Intro para nueva línea)',
    disclaimer: 'La IA puede cometer errores. Verifica información importante.',
    globalSettings: 'Configuración Global',
    language: 'Idioma',
    theme: 'Tema',
    globalSystemPrompt: 'Indicación Inicial Global',
    globalSystemPromptPlaceholder: 'Rol predeterminado para todos los chats nuevos...'
  },
  it: {
    title: 'Assistente IA',
    subtitle: 'Il tuo assistente intelligente',
    newChat: 'Nuova Chat',
    chats: 'Chat',
    settings: 'Impostazioni',
    help: 'Aiuto',
    chatSettings: 'Impostazioni Chat',
    temperature: 'Temperatura',
    precise: 'Preciso',
    creative: 'Creativo',
    model: 'Modello',
    writingStyle: 'Stile di Scrittura',
    formal: 'Formale',
    normal: 'Normale',
    casual: 'Casual',
    technical: 'Tecnico',
    systemPrompt: 'Prompt di Sistema',
    systemPromptPlaceholder: 'Definisci il ruolo e la personalità dell\'IA...',
    inputPlaceholder: 'Scrivi un messaggio... (Maiusc + Invio per nuova riga)',
    disclaimer: 'L\'IA può fare errori. Verifica le informazioni importanti.',
    globalSettings: 'Impostazioni Globali',
    language: 'Lingua',
    theme: 'Tema',
    globalSystemPrompt: 'Prompt Iniziale Globale',
    globalSystemPromptPlaceholder: 'Ruolo predefinito per tutte le nuove chat...'
  }
}

// Design-Themes
const themes = {
  light: {
    name: 'Hell',
    '--primary-color': '#10a37f',
    '--dark-bg': '#ffffff',
    '--sidebar-bg': '#f5f5f5',
    '--text-color': '#333'
  },
  dark: {
    name: 'Dunkel',
    '--primary-color': '#10a37f',
    '--dark-bg': '#1a1a1a',
    '--sidebar-bg': '#0d0d0d',
    '--text-color': '#ececec'
  },
  ocean: {
    name: 'Ozean',
    '--primary-color': '#0066cc',
    '--dark-bg': '#1a2332',
    '--sidebar-bg': '#0f1419',
    '--text-color': '#e0e0e0'
  },
  forest: {
    name: 'Wald',
    '--primary-color': '#2d7a3a',
    '--dark-bg': '#1b2d1f',
    '--sidebar-bg': '#0f1612',
    '--text-color': '#e8f0eb'
  },
  sunset: {
    name: 'Sonnenuntergang',
    '--primary-color': '#d97706',
    '--dark-bg': '#2d1f0f',
    '--sidebar-bg': '#1a1208',
    '--text-color': '#f5e8d8'
  }
}

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Neue Konversation' }
  ])
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
    return translations[globalSettings.language]?.[key] || translations['de'][key] || key
  }

  // Theme anwenden
  const applyTheme = (themeName) => {
    const theme = themes[themeName]
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name') {
        document.documentElement.style.setProperty(key, value)
      }
    })
  }

  const handleThemeChange = (themeName) => {
    setGlobalSettings({...globalSettings, theme: themeName})
    applyTheme(themeName)
  }

  const handleLanguageChange = (lang) => {
    setGlobalSettings({...globalSettings, language: lang})
  }

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage = { 
        id: messages.length + 1, 
        text: input, 
        sender: 'user' 
      }
      setMessages([...messages, newMessage])
      
      // Simulierte AI-Antwort
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
          <button className="new-chat-btn">
            <span className="icon">💬</span> Neuer Chat
          </button>
        </div>
        
        <div className="conversations">
          <h3 className="conversations-title">Chats</h3>
          {conversations.map(conv => (
            <div key={conv.id} className="conversation-item active" onClick={() => setSidebarOpen(false)}>
              {conv.title}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-btn">⚙️ Einstellungen</button>
          <button className="sidebar-btn">❓ Hilfe</button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="app-title">🤖 AI Assistant</h1>
              <button 
                className="settings-btn"
                onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                title="Chat-Einstellungen"
              >
                ⚙️
              </button>
            </div>
            <p className="app-subtitle">Dein intelligenter Helfer</p>
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

        {/* Settings Panel */}
        <div className={`settings-panel ${settingsPanelOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h2 className="settings-title">Chat-Einstellungen</h2>
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
                <label className="setting-label">🎚️ Temperatur</label>
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
              <p className="setting-hint">0 = Präzise, 1 = Kreativ</p>
            </div>

            {/* Model Selection */}
            <div className="setting-item">
              <label className="setting-label">🤖 Modell</label>
              <select 
                value={chatSettings.model}
                onChange={(e) => setChatSettings({...chatSettings, model: e.target.value})}
                className="setting-select"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5">GPT-3.5 Turbo</option>
                <option value="claude">Claude</option>
                <option value="local">Lokales Modell</option>
              </select>
            </div>

            {/* Writing Style */}
            <div className="setting-item">
              <label className="setting-label">✍️ Schreibstil</label>
              <div className="setting-buttons">
                {['formal', 'normal', 'locker', 'technisch'].map(style => (
                  <button
                    key={style}
                    className={`style-btn ${chatSettings.writingStyle === style ? 'active' : ''}`}
                    onClick={() => setChatSettings({...chatSettings, writingStyle: style})}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div className="setting-item">
              <label className="setting-label">📝 System-Prompt</label>
              <textarea 
                value={chatSettings.systemPrompt}
                onChange={(e) => setChatSettings({...chatSettings, systemPrompt: e.target.value})}
                placeholder="Definiere die Rolle und Persönlichkeit der KI..."
                className="setting-textarea"
              />
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
              placeholder="Schreib eine Nachricht... (Shift + Enter für neue Zeile)"
              className="message-input"
            />
            <button 
              onClick={handleSendMessage}
              className="send-btn"
            >
              ➤
            </button>
          </div>
          <p className="input-hint">Die KI kann Fehler machen. Überprüfe wichtige Informationen.</p>
        </div>
      </main>
    </div>
  )
}

export default App