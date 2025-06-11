import { useState, useEffect } from 'react'
import './App.css'
import { ChatInterface, ApiKeySection, SummarizeButton, WelcomeScreen } from './components'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)
  const [isChatActive, setIsChatActive] = useState(false)

  // Load saved API key on component mount
  useEffect(() => {
    console.log('🔧 Popup App mounted, loading API key...')
    loadApiKey()
  }, [])

  // Keep config collapsed by default
  // useEffect(() => {
  //   if (!apiKey.trim()) {
  //     setIsConfigExpanded(true)
  //   }
  // }, [apiKey])

  const loadApiKey = async () => {
    try {
      console.log('📖 Attempting to load API key from storage...')
      const result = await browser.storage.sync.get(['openaiApiKey'])
      console.log('📖 Storage result:', result)
      
      if (result.openaiApiKey) {
        console.log('✅ API key found in storage, length:', result.openaiApiKey.length)
        setApiKey(result.openaiApiKey)
      } else {
        console.log('ℹ️ No API key found in storage')
      }
    } catch (error) {
      console.error('❌ Error loading API key:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  const saveApiKey = async () => {
    console.log('💾 Save API key button clicked')
    console.log('💾 API key length:', apiKey.length)
    console.log('💾 API key starts with sk-:', apiKey.startsWith('sk-'))
    
    if (!apiKey.trim()) {
      console.log('❌ API key is empty or whitespace only')
      showMessage('Please enter an API key', 'error')
      return
    }

    if (!apiKey.startsWith('sk-')) {
      console.log('❌ API key does not start with sk-')
      showMessage('Invalid API key format. OpenAI keys start with "sk-"', 'error')
      return
    }

    setIsLoading(true)
    console.log('💾 Starting API key save process...')
    
    try {
      console.log('💾 Attempting to save to browser.storage.sync...')
      
      // Check if browser.storage is available
      if (!browser?.storage?.sync) {
        throw new Error('browser.storage.sync is not available')
      }
      
      const trimmedKey = apiKey.trim()
      console.log('💾 Trimmed key length:', trimmedKey.length)
      
      await browser.storage.sync.set({ openaiApiKey: trimmedKey })
      console.log('✅ API key saved successfully to storage')
      
      // Verify the save by reading it back
      const verification = await browser.storage.sync.get(['openaiApiKey'])
      console.log('🔍 Verification read:', verification)
      
      if (verification.openaiApiKey === trimmedKey) {
        console.log('✅ API key verification successful')
        showMessage('API key saved successfully!', 'success')
      } else {
        console.log('❌ API key verification failed')
        throw new Error('API key verification failed after save')
      }
      
    } catch (error) {
      console.error('❌ Error saving API key:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Check browser capabilities
      console.log('🔍 Browser capabilities check:')
      console.log('  - browser object exists:', typeof browser !== 'undefined')
      console.log('  - browser.storage exists:', typeof browser?.storage !== 'undefined')
      console.log('  - browser.storage.sync exists:', typeof browser?.storage?.sync !== 'undefined')
      console.log('  - browser.storage.sync.set exists:', typeof browser?.storage?.sync?.set !== 'undefined')
      
      showMessage('Error saving API key: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error')
    } finally {
      setIsLoading(false)
      console.log('💾 API key save process completed')
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    console.log(`📢 Showing ${type} message:`, text)
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      console.log('📢 Clearing message')
      setMessage('')
      setMessageType('')
    }, 4000)
  }

  const handleStartSummarize = () => {
    setIsChatActive(true)
  }

  // Log component state changes
  useEffect(() => {
    console.log('🔄 Component state changed:', {
      apiKeyLength: apiKey.length,
      isLoading,
      messageType,
      hasMessage: !!message,
      isChatActive
    })
  }, [apiKey, isLoading, messageType, message, isChatActive])

  return (
    <div className="w-80 h-[600px] border border-gray-200 flex flex-col overflow-hidden" style={{
      background: 'radial-gradient(at 100% 99%, #d4d4d4 0px, transparent 50%), radial-gradient(at 4% 5%, #d4d4d4 0px, transparent 50%), #ffffff'
    }}>
      {/* Header */}
      <div className="px-4 py-3 text-white flex-shrink-0" style={{
        background: 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">AI Page Summaries</h1>
            <p className="text-gray-300 text-xs">By Solve-AI.org</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* API Key Section - Always visible */}
        <ApiKeySection
          apiKey={apiKey}
          onApiKeyChange={(key) => {
            console.log('🔤 API key input changed, new length:', key.length)
            setApiKey(key)
          }}
          onSave={saveApiKey}
          isLoading={isLoading}
          message={message}
          messageType={messageType}
          isConfigExpanded={isConfigExpanded}
          onToggleExpanded={() => setIsConfigExpanded(!isConfigExpanded)}
        />

        {/* Chat Interface - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          {!isChatActive && apiKey.trim() ? (
            /* Summarize Button View */
            <SummarizeButton onStartSummarize={handleStartSummarize} />
          ) : isChatActive ? (
            /* Chat Interface */
            <ChatInterface 
              apiKey={apiKey}
              onShowMessage={showMessage}
              autoStart={true}
            />
          ) : (
            /* No API Key State */
            <WelcomeScreen />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
