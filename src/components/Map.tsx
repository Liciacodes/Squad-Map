import { memo, useEffect, useRef, type Ref } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getUserColor, MY_COLOR } from '../utils/userColor'
import type { User } from '../types'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  users: User[]
  currentLocation: { latitude: number; longitude: number } | null
  flyTo: { latitude: number; longitude: number } | null
  userName: string
  mapRef?: Ref<L.Map>
  selectedUserId: string | null
}

const createPulsingIcon = (color: string) => L.divIcon({
  className: '',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 rgba(34,197,94,0.4);
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// one icon per colour, built once and reused, so a re-render doesn't rebuild every dot
const iconCache: Record<string, L.DivIcon> = {}

function getPulsingIcon(color: string) {
  if (!iconCache[color]) iconCache[color] = createPulsingIcon(color)
  return iconCache[color]
}

// memo skips re-rendering a friend whose data has not changed
const FriendMarker = memo(function FriendMarker({ user }: { user: User }) {
  return (
    <Marker
      position={[user.latitude, user.longitude]}
      icon={getPulsingIcon(getUserColor(user.id))}
    >
      <Popup>{user.name} 👋</Popup>
    </Marker>
  )
})

function MapController({ currentLocation, flyTo }: { 
  currentLocation: { latitude: number; longitude: number } | null
  flyTo: { latitude: number; longitude: number } | null 
}) {
  const map = useMap()
  const hasFlownToInitial = useRef(false)

  useEffect(() => {
    if (!currentLocation || hasFlownToInitial.current) return
    map.flyTo([currentLocation.latitude, currentLocation.longitude], 15)
    hasFlownToInitial.current = true
  }, [currentLocation, map])

  useEffect(() => {
    if (!flyTo) return
    map.flyTo([flyTo.latitude, flyTo.longitude], 17)
  }, [flyTo, map])

  return null
}

export default function Map({ users, currentLocation, flyTo, mapRef, selectedUserId }: Props) {
  const selectedUser = users.find((user) => user.id === selectedUserId)

  return (
    <div className="w-screen h-screen">
      <MapContainer
        center={[6.5244, 3.3792]}
        zoom={13}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController currentLocation={currentLocation} flyTo={flyTo} />

        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={getPulsingIcon(MY_COLOR)}
          >
            <Popup>You are here 📍</Popup>
          </Marker>
        )}

        {users.map((user) => (
          <FriendMarker key={user.id} user={user} />
        ))}

        {/* one line, from you to the friend picked in the squad list */}
        {currentLocation && selectedUser && (
          <Polyline
            positions={[
              [currentLocation.latitude, currentLocation.longitude],
              [selectedUser.latitude, selectedUser.longitude]
            ]}
             pathOptions={{
              color: getUserColor(selectedUser.id),
              weight: 3,
              opacity: 1,
              dashArray: '8, 10'
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}