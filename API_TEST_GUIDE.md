# API Endpoints Test Guide

Dies ist eine Anleitung zum Testen der neuen KI-Service API-Endpoints.

## 🚀 Server starten

```bash
# Terminal 1: Backend starten
npm run server
# Server läuft dann auf http://localhost:5174

# Terminal 2: Frontend starten (optional)
npm run dev
# Frontend auf http://localhost:5173
```

## 🧪 Endpoints testen

### 1. Health Check
```bash
curl http://localhost:5174/api/health
# Antwort: {"status":"ok"}
```

### 2. Verfügbare KI-Services abrufen
```bash
curl http://localhost:5174/api/ai/services
```

**Antwort Beispiel:**
```json
{
  "services": [
    {
      "provider": "openai",
      "name": "OpenAI",
      "models": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
      "requiresKey": true,
      "description": "Professional AI models from OpenAI"
    },
    {
      "provider": "local",
      "name": "Local Echo",
      "models": ["echo"],
      "requiresKey": false,
      "description": "Simple local echo service for testing"
    }
    // ... weitere Services
  ]
}
```

### 3. API-Key validieren
```bash
curl -X POST http://localhost:5174/api/ai/validate-key \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-key-here"
  }'
```

**Erfolgreiche Antwort:**
```json
{
  "valid": true,
  "provider": "openai",
  "message": "Key is valid"
}
```

### 4. AI Chat aufrufen (mit Local Service)

**Ohne externe API:**
```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "local",
    "model": "echo",
    "temperature": 0.7,
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant"
      },
      {
        "role": "user",
        "content": "Hallo! Wie geht es dir?"
      }
    ],
    "chatId": 1
  }'
```

**Antwort:**
```json
{
  "success": true,
  "content": "[LOCAL RESPONSE] You said: Hallo! Wie geht es dir?",
  "provider": "local",
  "model": "echo"
}
```

### 5. AI Chat mit OpenAI (mit API-Key)

```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-actual-key",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant"
      },
      {
        "role": "user",
        "content": "Was ist 2+2?"
      }
    ],
    "chatId": 1
  }'
```

**Antwort (echte KI):**
```json
{
  "success": true,
  "content": "2+2 gleich 4.",
  "provider": "openai",
  "model": "gpt-3.5-turbo"
}
```

### 6. AI Chat mit Ollama (Local)

**Voraussetzung: Ollama läuft auf http://localhost:11434**

```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ollama",
    "model": "llama2",
    "temperature": 0.7,
    "messages": [
      {
        "role": "user",
        "content": "Schreibe einen kurzen Joke"
      }
    ],
    "chatId": 1
  }'
```

## 📊 Error Cases testen

### Invalid Provider
```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "invalid",
    "model": "test",
    "messages": []
  }'
# Antwort: 400 Error - Unknown provider
```

### Missing Messages
```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "local",
    "model": "echo"
  }'
# Antwort: 400 Error - messages are required
```

### Invalid OpenAI Key
```bash
curl -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-invalid",
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "test"}]
  }'
# Antwort: 500 Error - OpenAI API error
```

## 🔐 Sicherheit

### Wichtig: API-Keys NICHT in Curl-Befehlen speichern!

**Besser: Environment Variables verwenden:**

```bash
# Set environment variable
export OPENAI_API_KEY="sk-..."

# Oder in PowerShell:
$env:OPENAI_API_KEY = "sk-..."

# Dann in Code verwenden:
const apiKey = process.env.OPENAI_API_KEY
```

## 📝 Quick Test Script

Erstelle eine Datei `test-api.sh`:

```bash
#!/bin/bash

echo "Testing AI API Endpoints..."
echo ""

echo "1. Health Check"
curl -s http://localhost:5174/api/health | jq .
echo ""

echo "2. Available Services"
curl -s http://localhost:5174/api/ai/services | jq .
echo ""

echo "3. Local Echo Test"
curl -s -X POST http://localhost:5174/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "local",
    "model": "echo",
    "messages": [{"role": "user", "content": "Hello API!"}]
  }' | jq .
echo ""

echo "✅ All tests completed!"
```

Dann ausführen:
```bash
chmod +x test-api.sh
./test-api.sh
```

## 🐛 Troubleshooting

### "Port 5174 already in use"
```bash
# Finde den Process der den Port nutzt
lsof -i :5174  # (MacOS/Linux)
netstat -ano | findstr :5174  # (Windows)

# Kill den Process
kill -9 <PID>  # (MacOS/Linux)
taskkill /PID <PID> /F  # (Windows)
```

### "Connection refused"
- Prüfe ob `npm run server` läuft
- Prüfe ob Port 5174 richtig ist
- Try `curl -v http://localhost:5174/api/health` für Debug-Info

### "OpenAI API error"
- Prüfe ob der Schlüssel gültig ist
- Prüfe ob Guthaben vorhanden ist
- Try `curl http://api.openai.com` um API-Verfügbarkeit zu prüfen

## 📚 Weitere Ressourcen

- [Express.js Docs](https://expressjs.com/)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [curl Dokumentation](https://curl.se/docs/)
- [jq JSON Parser](https://stedolan.github.io/jq/)

---

**Tipp:** Nutze [Postman](https://www.postman.com/) oder [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) VS Code Extension für visuelles API Testing!
