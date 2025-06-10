export default defineBackground(() => {
  console.log('🚀 Page summarizer background script loaded');
  console.log('🔍 Browser capabilities:', {
    storageSync: typeof browser?.storage?.sync !== 'undefined',
    runtime: typeof browser?.runtime !== 'undefined',
    runtimeOnMessage: typeof browser?.runtime?.onMessage !== 'undefined'
  });

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Background received message:', {
      type: message.type,
      sender: sender.tab?.url || 'popup',
      messageKeys: Object.keys(message)
    });

    if (message.type === 'GENERATE_SUMMARY') {
      console.log('🤖 Processing GENERATE_SUMMARY request');
      
      // Handle async operation properly
      (async () => {
        try {
          const summary = await generateSummary(message.content, message.title, message.contentType);
          console.log('✅ Summary generated successfully, length:', summary.length);
          sendResponse({ success: true, summary });
        } catch (error) {
          console.error('❌ Error generating summary:', error);
          console.error('❌ Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
          });
        }
      })();
      
      return true; // Keep message channel open for async response
    }

    console.log('❓ Unknown message type:', message.type);
    sendResponse({ success: false, error: 'Unknown message type' });
    return false;
  });
});

async function generateSummary(content: string, title: string, contentType: string): Promise<string> {
  console.log('🤖 Starting summary generation:', {
    contentLength: content.length,
    title: title.substring(0, 50) + '...',
    contentType
  });

  // Get OpenAI API key from storage
  console.log('🔑 Retrieving API key from storage...');
  try {
    const result = await browser.storage.sync.get(['openaiApiKey']);
    console.log('🔑 Storage retrieval result:', {
      hasApiKey: !!result.openaiApiKey,
      keyLength: result.openaiApiKey?.length || 0,
      keyPrefix: result.openaiApiKey?.substring(0, 3) || 'none'
    });

    const apiKey = result.openaiApiKey;

    if (!apiKey) {
      console.log('❌ No API key found in storage');
      throw new Error('OpenAI API key not configured. Please set it in the extension popup.');
    }

    if (!apiKey.startsWith('sk-')) {
      console.log('❌ Invalid API key format');
      throw new Error('Invalid API key format. OpenAI keys should start with "sk-".');
    }

    console.log('✅ Valid API key found');

    // Prepare the prompt based on content type
    const prompt = createSummaryPrompt(content, title, contentType);
    console.log('📝 Prompt created, length:', prompt.length);

    console.log('🌐 Making OpenAI API request...');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of web content. Focus on the main points and key information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    };

    console.log('🌐 Request body prepared:', {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🌐 OpenAI API response status:', response.status);
    console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log('❌ OpenAI API request failed');
      let errorData;
      try {
        errorData = await response.json();
        console.log('❌ Error response data:', errorData);
      } catch (parseError) {
        console.log('❌ Could not parse error response:', parseError);
        errorData = {};
      }
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received:', {
      choices: data.choices?.length || 0,
      usage: data.usage,
      model: data.model
    });

    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      console.log('❌ No summary content in response');
      throw new Error('No summary generated from OpenAI API');
    }

    console.log('✅ Summary extracted successfully, length:', summary.length);
    return summary;

  } catch (error) {
    console.error('❌ Error in generateSummary:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to OpenAI API');
  }
}

function createSummaryPrompt(content: string, title: string, contentType: string): string {
  console.log('📝 Creating summary prompt:', {
    originalContentLength: content.length,
    title: title.substring(0, 50) + '...',
    contentType
  });

  // Truncate content if too long (GPT-3.5-turbo has token limits)
  const maxContentLength = 8000; // Conservative limit
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...[content truncated]'
    : content;

  console.log('📝 Content after truncation:', {
    finalLength: truncatedContent.length,
    wasTruncated: content.length > maxContentLength
  });

  const contentTypeInstructions = {
    article: 'This is a news article. Focus on the main story, key facts, and important details.',
    blog: 'This is a blog post. Summarize the main points and key insights shared by the author.',
    documentation: 'This is technical documentation. Focus on the main concepts, procedures, and important information.',
    general: 'This is web content. Provide a clear summary of the main information and key points.'
  };

  const instruction = contentTypeInstructions[contentType as keyof typeof contentTypeInstructions] || contentTypeInstructions.general;
  console.log('📝 Using instruction for content type:', contentType);

  const prompt = `Please provide a concise summary of the following ${contentType} titled "${title}".

${instruction}

Keep the summary between 100-300 words and structure it with clear paragraphs. Focus on the most important information.

Content:
${truncatedContent}`;

  console.log('📝 Final prompt length:', prompt.length);
  return prompt;
}
