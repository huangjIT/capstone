# PawPal — `frontend/mobile` ↔ Backend API Mapping

> Maps every network call made by the **latest app** (`frontend/mobile/src`) against the
> current Spring Boot backend (`backend/src/main/java/org/example/pet_social`).
> `frontend1/src/services/*` is the older reference layer and matches the backend 1:1 today;
> `frontend/mobile` targets a **richer contract** and a **JWT-based identity model**.
>
> Legend: ✅ works as-is · ⚠️ exists but needs a change · ❌ missing (must be built)
>
> **STATUS UPDATE 2026-07-13 — everything below is now built.** Every ❌/⚠️ item in this
> document was implemented on `feature/sanjyot-db-schema`; the tables are kept as the contract
> reference. Implementation notes:
> - **Walk/date boards**: one engine (`PartnerBoardService`) + `partner_invitations` /
>   `partner_requests` tables (type = WALK|DATE). Feeds are cached in Redis
>   (`feed:board:{type}`, 30 s TTL, invalidated on every write) and personalized per caller.
> - **Feeds are distance-bounded (2026-08-11).** When `lat`/`lng` are supplied,
>   `/api/{walk,date}/invitations/feed` return only invitations within `radiusKm` (optional;
>   defaults to 25 km, clamped server-side to 100 km) and sort them nearest-first. Previously
>   distance was computed for the label only and every open invitation was returned. **If a feed
>   looks empty, check the caller's coordinates before suspecting the data** — that is now the
>   most common cause. Omitting `lat`/`lng` disables the bound, since there is nothing to
>   measure against.
> - **Notifications have one entry point (2026-08-11).** The bell on `HomeMapScreen` is the only
>   route to the list; the 💬/🔔 buttons on the Walk, Date and Me headers and the Walk tab's red
>   dot are gone, as is `WalkBadgeContext`. The unread count comes from
>   `GET /api/notifications/unread-count` on screen focus. `/api/messages/unread-counts` is no
>   longer polled by the Walk and Date screens.
> - **Messages**: `POST /api/messages` accepts `walkRequestId`/`dateRequestId`/`marketItemId`
>   aliases (context types `WALK_REQUEST`/`DATE_REQUEST`/`LISTING`); the per-thread getters
>   mark incoming messages read on fetch; `/api/messages/unread-counts` → `{WALK,DATE,MARKET}`
>   is Redis-cached (15 s TTL, invalidated on send/read).
> - **Market**: `/api/market/*` uses raw enum values; `DELETE` = soft-delete to `WITHDRAWN`
>   so existing chats survive; `GET /api/market/chats` aggregates LISTING threads.
> - **Identity**: `JwtAuthFilter` now also gates `/api/walk/*`, `/api/date/*`, `/api/market/*`,
>   `/api/users/me*`, `/api/pets/my`. `POST /api/pets` uses the token when present and falls
>   back to body `ownerId` only for legacy frontend1 calls.
> - **Kafka**: notification fan-out rides a new `app-events` topic (async, off the request
>   path); `user-telemetry` is now declared with 3 partitions and the consumer concurrency
>   matches (`app.kafka.telemetry-partitions`).
> - **Google Sign-In**: `POST /api/auth/google` verifies the ID token via Google tokeninfo;
>   set `GOOGLE_CLIENT_ID` in production for audience checking.

---

## 0. The two structural differences

1. **Identity model.**
   - `frontend1` sends `userId` / `ownerId` / `sellerId` as **query/body params**; the backend trusts them.
   - `frontend/mobile` sends a **JWT `Authorization: Bearer <token>`** header (`utils/api.ts`) and calls
     `/me` and `/my` endpoints — it never puts its own id in the body. **Every "whose data" endpoint must
     derive the user from the token**, not from a client param. (This also closes the IDOR findings — see
     `SECURITY_FIXES.md`.)

2. **Base URL.**
   - `frontend/mobile/src/utils/api.ts` → `https://pawpal-279020382757.us-central1.run.app` (Cloud Run).
   - `frontend1/src/services/api.ts` → `http://10.0.2.2:8080` (local emulator).
   - To test `frontend/mobile` against this local backend, point `BASE_URL` at `http://10.0.2.2:8080`.

---

## 1. Auth  (`/api/auth`)

| App call | Body | Expects | Backend | Status |
|---|---|---|---|---|
| `POST /api/auth/login` | `{email,password}` | `{token,userId,name,email}` | `AuthController.login` | ✅ |
| `POST /api/auth/register` | `{name,email,password}` | `{token,userId,name,email}` | `AuthController.register` | ✅ |
| `POST /api/auth/google` | `{idToken}` (Google Sign-In) | `{token,userId,name,email}` | — | ❌ **build**: verify Google ID token, find-or-create user, issue app JWT |

**Screens:** `LoginScreen.tsx`, `SignUpScreen.tsx`.

---

## 2. Users / profile  (`/api/users`)

| App call | Body | Expects | Backend | Status |
|---|---|---|---|---|
| `GET /api/users/me` | — | `{id,name,email,bio?,location?,avatarUrl?}` | only `GET /api/users/{id}` (and it leaks a token) | ❌ **build** `/me` from token |
| `PUT /api/users/me` | `{name,bio,location,avatarUrl?}` | updated profile | — | ❌ **build** |
| `GET /api/users/me/stats` | — | `{posts:number,pets:number,friends:number}` | — | ❌ **build** (counts from Post/Pet/Friendship repos) |

**Schema gap:** `User` entity has **no** `bio`, `location`, or `avatarUrl` columns — add them.
**Screens:** `MeProfileScreen.tsx`, `EditProfileScreen.tsx`.

---

## 3. Pets  (`/api/pets`)

| App call | Body | Expects | Backend | Status |
|---|---|---|---|---|
| `GET /api/pets/my` | — | `Pet[]` (token-owned) | only `GET /api/pets/owner/{ownerId}` | ❌ **build** `/my` from token |
| `POST /api/pets` | `{name,species,breed?,gender,dateOfBirth?,bio?,isVaccinated,isNeutered,profilePhotoUrl?}` | created `Pet` | `PetController.create` **requires `ownerId` in body** | ⚠️ derive `ownerId` from token; app sends none |
| `PUT /api/pets/{id}` | same shape as POST | updated `Pet` | — | ❌ **build** (+ ownership check) |
| `DELETE /api/pets/{id}` | — | 204 | — | ❌ **build** (+ ownership check) |

**App `Pet` shape:** `{id,name,species,breed?,gender?,bio?,profilePhotoUrl?,isVaccinated?,isNeutered?,dateOfBirth?}`.
`Pet` entity already has `profilePhotoUrl` ✅ (no emoji needed). `PetResponse` must expose these exact fields.
**Discovery endpoints** `GET /api/pets/nearby|partners|blind-dates` exist ✅ but are used by **`frontend1` only** — `frontend/mobile` does not call them.
**Screens:** `AddPetScreen.tsx`, `EditPetScreen.tsx`, `MeProfileScreen.tsx`.

---

## 4. Walk invitations & requests  (`/api/walk/*`) — **entire namespace missing**

Closest existing backend is `/api/invitations` (WALK-type rows in `events`), but paths, shapes and the
request→accept flow all differ. Treat as a new module.

| App call | Body | Expects | Status |
|---|---|---|---|
| `GET /api/walk/invitations/feed?lat&lng` | — | `WalkFeedItem[]` (see below) | ❌ **build** |
| `GET /api/walk/invitations/my` | — | `WalkInvitation[]` | ❌ **build** |
| `POST /api/walk/invitations` | `{route,date,time,message?,durationMinutes,maxSpots,hostPetIds?[],latitude?,longitude?}` | created | ❌ **build** |
| `PUT /api/walk/invitations/{id}` | `{route,date,time,message?,durationMinutes,maxSpots,latitude?,longitude?}` | updated | ❌ **build** |
| `DELETE /api/walk/invitations/{id}` | — | 204 | ❌ **build** |
| `POST /api/walk/requests` | `{invitationId}` | created request (requester = token) | ❌ **build** |
| `GET /api/walk/requests/my-sent` | — | `[{invitationId,status}]` | ❌ **build** |
| `GET /api/walk/requests/my-sent-unread` | — | `[{invitationId,unreadCount}]` | ❌ **build** |
| `PUT /api/walk/requests/{id}` | `{status:'ACCEPTED'\|'REJECTED'\|'BLOCKED'}` | updated (host only) | ❌ **build** |
| `GET /api/walk/notifications` | — | `WalkNotification[]` | ❌ **build** |

**`WalkFeedItem`** (denormalized): `id, route, date, time, durationMinutes, maxSpots, spotsLeft, message?,
ownerId, ownerName, ownerAvatarUrl?, petId?, petName?, petSpecies?, petBreed?, petGender?, petAge?,
petProfilePhotoUrl?, petIsVaccinated?, petIsNeutered?, distanceKm?, distanceLabel?, myRequestId?,
myRequestStatus?, unreadMessageCount?, pets?[{petId,petName,petSpecies,petBreed,petGender,petAge,
petProfilePhotoUrl,petIsVaccinated,petIsNeutered}]`.

**`WalkInvitation`**: `id, route, date, time, durationMinutes, maxSpots, spotsLeft?, message?, status,
hostPetIds?[], pendingRequestCount?`.

**Model work:** a **walk request** entity (host, requester, invitation, per-requester status
`PENDING/ACCEPTED/REJECTED/BLOCKED`, unread counter) — `EventAttendee` is an RSVP list, not this. `PetMatch`
is the closest analog. Date fields are formatted **strings** (`"Mon, Jul 5, 2026"`, `"9:00 AM"`), not ISO.
**Screens:** `FindPartnersScreen.tsx`, `HomeMapScreen.tsx`, `PostInvitationScreen.tsx`, `EditInvitationScreen.tsx`, `ConnectPetProfileScreen.tsx`, `WalkRequestDetailScreen.tsx`.

---

## 5. Blind-date invitations & requests  (`/api/date/*`) — **entire namespace missing**

Same pattern as walk, single host pet, `location` instead of `route`.

| App call | Body | Expects | Status |
|---|---|---|---|
| `GET /api/date/invitations/feed?lat&lng` | — | `DateFeedItem[]` | ❌ **build** |
| `GET /api/date/invitations/my` | — | `DateInvitation[]` | ❌ **build** |
| `POST /api/date/invitations` | `{hostPetId,location,date,time,message?,latitude?,longitude?}` | created | ❌ **build** |
| `PUT /api/date/invitations/{id}` | `{hostPetId,location,date,time,message?,latitude?,longitude?}` | updated | ❌ **build** |
| `DELETE /api/date/invitations/{id}` | — | 204 | ❌ **build** |
| `POST /api/date/requests` | `{invitationId}` | created | ❌ **build** |
| `GET /api/date/requests/my-sent` | — | `[{invitationId,status}]` | ❌ **build** |
| `PUT /api/date/requests/{id}` | `{status}` | updated | ❌ **build** |
| `GET /api/date/notifications` | — | `WalkNotification[]` (shared shape) | ❌ **build** |

**`DateFeedItem`**: `id, hostUserId, location?, date?, time?, message?, ownerName?, ownerAvatarUrl?, petId?,
petName?, petSpecies?, petBreed?, petGender?, petAge?, petProfilePhotoUrl?, petIsVaccinated?, petIsNeutered?,
distanceKm?, distanceLabel?, myRequestId?, myRequestStatus?, unreadMessageCount?`.
**`DateInvitation`**: `id, hostUserId, hostPetId?, location?, date?, time?, message?, status,
pendingRequestCount?, petName?, petSpecies?, petBreed?, petProfilePhotoUrl?, petAge?`.
**Screens:** `PetBlindDateScreen.tsx`, `PostDateInvitationScreen.tsx`, `EditDateInvitationScreen.tsx`, `DatePetProfileScreen.tsx`.

---

## 6. Marketplace  (`/api/market/*`) — path & shape mismatch

Backend uses `/api/marketplace/items`; the app uses `/api/market/*` with richer fields.

| App call | Body | Expects | Backend | Status |
|---|---|---|---|---|
| `GET /api/market/items?category=TOY` | — | `MarketItem[]` | `GET /api/marketplace/items` | ❌ path + shape differ |
| `GET /api/market/items/my` | — | `MarketItem[]` (token seller) | — | ❌ **build** |
| `POST /api/market/items` | `{name,category,condition,price,originalPrice?,description?,location?,latitude?,longitude?,photoUrl?}` | created | `POST /api/marketplace/items` needs `sellerId` in body | ⚠️ path + derive seller from token |
| `PUT /api/market/items/{id}` | POST body + `{status:'ACTIVE'\|'SOLD'}` | updated | only `.../{id}/sold` | ❌ **build** general update |
| `DELETE /api/market/items/{id}` | — | 204 | — | ❌ **build** |
| `GET /api/market/chats` | — | `MarketChat[]` | — | ❌ **build** (aggregate messages by item+partner) |

**App `MarketItem`**: `id, sellerUserId, name, description?, category(TOY/CARRIER/FOOD/ACCESSORY/OTHER),
price?, originalPrice?, condition(NEW/LIKE_NEW/GOOD/FAIR), photoUrl?, location?, status(ACTIVE/SOLD/WITHDRAWN),
sellerName?, sellerAvatarUrl?, unreadMessageCount?`.
**App `MarketChat`**: `itemId, otherUserId, otherUserName?, otherUserAvatarUrl?, itemName?, itemPhotoUrl?,
itemPrice?, itemStatus?, isSeller?, lastMessage?, lastMessageAt?, lastMessageIsOwn?, unreadCount?`.
**Schema gaps on `MarketplaceItem`:** add `photoUrl`, `location`, `WITHDRAWN` status; responses must send raw
enum values (`TOY`, `LIKE_NEW`) — current `MarketplaceItemResponse` capitalizes/relabels them.
**Screens:** `MarketplaceScreen.tsx`, `PostMarketItemScreen.tsx`, `MarketChatsScreen.tsx`, `MarketplaceChatScreen.tsx`.

---

## 7. Messages  (`/api/messages`) — partially compatible

| App call | Body | Expects | Backend | Status |
|---|---|---|---|---|
| `POST /api/messages` | `{receiverId,content, walkRequestId? \| dateRequestId? \| marketItemId?}` | `ChatMessage` | `send` wants `{receiverId,content,contextType,contextId}` | ⚠️ accept the 3 context aliases → map to `(contextType,contextId)` |
| `GET /api/messages/walk-request/{id}` | — | `ChatMessage[]` | `GET /thread?otherUserId&contextType&contextId` | ❌ **build** alias |
| `GET /api/messages/date-request/{id}` | — | `ChatMessage[]` | as above | ❌ **build** alias |
| `GET /api/messages/market-item/{itemId}/{otherUserId}` | — | `ChatMessage[]` | as above | ❌ **build** alias |
| `GET /api/messages/unread-counts` | — | `{WALK,DATE,MARKET: number}` **map** | only `/unread-count` → `{count}` | ❌ **build** grouped counts |

**App `ChatMessage`**: `{id, senderId, receiverId, content, createdAt, isOwn, senderName?, senderAvatarUrl?}` —
`MessageResponse` must include `senderId`/`receiverId`/`createdAt`/`isOwn`. Auth already token-based ✅.
**Screens:** `WalkRequestDetailScreen.tsx`, `MarketplaceChatScreen.tsx`, `FindPartnersScreen.tsx`, `PetBlindDateScreen.tsx`, `MarketplaceScreen.tsx`.

---

## 8. Backend endpoints NOT used by `frontend/mobile`

Used by `frontend1` / ops only — safe to leave, but they are **not** part of the latest app:
`/api/users/{id}`, `/api/users/register|login`, `/api/pets/nearby|partners|blind-dates|owner/{id}`,
`/api/invitations/*`, `/api/marketplace/items/*`, `/api/notifications/*`, `/api/matches/*`, `/api/match`,
`/api/reviews/*`, `/api/telemetry/*`, `/api/test-data/*`, `/api/inspector/*`, `/dashboard/*`, `/api/system/health`.

---

## 9. Image uploads (not backend)

`frontend/mobile` uploads images to **Firebase Storage** (`utils/uploadImage.ts` + `utils/firebase.ts`) and
sends the resulting **URL string** (`profilePhotoUrl`, `avatarUrl`, `photoUrl`) in the JSON body. The backend
only ever stores/returns these URL strings — no multipart upload endpoint is required. Confirm Firebase Storage
security rules are locked down (uploads happen client-side).

---

## 10. Suggested build order

1. **Auth/identity spine** — add `bio/location/avatarUrl` to `User`; build `GET/PUT /api/users/me`,
   `/api/users/me/stats`, `GET /api/pets/my`, token-derived `POST /api/pets`, `PUT/DELETE /api/pets/{id}`,
   `POST /api/auth/google`. Unlocks profile + pet management (5 screens).
2. **Messaging aliases** — `unread-counts`, `walk-request/date-request/market-item` thread getters,
   `ChatMessage` fields, context aliases on `POST`. Small, unlocks all chat UI.
3. **Walk module** — invitation + request entities, `feed/my`, requests, notifications.
4. **Date module** — mirror walk with single host pet + `location`.
5. **Market module** — `/api/market/*` paths, `photoUrl`/`location`/`WITHDRAWN`, `my`, general `PUT`,
   `DELETE`, `chats`.

Items in **§1 (auth)** already work; everything marked ❌ needs building; ⚠️ items need the token-identity
switch, which is also the security fix for impersonation/IDOR.
