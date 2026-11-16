# Partner verification and return

Send a signed-in partner user to Kimlik to verify one account detail, then re-read their verification status on your backend. The return page is navigation, not proof of verification.

## Link

Build the URL with URLSearchParams so the entire return URL is encoded once:

```js
const verificationUrl = new URL('https://kimlik.az/az/settings/verification');
verificationUrl.search = new URLSearchParams({
  client_id: KIMLIK_CLIENT_ID,
  return_to: 'https://toy.az/settings/verification',
  need: 'phone',
}).toString();
```

The return path above is illustrative; toy.az must supply an actual route that performs the re-check. For a registered `https://example.com/oauth/callback` origin, a fully encoded example is:

```text
https://kimlik.az/az/settings/verification?client_id=11111111-1111-4111-8111-111111111111&return_to=https%3A%2F%2Fexample.com%2Fsettings%3Ftab%3Dverification&need=phone
```

The UUID is a placeholder. Use your registered client ID, never the client secret. Use `/en/` or `/ru/` for those languages. The `/az/` prefix may be canonicalized to the unprefixed Azerbaijani URL while keeping the query string.

All three parameters are required for a partner request. `need` is exactly `phone`, `email`, or `id`. Duplicate parameters are rejected by the page. A direct visit without these parameters retains the ordinary verification settings.

## Return URL restrictions

Kimlik validates the request through `POST https://api.kimlik.az/api/oauth/verification-request`, with a JSON body containing the three parameters. It returns only the registered display name, validated return URL and requested step. It is public and rate limited; it does not authenticate a partner or grant access to any user data.

The OAuth client must exist, be active and not be deleted. The return URL must be an absolute HTTP(S) URL whose origin matches one of that client's registered HTTP(S) redirect URI origins. Scheme, hostname and effective port must match; the default 443/80 port and hostname case are normalized. Paths, query strings and fragments can differ. Subdomains are different origins. Custom app schemes, protocol-relative URLs, credentials in URLs, backslashes, malformed hosts and control characters are rejected. Native-only clients need a registered web callback origin before using this web return flow.

Do not put secrets, access tokens, phone numbers or email addresses in `return_to`. Use a server-side session or an opaque, session-bound nonce if you need to resume a particular action. Partner return endpoints must enforce their own safe onward redirects.

## User flow

Kimlik validates the link before showing a request. If sign-in is needed, the local login return URL preserves the complete verification link and language. Expired Kimlik sessions are cleared before sign-in. Password and existing social login flows receive the same local continuation URL.

The page shows the registered client name and the requested verification method. Phone and email use the existing code verification endpoints. An account without email can supply it on this page. Existing phone delivery and billing policies are unchanged.

On successful verification, or if the requested detail is already verified, the page shows a return button and returns after three seconds. The user can pause the countdown and return manually. A failed code, an unrelated verified field, invalid partner link or failed status refresh never produces a success return. Status refreshes when the page regains focus.

ID limitation: Kimlik has an `id_verified_at` record but no online ID submission/review workflow. `need=id` explicitly explains that limitation and provides a status re-check. It only offers completion/automatic return when that account actually has `id_verified_at`. This change does not add an ID review system or mark identities verified.

No code, token or success claim is appended to the return URL. Keep the partner session tied to the same Kimlik user ID and re-check that ID on return; the user could sign in to a different Kimlik account in another tab.

## Re-check from the partner backend

Use the existing OAuth access token issued for that user's partner session, with the already granted `verification:read` scope:

```http
GET /api/oauth/user HTTP/1.1
Host: api.kimlik.az
Authorization: Bearer <user OAuth access token>
Accept: application/json
Cache-Control: no-cache
```

Expected shape:

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "verification": {
      "phone_verified": true,
      "email_verified": false,
      "verification_level": "basic"
    }
  }
}
```

Check the requested boolean for phone/email. For ID, require `verification_level === "verified"`. `basic` means phone or email is verified; it is not proof of ID verification. `unverified` means none are verified. The level is calculated from current verification timestamps, so it stays consistent after approval or removal.

`GET /api/oauth/user` reads current database records on every request and sends `Cache-Control: private, no-store`. The same existing access token sees the updated flags immediately after the verification endpoint commits its update; no fresh authorization is needed. Disable your own userinfo/session cache for this re-check. Update your local user verification fields from the response and require the returned ID to match the user who started verification.

If the token lacks `verification:read`, the verification object is absent. Treat that as unavailable, not verified; obtain consent for that scope through the normal OAuth flow. On 401, use the existing refresh flow or sign in again. Never accept a return query parameter as verification evidence.

## Validation

Backend tests cover allowed origins, open-redirect/parser tricks, default ports, inactive/deleted clients, missing/invalid parameters and all three needs. A SQLite in-memory integration test verifies phone/email through the real controllers with a mocked code verifier, then re-reads userinfo using the same OAuth token, including ID approval/removal and revoked token behavior. No real OTP is sent.

Frontend tests intercept all external traffic before navigation and block analytics explicitly. They cover login continuation, expired sessions, successful/failed verification, the three-second timer, pause/manual return, missing email, pending/approved ID and malformed links. Visual checks use 375px and 1440px widths in Azerbaijani, English and Russian.

Run from the isolated backend checkout with SQLite memory and a process-only test APP_KEY: `php artisan test`. Run frontend `npm ci`, `npm run build`, `npx tsc --noEmit --incremental false`, then `npm run test:verification`. Playwright uses Chrome and a temporary local server at localhost:3311. API calls are mocked in browser tests; backend tests separately exercise the actual validation and verification controllers.

## Production verification, 2026-11-15

Both repositories are deployed with the existing fast OAuth improvements preserved. The live smoke test used this registered toy.az client and its homepage as the return destination:

```text
https://kimlik.az/az/settings/verification?client_id=6039facf-cd51-4d07-914f-47aab516c2d8&return_to=https%3A%2F%2Ftoy.az%2F&need=phone
```

The homepage is a verified navigation destination for this smoke test, not a newly implemented toy.az verification callback. Partners must implement the backend userinfo re-check described above at their chosen return route. This change deploys Kimlik's flow only.

The live test used a disposable account, a reserved fictional phone number and a seeded, expiring OTP. Only the SMS-send response was intercepted in the browser. Code submission, authenticated user reads, OAuth userinfo and return navigation used production endpoints. SMS delivery and billing were not exercised or changed. The same OAuth token reported phone_verified=false before submission and true immediately afterward, with verification_level changing from unverified to basic. The synthetic account, OTP, OAuth token, session token and private fixture file were removed after the test. No real account was changed.

For a repeatable smoke check, the backend CLI-only `scripts/verification-return-smoke.php create` creates the narrowly restricted fixture. Capture stdout in a mode-600 file and pass it to frontend `node tests/check-verification-return-live.cjs <private-fixture.json> <output-directory>`. Never print or commit the fixture. Finish with `scripts/verification-return-smoke.php cleanup <fixture-user-id>` and remove the private file. The script refuses a phone already in use and cleanup accepts only the synthetic identity. It does not change global verification modes or add an HTTP test endpoint.
