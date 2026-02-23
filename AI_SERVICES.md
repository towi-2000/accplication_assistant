# AI Service Integration Guide

This document explains how to configure and use the various AI services in the application.

## 🎯 Overview of Supported Services

The application supports 5 different AI service providers:

| Service | Free | Offline | Models | Setup Difficulty |
|---------|------|---------|--------|------------------|
| **OpenAI** | ❌ Credit-based | ❌ No | GPT-4, GPT-3.5 | ⭐⭐ Medium |
| **Claude** | ❌ Credit-based | ❌ No | Claude 3 Opus/Sonnet | ⭐⭐ Medium |
| **Gemini** | ✅ (Limits) | ❌ No | Gemini Pro | ⭐⭐ Medium |
| **Ollama** | ✅ | ✅ Yes | Llama, Mistral, etc. | ⭐⭐⭐ Hard |
| **Local** | ✅ | ✅ Yes | Echo (Demo) | ⭐ Easy |

---

## 1️⃣ OpenAI Integration

### Setup Steps

1. **Get API Key:**
   - Go to [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
   - Sign in with your OpenAI account
   - Click "Create new secret key +"
   - Copy the key (shown only once!)

2. **Enter in App:**
   - Open Chat Settings (⚙️ Icon)
   - Select "OpenAI" from AI Service dropdown
   - Click "Enter API Key"
   - Paste your key
   - Select a model: `gpt-4-turbo` or `gpt-3.5-turbo`

3. **Test:**
   - Write a simple question
   - Should get a response within 5-10 seconds

### Models

| Model | Performance | Costs | Context | Recommended for |
|-------|-------------|-------|---------|------------------|
| **GPT-4 Turbo** | 🔥 Very High | $$$ | 128K tokens | Complex Tasks, Code |
| **GPT-4** | 🔥 Very High | $$$$ | 8K tokens | High-Quality Answers |
| **GPT-3.5 Turbo** | ✅ Good | $ | 4K tokens | Fast Answers, Budget |

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

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Check if key was copied correctly (no spaces!) |
| "Rate limit exceeded" | Wait 1 minute, then try again |
| Timeout after 30s | OpenAI overloaded, try later or switch to GPT-3.5 |

---

## 2️⃣ Anthropic Claude Integration

### Setup Steps

1. **Get API Key:**
   - Go to [https://console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
   - Sign in with your Anthropic account
   - Click "Create Key"
   - Copy the key

2. **Enter in App:**
   - Chat Settings (⚙️)
   - Select "Anthropic Claude"
   - Enter API Key
   - Choose Claude 3 Opus or Sonnet

3. **Free Credits:**
   - New accounts get $5 credits
   - Valid for 3 months

### Models

| Model | Performance | Costs | Context | Use Case |
|-------|-------------|-------|---------|----------|
| **Claude 3 Opus** | 🔥 Top | $$ | 200K tokens | Best Quality |
| **Claude 3 Sonnet** | ✅ Good | $ | 200K tokens | Balanced |
| **Claude 3 Haiku** | ⚡ Fast | $ | 200K tokens | Fast Answers |

### Pricing

```
Claude 3 Opus:
  - Input: $0.015 / 1K tokens
  - Output: $0.075 / 1K tokens
  
Claude 3 Sonnet:
  - Input: $0.003 / 1K tokens
  - Output: $0.015 / 1K tokens
```

### Special Features

- Very long context window (200K tokens)
- Excellent code analysis
- Strong compliance/security

---

## 3️⃣ Google Gemini Integration

### Setup Steps

1. **Get API Key:**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Click "Create API key"
   - Select your Google Project
   - Copy the key

2. **Enter in App:**
   - Chat Settings
   - Select "Google Gemini"
   - Enter API Key
   - Model: `gemini-pro`

3. **Test for Free:**
   - Up to 60 API calls per minute (free)
   - No credit card required!

### Models

| Model | Performance | Insights |
|-------|-------------|----------|
| **Gemini Pro** | ✅ Good | Multimodal-ready (Images coming soon) |

### Pricing

```
Gemini Pro (Free):
  - 60 calls/min (free)
  - After that: $0.00025 / 1K input tokens
```

---

## 4️⃣ Ollama (Local LLMs)

### What is Ollama?

Ollama is open-source software to run LLMs locally. **No internet needed, no costs, complete privacy.**

### Installation

1. **Install Ollama:**
   - Go to [https://ollama.ai](https://ollama.ai)
   - Download version for Windows/Mac/Linux
   - Install and start the application

2. **Download a Model:**
   ```bash
   # Open Terminal/Powershell
   ollama pull llama2
   # Or other models:
   # ollama pull mistral
   # ollama pull neural-chat
   ```

3. **Start Ollama Server:**
   ```bash
   ollama serve
   # Server runs on http://localhost:11434
   ```

4. **Use in App:**
   - Chat Settings
   - Select "Ollama (Local)"
   - API URL: `http://localhost:11434` (default)
   - Model: `llama2` (or your downloaded model)
   - Done! Type your message

### Available Models

| Model | Size | Speed | Quality | VRAM Required |
|-------|------|-------|---------|---------------|
| **Llama 2** | 7B | ⚡⚡ | ✅ Good | 8 GB |
| **Mistral** | 7B | ⚡⚡⚡ | ✅ Very Good | 8 GB |
| **Neural Chat** | 7B | ⚡⚡ | ✅ Specialized | 8 GB |
| **Llama 2 13B** | 13B | ⚡ | 🔥 Better | 16 GB |

### System Requirements

- **RAM:** Minimum 8 GB (better 16 GB)
- **VRAM:** For GPU acceleration (optional)
- **Disk:** 5-10 GB per model

### Advantages

✅ Free
✅ Offline (no network dependency)
✅ Private (no data leaves your computer)
✅ No API keys needed
✅ Unlimited usage

### Disadvantages

❌ Slower than cloud services
❌ Higher system requirements
❌ Less polished results than GPT-4  

---

## 5️⃣ Local Echo (Demo)

The Local Echo service is for **demo and testing purposes**.

- **Model:** `echo`
- **What it does:** Repeats your input back
- **Useful for:** UI tests without external APIs

---

## 🔄 Service Comparison & Recommendations

### For Beginners: **Gemini (Free)**
```
✅ Free (60 calls/min)
✅ No credit card
✅ Simple setup
✅ Good quality
```

### For Professionals: **Claude 3 Opus**
```
✅ Best quality
✅ Longest context (200K)
✅ Excellent for code
✅ Strong compliance
```

### For Budget: **GPT-3.5 Turbo**
```
✅ Very cheap
✅ Fast
✅ Good quality
✅ Large community
```

### For Privacy: **Ollama Local**
```
✅ Completely offline
✅ Free
✅ Private data
✅ No rate limits
❌ Uses system resources
```

---

## 🔐 Security & API Keys

### Best Practices

1. **Never Share**
   ```
   ❌ WRONG: Post your API keys on GitHub/Social Media
   ✅ RIGHT: Keep keys private/secret
   ```

2. **Store in Environment Variables** (for production)
   ```
   # .env file
   OPENAI_API_KEY=sk-...
   CLAUDE_API_KEY=sk-ant-...
   ```

3. **Rotate Regularly** (change keys)
   - Your Accounts → API Keys
   - Delete old keys
   - Generate new keys

4. **Set Limits** (in provider dashboard)
   - Maximum monthly spend
   - Configure rate limits

### In This App

```typescript
// Keys are stored with simple encryption in browser
// (localStorage)
// 
// For production, use:
// - Server-side key storage
// - Environment variables
// - Secrets manager (AWS, Azure, etc.)
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
- Check balance on [platform.openai.com](https://platform.openai.com/account/billing/overview)
- API key in [Account Settings](https://platform.openai.com/account/api-keys)

**Claude:**
- Check credits on [console.anthropic.com](https://console.anthropic.com)
- API key in [Account Settings](https://console.anthropic.com/account/keys)

**Ollama:**
- Check if Ollama server is running: `curl http://localhost:11434/api/tags`
- If not: `ollama serve` in terminal
- Check if model is downloaded: `ollama ls`

---

## 📊 Performance Comparison

```
Response Time (typical):
  GPT-4: 5-10s (depends on load)
  GPT-3.5: 2-5s
  Claude: 3-7s
  Gemini: 2-4s
  Ollama: 5-30s (on slower hardware)
```

---

## 🚀 Next Steps

1. **Choose a Service:**
   - Beginners → Gemini
   - Quality → Claude or GPT-4
   - Budget → GPT-3.5 or Ollama

2. **Get API Key:**
   - Follow the setup guide above

3. **Test the Integration:**
   - Ask a question in the app
   - Check the response

4. **Optimize Your Settings:**
   - Temperature (creativity)
   - System Prompt (instructions)
   - Model (based on task)

---

## 📚 Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **Claude Docs:** https://docs.anthropic.com
- **Gemini Docs:** https://ai.google.dev
- **Ollama:** https://ollama.ai
- **Model Comparison:** https://www.promptengineering.org/models

---

## 💬 Support

Have questions or problems?

1. **See the Troubleshooting chapter above**
2. **Check the provider documentation (links above)**
3. **Contact the respective service support:**
   - OpenAI: https://help.openai.com
   - Claude: https://support.anthropic.com
   - Google: https://support.google.com

---

*Last Updated: 2026*
