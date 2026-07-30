# PawPal Backend — Security Findings & Fixes

Audit of the Spring Boot backend during the `frontend/mobile` mapping. Each item lists the
risk, the fix applied, and anything you still need to do at deploy time.

---

## 🔴 Critical

### 1. `GET /api/users/{id}` minted a JWT for any user  *(fixed)*
`UserController.getUser` returned `AuthResponse` built by `toResponse()`, which calls
`jwtService.issue(...)`. The endpoint is not behind the auth filter, so **anyone could call
`GET /api/users/1` and receive a valid bearer token for that account** — a full auth bypass.
**Fix:** added `profileResponse()` (no token); `getUser` now returns the public profile only.
Tokens are issued exclusively by login/register. — `UserController.java`

### 2. Identity trusted from a client-supplied param (IDOR)  *(partially fixed)*
Per-user endpoints took `userId` from the query/body and trusted it, so changing the number
returned/modified another user's data.
**Fix applied:** `/api/notifications/*` is now behind `JwtAuthFilter`, and
`NotificationController` derives the user from the **token** (`list`, `unread-count`,
`read-all`), enforces recipient ownership on `PUT /{id}/read` (403 on mismatch), and stamps the
sender from the token on `POST` (no more `senderId` spoofing). — `WebConfig.java`, `NotificationController.java`
**Remaining (by design, tracked in the mapping):** the other write endpoints still accept a
client id — `POST /api/pets` (`ownerId`), `POST /api/marketplace/items` (`sellerId`),
`POST /api/invitations` (`organizerId`), `/api/invitations/{id}/join` (`userId`),
`GET /api/pets/owner/{id}`, `GET /api/marketplace/items/seller/{id}`. These are consumed by the
legacy `frontend1`; the go-forward `frontend/mobile` sends none of them and expects
**token-derived `/me` + `/my`** endpoints. Closing this fully = the `/me` migration in
`FRONTEND_MOBILE_API_MAPPING.md` §2–3, which replaces client identity everywhere at once.

> ⚠️ Behavior change: `/api/notifications/*` now **requires** `Authorization: Bearer <token>`.
> `frontend/mobile` doesn't use these endpoints; the legacy `frontend1` NotificationsScreen calls
> them without a token and will need the header added if it's kept.

---

## 🟠 High

### 3. Hardcoded JWT signing secret  *(fixed)*
`JwtService` fell back to `pawpal-dev-secret-change-in-production`. If the env var was unset in
prod, tokens were forgeable by anyone who read the repo.
**Fix:** secret now comes from `APP_JWT_SECRET`; `JwtService` **refuses to start** with the dev
default unless the active profile is `dev`/`test`, and warns on secrets shorter than 32 bytes.
— `JwtService.java`, `application.yml`
**Deploy action:** set `APP_JWT_SECRET` to a 32+ byte random value.

### 4. Database credentials committed in `application.yml`  *(fixed)*
`username: admin` / `password: rootpassword` shipped in plaintext.
**Fix:** now `${DB_USERNAME}` / `${DB_PASSWORD}` / `${DB_URL}` with local-dev defaults only.
**Deploy action:** set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (and rotate the committed password,
since it's in git history).

---

## 🟡 Medium

### 5. Unauthenticated ops/debug endpoints  *(fixed / documented)*
`/api/inspector/*` (Redis internals) and `/api/test-data/*` (inject/generate data) were open.
**Fix:** both are now behind `JwtAuthFilter`. — `WebConfig.java`
Actuator no longer exposes `prometheus`/`metrics` publicly — reduced to `health,info`
(override with `MGMT_ENDPOINTS` / `MGMT_PROMETHEUS_ENABLED` in trusted networks). — `application.yml`
**Still open:** the `/dashboard` HTML page and `POST /dashboard/api/reset` — a browser page can't
send a Bearer header, so it's not filter-gated. Run the app with a production profile that excludes
`DashboardController`, or restrict `/dashboard/**` at the network/ingress layer. Don't expose it publicly.

### 6. Wide-open CORS  *(fixed)*
`addCorsMappings` used `allowedOriginPatterns("*")`.
**Fix:** origins now come from `app.cors.allowed-origins` (`APP_CORS_ALLOWED_ORIGINS`), defaulting
to local Expo/emulator hosts. — `WebConfig.java`
**Deploy action:** set `APP_CORS_ALLOWED_ORIGINS` to your real web/app origin(s).

---

## 🟢 Low / Informational

### 7. Firebase web config committed  (`frontend/mobile/src/utils/firebase.ts`)
Firebase **client** API keys are public by design, so this is not itself a leak — but uploads
happen client-side, so security depends entirely on **Firebase Storage rules**. Confirm they
restrict writes to authenticated users and sane paths/sizes.

---

## Environment variables to set before deploying

| Var | Purpose |
|---|---|
| `APP_JWT_SECRET` | 32+ byte random JWT signing key (**required** in non-dev) |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | database connection |
| `APP_CORS_ALLOWED_ORIGINS` | comma-separated allowed browser origins |
| `MGMT_ENDPOINTS` / `MGMT_PROMETHEUS_ENABLED` | optional, to re-expose actuator internally |