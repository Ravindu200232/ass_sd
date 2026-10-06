/**
 * Client half of the Google OpenID Connect sign-in.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO
 * ---------------------------------------
 * It does not generate or hold the PKCE code_verifier, and it never sees the
 * nonce. In the usual browser-side PKCE arrangement the SPA generates the
 * verifier and keeps it in sessionStorage until the exchange. This application
 * already has a backend that is a confidential OAuth client, so the verifier,
 * the nonce and the client secret all stay there, held against the `state`
 * value for five minutes.
 *
 * That matters because of V-13: this app had a stored XSS. Anything the page
 * holds, an injected script can read. The browser therefore carries only the
 * opaque `state`, which is useless on its own - an attacker who steals it still
 * cannot complete somebody else's sign-in, because they cannot produce the
 * verifier and the server destroys the flow the first time it is used.
 *
 * WHY `state` IS STORED IN sessionStorage HERE
 * --------------------------------------------
 * Not as a secret - the server already holds the authoritative copy and expires
 * it. It is kept so the callback page can notice when it is handed a `state`
 * that this tab never issued, and refuse before making any network call. The
 * server performs the real check.
 */

import api from "@/lib/api";

const STATE_KEY = "pos.oauth.state";

const safeSet = (k, v) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* private mode: the server-side check still applies */
  }
};

const safeGet = (k) => {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

const safeRemove = (k) => {
  try {
    window.sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
};

/**
 * Start a sign-in: ask the backend for an authorize URL, then navigate to it.
 *
 * A full-page navigation, not a popup: popups are blocked by default on many
 * shop terminals, and Google refuses to render its consent screen inside an
 * iframe (X-Frame-Options) for exactly the clickjacking reason this project
 * fixed in V-18.
 */
export async function beginGoogleSignIn() {
  const response = await api.get("/auth/google/redirect");

  const { authorize_url: authorizeUrl, state } = response.data?.data ?? {};

  if (!authorizeUrl || !state) {
    throw new Error("Google sign-in is not available right now.");
  }

  safeSet(STATE_KEY, state);

  // Hand control to Google. Everything after this happens on their origin.
  window.location.assign(authorizeUrl);
}

/**
 * Finish a sign-in: exchange the code the callback URL carries.
 *
 * @param {string} code  the authorization code from ?code=
 * @param {string} state the value from ?state=
 * @returns {Promise<{user: object, token: string}>}
 */
export async function completeGoogleSignIn(code, state) {
  const expected = safeGet(STATE_KEY);

  // Local pre-check. The server does the authoritative one - it is the side
  // that holds the verifier and the nonce - but failing here avoids sending a
  // code that plainly did not originate in this tab.
  if (expected && expected !== state) {
    safeRemove(STATE_KEY);
    throw new Error("This sign-in did not start in this browser tab. Please try again.");
  }

  safeRemove(STATE_KEY);

  const response = await api.post("/auth/google/callback", { code, state });

  const data = response.data?.data;

  if (!data?.token || !data?.user) {
    throw new Error("Google sign-in did not complete. Please try again.");
  }

  return data;
}

/** Clear any half-finished flow, e.g. when the user navigates away. */
export function abandonGoogleSignIn() {
  safeRemove(STATE_KEY);
}
