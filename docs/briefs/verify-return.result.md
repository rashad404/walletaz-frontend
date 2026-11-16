# Verify and return: deployed and verified

Date: 2026-11-15 (America/Chicago).

The previously tested verification-return branches are now merged with current main, pushed through GitHub, and deployed to both Kimlik repositories. The restored backend deploy key works. Live phone verification, immediate userinfo refresh, automatic return to toy.az, invalid-origin rejection and signed-out continuation all passed.

## Delivered behavior

- Verification accepts client_id, return_to and need=phone|email|id. The backend accepts only an active client's registered HTTP(S) redirect origins, matching scheme, host and effective port. Invalid, duplicate or ambiguous links fail closed.
- The settings page names the requesting client and shows the requested verification method. Sign-in preserves the complete local continuation and selected step, including the Apple flow.
- Successful or already-completed verification shows a named return button and a three-second automatic return, with an option to stay. Failed verification or an unrelated verified field cannot trigger return.
- Userinfo with verification:read reads current verification timestamps and returns private/no-store. Partners can re-read the same OAuth token immediately after verification. Arrival at a return URL alone is never verification proof.
- The existing online ID limitation remains explicit: there is no ID submission/review workflow in this repository. need=id supports status rechecking and returns only when actual id_verified_at exists; this change does not invent an ID approval workflow.

## Final validation

- Backend full suite: 23 tests, 207 assertions passed with SQLite memory, null logging and a process-only test key. Includes real phone/email verification controllers with mocked delivery-code validation, same-token userinfo updates, ID approval/removal, missing scope, revocation and fast OAuth behavior.
- Frontend: 59 verification checks and 20 fast OAuth checks passed. Separate TypeScript validation, local production build and server production build passed.
- Local browser coverage includes login continuation, expired sessions, malformed/duplicate links, failed codes, exact three-second timing, pause/manual return, missing email, ID status and ordinary settings. The current merged build produced 48 state/language/theme screenshots.
- Live smoke test started on toy.az, navigated to the validated Kimlik phone request, submitted a one-time code to the real deployed verification endpoint, observed the named return button and returned automatically to https://toy.az/. The measured interval from visible completion to the loaded partner page was 3.614 seconds, including the partner navigation.
- Live OAuth userinfo using the same token changed immediately from phone_verified=false, verification_level=unverified to phone_verified=true, verification_level=basic. Both responses were private/no-store.
- Live invalid return_to=https://example.com/ for the toy.az client returned HTTP 422 and displayed no partner return link. Signed-out navigation preserved all parameters in the login continuation.
- Live request, completion and invalid-link screens were opened and visually inspected at 1440 and 375 pixels. No horizontal overflow. Local Azerbaijani request screens were also inspected at both widths. Prior detailed multilingual/state review remains in the initial report.
- Analytics were blocked before every browser navigation. The live test used a disposable identity, a reserved fictional phone and a seeded expiring OTP. Only SMS delivery was intercepted; code verification, userinfo and navigation were live. No SMS, email, paid job or real user was involved. This is not a test of carrier delivery.
- The synthetic identity, OTP and both kinds of token were removed, and the private local fixture was deleted. Cleanup receipt is saved with the evidence. No partner account was created by this verification-only check.

## Deployment

Backend runtime: 2ada801, including the original 2cd0175 verification change and current fast OAuth main. Frontend runtime: ae572cf, merging original 0041585 with current main 639f94a. The only merge conflict was package.json test commands; both commands are retained. Later commits contain documentation and a live-test harness only.

The backend origin is now git@github-wallet-be:rashad404/walletaz-backend.git, as instructed. Both production checkouts pulled main through GitHub. No source files were copied over SSH. The backend route cache was cleared; no migration or dependency change was needed. The frontend built in an isolated server worktree, then its completed .next directory was switched into place and only next.wallet.az was restarted. The five-second login cache was cleared to prevent stale chunk references. Existing fast OAuth nginx configuration and Brotli delivery remain in place.

The server's public/.htaccess edit and all pre-existing environment/build backups were preserved. Frontend rollback build: /home/ugn/next.wallet.az/.next-before-verify-return-20261115. The temporary server worktree was removed after deployment. Local work remains in .local/verify-return/frontend and .local/verify-return/backend, preserving unrelated edits in the original checkouts.

## Documentation and evidence

Partner instructions: docs/partner-verification.md, including an encoded example URL, origin rules, sign-in behavior, ID limitation and the exact authenticated GET https://api.kimlik.az/api/oauth/user call. The partner must bind the initiating session to the returned Kimlik user ID and bypass its own cached userinfo. This task did not add a verification callback route to toy.az.

Evidence: docs/briefs/verify-return-live-qa/ contains live-checks.json, cleanup.json, tested-url.txt, live desktop/mobile screenshots, current local screenshots and frontend validation logs. The earlier blocked report is archived as verify-return.initial.result.md.
