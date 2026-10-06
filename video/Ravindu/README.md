# Ravindu video evidence pack

This folder contains Ravindu's video plan and the evidence checklist for his assigned security work.

## Ravindu's scope

- V-01 — unauthenticated registration could mint administrator access
- V-02 — administrator/privileged route checks were not consistently applied
- V-03 — cross-branch customer access (IDOR/BOLA)
- V-05 — authentication weaknesses: username enumeration, brute-force protection, password policy and self-service password change
- V-06 — token/session lifecycle and deactivated-user access
- Google OpenID Connect sign-in with Authorization Code + PKCE

V-04 is Malith's assigned vulnerability. Mention that ownership clearly if the video passes through V-04.

## Live demo tabs

- Original web: `http://localhost:5174`
- Secured web: `http://localhost:5173`
- Use the same local cashier account in both tabs. Type the password only into the local login form and keep it masked in every recording.
- `Ctrl+Tab` moves to the next tab; `Ctrl+Shift+Tab` returns to the previous tab.

## Recording rule for every screenshot

1. Move the cursor slowly to the field, link or button named in the script.
2. Pause for two seconds.
3. Take the screenshot while the cursor is still on that item.
4. After a click or form submission, wait for the page to finish loading, move the cursor to the result, pause, and take the next screenshot.
5. At code evidence, show the file path and the relevant lines, then circle the security control twice with the cursor.

The live demo deliberately does not create a new administrator through the vulnerable endpoint and does not deactivate a seeded employee. Those two actions would change the demonstration database. The route/test evidence is safer and is stronger proof for those API-only controls.

## Suggested video order

1. Short introduction.
2. V-01, original then secure.
3. V-02, original then secure.
4. V-03, original then secure live customer search.
5. V-05, original then secure login comparison.
6. V-06, source/test evidence.
7. Google OIDC evidence and conclusion.

The numbered scripts inside the child folders contain the exact words to say and the exact screenshot names to use in the recording/editing timeline.

## Screenshot file note

The live browser screenshots were surfaced during the Codex browser run above. The browser-control tool displays those images but does not automatically write the image bytes into the workspace folders. Use the exact screenshot names in each script when saving the displayed capture or when taking the same frame during the screen recording. The scripts are already arranged so the screenshots can be dropped into the matching vulnerability folder without renaming the plan.
