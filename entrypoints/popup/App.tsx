import { useState, useEffect } from 'react'
import './App.css'
import { ChatInterface } from './components/ChatInterface'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)


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

  // Log component state changes
  useEffect(() => {
    console.log('🔄 Component state changed:', {
      apiKeyLength: apiKey.length,
      isLoading,
      messageType,
      hasMessage: !!message
    })
  }, [apiKey, isLoading, messageType, message])

  return (
    <div className="w-80 h-[500px] bg-white border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-black px-6 py-4 text-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Page Summarizer</h1>
            <p className="text-gray-400 text-xs">AI-powered summaries</p>
          </div>
        </div>
      </div>
      
      {/* Content - Single Scrolling Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* API Key Section */}
          <div className="space-y-3">
            <button
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-black' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-900">
                  {apiKey.trim() ? 'API Key Configured' : 'Setup Required'}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isConfigExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isConfigExpanded && (
              <div className="space-y-3 px-3 pb-2">
                <label htmlFor="apiKey" className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
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
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm transition-all duration-200 placeholder-gray-400"
                  />
                  {apiKey && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={saveApiKey}
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
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
                
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:underline font-medium"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Chat Interface Section */}
          <div className="flex-1 min-h-0">
            <ChatInterface 
              apiKey={apiKey}
              onShowMessage={showMessage}
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium transition-all duration-300 border-t border-gray-200 mt-4 ${
              messageType === 'success' 
                ? 'bg-gray-50 text-gray-800' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-start gap-2">
                {messageType === 'success' ? (
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span>{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
