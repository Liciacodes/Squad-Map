import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface User {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface Props {
  users: User[]
  currentLocation: { latitude: number; longitude: number } | null
  flyTo: { latitude: number; longitude: number } | null
  userName: string
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

export default function Map({ users, currentLocation, flyTo }: Props) {
  return (
    <div className="w-screen h-screen">
      <MapContainer
        center={[6.5244, 3.3792]}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController currentLocation={currentLocation} flyTo={flyTo} />

        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={createPulsingIcon('#22c55e')}
          >
            <Popup>You are here 📍</Popup>
          </Marker>
        )}

        {users.map((user, index) => (
          <Marker
            key={user.id}
            position={[user.latitude, user.longitude]}
            icon={createPulsingIcon(COLORS[index % COLORS.length])}
          >
            <Popup>{user.name} 👋</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}