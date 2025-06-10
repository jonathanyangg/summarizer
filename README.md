# Page Summarizer Browser Extension

An AI-powered browser extension that summarizes web pages, similar to Arc Browser's built-in page summarizer. Built with WXT, React, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Summaries**: Uses OpenAI GPT-3.5-turbo to generate concise, informative summaries
- 🎯 **Smart Content Detection**: Automatically identifies and extracts main content from web pages
- 🎨 **Clean UI**: Floating summary button and modal with modern design
- 📱 **Responsive**: Works seamlessly across different websites and screen sizes
- 🔒 **Privacy-Focused**: Your API key is stored locally in the browser
- ⚡ **Fast**: Optimized content extraction and API calls

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd summarizer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the extension**
   ```bash
   pnpm run build
   ```

4. **Load in browser**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `.output/chrome-mv3` folder

## Setup

1. **Get an OpenAI API key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key

2. **Configure the extension**
   - Click the extension icon in your browser toolbar
   - Enter your OpenAI API key
   - Click "Save API Key"

## Usage

1. **Visit any article or blog post** with substantial content
2. **Look for the blue floating button** in the bottom-right corner
3. **Click the button** to generate an AI summary
4. **Read the summary** in the clean modal interface
5. **Copy the summary** if needed using the copy button

## Supported Content Types

The extension works best with:
- News articles
- Blog posts
- Documentation pages
- Long-form content
- Academic papers

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm dev:firefox` - Development for Firefox
- `pnpm build:firefox` - Build for Firefox

### Project Structure

```
entrypoints/
├── background.ts          # Handles OpenAI API calls
├── content/
│   ├── index.tsx         # Main content script with React components
│   ├── ContentExtractor.ts # Smart content extraction logic
│   ├── SummaryButton.tsx # Floating summary button
│   └── SummaryModal.tsx  # Summary display modal
└── popup/
    └── App.tsx           # Extension popup for settings
```

## Technical Details

- **Framework**: WXT (Web Extension Toolkit)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **AI Provider**: OpenAI GPT-3.5-turbo
- **Content Extraction**: Custom algorithm with smart selectors
- **Storage**: Chrome Extension Storage API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
