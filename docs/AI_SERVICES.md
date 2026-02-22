# KI-Service Integrationsanleitung

Dieses Dokument erklärt wie man die verschiedenen KI-Services in der Application konfiguriert und nutzt.

## 🎯 Übersicht der unterstützten Services

Die Application unterstützt 5 verschiedene KI-Service Provider:

| Service | Kostenlos | Offline | Modelle | Setup-Schwierigkeit |
|---------|-----------|---------|---------|---------------------|
| **OpenAI** | ❌ Nach Credits | ❌ Nein | GPT-4, GPT-3.5 | ⭐⭐ Mittel |
| **Claude** | ❌ Nach Credits | ❌ Nein | Claude 3 Opus/Sonnet | ⭐⭐ Mittel |
| **Gemini** | ✅ (Limits) | ❌ Nein | Gemini Pro | ⭐⭐ Mittel |
| **Ollama** | ✅ | ✅ Ja | Llama, Mistral, etc. | ⭐⭐⭐ Schwer |
| **Lokal** | ✅ | ✅ Ja | Echo (Demo) | ⭐ Leicht |

---

## 1️⃣ OpenAI Integration

### Setup-Schritte

1. **API-Schlüssel besorgen:**
   - Gehe zu [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
   - Melde dich mit deinem OpenAI-Konto an
   - Klicke auf "Create new secret key +"
   - Kopiere den Schlüssel (wird nur einmal angezeigt!)

2. **In der App eingeben:**
   - Öffne die Chat-Einstellungen (⚙️ Icon)
   - Wähle "OpenAI" aus dem KI-Service Dropdown
   - Klicke auf "API-Schlüssel eingeben"
   - Paste deinen Schlüssel
   - Wähle ein Modell: `gpt-4-turbo` oder `gpt-3.5-turbo`

3. **Testen:**
   - Schreibe eine einfache Frage
   - Sollte eine Antwort innerhalb von 5-10 Sekunden kommen

### Modelle

| Modell | Performance | Kosten | Context | Empfohlen für |
|--------|-------------|--------|---------|---------------|
| **GPT-4 Turbo** | 🔥 Sehr hoch | $$$ | 128K tokens | Komplexe Aufgaben, Code |
| **GPT-4** | 🔥 Sehr hoch | $$$$ | 8K tokens | Hochwertige Antworten |
| **GPT-3.5 Turbo** | ✅ Gut | $ | 4K tokens | Schnelle Antworten, Budget |

### Pricing

```
GPT-4 Turbo:
  - Input: $0.01 / 1K tokens
  - Output: $0.03 / 1K tokens
  
GPT-3.5 Turbo:
  - Input: $0.0005 / 1K tokens  
  - Output: $0.0015 / 1K tokens
```

### Troubleshooting

| Problem | Lösung |
|---------|--------|
| "Invalid API key" | Prüfe ob Schlüssel korrekt kopiert wurde (keine Leerzeichen!) |
| "Rate limit exceeded" | Warte 1 Minute, dann versuche es erneut |
| Timeout nach 30s | OpenAI überlastet, versuche später oder wechsle zu GPT-3.5 |

---

## 2️⃣ Anthropic Claude Integration

### Setup-Schritte

1. **API-Schlüssel besorgen:**
   - Gehe zu [https://console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
   - Melde dich mit deinem Anthropic-Konto an
   - Klicke auf "Create Key"
   - Kopiere den Schlüssel

2. **In der App eingeben:**
   - Chat-Einstellungen (⚙️)
   - Wähle "Anthropic Claude" aus
   - API-Schlüssel eingeben
   - Wähle Claude 3 Opus oder Sonnet

3. **Kostenlose Credits:**
   - Neue Accounts bekommen $5 Credits
   - Gültig für 3 Monate

### Modelle

| Modell | Performance | Kosten | Context | Use Case |
|--------|-------------|--------|---------|----------|
| **Claude 3 Opus** | 🔥 Top | $$ | 200K tokens | Beste Qualität |
| **Claude 3 Sonnet** | ✅ Gut | $ | 200K tokens | Balanced |
| **Claude 3 Haiku** | ⚡ Schnell | $ | 200K tokens | Schnelle Antworten |

### Pricing

```
Claude 3 Opus:
  - Input: $0.015 / 1K tokens
  - Output: $0.075 / 1K tokens
  
Claude 3 Sonnet:
  - Input: $0.003 / 1K tokens
  - Output: $0.015 / 1K tokens
```

### Besonderheiten

- Sehr lange Context-Fenster (200K tokens)
- Exzellente Code-Analyse
- Starke Compliance/Sicherheit

---

## 3️⃣ Google Gemini Integration

### Setup-Schritte

1. **API-Schlüssel besorgen:**
   - Gehe zu [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Klicke auf "Create API key"
   - Wähle dein Google-Project
   - Kopiere den Schlüssel

2. **In der App eingeben:**
   - Chat-Einstellungen
   - Wähle "Google Gemini" aus
   - API-Schlüssel eingeben
   - Model: `gemini-pro`

3. **Kostenlos testen:**
   - Bis zu 60 API-Anfragen pro Minute (kostenlos)
   - Keine Kreditkarte nötig!

### Modelle

| Modell | Performance | Erkenntnisse |
|--------|-------------|-------------|
| **Gemini Pro** | ✅ Gut | Multimodal-ready (Bilder bald) |

### Pricing

```
Gemini Pro (Free):
  - 60 calls/min (kostenlos)
  - Danach: $0.00025 / 1K input tokens
```

---

## 4️⃣ Ollama (Local LLMs)

### Was ist Ollama?

Ollama ist eine Open-Source Software zum lokalen Ausführen von LLMs. **Kein Internet nötig, keine Kosten, vollständige Privatsphäre.**

### Installation

1. **Ollama installieren:**
   - Gehe zu [https://ollama.ai](https://ollama.ai)
   - Lade Version für Windows/Mac/Linux herunter
   - Installiere und starte die Anwendung

2. **Ein Modell laden:**
   ```bash
   # Terminal/Powershell öffnen
   ollama pull llama2
   # Oder andere Modelle:
   # ollama pull mistral
   # ollama pull neural-chat
   ```

3. **Ollama Server starten:**
   ```bash
   ollama serve
   # Server läuft dann auf http://localhost:11434
   ```

4. **In der App verwenden:**
   - Chat-Einstellungen
   - Wähle "Ollama (Lokal)" aus
   - API-URL: `http://localhost:11434` (Standard)
   - Modell: `llama2` (oder dein geladenes Modell)
   - Fertig! Tippe deine Nachricht

### Verfügbare Modelle

| Modell | Größe | Speed | Qualität | VRAM benötigt |
|--------|-------|-------|----------|---------------|
| **Llama 2** | 7B | ⚡⚡ | ✅ Gut | 8 GB |
| **Mistral** | 7B | ⚡⚡⚡ | ✅ Sehr Gut | 8 GB |
| **Neural Chat** | 7B | ⚡⚡ | ✅ Spezialisiert | 8 GB |
| **Llama 2 13B** | 13B | ⚡ | 🔥 Besser | 16 GB |

### Systemanforderungen

- **RAM:** Minimum 8 GB (besser 16 GB)
- **VRAM:** Für GPU-Beschleunigung (optional)
- **Disk:** 5-10 GB pro Modell

### Vorteile

✅ Kostenlos  
✅ Offline (keine Netzwerkabhängigkeit)  
✅ Privat (keine Daten verlassen deinen Rechner)  
✅ Keine API-Keys nötig  
✅ Unbegrenzte Nutzung  

### Nachteile

❌ Langsamer als Cloud-Services  
❌ Höhere Systemanforderungen  
❌ Weniger gelungene Ergebnisse als GPT-4  

---

## 5️⃣ Lokal Echo (Demo)

Der Local Echo Service ist für **Demo und Testzwecke** da.

- **Modell:** `echo`
- **Was macht es:** Repetiert deine Eingabe zurück
- **Nützlich für:** UI-Tests ohne externe APIs

---

## 🔄 Service Vergleich & Empfehlungen

### Für Anfänger: **Gemini (Kostenlos)**
```
✅ Kostenlos (60 calls/min)
✅ Keine Kreditkarte
✅ Einfaches Setup
✅ Gute Qualität
```

### Für Profis: **Claude 3 Opus**
```
✅ Beste Qualität
✅ Längste Context (200K)
✅ Exzellent für Code
✅ Starke Compliance
```

### Für Budget: **GPT-3.5 Turbo**
```
✅ Sehr günstig
✅ Schnell
✅ Gute Qualität
✅ Große Community
```

### Für Privatsphäre: **Ollama Local**
```
✅ Komplett offline
✅ Kostenlos
✅ Private Daten
✅ Keine Rate Limits
❌ Braucht viele Ressourcen
```

---

## 🔐 Sicherheit & API-Keys

### Best Practices

1. **Niemals teilen**
   ```
   ❌ FALSCH: Poste deine API-Keys auf GitHub/Social Media
   ✅ RICHTIG: Halte Keys privat/geheim
   ```

2. **In Umgebungsvariablen speichern** (für Produktion)
   ```
   # .env file
   OPENAI_API_KEY=sk-...
   CLAUDE_API_KEY=sk-ant-...
   ```

3. **Regelmäßig rotieren** (Schlüssel wechseln)
   - Deine Accounts → API-Keys
   - Alte Keys löschen
   - Neue Keys generieren

4. **Limits setzen** (im Provider-Dashboard)
   - Maximum monthly spend
   - Rate limits konfigurieren

### In dieser App

```typescript
// Keys werden mit einfacher Verschlüsselung im Browser
// gespeichert (localStorage)
// 
// Für Produktion würde man verwenden:
// - Server-seitige Key-Speicherung
// - Environment Variables
// - Secrets Manager (AWS, Azure, etc.)
```

---

## 🐛 Troubleshooting

### Allgemeine Probleme

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "Invalid API key" | Falscher Key | Prüfe ob Key korrekt kopiert |
| "Network error" | Kein Internet | Prüfe Internetverbindung |
| "401 Unauthorized" | Key abgelaufen | Generiere neuen Key |
| "Rate limit" | Zu viele Anfragen | Warte 1 Minute, versuche später |
| "Token limit exceeded" | Text zu lang | Verkürze Eingabe |

### Service-spezifische Probleme

**OpenAI:**
- Prüfe Guthaben auf [platform.openai.com](https://platform.openai.com/account/billing/overview)
- API-Key in [Account Settings](https://platform.openai.com/account/api-keys)

**Claude:**
- Prüfe Credits auf [console.anthropic.com](https://console.anthropic.com)
- API-Key in [Account Settings](https://console.anthropic.com/account/keys)

**Ollama:**
- Prüfe ob Ollama server läuft: `curl http://localhost:11434/api/tags`
- Falls nicht: `ollama serve` im Terminal
- Prüfe ob Modell heruntergeladen: `ollama ls`

---

## 📊 Performance-Vergleich

```
Response Time (typisch):
  GPT-4: 5-10s (abhängig von Load)
  GPT-3.5: 2-5s
  Claude: 3-7s
  Gemini: 2-4s
  Ollama: 5-30s (auf schwacher Hardware)
```

---

## 🚀 Nächste Schritte

1. **Wähle einen Service:**
   - Anfänger → Gemini
   - Qualität → Claude oder GPT-4
   - Budget → GPT-3.5 oder Ollama

2. **Hole dir API-Key:**
   - Folge der Setup-Anleitung oben

3. **Teste die Integration:**
   - Stelle eine Frage in der App
   - Überprüfe die Antwort

4. **Optimiere deine Settings:**
   - Temperature (Kreativität)
   - System Prompt (Anweisung)
   - Modell (basierend auf Aufgabe)

---

## 📚 Ressourcen

- **OpenAI Docs:** https://platform.openai.com/docs
- **Claude Docs:** https://docs.anthropic.com
- **Gemini Docs:** https://ai.google.dev
- **Ollama:** https://ollama.ai
- **Model Vergleich:** https://www.promptengineering.org/models

---

## 💬 Support

Hast du Fragen oder Probleme?

1. **Siehe das Troubleshooting Kapitel oben**
2. **Prüfe die Provider-Dokumentation (Links oben)**
3. **Kontaktiere den jeweiligen Service-Support:**
   - OpenAI: https://help.openai.com
   - Claude: https://support.anthropic.com
   - Google: https://support.google.com

---

*Letzte Aktualisierung: 2024*