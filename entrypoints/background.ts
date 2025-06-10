export default defineBackground(() => {
  console.log('Page summarizer background script loaded');

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'GENERATE_SUMMARY') {
      try {
        const summary = await generateSummary(message.content, message.title, message.contentType);
        return { success: true, summary };
      } catch (error) {
        console.error('Error generating summary:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }
    }
  });
});

async function generateSummary(content: string, title: string, contentType: string): Promise<string> {
  // Get OpenAI API key from storage
  const result = await browser.storage.sync.get(['openaiApiKey']);
  const apiKey = result.openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set it in the extension popup.');
  }

  // Prepare the prompt based on content type
  const prompt = createSummaryPrompt(content, title, contentType);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error('No summary generated from OpenAI API');
    }

    return summary;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to OpenAI API');
  }
}

function createSummaryPrompt(content: string, title: string, contentType: string): string {
  // Truncate content if too long (GPT-3.5-turbo has token limits)
  const maxContentLength = 8000; // Conservative limit
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...[content truncated]'
    : content;

  const contentTypeInstructions = {
    article: 'This is a news article. Focus on the main story, key facts, and important details.',
    blog: 'This is a blog post. Summarize the main points and key insights shared by the author.',
    documentation: 'This is technical documentation. Focus on the main concepts, procedures, and important information.',
    general: 'This is web content. Provide a clear summary of the main information and key points.'
  };

  const instruction = contentTypeInstructions[contentType as keyof typeof contentTypeInstructions] || contentTypeInstructions.general;

  return `Please provide a concise summary of the following ${contentType} titled "${title}".

${instruction}

Keep the summary between 100-300 words and structure it with clear paragraphs. Focus on the most important information.

Content:
${truncatedContent}`;
}
