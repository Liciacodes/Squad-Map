interface Point {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_METERS = 6371000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

// straight-line distance between two GPS points (haversine)
export function distanceMeters(a: Point, b: Point) {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

// 120 -> "120 m", 1530 -> "1.5 km"
export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
