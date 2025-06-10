import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Page Summarizer',
    description: 'AI-powered web page summarizer using OpenAI',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://api.openai.com/*'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
