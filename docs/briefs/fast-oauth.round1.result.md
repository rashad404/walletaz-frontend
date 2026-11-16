# Fast OAuth login result

Date: 2026-11-15

Implemented and deployed through GitHub to the Kimlik frontend. Runtime commit: `06798d4`, following `8f5cd43` and `18143e5`. No backend deployment or backend repository access was required.

The toy.az median reached the first-input target. Wisher improved but remains above one second. The target was not met on every individual run.

## Measurements

Headless Chrome on the same Mac mini connection, without throttling, three fresh browser contexts per partner before and after. Contexts have empty browser caches and blocked service workers. Analytics requests are aborted before navigation. Public server metadata caches are allowed to warm normally; the first post-deployment run is included. Network idle includes Playwright's 500 ms quiet window.

Toy timing starts at navigation to its popup entry, `/auth/kimlik?popup=1`. Wisher timing starts at clicking the real site's "Daxil ol" link after the parent page is idle, and ends in the resulting popup. Wisher opens Kimlik through its own flow; `/auth/kimlik` on wisher.az is not a valid entry and those exploratory attempts are excluded. Before and after use the same entry for each partner. Medians:

| Partner | First input before | First input after | Network idle before | Network idle after |
| --- | --- | --- | --- | --- |
| toy.az | 2.122 s | 0.989 s | 4.065 s | 1.685 s |
| wisher.az | 1.953 s | 1.383 s | 3.605 s | 1.724 s |

Final raw runs, milliseconds:

| Partner | Run | First input | Network idle |
| --- | --- | --- | --- |
| toy.az | 1 | 1928 | 2133 |
| toy.az | 2 | 862 | 1685 |
| toy.az | 3 | 989 | 1649 |
| wisher.az | 1 | 1477 | 1694 |
| wisher.az | 2 | 1359 | 1724 |
| wisher.az | 3 | 1383 | 2396 |

The slowest first toy run was 1.928 seconds; this is not a guarantee of sub-second loading. Wisher's median is still 1.383 seconds. The remaining end-to-end time includes partner startup, cold connections, the required server redirect, HTML and static asset delivery. A diagnostic trace before the font change showed about 0.70 seconds in toy plus Kimlik connection/redirect setup before the login response, and a further chained Google stylesheet/font download. The font chain has now been removed. No latency claim is based on localhost measurements.

Reproduce from the frontend checkout:

```sh
npm ci
node tests/measure-fast-oauth.cjs > measurement.json
```

## Changes

- Middleware sends visitors without a session hint directly from authorization to login. Signed-out visitors do not download or execute the authorization page. Both `/az/...` and unprefixed Azerbaijani URLs work without a locale-removal redirect. Explicit languages, saved preference and partner hints remain supported. OAuth query parameters, including state and PKCE, survive the redirect.
- The login page is a server component around the interactive form. Email/password inputs and validated partner name/logo data are in the initial HTML. Config, partner metadata and Apple availability start in parallel. Public config and Apple availability use a five-minute Next server cache; validated public partner metadata uses a one-minute cache. Failed metadata requests have a bounded timeout and fall back without blocking login indefinitely.
- Login pages receive public config and Apple availability from the server. They no longer fetch these or client branding after hydration. Middleware forwards the popup context to server layouts correctly.
- Telegram's widget, authentication handler and third-party scripts load after its button is tapped. The existing official widget and authentication/2FA behavior are retained. Apple's PKCE sign-in implementation loads on click; its available button remains in server-rendered HTML.
- Register and password-reset links do not prefetch. This includes the regular login header's registration link.
- The existing Inter UI font is served through Next's local font assets. Removed the chained Google Fonts stylesheet and unused Plus Jakarta Sans import. The unused DM Sans declaration no longer preloads a font. No redesign or new external links.

## Session behavior

The application stores bearer tokens in localStorage. The new `kimlik_session=1` cookie is a non-sensitive routing hint, not an authenticated session or an authorization credential. It uses Path=/, SameSite=Lax, a seven-day lifetime, and Secure on HTTPS. Token writes/removals across email, phone, registration, 2FA, provider callbacks, modal login, logout and API 401 handling now synchronize the hint.

Existing localStorage-only sessions bridge through login once and establish the hint. A stale hint with no token is cleared. An expired bearer token is cleared after the authorization API returns 401, preventing redirect loops. Consent and access still require successful backend bearer-token validation. Cookie-dependent redirects are private and no-store.

## Validation and bundle review

- Production build passed locally and on the production server.
- `npx tsc --noEmit --incremental false` passed separately because the project's build skips type checking.
- `npm run test:fast-oauth`: 13 passed. Coverage includes no-JavaScript form visibility; both Azerbaijani paths; English/Russian paths; state/PKCE preservation; saved/hinted language; signed-in hints; missing/expired token recovery; a mocked successful email login returning to authorization; deferred Telegram; no metadata/font requests or unwanted prefetching.
- Login route: 7.43 kB route JavaScript, 132 kB first-load JavaScript in the production build, including 102 kB shared framework JavaScript. The combined root/layout/login manifest assets are about 160 kB gzip, essentially unchanged in total; the main saving is eliminating the authorization download/render step and optional provider requests, rather than claiming a large framework bundle reduction.
- Live toy.az and wisher.az popups checked at 1440 and 375 pixels. Both display correct partner branding, visible inputs, no horizontal overflow, and no authorization-page JavaScript, browser metadata requests, Telegram requests, Google font requests, or register/reset prefetches on initial load. Screenshots were opened and visually reviewed.
- No real account passwords, SMS, emails, paid API jobs or external authentication-provider submissions were used. Email success and expired-token cases use local request mocks.

## Deployment and artifacts

Source was pushed to `rashad404/walletaz-frontend` main and `feat/fast-oauth`, then pulled on the server. Builds ran in a separate server worktree while the old build remained online. The finished `.next` directory was switched and only `next.wallet.az` was restarted. The original build is retained at `/home/ugn/next.wallet.az/.next-before-fast-oauth-20261115` for rollback. Existing local edits and unrelated server files were preserved.

Artifacts in `fast-oauth-qa/`: `before.json`, `after.json`, `live-checks.json`, desktop/mobile live partner screenshots, and desktop/mobile local popup and standalone login screenshots. `intermediate-before-local-fonts.json` records the earlier deployment measurement; the table above uses only the final deployment.
