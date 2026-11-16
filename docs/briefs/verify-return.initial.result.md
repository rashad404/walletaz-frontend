# Verify and return: implemented, deployment blocked

Date: 2026-11-15 (America/Chicago).

## Delivery

- Backend commit: 2cd0175c3c016fc16338ee8093aec0c3ab12d02e, Add validated partner verification returns.
- Frontend commit: 004158532d3f991af144911d620c5e69d7e44af3, Return partners after account verification.
- Both commits are pushed to GitHub branch feat/verification-return in their respective walletaz-backend and walletaz-frontend repositories.
- Backend worktree: /Users/macmini/projects/wallet/.local/verify-return/backend, based on production e13fd22.
- Frontend worktree: /Users/macmini/projects/wallet/.local/verify-return/frontend, based on production 1a5bc0f.
- Both worktrees are clean. Existing changes in the original checkouts were preserved.

## Implemented behavior

- Public, rate-limited POST /api/oauth/verification-request validates client_id, return_to and need. Only active, undeleted clients and registered HTTP(S) redirect origins are accepted. Scheme, hostname and effective port must match. No relative URLs, custom app schemes, embedded credentials, backslashes or control characters.
- Verification settings show the registered client name and requested phone/email/ID step. Invalid requests fail closed with no external return.
- Missing/expired sessions go through sign-in with the full local continuation URL and selected step preserved. Apple sign-in's local return allowlist now includes settings/verification.
- Successful or already-completed verification shows a named return button, returns after three seconds and allows the user to stay instead. Failed verification and unrelated verified fields do not trigger return.
- Users without an email address can enter it directly in the email verification step.
- Userinfo uses current verification timestamps and sends private, no-store cache headers. The partner's existing OAuth access token sees changes immediately when it has verification:read.
- ID limitation: the repository has ID verification records but no online submission/review workflow. The ID step explains that limitation, supports rechecking status, and returns only when id_verified_at exists. No ID approval bypass or invented workflow was added. A clarification was requested; no reply was received during implementation.
- Azerbaijani, English and Russian copy added. New Azerbaijani copy remains a draft for Rashad's wording review; this does not change the existing deployment authorization.

## Validation

- Backend full suite: 17 tests, 179 assertions passed, with forced SQLite :memory:, null logging, isolated test configuration and a process-only test APP_KEY.
- Includes real phone/email verification controllers with mocked code validation, reads through the same OAuth token before and after verification, ID approval/removal, missing scope and token revocation.
- Frontend: production build passed, separate TypeScript check passed, git diff --check passed.
- Playwright: 59 checks passed, including password login continuation, expired sessions, invalid/duplicate links, success/failure, three-second timing, cancellation/manual return, missing email, actual ID status, long names and original settings behavior.
- 48 screenshots captured and visually reviewed at 375 and 1440 in az/en/ru. Phone request states include light/dark. Completion, invalid request, ID, missing email, account-load error and long-name states were reviewed in all three languages at both widths.
- Visual evidence: docs/briefs/verify-return-qa/. Product-specific design notes: docs/design.md (also versioned in frontend/docs/design.md).
- Browser tests block analytics before navigation and block all other external traffic. They use mocked API responses. Backend tests independently exercise the actual validation and verification endpoints. No live OTP messages or paid jobs were sent, and no production users were changed.
- A browser-test URL mismatch between localhost and 127.0.0.1 initially caused a local middleware redirect loop; using localhost consistently fixed the harness without changing production routing.
- Visual checking caught mobile overflow from an unbroken long client name, which was fixed. The Apple continuation check found and fixed its missing local allowlist entry.

## Partner documentation

Read docs/partner-verification.md. It includes an example URL, origin rules, sign-in/return behavior, ID limitation and the exact authenticated GET https://api.kimlik.az/api/oauth/user call to make after returning. A versioned copy is in the backend branch at docs/partner-verification.md.

The partner must re-read userinfo with verification:read, bypass its own cached copy, check the Kimlik user ID matches the initiating partner session, and inspect the requested boolean or verification_level=verified for ID. Arrival at the return URL is not proof of verification.

## Deployment blocker and remaining work

Production has NOT been changed. No code was copied to the server and no alternate deployment transport was used.

- Server: 203.161.35.63, SSH port 21098.
- Backend: /home/ugn/api.wallet.az, current production HEAD e13fd22 on main.
- Frontend: /home/ugn/next.wallet.az, current production HEAD 1a5bc0f on main.
- As ugn, backend git ls-remote origin HEAD fails with "ERROR: Repository not found" and "Could not read from remote repository". The frontend repository read succeeds.
- The existing root deployment login also cannot read the backend repository: its normal attempt fails host-key verification; an attempt using the application's existing known_hosts file fails public-key authentication. No SSH keys, trust files, repository access or remote URLs were changed.
- The lead needs to restore the existing server deployment identity's read access to rashad404/walletaz-backend. This was requested during the task.
- Once access is restored, pull the tested backend branch through GitHub, regenerate production autoload/routes as appropriate, then pull/build the tested frontend branch with its production API URL and restart the existing next.wallet.az service. No database migration is needed.
- Preserve the server's existing public/.htaccess change and untracked environment/build backups.
- Finish with live endpoint and sign-in/return checks with analytics blocked. These live checks and production deployment remain undone because of repository access. Frontend deployment was held to avoid shipping a UI whose backend endpoint does not yet exist.
