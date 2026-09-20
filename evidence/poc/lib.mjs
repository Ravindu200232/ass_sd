/**
 * SE4030 Secure Software Development - PoC support library
 *
 * Shared helpers for the vulnerability proof-of-concept suite.
 * Every PoC is written so that it SUCCEEDS (status "VULNERABLE") against the
 * original application at tag v0-original-vulnerable, and FAILS (status
 * "FIXED") once the corresponding remediation commit is applied.
 */

export const BASE = process.env.POC_BASE || 'http://127.0.0.1:8000/api';

/** ANSI colours - disabled automatically when output is piped to a file. */
const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColour ? `\x1b[${code}m${s}\x1b[0m` : s);
export const red = (s) => paint('31;1', s);
export const green = (s) => paint('32;1', s);
export const yellow = (s) => paint('33;1', s);
export const grey = (s) => paint('90', s);
export const bold = (s) => paint('1', s);

/**
 * Minimal HTTP wrapper. Never throws on a non-2xx - PoCs need the status and
 * body of failures just as much as successes.
 */
export async function http(method, path, { token, body, headers = {}, raw = false } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const h = { Accept: 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined && !h['Content-Type']) h['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
      redirect: 'manual',
    });
  } catch (e) {
    return { ok: false, status: 0, data: null, text: String(e), headers: new Headers(), networkError: true };
  }

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not JSON - keep raw text */ }
  return { ok: res.ok, status: res.status, data, text: raw ? text : text.slice(0, 4000), headers: res.headers };
}

export const get = (p, o) => http('GET', p, o);
export const post = (p, body, o = {}) => http('POST', p, { ...o, body });
export const put = (p, body, o = {}) => http('PUT', p, { ...o, body });
export const del = (p, o) => http('DELETE', p, o);

/** Log in and return the bearer token, or null if the credentials are refused. */
export async function login(username, password) {
  const r = await post('/login', { username, password });
  return r.data?.data?.token ?? null;
}

// ---------------------------------------------------------------------------
// Result recording
// ---------------------------------------------------------------------------

export const results = [];

/**
 * Record the outcome of one PoC.
 *
 * @param {string}  id        Vulnerability id, e.g. "V-01"
 * @param {string}  title     Human readable name
 * @param {string}  owasp     OWASP category
 * @param {boolean} exploited true when the attack still works
 * @param {string}  detail    Evidence line shown under the result
 */
export function record(id, title, owasp, exploited, detail) {
  results.push({ id, title, owasp, exploited, detail });
  const tag = exploited ? red(' VULNERABLE ') : green('   FIXED    ');
  console.log(`${tag} ${bold(id)}  ${title}`);
  console.log(`${grey('             ' + owasp)}`);
  for (const line of String(detail).split('\n')) {
    console.log(grey('             ' + line));
  }
  console.log();
}

/** Record a PoC that could not run (missing fixture, server down, ...). */
export function skip(id, title, reason) {
  results.push({ id, title, owasp: '', exploited: null, detail: reason });
  console.log(`${yellow('  SKIPPED   ')} ${bold(id)}  ${title}`);
  console.log(grey('             ' + reason));
  console.log();
}

export function summary() {
  const exploited = results.filter((r) => r.exploited === true);
  const fixed = results.filter((r) => r.exploited === false);
  const skipped = results.filter((r) => r.exploited === null);

  console.log(bold('='.repeat(72)));
  console.log(bold(' SUMMARY'));
  console.log(bold('='.repeat(72)));
  console.log(`  ${red('Still exploitable')} : ${exploited.length}  ${exploited.map((r) => r.id).join(' ')}`);
  console.log(`  ${green('Fixed')}             : ${fixed.length}  ${fixed.map((r) => r.id).join(' ')}`);
  if (skipped.length) {
    console.log(`  ${yellow('Skipped')}           : ${skipped.length}  ${skipped.map((r) => r.id).join(' ')}`);
  }
  console.log(bold('='.repeat(72)));
  console.log(grey(`  target: ${BASE}`));
  console.log(grey(`  run at: ${new Date().toISOString()}`));
  return exploited.length;
}

export function banner(phase) {
  console.log();
  console.log(bold('='.repeat(72)));
  console.log(bold(` SE4030 - Vulnerability proof-of-concept suite  [${phase}]`));
  console.log(bold(` target: ${BASE}`));
  console.log(bold('='.repeat(72)));
  console.log();
}
