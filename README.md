# PawPal — Pet Social App

PawPal is a mobile social platform that connects pet owners for walking meetups, blind dates between pets, and community engagement.

---

## Project Structure

```
capstone/
├── backend/        # Spring Boot REST API
└── frontend/
    └── mobile/     # React Native (Expo) mobile app
```

---

## Frontend

### Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native (Expo SDK 56) |
| Language | TypeScript |
| Navigation | React Navigation (Bottom Tabs + Stack) |
| Maps | react-native-maps (Google Maps on Android, Apple Maps on iOS) |
| Location | expo-location |
| Route Planning | OpenRouteService (ORS) API |
| Design | Figma |

### Screens

| Screen | Description |
|--------|-------------|
| Splash | App entry animation |
| Login | Google OAuth + email/password login |
| Map (Home) | Google Maps with nearby pet markers, walking partners bottom sheet |
| Find Partners | Walking partner list with filters, My Invitations section |
| Post Invitation | Create a walking invitation with route, date, time |
| Edit Invitation | Edit or withdraw an existing invitation |
| Route Map Picker | Tap A/B pins on map, real road routing via ORS, walking time & distance |
| Connect Pet Profile | View a pet's full profile before connecting |
| Pet Blind Date | Browse nearby pets for blind date matchmaking |
| Marketplace | Pet products and services |
| Me Profile | User profile and settings |

### Key Features

- **Google Maps integration** with real-time user location
- **Route planning** via OpenRouteService API (walking mode, real road path)
- **Geolocation** — auto-center map on current position, 100km distance validation
- **Scroll-based UI** — My Invitations section hides/shows on scroll
- **Tab bar management** — hides on nested screens (Profile, Invitation, etc.)
- **Cross-platform** — Android (Google Maps) and iOS (Apple Maps)

### Getting Started

#### Prerequisites
- Node.js 18+
- Android Studio (for Android emulator)
- Xcode 15+ (for iOS simulator, Mac only)
- Expo CLI

#### Run on Android
```bash
cd frontend/mobile

# Start Android emulator (if not running)
~/Library/Android/sdk/emulator/emulator -avd Pixel_9a -no-snapshot-load &

# Install and run
npx expo run:android
```

#### Run on iOS Simulator
```bash
cd frontend/mobile
npx expo run:ios
```

#### Run with Expo Go (same WiFi or tunnel)
```bash
cd frontend/mobile

# LAN mode (same WiFi required)
npx expo start

# Tunnel mode (any network)
npx expo start --tunnel
```

### Environment Configuration

`frontend/mobile/app.json`:
```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

`frontend/mobile/src/components/RouteMapPicker.tsx`:
```ts
const ORS_API_KEY = 'YOUR_ORS_API_KEY';
```

---

## Backend

### Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Spring Boot 4.0.6 |
| Language | Java |
| Database | PostgreSQL 16 |
| Cache / Geo | Redis Stack |
| Message Broker | Apache Kafka |
| Monitoring | Prometheus + Grafana |
| Container | Docker + Docker Compose |

### Architecture

```
Mobile App
    ↓ REST API
Spring Boot (Port 8080)
    ├── PostgreSQL  — persistent data (users, pets, events, posts)
    ├── Redis       — caching, geospatial queries, leaderboard
    └── Kafka       — async event streaming (telemetry, notifications)

Monitoring
    ├── Prometheus  (Port 9090) — metrics scraping
    └── Grafana     (Port 3000) — dashboard visualization
```

### Data Models

| Entity | Description |
|--------|-------------|
| User | Account info, location, preferences |
| Pet | Name, breed, age, gender, photo |
| PetMatch | Match requests between pets |
| Event | Walking events with location and time |
| EventAttendee | Users attending an event |
| Post | Community posts |
| Comment | Comments on posts |
| Message | Direct messages between users |
| Friendship | Friend relationships between users |

### API Endpoints

| Module | Endpoints |
|--------|-----------|
| User | `GET/POST /api/users` |
| Matching | `POST /api/match`, `GET /api/match/suggestions` |
| Health | `GET /health` |
| Dashboard | `GET /dashboard` |
| Telemetry | `GET /api/telemetry` |

### Getting Started

#### Prerequisites
- Docker + Docker Compose
- Java 21+
- Maven

#### Start Infrastructure
```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379` (RedisInsight GUI on `8001`)
- Kafka on port `9092`
- Prometheus on port `9090`
- Grafana on port `3000`

#### Run Backend
```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

#### Grafana Dashboard
Open `http://localhost:3000` — default login: `admin / admin`

---

## Sprint Plan

### Sprint 1 — Frontend UI (Done)
- Map page with Google Maps, floating header, nearby partners
- Walk page with partner list, filters, My Invitations
- Post & Edit Invitation with Route Map Picker
- Pet Blind Date page with date cards
- Figma design — 10+ screens

### Sprint 2 — Backend Foundation & Auth
- Project setup (Spring Boot + PostgreSQL + Redis + Kafka)
- Google OAuth login, JWT authentication
- User and Pet profile APIs
- File upload service

### Sprint 3 — Core APIs & Frontend Integration
- Walking invitation API with geospatial query (10km radius)
- Pet Blind Date API
- Match & connect API
- Replace frontend mock data with real API calls
- Push notifications

### Sprint 4 — Polish, Testing & Deployment
- End-to-end testing
- UI polish (loading, empty, error states)
- Cloud deployment
- Release APK build

---

## Design

Figma file: [PawPal UI Design](https://www.figma.com/design/vMnjFIIFZn4yIJYpu59Nsz)

Key design tokens:
- Primary orange: `#F97316`
- Purple accent: `#8B5CF6`
- Background: `#FAF9F6`
- Card: `#FFFFFF`
