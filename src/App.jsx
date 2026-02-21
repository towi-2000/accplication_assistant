import { useState } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hallo! Wie kann ich dir heute helfen?', sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Neue Konversation' }
  ])

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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn">
            <span className="icon">💬</span> Neuer Chat
          </button>
        </div>
        
        <div className="conversations">
          <h3 className="conversations-title">Chats</h3>
          {conversations.map(conv => (
            <div key={conv.id} className="conversation-item active">
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
            <h1 className="app-title">🤖 AI Assistant</h1>
            <p className="app-subtitle">Dein intelligenter Helfer</p>
          </div>
          <button className="profile-btn">👤</button>
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
