/**
 * Security-only lint gate.  [V-13 / V-16]
 *
 * WHY A SECOND CONFIG
 * -------------------
 * `npm run lint` currently reports ~126 pre-existing errors in this codebase,
 * almost all of them `no-unused-vars`. None are security defects, and clearing
 * them would mean touching dozens of files that this security remediation has
 * no other reason to change - burying the security diff in unrelated noise and
 * making the whole thing unreviewable.
 *
 * So the security rules get their own config and their own script, and CI gates
 * on THIS one:
 *
 *     npm run lint:security      must pass, and does
 *     npm run lint               the full sweep, still failing on old debt
 *
 * That way reintroducing an XSS sink breaks the build immediately, while the
 * unused-variable cleanup can be scheduled separately on its own merits. The
 * remaining debt is recorded in the report as NF-6.
 *
 * Deliberately no `extends: js.configs.recommended` here - the point is a sharp
 * gate that fails only on the things this project fixed.
 */
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

const XSS_SINKS = [
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
]

const RESTRICTED_SYNTAX = [
  {
    // no-restricted-properties with {object: 'document', property: 'write'}
    // only matches the bare identifier `document`. Every call site in this app
    // is `printWindow.document.write(...)`, where the object is the member
    // expression `printWindow.document` - so the rule silently missed all
    // seven of them. This selector catches `<anything>.document.write(...)`.
    selector:
      'CallExpression[callee.property.name=/^(write|writeln)$/][callee.object.property.name="document"]',
    message:
      'document.write() on another window bypasses React escaping. Escape every interpolation with escapeHtml() from @/lib/escapeHtml and disable this rule on the line with a justification. [V-13]',
  },
  {
    selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
    message:
      'dangerouslySetInnerHTML defeats React escaping. Render text, or sanitise first. [V-13]',
  },
  {
    selector:
      'CallExpression[callee.object.name="localStorage"][callee.property.name=/^(getItem|setItem)$/] > Literal[value=/authToken|auth_token/]',
    message:
      'Do not read or write the auth token in localStorage - any XSS can steal it. Use the accessors in @/lib/auth. [V-16]',
  },
  {
    selector:
      'CallExpression[callee.object.name="window"][callee.property.name="open"][arguments.length=2]',
    message:
      'window.open(url, "_blank") leaks window.opener to the opened page (reverse tabnabbing). Pass "noopener,noreferrer" as the third argument.',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'public/sw.js']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-properties': ['error', ...XSS_SINKS],
      'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // The escaping helper and its tests must be able to name these things.
    files: ['src/lib/escapeHtml.js', 'src/lib/escapeHtml.test.js'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },
])
