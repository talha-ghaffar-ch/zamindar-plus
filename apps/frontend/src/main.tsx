import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider.tsx'
import { AiChatProvider } from './ai/AiChatProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AiChatProvider>
        <App />
      </AiChatProvider>
    </I18nProvider>
  </StrictMode>,
)
