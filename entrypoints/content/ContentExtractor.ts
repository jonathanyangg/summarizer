export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  wordCount: number;
  contentType: 'article' | 'blog' | 'documentation' | 'general';
}

export class ContentExtractor {
  private static readonly CONTENT_SELECTORS = [
    // Common article containers
    'article',
    '[role="main"]',
    'main',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.story-body',
    '.post-body',
    
    // Fallback selectors
    '.container',
    '#content',
    '#main',
  ];

  private static readonly EXCLUDE_SELECTORS = [
    'nav',
    'header',
    'footer',
    'aside',
    '.sidebar',
    '.navigation',
    '.menu',
    '.ads',
    '.advertisement',
    '.social-share',
    '.comments',
    '.related-posts',
    'script',
    'style',
    'noscript',
  ];

  static extractContent(): ExtractedContent | null {
    try {
      const title = this.extractTitle();
      const content = this.extractMainContent();
      
      if (!content || content.length < 100) {
        console.log('Content too short or not found');
        return null;
      }

      const wordCount = content.split(/\s+/).length;
      const contentType = this.detectContentType();

      return {
        title,
        content,
        url: window.location.href,
        wordCount,
        contentType,
      };
    } catch (error) {
      console.error('Error extracting content:', error);
      return null;
    }
  }

  private static extractTitle(): string {
    // Try multiple title sources
    const titleSources = [
      'h1',
      '.title',
      '.post-title',
      '.article-title',
      '.entry-title',
      'title',
    ];

    for (const selector of titleSources) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return document.title || 'Untitled Page';
  }

  private static extractMainContent(): string {
    // First, try to find the main content container
    let contentContainer = this.findMainContentContainer();
    
    if (!contentContainer) {
      // Fallback to body if no main container found
      contentContainer = document.body;
    }

    // Extract text content while preserving structure
    const textContent = this.extractTextFromElement(contentContainer);
    
    // Clean up the content
    return this.cleanContent(textContent);
  }

  private static findMainContentContainer(): Element | null {
    for (const selector of this.CONTENT_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        // Check if this element has substantial text content
        const textLength = element.textContent?.length || 0;
        if (textLength > 200) {
          return element;
        }
      }
    }
    return null;
  }

  private static extractTextFromElement(element: Element): string {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as Element;
    
    // Remove excluded elements
    this.EXCLUDE_SELECTORS.forEach(selector => {
      const excludedElements = clone.querySelectorAll(selector);
      excludedElements.forEach(el => el.remove());
    });

    // Extract text with some structure preservation
    const textParts: string[] = [];
    
    // Get headings first
    const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const text = heading.textContent?.trim();
      if (text) {
        textParts.push(`\n${text}\n`);
      }
    });

    // Get paragraphs and other text content
    const paragraphs = clone.querySelectorAll('p, div, section, li');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 20) {
        textParts.push(text);
      }
    });

    // If no structured content found, get all text
    if (textParts.length === 0) {
      return clone.textContent?.trim() || '';
    }

    return textParts.join('\n\n');
  }

  private static cleanContent(content: string): string {
    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  private static detectContentType(): 'article' | 'blog' | 'documentation' | 'general' {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    // Check for documentation sites
    if (url.includes('docs') || url.includes('documentation') || 
        title.includes('documentation') || title.includes('docs')) {
      return 'documentation';
    }
    
    // Check for blog indicators
    if (url.includes('blog') || url.includes('post') || 
        title.includes('blog') || document.querySelector('.blog, .post')) {
      return 'blog';
    }
    
    // Check for article indicators
    if (document.querySelector('article') || 
        document.querySelector('.article') ||
        url.includes('article')) {
      return 'article';
    }
    
    return 'general';
  }

  static isContentSummarizable(): boolean {
    const extracted = this.extractContent();
    return extracted !== null && extracted.wordCount >= 50;
  }
} 