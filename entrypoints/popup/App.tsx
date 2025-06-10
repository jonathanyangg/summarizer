import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // Load saved API key on component mount
  useEffect(() => {
    loadApiKey()
  }, [])

  const loadApiKey = async () => {
    try {
      const result = await browser.storage.sync.get(['openaiApiKey'])
      if (result.openaiApiKey) {
        setApiKey(result.openaiApiKey)
      }
    } catch (error) {
      console.error('Error loading API key:', error)
    }
  }

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      showMessage('Please enter an API key', 'error')
      return
    }

    if (!apiKey.startsWith('sk-')) {
      showMessage('Invalid API key format. OpenAI keys start with "sk-"', 'error')
      return
    }

    setIsLoading(true)
    try {
      await browser.storage.sync.set({ openaiApiKey: apiKey.trim() })
      showMessage('API key saved successfully!', 'success')
    } catch (error) {
      showMessage('Error saving API key', 'error')
      console.error('Error saving API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testCurrentPage = async () => {
    if (!apiKey.trim()) {
      showMessage('Please save your API key first', 'error')
      return
    }

    setIsLoading(true)
    try {
      // Get the active tab
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Send message to content script to test summarization
      const response = await browser.tabs.sendMessage(tab.id, {
        type: 'TEST_SUMMARIZATION'
      })

      if (response?.success) {
        showMessage('Page can be summarized! Look for the blue button on the page.', 'success')
      } else {
        showMessage('This page cannot be summarized (not enough content)', 'error')
      }
    } catch (error) {
      showMessage('Error testing page. Make sure you\'re on a web page with content.', 'error')
      console.error('Error testing page:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 4000)
  }

  return (
    <div className="w-80 p-6 bg-white">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page Summarizer</h1>
        <p className="text-sm text-gray-600">AI-powered web page summaries</p>
      </div>

      <div className="space-y-4">
        {/* API Key Section */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="space-y-2">
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={saveApiKey}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenAI Platform
            </a>
          </p>
        </div>

        {/* Test Section */}
        <div className="border-t pt-4">
          <button
            onClick={testCurrentPage}
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isLoading ? 'Testing...' : 'Test Current Page'}
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Check if the current page can be summarized
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="border-t pt-4 text-xs text-gray-600 space-y-2">
          <p className="font-medium">How to use:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Save your OpenAI API key above</li>
            <li>Visit any article or blog post</li>
            <li>Look for the blue summarize button</li>
            <li>Click it to get an AI summary!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default App
