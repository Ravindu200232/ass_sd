/**
 * Session storage for the POS client.  [V-16]
 *
 * WHAT WAS WRONG
 * --------------
 * The original module was eighteen lines that put the bearer token and the full
 * user record in localStorage and then answered authorisation questions from
 * them:
 *
 *   export const getAuthToken = () => localStorage.getItem('authToken');
 *   export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
 *   export const isAdmin = () => getUser()?.role === 'admin';
 *
 * Three distinct problems:
 *
 * 1. localStorage is readable by any JavaScript on the origin, it is never
 *    scoped to a tab, and it survives the browser being closed. Combined with
 *    the stored XSS in the print templates (V-13) and tokens that never expired
 *    (V-06), one poisoned customer name gave an attacker an administrator's
 *    credentials indefinitely.
 *
 * 2. `role` was read back out of that same writable storage and used to decide
 *    what the user may do (App.jsx:50 gates every admin route on it). Typing
 *    localStorage.setItem('user', JSON.stringify({role:'admin'})) into the
 *    console granted the admin UI.
 *
 * 3. On a shared shop terminal, logout cleared only 'authToken' and 'user',
 *    leaving invoice drafts, GRN drafts with cost prices, and the service
 *    catalogue behind for the next cashier to read out of DevTools.
 *
 * WHAT THIS DOES NOW
 * ------------------
 * The token lives in a module-scoped variable - ordinary memory, unreachable
 * from `localStorage` enumeration and gone the moment the tab closes. A mirror
 * is kept in sessionStorage purely so a page refresh does not log the cashier
 * out mid-sale; sessionStorage is per-tab and cleared when the tab closes,
 * which is a much better fit for a till than localStorage ever was.
 *
 * The user record is cached for DISPLAY ONLY, and every accessor that returns
 * it says so. Authorisation is decided by the server: AuthContext calls
 * GET /me on boot and uses the response as the authority on role, and the API
 * enforces roles with middleware regardless of what the client believes
 * (V-01/V-02).
 *
 * WHAT IS STILL NOT IDEAL (recorded as NF-2)
 * -----------------------------------------
 * The right answer is an httpOnly, SameSite=Strict cookie, which script cannot
 * read at all. That needs Sanctum's stateful SPA mode and a shared parent
 * domain, and this app is deployed cross-origin (Vercel frontend, shared-host
 * API). Until that changes, this is the best available: a smaller window, a
 * smaller blast radius, and XSS removed at source.
 *
 * OWASP A07:2021 Identification and Authentication Failures
 *       A01:2021 Broken Access Control (the role-trust half)
 * CWE-522 Insufficiently Protected Credentials
 * CWE-603 Use of Client-Side Authentication
 */

/** Per-tab mirror key. Deliberately NOT the old 'authToken' localStorage key. */
const TOKEN_KEY = "pos.session.token";
const USER_CACHE_KEY = "pos.session.user";

/**
 * Every key this application has ever written to browser storage.
 *
 * Kept in one place because logout must clear all of it. The first two entries
 * are the legacy localStorage keys: they are listed so that a browser which
 * still holds a token from before this fix is cleaned up on the next logout.
 */
const APP_STORAGE_KEYS = [
  // Legacy keys from the vulnerable version - cleaned up on sight.
  "authToken",
  "auth_token",
  "user",
  // Business data that logout used to leave behind on a shared terminal.
  "invoice drafts",
  "grn_drafts",
  "grn_report_data",
  "services",
  "invoice_services_v1",
  "auto_print_enabled",
];

/** In-memory token. Lost on tab close and on hard reload, by design. */
let tokenInMemory = null;

/** sessionStorage can throw in private mode or with site data blocked. */
function safeSessionGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* memory-only is an acceptable degradation */
  }
}

function safeSessionRemove(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* nothing to do */
  }
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export const getAuthToken = () => {
  if (tokenInMemory) return tokenInMemory;

  // Rehydrate after a page refresh within the same tab.
  tokenInMemory = safeSessionGet(TOKEN_KEY);

  return tokenInMemory;
};

export const setAuthToken = (token) => {
  tokenInMemory = token || null;

  if (token) {
    safeSessionSet(TOKEN_KEY, token);
  } else {
    safeSessionRemove(TOKEN_KEY);
  }
};

export const removeAuthToken = () => {
  tokenInMemory = null;
  safeSessionRemove(TOKEN_KEY);
};

// ---------------------------------------------------------------------------
// User record - DISPLAY ONLY
// ---------------------------------------------------------------------------

/**
 * The cached user record, for rendering a name in the header and similar.
 *
 * NEVER use the `role` on this object to decide whether an action is allowed.
 * It comes from storage the user can edit. AuthContext refreshes it from
 * GET /me on every app boot, and the API enforces roles server-side.
 */
export const getUser = () => {
  const raw = safeSessionGet(USER_CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Corrupt or tampered cache: treat as absent rather than throwing during
    // render.
    safeSessionRemove(USER_CACHE_KEY);

    return null;
  }
};

export const setUser = (user) => {
  if (!user) {
    safeSessionRemove(USER_CACHE_KEY);

    return;
  }

  safeSessionSet(USER_CACHE_KEY, JSON.stringify(user));
};

export const removeUser = () => safeSessionRemove(USER_CACHE_KEY);

/**
 * Clear every trace of the session, including the business data that the old
 * logout left behind on shared shop terminals.
 *
 * Called by AuthContext.logout() and by the 401 handler in lib/api.js.
 */
export const clearAllAppStorage = () => {
  removeAuthToken();
  removeUser();

  for (const key of APP_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    safeSessionRemove(key);
  }
};

/**
 * Convenience predicates for rendering only.
 *
 * These decide what to SHOW, never what to permit. The server refuses a
 * privileged call from a non-admin token whatever the UI thinks (V-01/V-02),
 * and it strips cost and margin fields from an employee's report payload rather
 * than relying on the client to hide them.
 */
export const isAdmin = () => getUser()?.role === "admin";
export const isEmployee = () => getUser()?.role === "employee";
