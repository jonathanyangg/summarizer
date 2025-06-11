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

    if (message.type === 'GENERATE_CHAT_RESPONSE') {
      console.log('💬 Processing GENERATE_CHAT_RESPONSE request');
      
      // Handle async operation properly
      (async () => {
        try {
          const response = await generateChatResponse(message.prompt, message.userMessage);
          console.log('✅ Chat response generated successfully, length:', response.length);
          sendResponse({ success: true, response });
        } catch (error) {
          console.error('❌ Error generating chat response:', error);
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at distilling content into ultra-concise summaries. Extract and present only the most critical information that represents 80%+ of the article\'s value. Use bullet points, keep sentences short, and eliminate all fluff. Maximum 3-4 sentences or 5-6 bullet points.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
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

async function generateChatResponse(prompt: string, userMessage: string): Promise<string> {
  console.log('💬 Starting chat response generation:', {
    promptLength: prompt.length,
    userMessageLength: userMessage.length
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

    console.log('🌐 Making OpenAI API request for chat response...');
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assistant that provides precise, concise answers about web content. Give direct, actionable responses without unnecessary elaboration. Focus on the most relevant information to answer the user\'s question.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
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

    const chatResponse = data.choices?.[0]?.message?.content?.trim();

    if (!chatResponse) {
      console.log('❌ No chat response content in response');
      throw new Error('No response generated from OpenAI API');
    }

    console.log('✅ Chat response extracted successfully, length:', chatResponse.length);
    return chatResponse;

  } catch (error) {
    console.error('❌ Error in generateChatResponse:', error);
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

  // Truncate content if too long (GPT-4o-mini has higher token limits)
  const maxContentLength = 12000; // Increased limit for GPT-4o-mini
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...[content truncated]'
    : content;

  console.log('📝 Content after truncation:', {
    finalLength: truncatedContent.length,
    wasTruncated: content.length > maxContentLength
  });

  // Detect technical AI/research content and major AI companies/technologies
  const technicalKeywords = [
    // Research & Academic Papers
    'arxiv', 'research paper', 'methodology', 'experiment', 'benchmark', 'SOTA', 'state of the art',
    'ablation study', 'neural network', 'transformer', 'attention mechanism',
    
    // Major AI Companies (Top Tier Only)
    'OpenAI', 'Anthropic', 'DeepMind', 'Palantir', 'Scale AI', 'ScaleAI',
    
    // Cutting-Edge Technologies
    'MCP', 'Model Context Protocol', 'RAG', 'retrieval augmented generation',
    'RLHF', 'constitutional AI', 'mixture of experts', 'MoE', 'multimodal AI',
    
    // Advanced AI Concepts
    'AGI', 'artificial general intelligence', 'AI alignment', 'AI safety',
    'fine-tuning', 'prompt engineering', 'in-context learning'
  ];
  
  const contentLower = (title + ' ' + truncatedContent).toLowerCase();
  const isTechnicalContent = technicalKeywords.some(keyword => contentLower.includes(keyword));
  
  console.log('📝 Technical content detected:', isTechnicalContent);

  const contentTypeInstructions = {
    article: 'This is a news article. Extract the core story: what happened, who was involved, when, where, and why it matters. Skip background details.',
    blog: 'This is a blog post. Identify the main argument, key insights, and actionable takeaways. Ignore personal anecdotes and filler.',
    documentation: 'This is technical documentation. Focus on the primary purpose, key steps, and critical information needed to understand or use this.',
    general: 'Extract the main purpose, key facts, and most important conclusions. Eliminate introductions, examples, and repetitive content.'
  };

  const instruction = contentTypeInstructions[contentType as keyof typeof contentTypeInstructions] || contentTypeInstructions.general;
  console.log('📝 Using instruction for content type:', contentType);

  // Use different requirements for technical content
  if (isTechnicalContent) {
    const prompt = `Summarize this technical ${contentType} in 80-120 words maximum. ${instruction}

TECHNICAL REQUIREMENTS:
- Capture 90%+ of the essential information including technical details
- Preserve key methodologies, algorithms, and findings
- Include specific metrics, performance numbers, and technical terms
- Maintain accuracy of technical concepts and terminology
- Use bullet points for multiple technical points
- Focus on: methodology, results, implications, and technical innovations

Title: "${title}"
Content: ${truncatedContent}

Technical Summary:`;

    console.log('📝 Final prompt length (technical):', prompt.length);
    return prompt;
  } else {
    const prompt = `Summarize this ${contentType} in 50-80 words maximum. ${instruction}

REQUIREMENTS:
- Capture 80%+ of the essential information
- Use bullet points if multiple key points exist
- Be extremely concise - every word must add value
- Skip introductory phrases like "This article discusses..."
- Focus on facts, conclusions, and actionable information

Title: "${title}"
Content: ${truncatedContent}

Summary:`;

    console.log('📝 Final prompt length:', prompt.length);
    return prompt;
  }
}
