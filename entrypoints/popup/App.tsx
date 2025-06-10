import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // Load saved API key on component mount
  useEffect(() => {
    console.log('🔧 Popup App mounted, loading API key...')
    loadApiKey()
  }, [])

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

  const testCurrentPage = async () => {
    console.log('🧪 Test current page button clicked')
    
    if (!apiKey.trim()) {
      console.log('❌ No API key available for testing')
      showMessage('Please save your API key first', 'error')
      return
    }

    setIsLoading(true)
    console.log('🧪 Starting page test...')
    
    try {
      console.log('🧪 Getting active tab...')
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      console.log('🧪 Active tab:', tab)
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      console.log('🧪 Sending message to content script...')
      const response = await browser.tabs.sendMessage(tab.id, {
        type: 'TEST_SUMMARIZATION'
      })
      console.log('🧪 Content script response:', response)

      if (response?.success) {
        console.log('✅ Page test successful')
        showMessage('Page can be summarized! Look for the blue button on the page.', 'success')
      } else {
        console.log('❌ Page test failed - not summarizable')
        showMessage('This page cannot be summarized (not enough content)', 'error')
      }
    } catch (error) {
      console.error('❌ Error testing page:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      showMessage('Error testing page. Make sure you\'re on a web page with content.', 'error')
    } finally {
      setIsLoading(false)
      console.log('🧪 Page test completed')
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
    <div className="w-80 min-h-[400px] bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Page Summarizer</h1>
            <p className="text-blue-100 text-sm">AI-powered summaries</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* API Key Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Configuration</h2>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 placeholder-gray-400"
              />
              {apiKey && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
            
            <button
              onClick={saveApiKey}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save API Key'
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Test Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Test</h2>
          </div>
          
          <button
            onClick={testCurrentPage}
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Testing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Current Page
              </div>
            )}
          </button>
          
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Check if the current page can be summarized
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium transition-all duration-300 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
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
  )
}

export default App
