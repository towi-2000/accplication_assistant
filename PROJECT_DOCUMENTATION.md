# AI Assistant - Projektdokumentation

## 📋 Überblick

Dies ist eine **moderne, responsive Browser-basierte AI Chat-Anwendung**, entwickelt mit React und TypeScript. Die Anwendung bietet eine benutzerfreundliche Schnittstelle zum Chatten mit KI-Modellen mit umfangreichen Konfigurationsmöglichkeiten.

### Kernfeatures
- 💬 **Chat-Interface**: Multi-turn Konversationen mit latentem Speichern
- 🌍 **5 Sprachen**: Deutsch, Englisch, Französisch, Spanisch, Italienisch
- 🎨 **5 Design-Themes**: Hell, Dunkel, Ozean, Wald, Sonnenuntergang
- ⚙️ **Chat-Einstellungen**: Temperature, Modellauswahl, Schreibstil, System-Prompts
- 📱 **Responsive Design**: Desktop, Tablet, Mobile (down to 380px)
- 🔒 **Typsicher**: Vollständig mit TypeScript typasiert
- 💾 **Persistierung**: LocalStorage für Einstellungen und Chat-Verlauf

---

## 🏗️ Projektstruktur

```
src/
├── App.tsx                    # Hauptkomponente - Rendering und State Management
├── Functions.tsx              # Business-Logik und Utility-Funktionen
├── type.tsx                   # TypeScript Type-Definitionen
├── App.css                    # Styles für alle Komponenten
├── index.css                  # Globale Styles
├── main.jsx                   # Entry Point
├── data.json                  # Konfigurationsdaten (Sprachen, Themes)
└── index.html                 # HTML-Einstiegspunkt
```

### Dateien im Detail

#### **App.tsx** (700+ Zeilen)
Hauptkomponente der Anwendung:
- **State Management**: Verwaltet Messages, Conversations, Settings
- **Event Handler**: Kümmert sich um Benutzereingaben
- **UI Rendering**: Rendert Sidebar, Header, Chat-Bereich, Settings-Panels
- **Lokalisierung**: Nutzt Translations-System für Multi-Language-Support

**Wichtigste States:**
```javascript
- messages: Message[]           // Chat-Nachrichten
- input: string                 // Eingabefeld
- globalSettings: GlobalSettings // Sprache, Theme, globaler Prompt
- chatSettings: ChatSettings     // Temperature, Model, WritingStyle
```

#### **Functions.tsx** (250+ Zeilen)
Utility-Funktionen und Business-Logik:
- `getTranslation()` - Übersetzungen abrufen
- `getTheme()`, `applyThemeToDocument()` - Theme-Management
- `processChatMessage()` - Nachrichtenverarbeitung
- `isMessageValid()` - Input-Validierung
- `saveGlobalSettings()`, `loadGlobalSettings()` - LocalStorage
- `saveChatData()`, `loadChatData()` - Chat-Persistierung

#### **type.tsx** (280+ Zeilen)
TypeScript Type-Definitionen für komplette Typsicherheit:
- `Message`, `Conversation` - Datenstrukturen
- `GlobalSettings`, `ChatSettings` - Konfigurationstypen
- `Theme`, `Themes` - Design-Definitionen
- `TranslationStrings`, `Translations` - Sprach-Typen
- `ChatData`, `SavedGlobalSettings` - Persistierungs-Formate

**Wichtigste Typen:**
```typescript
type Message = {
  id: number
  text: string
  sender: 'user' | 'ai'
}

type GlobalSettings = {
  language: string
  theme: string
  globalSystemPrompt: string
}

type ChatSettings = {
  temperature: number
  model: string
  writingStyle: string
  systemPrompt: string
}
```

#### **App.css** (1146 Zeilen)
Responsive Styling mit CSS-Variablen:
- **CSS Variables**: Für einfaches Theme-Switching
- **Responsive Breakpoints**: 1024px, 768px, 480px, 380px
- **Dark Mode Support**: Via `prefers-color-scheme` media query
- **Komponenten-Styling**: Sidebar, Header, Messages, Settings-Panels

**CSS Variable Beispiel:**
```css
:root {
  --primary-color: #10a37f;
  --dark-bg: #ffffff;
  --text-color: #333;
}

@media (prefers-color-scheme: dark) {
  :root {
    --dark-bg: #1a1a1a;
    --text-color: #ececec;
  }
}
```

#### **data.json** (200+ Zeilen)
Externalisierte Konfigurationsdaten:
```json
{
  "translations": {
    "de": { "title": "AI Assistant", ... },
    "en": { "title": "AI Assistant", ... },
    ...
  },
  "themes": {
    "light": { "primaryColor": "#10a37f", ... },
    "dark": { "primaryColor": "#10a37f", ... },
    ...
  }
}
```

---

## 🎯 Architekturkonzepte

### 1. **Separation of Concerns**
- **App.tsx**: Nur UI-Rendering und Event-Handling
- **Functions.tsx**: Nur Business-Logik und Datenverarbeitung
- **data.json**: Nur externalisierte Konfigurationen

### 2. **Type Safety**
- Alle TypeScript Types in `type.tsx` definiert
- Verhindert Laufzeitfehler durch Compile-Zeit-Checks
- Bessere IDE-Unterstützung und Autocompletion

### 3. **Reactive State Management**
```typescript
const [messages, setMessages] = useState<Message[]>([...])
const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({...})
```
- Single-direction data flow
- State wird nur durch explizite setState-Calls geändert
- Komponente re-renders automatisch bei State-Änderung

### 4. **Globalisierung (i18n)**
```typescript
const t = (key: string): string => {
  return getTranslation(key, globalSettings.language)
}

// Nutzen in JSX: {t('title')}, {t('newChat')}
```
- Zentrale Translation-Funktion
- Fallback auf Deutsch wenn Schlüssel nicht existiert
- Alle Sprachen in `data.json` definiert

### 5. **Theme-System**
```typescript
const handleThemeChange = (themeName: string) => {
  setGlobalSettings({ ...globalSettings, theme: themeName })
  applyThemeToDocument(themeName)  // Wendet CSS-Variablen an
}
```
- CSS-Variablen für dynamisches Theme-Switching
- Keine Hard-coded Farben im CSS
- 5 vordefinierte Themes in `data.json`

### 6. **Persistierung (LocalStorage)**
```typescript
// Automatisches Speichern
const saveSettings = () => saveGlobalSettings(globalSettings)

// Automatisches Laden
const loadSettings = () => loadGlobalSettings()
```
- `saveGlobalSettings()` und `loadGlobalSettings()`
- `saveChatData()` und `loadChatData()`
- Error-Handling mit Try-Catch

---

## 🎨 UI-Struktur

### Layout
```
┌─────────────────────────────────────┐
│         App Container              │
├──────────────┬──────────────────────┤
│              │                      │
│   Sidebar    │    Chat Container    │
│              │   ┌────────────────┐ │
│ - New Chat   │   │     Header     │ │
│ - Chats      │   ├────────────────┤ │
│ - Settings   │   │                │ │
│              │   │   Messages     │ │
│              │   │                │ │
│              │   ├────────────────┤ │
│              │   │  Input Area    │ │
│              │   └────────────────┘ │
└──────────────┴──────────────────────┘

Overlays (abgelegt über Main):
- Settings Panel (Chat-specific)
- Global Settings Panel
- Overlay Background
```

### Komponenten

#### **Sidebar** (Links)
- **New Chat Button**: Startet einen neuen Chat
- **Conversations List**: Zeigt bisherige Chats
- **Settings Button**: Öffnet Global-Settings
- **Help Button**: Zukünftige Hilfe-Funktion

#### **Header** (Oben)
- **Title**: App-Name ("🤖 AI Assistant")
- **Settings Button**: Öffnet Chat-Settings
- **Subtitle**: Kurzbeschreibung

#### **Messages Area** (Mitte)
- Scrollbare Liste aller Nachrichten
- User-Nachrichten alignt rechts (grün)
- AI-Nachrichten alignt links (grau)
- Emojis für visuelle Unterscheidung (👤 / 🤖)

#### **Input Area** (Unten)
- **Textarea**: Mehrere Zeilen, Auto-resize
- **Send Button**: Sendet mit Arrow-Icon (➤)
- **Disclaimer**: Info-Text über AI-Grenzen
- **Keyboard-Shortcut**: Enter sender, Shift+Enter neue Zeile

#### **Settings Panels**
Beide Panels sind floating overlays auf der rechten Seite:

**Chat Settings:**
- 🎚️ Temperature Slider (0-1)
- 🤖 Model Selector (GPT-4, GPT-3.5, Claude, Local)
- ✍️ Writing Style Buttons (Formal, Normal, Casual, Technical)
- 📝 System Prompt Textarea

**Global Settings:**
- 🌍 Language Selector (5 Sprachen)
- 🎨 Theme Selector (5 Themes mit Farbvorschau)
- 📝 Global System Prompt Textarea

---

## 🔄 Datenfluss

### Message Flow
```
User Input (Textarea)
    ↓
handleInputChange() → setInput()
    ↓
User drückt Enter
    ↓
handleSendMessage()
    ├─ isMessageValid() → prüft Input
    ├─ Erstelle Message-Objekt
    ├─ setMessages([...messages, userMessage])
    └─ setTimeout() → simulierte AI-Antwort
        └─ setMessages([...prev, aiResponse])
```

### Settings Flow
```
User ändert Einstellung
    ↓
handleThemeChange() / handleLanguageChange() / etc.
    ↓
setGlobalSettings() / setChatSettings()
    ↓
Component re-renders mit neuen Werten
    ↓
applyThemeToDocument() → setzt CSS-Variablen
```

### Localization Flow
```
Komponente rendert Text: {t('title')}
    ↓
t() → getTranslation(key, globalSettings.language)
    ↓
Suche in translations[language][key]
    ↓
Falls nicht gefunden, fallback auf translations['de'][key]
    ↓
Gibt übersetzten Text zurück oder Schlüssel als Fallback
```

---

## 📱 Responsiveness

### Breakpoints
| Screen Size | Device | Changes |
|------------|--------|---------|
| > 1024px | Desktop | Full layout, sidebar always visible |
| 1024px | Tablet L | Reduced padding, adjusted font sizes |
| 768px | Tablet/Mobile | Hamburger menu, sidebar collapse |
| 480px | Phone | Single column, full-width input |
| 380px | Small Phone | Tiny text, minimal padding |

### Mobile Features
```typescript
const [sidebarOpen, setSidebarOpen] = useState(false)

// Hamburger Menu Button (nur auf Mobile)
<button onClick={() => setSidebarOpen(!sidebarOpen)}>
  {sidebarOpen ? '✕' : '☰'}
</button>

// Sidebar mit class toggle
<aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
```

---

## 🚀 Workflow für Entwickler

### 1. **Neue Nachricht hinzufügen**
```typescript
// In App.tsx handleSendMessage()
const newMessage: Message = {
  id: messages.length + 1,
  text: input,
  sender: 'user'
}
setMessages([...messages, newMessage])
```

### 2. **Neue Einstellung hinzufügen**
```typescript
// 1. Typ in type.tsx erweitern
export type ChatSettings = {
  temperature: number
  // ... add new setting
  newSetting: string
}

// 2. Handler in App.tsx
const handleNewSettingChange = (e: ChangeEvent<HTMLInputElement>) => {
  setChatSettings({ ...chatSettings, newSetting: e.target.value })
}

// 3. UI in JSX hinzufügen
<input onChange={handleNewSettingChange} value={chatSettings.newSetting} />
```

### 3. **Neue Sprache hinzufügen**
```json
// In data.json
{
  "translations": {
    "pt": {
      "title": "Assistente de IA",
      "subtitle": "Seu assistente inteligente",
      ...
    }
  }
}
```

### 4. **Neues Theme hinzufügen**
```json
// In data.json
{
  "themes": {
    "custom": {
      "name": "Custom Theme",
      "primaryColor": "#...",
      "darkBg": "#...",
      ...
    }
  }
}
```

---

## 🔗 API-Integration (TODO)

Aktuell sind Nachrichten simuliert. Für echte AI-Integration:

```typescript
// In Functions.tsx processChatMessage()
// Ersetze setTimeout mit echtem API-Call:

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    globalSystemPrompt: globalSystemPrompt,
    chatSystemPrompt: chatSettings.systemPrompt,
    temperature: chatSettings.temperature,
    model: chatSettings.model,
    writingStyle: chatSettings.writingStyle
  })
})

const data = await response.json()
const aiResponse: Message = {
  id: currentMessagesLength + 2,
  text: data.response,
  sender: 'ai'
}
```

---

## 💾 LocalStorage Schema

### globalSettings
```javascript
localStorage.getItem('globalSettings')
{
  "language": "de",
  "theme": "dark",
  "globalSystemPrompt": "Du bist ein hilfreicher Assistent",
  "timestamp": 1708521600000
}
```

### chats
```javascript
localStorage.getItem('chats')
{
  "1": {
    "conversationId": 1,
    "messages": [
      { "id": 1, "text": "Hallo", "sender": "user" },
      { "id": 2, "text": "Hallo!", "sender": "ai" }
    ],
    "chatSettings": { ... },
    "timestamp": 1708521600000
  },
  "2": { ... }
}
```

---

## 🧪 Testing

Aktuelle Test-Szenarien:
- ✅ Mehrsprachige UI
- ✅ Theme-Wechsel
- ✅ Nachrichtenverlauf
- ✅ Responsive Layout
- ✅ Input-Validierung
- ✅ Settings-Panels
- ✅ LocalStorage-Persistierung

TODO:
- [ ] Unit Tests für Functions.tsx
- [ ] Integration Tests für Message Flow
- [ ] E2E Tests mit Cypress
- [ ] Visual Regression Tests

---

## 🐛 Häufige Probleme

### **Nachrichten werden nicht angezeigt**
- localStorage-Limit überschritten? `localStorage.clear()`
- Messages nicht korrekt in State gespeichert?
- Key sollte eindeutig sein: `key={message.id}`

### **Theme wird nicht angewendet**
- CSS-Variablen nicht im Root? `applyThemeToDocument()`
- Browser-Cache nicht geleert? F5 oder Ctrl+Shift+R
- Dark Mode System-Setting interferiert?

### **Übersetzungen nicht gefunden**
- Key existiert nicht in Translations?
- Falsche Sprache gewählt?
- Fallback zu Deutsch wird verwendet

---

## 📚 Weitere Ressourcen

### Wichtige Dateien zum Verstehen
1. `App.tsx` - Lesen Sie die State-Definitionen
2. `Functions.tsx` - Verstehen Sie die Business-Logik
3. `type.tsx` - Sehen Sie alle Typen
4. `data.json` - Konfigurationsdaten

### Externe Docs
- [React Hooks Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## 🎓 Learnings

Dieses Projekt demonstriert:
- ✅ React Hooks (useState, useEffect)
- ✅ TypeScript Type Safety
- ✅ Responsive Web Design
- ✅ CSS Custom Properties
- ✅ LocalStorage API
- ✅ Event Handling
- ✅ State Management Pattern
- ✅ Component Composition
- ✅ Internationalization (i18n)
- ✅ Theme System Architecture

---

**Erstellt am:** 21. Februar 2026  
**Typ:** Open Source Demo  
**Status:** Production Ready