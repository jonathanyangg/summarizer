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

### Option 1: Install from Browser Store (Recommended)
*Coming soon - extension will be available on Chrome Web Store and Firefox Add-ons*

### Option 2: Manual Installation (Developer Mode)

#### For Chrome/Edge:
1. Download the latest release from [GitHub Releases](https://github.com/your-username/page-summarizer/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select the extracted folder
6. The extension icon should appear in your toolbar

#### For Firefox:
1. Download the Firefox version from [GitHub Releases](https://github.com/your-username/page-summarizer/releases)
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the downloaded ZIP file

### Option 3: Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/page-summarizer.git
   cd page-summarizer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the extension**
   ```bash
   # For Chrome/Edge
   pnpm run build
   
   # For Firefox
   pnpm run build:firefox
   ```

4. **Load in browser**
   - **Chrome/Edge**: Load the `.output/chrome-mv3` folder
   - **Firefox**: Load the `.output/firefox-mv2` folder

## Setup

1. **Get an OpenAI API key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - **Note**: You'll need to add credits to your OpenAI account for API usage

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
- Research papers
- Tutorial articles

## Privacy & Security

- **Your API key is stored locally** in your browser's extension storage
- **No data is sent to our servers** - communication is directly between your browser and OpenAI
- **Page content is only processed when you click the summary button**
- **Summaries are not stored** - they're generated fresh each time

## Troubleshooting

### Extension not working?
- Make sure you've entered a valid OpenAI API key
- Check that you have credits in your OpenAI account
- Try refreshing the page and clicking the summary button again

### No summary button visible?
- The button only appears on pages with substantial text content
- Try scrolling down - the button appears after content is detected
- Some websites may block content scripts - this is a browser security feature

### API errors?
- Verify your OpenAI API key is correct
- Check your OpenAI account has available credits
- Some pages may have content that's too long - try shorter articles

## Development

### Available Scripts

- `pnpm dev` - Start development server for Chrome
- `pnpm dev:firefox` - Start development server for Firefox
- `pnpm build` - Build for Chrome/Edge production
- `pnpm build:firefox` - Build for Firefox production
- `pnpm zip` - Create distributable ZIP for Chrome
- `pnpm zip:firefox` - Create distributable ZIP for Firefox

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

### Tech Stack

- **Framework**: WXT (Web Extension Toolkit)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **AI Provider**: OpenAI GPT-3.5-turbo
- **Content Extraction**: Custom algorithm with smart selectors
- **Storage**: Chrome Extension Storage API

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on multiple websites
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Test on both Chrome and Firefox
- Ensure the extension works on various website layouts
- Update documentation for new features

## Roadmap

- [ ] Publish to Chrome Web Store
- [ ] Publish to Firefox Add-ons
- [ ] Add support for more AI providers (Anthropic, Gemini)
- [ ] Implement summary history
- [ ] Add keyboard shortcuts
- [ ] Support for more languages
- [ ] Custom summary length options

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/your-username/page-summarizer/issues)
- 💡 **Feature requests**: [GitHub Discussions](https://github.com/your-username/page-summarizer/discussions)
- 📧 **Contact**: your-email@example.com

---

**⭐ If you find this extension helpful, please consider giving it a star on GitHub!**
