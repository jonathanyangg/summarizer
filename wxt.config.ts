import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Page Summaries',
    description: 'Smart AI-powered web page summaries by Solve-AI.org',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://api.openai.com/*'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
