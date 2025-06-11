import { useState, useEffect } from 'react'
import './App.css'
import { ChatInterface } from './components/ChatInterface'

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
            <h1 className="text-base font-semibold tracking-tight">Page Summarizer</h1>
            <p className="text-gray-300 text-xs">AI-powered chat</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* API Key Section - Always visible */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200/60">
          <div className="space-y-3">
            <button
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/60 cursor-pointer backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-green-500' : 'bg-gray-400'} shadow-sm`}></div>
                <span className="text-xs font-medium text-gray-900">
                  {apiKey.trim() ? 'API Key Configured' : 'Setup Required'}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isConfigExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isConfigExpanded && (
              <div className="space-y-3 px-1">
                <label htmlFor="apiKey" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      console.log('🔤 API key input changed, new length:', e.target.value.length)
                      setApiKey(e.target.value)
                    }}
                    placeholder="sk-..."
                    className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-xs transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
                  />
                  {apiKey && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={saveApiKey}
                  disabled={isLoading}
                  className="w-full text-white py-2.5 px-4 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                  style={{
                    background: isLoading ? '#6b7280' : 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save API Key'
                  )}
                </button>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  Get your API key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-gray-900 font-medium underline decoration-gray-400 hover:decoration-gray-600 transition-colors"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-medium transition-all duration-300 backdrop-blur-sm ${
              messageType === 'success' 
                ? 'bg-green-50/80 text-green-800 border border-green-200/60' 
                : 'bg-red-50/80 text-red-800 border border-red-200/60'
            }`}>
              <div className="flex items-start gap-2">
                {messageType === 'success' ? (
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span>{message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          {!isChatActive && apiKey.trim() ? (
            /* Summarize Button View */
            <div className="h-full flex items-center justify-center p-6">
              <button
                onClick={handleStartSummarize}
                className="text-white py-4 px-8 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{
                  background: 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summarize This Page
              </button>
            </div>
          ) : isChatActive ? (
            /* Chat Interface */
            <ChatInterface 
              apiKey={apiKey}
              onShowMessage={showMessage}
              autoStart={true}
            />
          ) : (
            /* No API Key State */
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-sm">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Setup Required</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Please configure your OpenAI API key above to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
