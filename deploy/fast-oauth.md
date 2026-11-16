# OAuth deployment notes

Deploy the backend fast-authorization endpoint before the frontend. No migration is needed. Authentication, registered redirects, S256 PKCE and consent eligibility are checked on every fast request. If the API or cookie bridge is unavailable, the existing consent flow remains available.

Build with `npm ci` and `npm run build` in a separate server worktree. The build verifies and writes Brotli companions for static assets. Preserve the existing production environment. Switch the finished `.next` directory, restart only `next.wallet.az`, and clear the generated files in `/var/cache/nginx/kimlik-login` so a five-second HTML cache entry cannot refer to the previous build's chunks. Keep the previous `.next` directory for rollback.

Install the versioned nginx snippets from the GitHub-pulled checkout:

- `nginx/kimlik-fast-oauth-http.conf` goes in `/etc/nginx/conf.d/kimlik-fast-oauth-http.conf` (http context).
- `nginx/kimlik-fast-oauth-server.conf` goes in `/etc/nginx/conf.d/users/ugn/kimlik.az.ug2.news/fast-oauth.conf` (Kimlik's vhost only).

Run `nginx -t` before reload. The vhost already enables HTTP/2. The server snippet enforces HTTPS, preserves the public Host and X-Forwarded-Proto, serves immutable static files and precompressed Brotli, and proxies the login/session/authorization routes directly to Next on port 3033.

The cache accepts only responses marked `X-Kimlik-Public-Shell: 1`, for validated public client/redirect/language keys. Cookies, Authorization headers, RSC and router-prefetch requests bypass it. OAuth state, PKCE, session tokens and user data must never appear in the cached HTML. Do not remove the response-marker check, broaden the cache to authorization/session endpoints, or use a public cache for fallback login responses. Browser HTML responses remain private/no-store.

Validation:

```sh
npm run test:fast-oauth
npx tsc --noEmit --incremental false
node tests/check-fast-oauth-cache.cjs
node tests/measure-fast-oauth.cjs
node tests/measure-fast-oauth-popups.cjs
```

For signed-in smoke tests, the backend CLI utility can create a disposable, unverified identity with a one-hour token. Capture its output in a mode-600 local file; never print it, commit it, or use a real user's account. Pass that file to `tests/measure-fast-oauth-popups.cjs`. It establishes actual partner consent once, then checks successful popup closure with fresh browser contexts. Clean up both partner identities, the Kimlik identity and tokens, and the private local file afterward using the narrowly restricted cleanup utilities.

Rollback: remove only these two nginx snippets, validate/reload nginx, restore the retained `.next` build and restart `next.wallet.az`. Keep all source changes going through GitHub. The added backend endpoint can remain deployed during a frontend rollback.
