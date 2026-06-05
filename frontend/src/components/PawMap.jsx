import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import './PawMap.css'

/* ── Map visual style — warm/minimal to match PawPal palette ── */
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fed7aa' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#bae6fd' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7dd3fc' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#bbf7d0' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
]

/* ── Simulated nearby pets (offset from user location) ── */
const NEARBY_PETS = [
  { id: 1, name: 'Max', breed: 'Golden Retriever', owner: 'Sarah K.', dist: '0.3 km', emoji: '🐕', offset: { lat: 0.003, lng: 0.004 } },
  { id: 2, name: 'Luna', breed: 'Corgi', owner: 'Mike L.', dist: '0.8 km', emoji: '🐶', offset: { lat: -0.006, lng: 0.002 } },
  { id: 3, name: 'Buddy', breed: 'Labrador', owner: 'Emma W.', dist: '1.2 km', emoji: '🦮', offset: { lat: 0.007, lng: -0.005 } },
  { id: 4, name: 'Mochi', breed: 'Shiba Inu', owner: 'Tom H.', dist: '1.5 km', emoji: '🐩', offset: { lat: -0.004, lng: -0.007 } },
]

/* ── Custom SVG marker for user ── */
function makeUserMarkerIcon() {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#ff6b35',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.8,
    anchor: { x: 12, y: 22 },
  }
}

/* ── Custom SVG marker for pets ── */
function makePetMarkerIcon() {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#f97316',
    fillOpacity: 0.85,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.4,
    anchor: { x: 12, y: 22 },
  }
}

/* ─────────────────────────────────────────────────────────── */

export default function PawMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  })

  const [userPos, setUserPos] = useState(null)     // { lat, lng }
  const [geoError, setGeoError] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const [selectedPet, setSelectedPet] = useState(null)
  const mapRef = useRef(null)

  /* ── Geolocation ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('您的浏览器不支持地理位置')
      setGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      err => {
        const msgs = {
          1: '位置权限被拒绝，已显示默认位置',
          2: '无法获取位置信息',
          3: '获取位置超时',
        }
        setGeoError(msgs[err.code] || '获取位置失败')
        // Fallback to Vancouver (school location)
        setUserPos({ lat: 43.7315, lng: -79.7624 })
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const onMapLoad = useCallback(map => {
    mapRef.current = map
  }, [])

  /* ── Pet positions relative to user ── */
  const pets = userPos
    ? NEARBY_PETS.map(p => ({
        ...p,
        position: {
          lat: userPos.lat + p.offset.lat,
          lng: userPos.lng + p.offset.lng,
        },
      }))
    : []

  /* ── Render states ── */
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return <MapPlaceholder message="请在 .env 中配置 VITE_GOOGLE_MAPS_API_KEY" type="config" />
  }

  if (loadError) {
    return <MapPlaceholder message="Google Maps 加载失败，请检查 API Key" type="error" />
  }

  if (!isLoaded || geoLoading) {
    return <MapPlaceholder message="正在加载地图..." type="loading" />
  }

  return (
    <div className="pawmap-wrapper">
      {/* Google Map */}
      <GoogleMap
        mapContainerClassName="pawmap-container"
        center={userPos}
        zoom={14}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        }}
        onLoad={onMapLoad}
      >
        {/* User location marker */}
        {userPos && (
          <Marker
            position={userPos}
            icon={makeUserMarkerIcon()}
            title="你的位置"
            zIndex={10}
          />
        )}

        {/* Nearby pet markers */}
        {pets.map(pet => (
          <Marker
            key={pet.id}
            position={pet.position}
            icon={makePetMarkerIcon()}
            title={pet.name}
            onClick={() => setSelectedPet(pet)}
          />
        ))}

        {/* Info window on pet click */}
        {selectedPet && (
          <InfoWindow
            position={selectedPet.position}
            onCloseClick={() => setSelectedPet(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -28) }}
          >
            <div className="pawmap-infowindow">
              <span className="pawmap-iw-emoji">{selectedPet.emoji}</span>
              <div className="pawmap-iw-info">
                <p className="pawmap-iw-name">{selectedPet.name}</p>
                <p className="pawmap-iw-breed">{selectedPet.breed}</p>
                <p className="pawmap-iw-owner">👤 {selectedPet.owner}</p>
                <p className="pawmap-iw-dist">📍 {selectedPet.dist}</p>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Geo error toast */}
      {geoError && (
        <div className="pawmap-geo-toast">
          ⚠️ {geoError}
        </div>
      )}

      {/* Map label overlay */}
      <div className="pawmap-label">
        🗺️&nbsp; Live Map — Discover Pets Nearby
      </div>
    </div>
  )
}

/* ── Fallback placeholder ───────────────────────────────── */
function MapPlaceholder({ message, type }) {
  const icons = { loading: '⏳', error: '⚠️', config: '🔑' }
  return (
    <div className={`pawmap-placeholder pawmap-placeholder--${type}`}>
      <span className="pawmap-placeholder-icon">{icons[type]}</span>
      <p className="pawmap-placeholder-msg">{message}</p>
      {type === 'loading' && <div className="pawmap-spinner" />}
    </div>
  )
}
