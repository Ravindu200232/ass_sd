import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // ----------------------------------------------------------------------
      // V-13: make the XSS sinks un-reintroducible.
      //
      // The stored XSS in this application existed because receipts and
      // reports are built as template strings and handed to document.write(),
      // bypassing React's automatic escaping entirely. The fix was to escape
      // every interpolation - but a fix that relies on the next developer
      // remembering is not a fix. These rules fail the build instead.
      //
      // The remaining document.write() call sites carry a line-level disable
      // directive together with a note stating that every interpolation is
      // escaped. That comment is the review checkpoint.
      // ----------------------------------------------------------------------
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'write',
          message:
            'document.write() bypasses React escaping. Build the DOM with textContent, or escape every interpolation with escapeHtml() from @/lib/escapeHtml and disable this rule on the line with a justification. [V-13]',
        },
        {
          object: 'document',
          property: 'writeln',
          message: 'See document.write. [V-13]',
        },
        {
          property: 'innerHTML',
          message:
            'Assigning innerHTML is an XSS sink. Use textContent, or escapeHtml() from @/lib/escapeHtml if markup is genuinely required. [V-13]',
        },
        {
          property: 'outerHTML',
          message: 'Assigning outerHTML is an XSS sink. Use textContent. [V-13]',
        },
        {
          property: 'insertAdjacentHTML',
          message: 'insertAdjacentHTML is an XSS sink. Use textContent. [V-13]',
        },
      ],

      // eval / new Function / setTimeout("string") - none present today, and
      // this keeps it that way.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // V-13: flag React's own escape hatch. Done with no-restricted-syntax
      // rather than react/no-danger because eslint-plugin-react is not a
      // dependency of this project and adding one to enforce a single rule is
      // not worth the supply-chain surface (V-12).
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'dangerouslySetInnerHTML defeats React escaping. Render text, or sanitise first. [V-13]',
        },
        {
          // V-16: the bearer token must not be read out of localStorage in new
          // code. It is held in memory by @/lib/auth; see that module.
          selector:
            'CallExpression[callee.object.name="localStorage"][callee.property.name=/^(getItem|setItem)$/] > Literal[value=/authToken|auth_token/]',
          message:
            'Do not read or write the auth token in localStorage - any XSS can steal it. Use the accessors in @/lib/auth. [V-16]',
        },
        {
          // V-08/V-16: window.open without noopener leaks a live window.opener
          // reference to the opened page (reverse tabnabbing).
          selector:
            'CallExpression[callee.object.name="window"][callee.property.name="open"][arguments.length=2]',
          message:
            'window.open(url, "_blank") leaks window.opener. Pass "noopener,noreferrer" as the third argument.',
        },
      ],
    },
  },
  {
    // The escaping helper itself must be allowed to talk about these things.
    files: ['src/lib/escapeHtml.js', 'src/lib/escapeHtml.test.js'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Tests use vitest globals.
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
