# Fast OAuth Round 2 result

Date: 2026-11-15

The requested Round 2 mechanisms are implemented and deployed through GitHub. The raised acceptance targets are NOT met: final cold-browser median form visibility is 0.776 seconds for toy.az and 0.949 seconds for Wisher; successful signed-in popup closure is 2.098 and 2.360 seconds. These exceed the requested 0.6-second and 0.4-second limits.

## Cold measurements

Same Mac mini connection and headless Chrome, no throttling, three fresh browser contexts per partner. Browser caches start empty, service workers are blocked, and analytics are blocked before navigation. Public server caches may warm normally. Network idle includes Playwright's 500 ms quiet window.

The comparable signed-out test retains Round 1's entry points: navigation to toy.az's popup entry, and a click on Wisher's actual login link after its parent page becomes idle. Signed-in measurements use actual parent login buttons on both sites, an authenticated session with existing consent, and confirm the partner's successful authentication message as well as popup closure. Session setup is outside the timed interval. Every final signed-in run succeeded and loaded zero Kimlik page scripts.

| Partner | Original form | Round 1 form | Round 2 form | Original idle | Round 1 idle | Round 2 idle | Round 2 signed-in close |
| --- | --- | --- | --- | --- | --- | --- | --- |
| toy.az | 2.122 s | 0.989 s | 0.776 s | 4.065 s | 1.685 s | 2.146 s | 2.098 s |
| wisher.az | 1.953 s | 1.383 s | 0.949 s | 3.605 s | 1.724 s | 1.950 s | 2.360 s |

Final raw runs, milliseconds:

| Partner | Form visible | Network idle | Signed-in close |
| --- | --- | --- | --- |
| toy.az | 872, 731, 776 | 2146, 1849, 2193 | 2098, 1854, 4896 |
| wisher.az | 1015, 850, 949 | 2181, 1847, 1950 | 2360, 2130, 2868 |

Form visibility improved; final network idle did not improve over Round 1. Earlier Round 2 actual-click signed-out medians were 0.812 seconds for toy.az and 0.782 seconds for Wisher. They are retained as intermediate evidence, not substituted for the final comparable measurements.

Shared-server contention was substantial during testing: 12 logical CPUs, load averages 18.24, 16.37, 11.52, with busy PHP-FPM and MariaDB processes. Diagnostic static-chunk first bytes exceeded two seconds. Completed high-load measurements and timeout notes are retained. One parent-page load and a subsequent popup-close attempt timed out; the final rerun succeeded for all six signed-in cases. No unrelated workloads were stopped. Server contention is an observed contributor, not proof of what latency would be on an idle server.

Partner startup and callback work also remain on the critical path. An earlier successful toy trace reached the Kimlik 302 at 731 ms and callback HTML at 1378 ms; Wisher reached the Kimlik 302 at 764 ms and completed its callback API at 1898 ms. Removing the Kimlik page render alone does not meet the end-to-end closure target. Partner callback performance and shared-server capacity remain unresolved.

## Implemented changes

- Signed-out authorization redirects immediately to login without authorization-page JavaScript. Prefixed and unprefixed Azerbaijani routes retain state and PKCE without a locale-removal hop. Round 1's parallel metadata fetching, server-rendered partner branding, five-minute config cache, deferred Telegram/Apple modules and disabled registration/reset prefetch remain in place.
- A static public login shell uses only validated client, redirect and language data, with 60-second Next revalidation. It is fetched through a canonical URL without the original query; this prevents Next's serialized router data from leaking OAuth state or PKCE into shared HTML. Session-specific return handling occurs after paint.
- Nginx micro-caches eligible public shells for five seconds. Cookies, Authorization, RSC and router-prefetch headers bypass it. Only responses explicitly marked as a public shell may enter the cache; fallback HTML cannot. Authorization and session endpoints remain private/no-store, as do browser HTML responses. Tests prove different states produce byte-identical cached HTML without either state or PKCE.
- CSS is inlined, eliminating the blocking stylesheet request. This currently inlines the full application CSS rather than extracting only above-the-fold rules. Local Inter fonts preload with swap fallback. Login route entry JavaScript is 222 bytes and the shell entry 337 bytes; first-load JavaScript remains about 132 kB including 102 kB shared framework code. The main saving is removing page and request stages, not a large framework reduction.
- Kimlik's nginx vhost proxies these routes directly to Next with the public host and HTTPS scheme preserved. Static assets are immutable for one year and served directly, with verified precompressed Brotli files and gzip fallback. HTTP/2 is active. The build generated 58 Brotli companions, reducing 1,714,165 raw bytes to 487,443 bytes. Live decompressed JavaScript matches the build.
- A same-origin session bridge validates the bearer token and stores it in a Secure, HttpOnly, SameSite=Lax host cookie. Login and provider callbacks await this bridge before returning to authorization. Logout clears it. Existing localStorage sessions upgrade on ordinary pages or through one legacy authorization pass; a session known only to localStorage cannot use the server fast path until bridged.
- The authenticated backend fast endpoint checks registered redirects, S256 PKCE, state, scopes and consent eligibility before creating the existing one-use authorization code. First-party identity scopes or a single live grant covering every requested scope qualify. Explicit prompts, new scopes, missing consent or errors retain the existing consent path. The middleware issues a validated private 302 directly to the partner. Existing token expiry and authentication/2FA requirements remain enforced.

## Validation and cleanup

- Frontend: 20 fast-OAuth checks passed; separate TypeScript checking and local/production builds passed.
- Backend: FastOAuthTest, NativeOAuthCallbackTest and AppleSignInTest passed, 17 tests and 134 assertions. No migration was needed.
- Live checks passed for cache MISS/HIT behavior, state isolation, cookie/foreign-origin bypass, public redirect origin, immutable assets, Brotli content integrity and HTTP/2.
- Both partner popups were rendered and visually inspected at 1440 and 375 pixels. Inputs and partner branding are visible, with no horizontal overflow or initial Telegram, Google Fonts, browser metadata, authorization-script or unwanted prefetch requests.
- Actual signed-in partner callbacks were tested using a disposable unverified identity with no phone and a short-lived token. The synthetic accounts on toy.az, Wisher and Kimlik, central tokens and private local credential file were removed. Cleanup receipts contain no credentials. No real user's credentials, paid API jobs, SMS or email were used.

## Deployment and reproduction

Frontend source through `5381b18` and backend through `c9cafce` were pushed to main and feat/fast-oauth, then pulled on production. The application build is from `2b2b350`; the later frontend commit adds static precompression and nginx delivery. Nginx configuration is versioned and was installed from the GitHub-pulled checkout, checked with nginx -t and reloaded. Existing unrelated edits were preserved. Backend access used an ephemeral forwarded SSH agent without changing keys or access configuration.

Frontend builds ran in a separate server worktree while production stayed online. Only the Kimlik PM2 application was restarted. The Round 1 compiled rollback remains at `/home/ugn/next.wallet.az/.next-before-fast-oauth-r2`; further intermediate builds are also retained. Deployment, cache invalidation and rollback instructions are in `deploy/fast-oauth.md` in the frontend repository.

Reproduce with `node tests/measure-fast-oauth.cjs`, `node tests/measure-fast-oauth-popups.cjs` and `node tests/check-fast-oauth-cache.cjs`. Signed-in measurement requires the disposable-session setup and cleanup documented in the deployment notes.

Final evidence is in `fast-oauth-round2-qa/final-signed-out-comparable.json`, `final-signed-in-click.json`, `cache-checks.json`, `brotli-check.json`, `live-checks.json`, `cleanup.json` and the desktop/mobile screenshots. Intermediate and high-load results remain alongside them. The previous report is preserved as `fast-oauth.round1.result.md`, with its original evidence in `fast-oauth-qa/`.
