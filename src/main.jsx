/**
 * main.jsx - Entry Point der Anwendung
 * 
 * Dies ist der Einstiegspunkt für die React-Anwendung.
 * Verantwortlichkeiten:
 * 1. Initialisiert React StrictMode für zusätzliche Checks
 * 2. Rendert die App-Komponente in das root-DOM-Element
 * 3. Behandelt Fehler bei der Rendering
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Zielcontainer aus der index.html abrufen
const rootElement = document.getElementById('root')

// Nur rendern wenn das Element existiert
if (rootElement) {
  // React-Application starten und in das root-Element einbinden
  createRoot(rootElement).render(
    <StrictMode>
      {/* 
        StrictMode aktiviert zusätzliche Development-Checks:
        - Doppelte Renders zur Fehlersuche
        - Warnung bei unsicheren Lifecycle-Methoden
        - Warnung bei nicht-erlaubten String-Refs
      */}
      <App />
    </StrictMode>,
  )
}