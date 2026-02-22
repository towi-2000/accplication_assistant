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

import React, { useState, ChangeEvent, KeyboardEvent, useEffect, useRef } from 'react'
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
  WebPreviewItem,
  JobSearchItem,
  FileRecord
} from './type'
import {
  getTranslation,
  applyThemeToDocument,
  isMessageValid,
  parseUrlList,
  limitUrls,
  crawlUrls,
  searchPages,
  searchJobs,
  previewUrls,
  fetchFiles,
  fetchFileContent,
  previewDbFilter,
  deleteFilteredDb,
  fetchAllPages,
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

  // ========== WEB PAGE DB STATE ==========
  const [urlInput, setUrlInput] = useState<string>('')
  const [crawlResults, setCrawlResults] = useState<CrawlResultItem[]>([])
  const [crawlBusy, setCrawlBusy] = useState<boolean>(false)
  const [crawlError, setCrawlError] = useState<string>('')

  const [searchFields, setSearchFields] = useState<Array<{ id: number; value: string }>>([
    { id: 1, value: '' }
  ])
  const [lastSearchQueries, setLastSearchQueries] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<WebPageRecord[]>([])
  const [jobResults, setJobResults] = useState<JobSearchItem[]>([])
  const [searchBusy, setSearchBusy] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string>('')
  const [dbResultsQuery, setDbResultsQuery] = useState<string>('')
  const [previewResults, setPreviewResults] = useState<WebPreviewItem[]>([])
  const [previewSelected, setPreviewSelected] = useState<Record<string, boolean>>({})
  const [previewBusy, setPreviewBusy] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string>('')
  const [saveBusy, setSaveBusy] = useState<boolean>(false)
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })

  const searchFieldIdRef = useRef<number>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ========== AI SERVICE STATE ==========
  const [aiProvider, setAiProvider] = useState<string>('local')
  const [aiApiKey, setAiApiKey] = useState<string>('')
  const [aiApiUrl, setAiApiUrl] = useState<string>('http://localhost:11434')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string>('')
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false)

  // ========== FILE UPLOAD STATE ==========
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: number }>>([])
  const [fileUploadError, setFileUploadError] = useState<string>('')
  const [fileUploadLoading, setFileUploadLoading] = useState<boolean>(false)
  const [templateFiles, setTemplateFiles] = useState<FileRecord[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // ===== DB FILTER STATE =====
  const [filterInclude, setFilterInclude] = useState<string>('')
  const [filterExclude, setFilterExclude] = useState<string>('')
  const [filterPreviewItems, setFilterPreviewItems] = useState<WebPageRecord[]>([])
  const [filterPreviewTotal, setFilterPreviewTotal] = useState<number>(0)
  const [filterBusy, setFilterBusy] = useState<boolean>(false)
  const [filterError, setFilterError] = useState<string>('')

  // ===== APPLICATION GENERATION STATE =====
  const [applicationInstruction, setApplicationInstruction] = useState<string>('')
  const [applicationBusy, setApplicationBusy] = useState<boolean>(false)
  const [applicationError, setApplicationError] = useState<string>('')
  const [applicationProgress, setApplicationProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })

  // ========== MODAL STATE ==========
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false)

  /**
   * Translation helper function
   * Gibt den übersetzten Text für einen Key in der aktuellen Sprache zurück
   */
  const t = (key: string): string => {
    return getTranslation(key, globalSettings.language)
  }

  // ========== EFFECTS ==========

  /**
   * Load available AI services on component mount
   */
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/api/ai/services')
        if (response.ok) {
          const data = await response.json()
          setAvailableServices(data.services || [])
        }
      } catch (error) {
        console.error('Failed to load AI services:', error)
      }
    }

    loadServices()
  }, [])

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await fetchFiles(activeConversationId)
        setTemplateFiles(response.files)
      } catch (error) {
        console.error('Failed to load files:', error)
      }
    }

    loadFiles()
  }, [activeConversationId])

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
    setConversations((prev) => updateConversationTitle(
      prev,
      editingConversationId,
      editingConversationTitle,
      t('defaultConversationTitle')
    ))
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
          return [newConversation]
        }
      }

      return next
    })
  }

  /**
   * Handle file upload
   * Validiert und speichert hochgeladene Dateien
   */
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.currentTarget.files
    if (!files) return

    setFileUploadError('')
    setFileUploadLoading(true)

    try {
      const newFiles: typeof uploadedFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setFileUploadError(`${file.name} ${t('errorFileTooLarge')}`)
          continue
        }

        // Create file entry
        const fileId = `${Date.now()}-${i}`
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = String(reader.result || '')
            const base64 = result.split(',')[1] || ''
            resolve(base64)
          }
          reader.onerror = () => reject(new Error('File read failed'))
          reader.readAsDataURL(file)
        })

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: base64Content,
            fileType: file.type,
            fileSize: file.size,
            chatId: activeConversationId
          })
        })

        const payload = await parseJsonResponse(response)
        if (!response.ok) {
          throw new Error(payload?.error || t('errorFileUpload'))
        }

        if (!payload) {
          throw new Error(t('errorFileUpload'))
        }
        newFiles.push({
          id: payload.fileId,
          name: payload.fileName,
          size: file.size
        })
      }

      setUploadedFiles(prev => [...prev, ...newFiles])
      const refreshed = await fetchFiles(activeConversationId)
      setTemplateFiles(refreshed.files)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('errorFileUpload')
      setFileUploadError(errorMsg)
    } finally {
      setFileUploadLoading(false)
    }
  }

  /**
   * Send message to AI
   * Vereinfachte Logik: Nur Chat mit KI, keine Web-Suche
   * KI hat Zugriff auf Datenbank des aktuellen Chats wenn nötig
   */
  const handleSendMessage = async (): Promise<void> => {
    if (!isMessageValid(input)) {
      return
    }

    // User-Nachricht erstellen
    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user'
    }
    setMessages([...messages, newMessage])
    setInput('')
    setFileUploadError('')

    // AI-Antwort abrufen
    setAiLoading(true)
    setAiError('')

    try {
      // Prepare messages for API
      // Kombiniere globale Instruktion + chat-spezifische Instruktion
      const systemPrompt = `${globalSettings.globalSystemPrompt}

${chatSettings.systemPrompt}

${uploadedFiles.length > 0 ? `${t('uploadedFilesSystem')}: ${uploadedFiles.map(f => f.name).join(', ')}` : ''}`

      const messagesForApi = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.text
        })),
        {
          role: 'user' as const,
          content: input
        }
      ]

      // Call AI Service API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey || undefined,
          apiUrl: aiApiUrl || undefined,
          model: chatSettings.model,
          temperature: chatSettings.temperature,
          messages: messagesForApi,
          chatId: activeConversationId,
          // Files for AI context (in production: send base64 content)
          files: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name) : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('errorAiRequestFailed'))
      }

      const data = await response.json()

      // Add AI response to messages
      const aiResponse: Message = {
        id: messages.length + 2,
        text: data.content || t('errorNoAiResponse'),
        sender: 'ai'
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('errorUnknown')
      setAiError(errorMsg)

      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        text: `❌ Fehler: ${errorMsg}`,
        sender: 'ai'
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setAiLoading(false)
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
      setCrawlError(t('errorUrlRequired'))
      return
    }
    if (urls.length > 1000) {
      setCrawlError(t('errorUrlMax'))
      return
    }

    setCrawlBusy(true)
    setCrawlError('')
    try {
      const response = await crawlUrls(limitUrls(urls, 1000), activeConversationId)
      setCrawlResults(response.items)
    } catch (error) {
      setCrawlError(t('errorCrawlFailed'))
    } finally {
      setCrawlBusy(false)
    }
  }

  const getNormalizedQueries = (fields: Array<{ id: number; value: string }>): string[] => {
    return fields
      .map((field) => field.value.trim())
      .filter((value) => value.length > 0)
  }


  const parseKeywords = (value: string): string[] => {
    return value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  const handleFilterPreview = async (): Promise<void> => {
    setFilterBusy(true)
    setFilterError('')
    try {
      const include = parseKeywords(filterInclude)
      const exclude = parseKeywords(filterExclude)
      const response = await previewDbFilter(include, exclude, activeConversationId)
      setFilterPreviewItems(response.items)
      setFilterPreviewTotal(response.total)
    } catch (error) {
      setFilterError(t('errorFilterPreviewFailed'))
    } finally {
      setFilterBusy(false)
    }
  }

  const handleFilterDelete = async (): Promise<void> => {
    setFilterBusy(true)
    setFilterError('')
    try {
      const include = parseKeywords(filterInclude)
      const exclude = parseKeywords(filterExclude)
      const response = await deleteFilteredDb(include, exclude, activeConversationId)
      setSearchResults((prev) => prev.filter((item) => !response.deletedIds.includes(item.id)))
      setFilterPreviewItems([])
      setFilterPreviewTotal(0)
    } catch (error) {
      setFilterError(t('errorFilterDeleteFailed'))
    } finally {
      setFilterBusy(false)
    }
  }

  const decodeBase64Text = (base64: string): string => {
    try {
      const binary = atob(base64)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder('utf-8').decode(bytes)
    } catch (error) {
      return ''
    }
  }

  const parseJsonResponse = async (response: Response): Promise<any> => {
    const text = await response.text()
    if (!text) {
      return null
    }
    try {
      return JSON.parse(text)
    } catch (error) {
      return null
    }
  }

  const buildTemplateBlock = async (): Promise<string> => {
    if (!selectedTemplateId) {
      return ''
    }

    const template = await fetchFileContent(selectedTemplateId, activeConversationId)
    const isText = template.mime ? template.mime.startsWith('text/') : /\.(txt|md|rtf)$/i.test(template.name)
    if (!isText) {
      return `${t('templateBinaryNotice')} ${template.name}`
    }

    const content = decodeBase64Text(template.contentBase64)
    return `${t('templateLabel')}\n${content}`
  }

  const downloadTextFile = (filename: string, content: string): void => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerateApplications = async (): Promise<void> => {
    setApplicationBusy(true)
    setApplicationError('')
    setApplicationProgress({ current: 0, total: 0 })

    try {
      const pagesResponse = await fetchAllPages(activeConversationId)
      const pages = pagesResponse.items
      if (pages.length === 0) {
        setApplicationError(t('errorNoDbEntries'))
        return
      }

      const templateBlock = await buildTemplateBlock()
      const instruction = applicationInstruction.trim()
      const total = pages.length
      setApplicationProgress({ current: 0, total })

      for (let index = 0; index < pages.length; index += 1) {
        const item = pages[index]
        const jobText = `${item.title || ''} ${item.url}\n${item.content}`.trim()
        const prompt = `${t('applicationPrompt')}

${instruction ? `${t('applicationInstructionLabel')}: ${instruction}\n` : ''}${templateBlock ? `${templateBlock}\n` : ''}${t('applicationJobPostingLabel')}:
${jobText}`

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: aiProvider,
            apiKey: aiApiKey || undefined,
            apiUrl: aiApiUrl || undefined,
            model: chatSettings.model,
            temperature: chatSettings.temperature,
            messages: [
              {
                role: 'system',
                content: `${globalSettings.globalSystemPrompt}

${chatSettings.systemPrompt}`
              },
              { role: 'user', content: prompt }
            ],
            chatId: activeConversationId
          })
        })

        if (!response.ok) {
          throw new Error(t('errorApplicationGenerateFailed'))
        }

        const payload = await response.json()
        const filename = `application-${index + 1}.txt`
        downloadTextFile(filename, payload.content || '')
        setApplicationProgress({ current: index + 1, total })
      }
    } catch (error) {
      setApplicationError(t('errorApplicationGenerateFailed'))
    } finally {
      setApplicationBusy(false)
    }
  }

  const handleSearchAll = async (): Promise<void> => {
    const normalizedQueries = getNormalizedQueries(searchFields)
    if (normalizedQueries.length === 0) {
      setSearchError(t('errorSearchQueryRequired'))
      return
    }

    setSearchBusy(true)
    setSearchError('')
    setPreviewError('')
    setPreviewResults([])
    setPreviewSelected({})

    const errorMessages: string[] = []

    try {
      const [searchSettled, jobSettled] = await Promise.all([
        Promise.allSettled(
          normalizedQueries.map((query) => searchPages(query, activeConversationId, 1000, 0))
        ),
        Promise.allSettled(
          normalizedQueries.map((query) => searchJobs(query, 50))
        )
      ])

      const mergedResults = new Map<number, WebPageRecord>()
      const emptyQueries: string[] = []
      const failedQueries: string[] = []

      searchSettled.forEach((result, index) => {
        const query = normalizedQueries[index]
        if (result.status === 'fulfilled') {
          const items = result.value.items
          if (items.length === 0) {
            emptyQueries.push(query)
          }
          items.forEach((item) => {
            if (!mergedResults.has(item.id)) {
              mergedResults.set(item.id, item)
            }
          })
        } else {
          failedQueries.push(query)
        }
      })

      setSearchResults(Array.from(mergedResults.values()))
      setDbResultsQuery('')
      setLastSearchQueries(normalizedQueries)

      const jobItems: JobSearchItem[] = []
      const failedJobQueries: string[] = []

      jobSettled.forEach((result, index) => {
        const query = normalizedQueries[index]
        if (result.status === 'fulfilled') {
          jobItems.push(...result.value.items)
        } else {
          failedJobQueries.push(query)
        }
      })

      setJobResults(jobItems)

      if (failedJobQueries.length > 0) {
        errorMessages.push(`${t('errorJobSearchFailedFor')}: ${failedJobQueries.join(', ')}`)
      }

      if (failedQueries.length > 0) {
        errorMessages.push(`${t('errorSearchFailedFor')}: ${failedQueries.join(', ')}`)
      }

      if (emptyQueries.length > 0) {
        const urls = parseUrlList(urlInput)
        if (urls.length === 0) {
          errorMessages.push(`${t('errorNoDbHitsFor')}: ${emptyQueries.join(', ')}. ${t('errorPleaseProvideUrls')}`)
        } else if (urls.length > 1000) {
          errorMessages.push(t('errorUrlMax'))
        } else {
          setPreviewBusy(true)
          const previewSettled = await Promise.allSettled(
            emptyQueries.map((query) => previewUrls(limitUrls(urls, 1000), query))
          )

          const previewItems: WebPreviewItem[] = []
          let previewFailed = false

          previewSettled.forEach((result) => {
            if (result.status === 'fulfilled') {
              previewItems.push(...result.value.items)
            } else {
              previewFailed = true
            }
          })

          const uniquePreview = new Map<string, WebPreviewItem>()
          previewItems.forEach((item) => {
            if (!uniquePreview.has(item.url)) {
              uniquePreview.set(item.url, item)
            }
          })

          const previewList = Array.from(uniquePreview.values())
          setPreviewResults(previewList)
          setPreviewSelected(buildSelectionMap(previewList))

          if (previewFailed) {
            setPreviewError(t('errorPreviewFailed'))
          }
        }
      }
    } catch (error) {
      errorMessages.push(t('errorSearchFailed'))
    } finally {
      setSearchBusy(false)
      setPreviewBusy(false)
      if (errorMessages.length > 0) {
        setSearchError(errorMessages.join(' '))
      }
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
      setPreviewError(t('errorSelectUrl'))
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

      const refreshQueries = lastSearchQueries.length > 0
        ? lastSearchQueries
        : getNormalizedQueries(searchFields)

      if (refreshQueries.length > 0) {
        const refreshedSettled = await Promise.allSettled(
          refreshQueries.map((query) => searchPages(query, activeConversationId, 20, 0))
        )

        const refreshedResults = new Map<number, WebPageRecord>()
        refreshedSettled.forEach((result) => {
          if (result.status === 'fulfilled') {
            result.value.items.forEach((item) => {
              if (!refreshedResults.has(item.id)) {
                refreshedResults.set(item.id, item)
              }
            })
          }
        })

        setSearchResults(Array.from(refreshedResults.values()))
        setDbResultsQuery('')
      }
      setPreviewResults([])
      setPreviewSelected({})
    } catch (error) {
      setPreviewError(t('errorSaveFailed'))
    } finally {
      setSaveBusy(false)
    }
  }

  const jobRecords: WebPageRecord[] = jobResults.map((item, index) => ({
    id: -(index + 1),
    url: item.url,
    title: `[${item.source}] ${item.title}`,
    content: `${item.company} ${item.location ?? ''} ${item.description}`.trim(),
    status_code: null,
    content_hash: null,
    fetched_at: '',
    created_at: '',
    updated_at: ''
  }))
  const combinedResults = filterWebResults([...searchResults, ...jobRecords], dbResultsQuery)
  const showProgress = searchBusy || previewBusy || crawlBusy || saveBusy
  const progressLabel = searchBusy
    ? t('progressSearchDb')
    : previewBusy
      ? t('progressPreviewUrls')
      : crawlBusy
        ? t('progressCrawlUrls')
        : saveBusy
          ? t('progressSaveSelection')
          : ''
  const savePercent = saveProgress.total > 0
    ? Math.round((saveProgress.current / saveProgress.total) * 100)
    : 0
  const hasSearchQuery = searchFields.some((field) => field.value.trim().length > 0)

  return (
    <div className="app-container">
      {/* ===== MOBILE MENU TOGGLE ===== */}
      {/* Hamburger-Menü für Mobile: Zeigt/Versteckt die Sidebar */}
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={t('toggleMenuAria')}
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
            placeholder={t('searchChatsPlaceholder')}
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            aria-label={t('searchChatsAria')}
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
                aria-label={t('deleteChatAria')}
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
            aria-label={t('globalSettingsAria')}
          >
            ⚙️ {t('settings')}
          </button>
          <button 
            className="sidebar-btn" 
            onClick={() => setHelpModalOpen(true)}
            aria-label={t('helpAria')}
          >
            ❓ {t('help')}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      {/* 
        Hauptbereich mit drei Spalten:
        1. Chat-Bereich: Messages + Input
        2. Suchbereich: URL-Eingabe + Suchbegriffe
        3. Ergebnisbereich: Gefilterte Ergebnisse
      */}
      <main className="chat-container">
        {/* ===== HEADER (FULL WIDTH) ===== */}
        <header className="chat-header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="app-title">🤖 {t('title')}</h1>
              <button
                className="settings-btn"
                onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                title={t('chatSettings')}
                aria-label={t('chatSettingsAria')}
              >
                ⚙️
              </button>
            </div>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
        </header>

        {/* ===== LEFT COLUMN: CHAT ===== */}
        <div className="chat-column chat-column-left">
          {/* ===== MESSAGES AREA ===== */}
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

          {/* ===== INPUT AREA ===== */}
          <div className="input-area">
            {/* Datei-Upload-Dropdown */}
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-dropdown-container">
                <select
                  className="uploaded-files-dropdown"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  aria-label={t('uploadedFilesLabel')}
                >
                  <option value="">📎 {t('uploadedFilesLabel')} ({uploadedFiles.length})</option>
                  {uploadedFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      📄 {file.name}
                    </option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <button
                    className="file-remove-btn"
                    onClick={() => {
                      setUploadedFiles(prev => prev.filter(f => f.id !== selectedTemplateId))
                      setSelectedTemplateId('')
                    }}
                    aria-label={t('deleteFileAria')}
                    title={t('deleteFileAria')}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* File Upload Input (versteckt) + Button */}
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              aria-label={t('fileUploadAria')}
              accept=".pdf,.txt,.csv,.png,.jpg,.jpeg"
            />
            <button
              className="file-upload-btn"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={fileUploadLoading}
              title={t('fileUploadGuide')}
            >
              📎 {t('fileUpload')}
            </button>
            {fileUploadError && <div className="upload-error">{fileUploadError}</div>}

            {/* Chat Input */}
            <div className="input-container">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={t('inputPlaceholder')}
                className="message-input"
                aria-label={t('messageInputAria')}
              />
              <button
                onClick={handleSendMessage}
                className="send-btn"
                aria-label={t('sendMessageAria')}
                disabled={!isMessageValid(input) || aiLoading}
              >
                {aiLoading ? '⏳' : '➤'}
              </button>
            </div>
            <p className="input-hint">{t('disclaimer')}</p>
          </div>
        </div>

        {/* ===== CENTER COLUMN: SEARCH INPUT ===== */}
        <div className="chat-column chat-column-center">
          <div className="search-panel">
            <h3 className="search-title">📄 {t('crawlTitle')}</h3>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t('urlListPlaceholder')}
              className="webdb-textarea"
              aria-label={t('urlListAria')}
            />
            <button
              className="webdb-action"
              onClick={handleCrawl}
              disabled={crawlBusy}
            >
              {crawlBusy ? t('crawlBusyLabel') : t('crawlAction')}
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

            <div className="search-divider"></div>

            <h3 className="search-title">🔍 {t('searchTitle')}</h3>
            <div className="webdb-search-fields">
              {searchFields.map((field, index) => (
                <div key={field.id} className="webdb-row webdb-search-row">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => setSearchFields((prev) => (
                      prev.map((entry) => (
                        entry.id === field.id
                          ? { ...entry, value: e.target.value }
                          : entry
                      ))
                    ))}
                    placeholder={`${t('searchTermPlaceholder')} ${index + 1}`}
                    className="webdb-input"
                    aria-label={`${t('searchQueryAria')} ${index + 1}`}
                  />
                  <button
                    className="webdb-icon"
                    onClick={() => setSearchFields((prev) => (
                      prev.length > 1 ? prev.filter((entry) => entry.id !== field.id) : prev
                    ))}
                    disabled={searchFields.length === 1}
                    aria-label={`${t('searchFieldRemoveAria')} ${index + 1}`}
                    type="button"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                className="webdb-action webdb-add"
                onClick={() => setSearchFields((prev) => {
                  const nextId = searchFieldIdRef.current + 1
                  searchFieldIdRef.current = nextId
                  return [...prev, { id: nextId, value: '' }]
                })}
                type="button"
              >
                {t('addSearchField')}
              </button>
            </div>
            <div className="webdb-row">
              <button
                className="webdb-action"
                onClick={handleSearchAll}
                disabled={searchBusy || !hasSearchQuery}
              >
                {searchBusy ? t('searchBusyLabel') : t('searchAction')}
              </button>
            </div>
            {searchError && <p className="webdb-error">{searchError}</p>}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: RESULTS ===== */}
        <div className="chat-column chat-column-right">
          <div className="results-panel">
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

            <h3 className="results-title">💾 {t('dbResultsTitle')}</h3>
            <div className="webdb-results">
              {combinedResults.length === 0 && !searchBusy && (
                <span className="webdb-empty">{t('noResults')}</span>
              )}
            </div>
            {combinedResults.length > 0 && (
              <div className="webdb-db">
                <div className="webdb-db-search">
                  <input
                    type="text"
                    className="webdb-input"
                    placeholder={t('filterResultsPlaceholder')}
                    value={dbResultsQuery}
                    onChange={(event) => setDbResultsQuery(event.target.value)}
                    aria-label={t('filterResultsAria')}
                  />
                </div>
                <div className="webdb-results-db">
                  {combinedResults.map((item, index) => (
                    <div key={item.id} className="webdb-result-row">
                      <span className="webdb-result-index">{index + 1}</span>
                      <div className="webdb-result-content">
                        <span className="webdb-result-url">{item.url}</span>
                        <span className="webdb-result-title">{item.title || t('untitled')}</span>
                        <span className="webdb-result-snippet">
                          {item.content.slice(0, 160)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="webdb-section">
              <h3 className="results-title">🧹 {t('filterTitle')}</h3>
              <div className="webdb-filter-fields">
                <textarea
                  className="webdb-textarea"
                  placeholder={t('filterIncludePlaceholder')}
                  value={filterInclude}
                  onChange={(event) => setFilterInclude(event.target.value)}
                  aria-label={t('filterIncludeAria')}
                />
                <textarea
                  className="webdb-textarea"
                  placeholder={t('filterExcludePlaceholder')}
                  value={filterExclude}
                  onChange={(event) => setFilterExclude(event.target.value)}
                  aria-label={t('filterExcludeAria')}
                />
              </div>
              <div className="webdb-row">
                <button
                  className="webdb-action"
                  onClick={handleFilterPreview}
                  disabled={filterBusy}
                >
                  {filterBusy ? t('filterPreviewBusy') : t('filterPreviewAction')}
                </button>
                <button
                  className="webdb-action"
                  onClick={handleFilterDelete}
                  disabled={filterBusy || filterPreviewTotal === 0}
                >
                  {filterBusy ? t('filterDeleteBusy') : t('filterDeleteAction')}
                </button>
              </div>
              {filterError && <p className="webdb-error">{filterError}</p>}
              {filterPreviewTotal > 0 && (
                <div className="webdb-filter-preview">
                  <span className="webdb-filter-count">
                    {t('filterPreviewLabel')}: {filterPreviewTotal}
                  </span>
                  <div className="webdb-results">
                    {filterPreviewItems.map((item) => (
                      <div key={item.id} className="webdb-result">
                        <span className="webdb-result-url">{item.url}</span>
                        <span className="webdb-result-title">{item.title || t('untitled')}</span>
                      </div>
                    ))}
                  </div>
                  {filterPreviewTotal > filterPreviewItems.length && (
                    <span className="webdb-empty">
                      {t('filterPreviewMore')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="webdb-section">
              <h3 className="results-title">📝 {t('applicationsTitle')}</h3>
              <div className="webdb-applications">
                <label className="webdb-label">{t('templateSelectLabel')}</label>
                <select
                  className="webdb-input"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  aria-label={t('templateSelectAria')}
                >
                  <option value="">{t('templateNone')}</option>
                  {templateFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="webdb-textarea"
                  placeholder={t('applicationInstructionPlaceholder')}
                  value={applicationInstruction}
                  onChange={(event) => setApplicationInstruction(event.target.value)}
                  aria-label={t('applicationInstructionAria')}
                />
                <button
                  className="webdb-action"
                  onClick={handleGenerateApplications}
                  disabled={applicationBusy}
                >
                  {applicationBusy ? t('applicationBusyLabel') : t('applicationAction')}
                </button>
                {applicationProgress.total > 0 && (
                  <span className="webdb-progress-count">
                    {applicationProgress.current}/{applicationProgress.total}
                  </span>
                )}
                {applicationError && <p className="webdb-error">{applicationError}</p>}
              </div>
            </div>

            {previewError && <p className="webdb-error">{previewError}</p>}
            {previewResults.length > 0 && (
              <div className="webdb-preview">
                <div className="webdb-preview-header">
                  <span>🌐 {t('webResultsTitle')}</span>
                  <div className="webdb-preview-actions">
                    <button className="webdb-link" onClick={() => handleSelectAllPreview(true)}>
                      {t('selectAll')}
                    </button>
                    <button className="webdb-link" onClick={() => handleSelectAllPreview(false)}>
                      {t('selectNone')}
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
                        <span className="webdb-result-title">{item.title || t('untitled')}</span>
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
                  {saveBusy ? t('saveBusyLabel') : t('saveSelected')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== OVERLAY LAYERS ===== */}
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
      <div className={`settings-panel ${settingsPanelOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2 className="settings-title">{t('chatSettings')}</h2>
          <button
            className="settings-close"
            onClick={() => setSettingsPanelOpen(false)}
            aria-label={t('closeChatSettingsAria')}
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
              aria-label={t('temperatureAria')}
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
              aria-label={t('modelAria')}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5 Turbo</option>
              <option value="claude">Claude</option>
              <option value="local">{t('model')} {t('localLabel')}</option>
            </select>
          </div>

          {/* AI Service Selection */}
          <div className="setting-item">
            <label className="setting-label">🔌 {t('aiServiceLabel')}</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="setting-select"
              aria-label={t('aiServiceAria')}
            >
              {availableServices.map((service) => (
                <option key={service.provider} value={service.provider}>
                  {service.name}
                </option>
              ))}
            </select>
            <p className="setting-hint">{availableServices.find(s => s.provider === aiProvider)?.description}</p>
          </div>

          {/* API Key Input (if required) */}
          {availableServices.find(s => s.provider === aiProvider)?.requiresKey && (
            <div className="setting-item">
              <label className="setting-label">🔑 {t('apiKeyLabel')}</label>
              <button
                className="setting-btn"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              >
                {showApiKeyInput ? t('apiKeyHide') : t('apiKeyShow')}
              </button>
              {showApiKeyInput && (
                <input
                  type="password"
                  placeholder={t('apiKeyPlaceholder')}
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="setting-input"
                  aria-label={t('apiKeyAria')}
                />
              )}
            </div>
          )}

          {/* Custom API URL (for Ollama, Local) */}
          {(aiProvider === 'ollama' || aiProvider === 'local') && (
            <div className="setting-item">
              <label className="setting-label">🌐 {t('apiUrlLabel')}</label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={aiApiUrl}
                onChange={(e) => setAiApiUrl(e.target.value)}
                className="setting-input"
                aria-label={t('apiUrlAria')}
              />
            </div>
          )}

          {/* AI Error Display */}
          {aiError && (
            <div className="setting-item error">
              <p className="setting-error">❌ {aiError}</p>
            </div>
          )}

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
              aria-label={t('chatSystemPromptAria')}
            />
          </div>
        </div>
      </div>

      {/* ===== GLOBAL SETTINGS PANEL ===== */}
      <div className={`settings-panel ${globalSettingsOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2 className="settings-title">{t('globalSettings')}</h2>
          <button
            className="settings-close"
            onClick={() => setGlobalSettingsOpen(false)}
            aria-label={t('closeGlobalSettingsAria')}
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
                  title={getTranslation('languageName', lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="setting-hint">
              {getTranslation('languageName', globalSettings.language)}
            </p>
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
              aria-label={t('jobSearchProfileAria')}
            />
            <p className="setting-hint">{t('jobSearchProfileHint')}</p>
          </div>
        </div>
      </div>

      {/* ===== HELP MODAL ===== */}
      {helpModalOpen && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setHelpModalOpen(false)}
            aria-hidden="true"
          />
          <div className="modal help-modal">
            <div className="modal-header">
              <h2 className="modal-title">❓ {t('helpTitle')}</h2>
              <button
                className="modal-close"
                onClick={() => setHelpModalOpen(false)}
                aria-label={t('closeHelpAria')}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              {t('helpText').split('\n').map((line, idx) => (
                <p key={idx} className="help-line">
                  {line}
                </p>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn"
                onClick={() => setHelpModalOpen(false)}
              >
                {t('closeModal')}
              </button>
              <a
                href="https://github.com/yourusername/repo"
                target="_blank"
                rel="noopener noreferrer"
                className="modal-btn modal-btn-secondary"
              >
                📖 {t('documentation')}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App

