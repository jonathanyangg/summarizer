import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentExtractor, ExtractedContent } from './ContentExtractor';
import { SummaryButton } from './SummaryButton';
import { SummaryModal } from './SummaryModal';

interface SummaryAppState {
  isModalOpen: boolean;
  isLoading: boolean;
  summary: string;
  extractedContent: ExtractedContent | null;
}

const SummaryApp: React.FC = () => {
  const [state, setState] = useState<SummaryAppState>({
    isModalOpen: false,
    isLoading: false,
    summary: '',
    extractedContent: null,
  });

  const handleSummarizeClick = async () => {
    // Extract content if not already done
    let content = state.extractedContent;
    if (!content) {
      content = ContentExtractor.extractContent();
      if (!content) {
        console.error('Could not extract content from page');
        return;
      }
    }

    setState(prev => ({
      ...prev,
      isModalOpen: true,
      isLoading: true,
      extractedContent: content,
    }));

    try {
      // Send message to background script to generate summary
      const response = await browser.runtime.sendMessage({
        type: 'GENERATE_SUMMARY',
        content: content.content,
        title: content.title,
        contentType: content.contentType,
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          summary: response.summary,
        }));
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        summary: 'Sorry, there was an error generating the summary. Please try again.',
      }));
    }
  };

  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
    }));
  };

  return (
    <>
      <SummaryButton 
        onClick={handleSummarizeClick}
        isLoading={state.isLoading && !state.isModalOpen}
      />
      <SummaryModal
        isOpen={state.isModalOpen}
        onClose={handleCloseModal}
        title={state.extractedContent?.title || ''}
        summary={state.summary}
        isLoading={state.isLoading}
        wordCount={state.extractedContent?.wordCount}
        contentType={state.extractedContent?.contentType}
      />
    </>
  );
};

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    // Skip if we're on extension pages or non-http(s) pages
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      return;
    }

    console.log('🚀 Page summarizer content script loaded for:', window.location.href);

    // Set up message listener for popup communication
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Content script received message:', message);
      
      if (message.type === 'TEST_SUMMARIZATION') {
        const isSummarizable = ContentExtractor.isContentSummarizable();
        console.log('🧪 Testing summarization capability:', isSummarizable);
        sendResponse({ success: isSummarizable });
        return true; // Keep message channel open for async response
      }
      
      if (message.type === 'GENERATE_SUMMARY_FROM_POPUP') {
        console.log('🚀 Generating summary from popup request...');
        
        // Check if content is summarizable
        const isSummarizable = ContentExtractor.isContentSummarizable();
        if (!isSummarizable) {
          console.log('❌ Page content is not suitable for summarization');
          sendResponse({ 
            success: false, 
            error: 'This page cannot be summarized (not enough content)' 
          });
          return true;
        }
        
        // Extract content
        const extractedContent = ContentExtractor.extractContent();
        if (!extractedContent) {
          console.log('❌ Failed to extract content from page');
          sendResponse({ 
            success: false, 
            error: 'Failed to extract content from this page' 
          });
          return true;
        }
        
        console.log('✅ Content extracted, sending to background script...');
        
        // Send to background script for AI processing
        browser.runtime.sendMessage({
          type: 'GENERATE_SUMMARY',
          content: extractedContent.content,
          title: extractedContent.title,
          contentType: extractedContent.contentType,
        }).then(response => {
          console.log('🤖 Background script response:', response);
          
          if (response.success) {
            sendResponse({
              success: true,
              summary: response.summary,
              title: extractedContent.title,
              wordCount: extractedContent.wordCount,
              contentType: extractedContent.contentType
            });
          } else {
            sendResponse({
              success: false,
              error: response.error || 'Failed to generate summary'
            });
          }
        }).catch(error => {
          console.error('❌ Error communicating with background script:', error);
          sendResponse({
            success: false,
            error: 'Failed to communicate with AI service'
          });
        });
        
        return true; // Keep message channel open for async response
      }
      
      return false;
    });

    // Wait for page to be ready
    await new Promise<void>((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });

    // Check if content is summarizable
    const isSummarizable = ContentExtractor.isContentSummarizable();
    
    if (!isSummarizable) {
      console.log('ℹ️ Page content is not suitable for summarization');
      return;
    }

    console.log('✅ Page is summarizable, injecting UI');

    // Create container for our React app
    const container = document.createElement('div');
    container.id = 'page-summarizer-root';
    document.body.appendChild(container);

    // Create React root and render our app
    const root = createRoot(container);
    root.render(<SummaryApp />);

    // Cleanup function
    ctx.onInvalidated(() => {
      root.unmount();
      container.remove();
    });
  },
}); 