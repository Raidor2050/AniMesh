import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

const noUnused = ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }]

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'scripts/*.mjs', 'src/shaders/milkdrop-generated.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { warnOnUnsupportedTypeScriptVersion: false },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Deliberate codebase conventions relaxed (documented in FINAL_AUDIT):
      '@typescript-eslint/no-unused-vars': noUnused,      // dead-code pass is tracked in Progress.md
      '@typescript-eslint/no-explicit-any': 'off',        // bridge/audio snapshots use any deliberately
      'no-empty': ['error', { allowEmptyCatch: true }],   // engine uses empty catch to swallow context errors
      'react-hooks/set-state-in-effect': 'off',           // stores push boot/mount state synchronously by design
      'react-hooks/immutability': 'off',                  // preview rule; flags hoisted fn decls used by useCallback (valid React 18)
    },
  },
)