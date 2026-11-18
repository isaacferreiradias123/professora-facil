import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const browsers = fileURLToPath(
  new URL(
    '../../../02_Ferramentas/_runtime/cache/ms-playwright/',
    import.meta.url,
  ),
)
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(browsers)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsers
}
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' },
    },
  ],
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
