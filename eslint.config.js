import js from '@eslint/js'
import ts from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
export default defineConfig([
  { ignores: ['dist', 'test-results', 'playwright-report'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [js.configs.recommended, ...ts.configs.recommended],
  },
])
