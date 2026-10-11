import { useEffect, useState } from "react"

interface Location {
    latitude: number
    longitude: number
}

const isSupported = "geolocation" in navigator

export const useLocation = () => {
    const [location, setLocation] = useState<Location | null>(null)
    const [error, setError] = useState<string | null>(
        isSupported ? null : "Your browser does not support location sharing."
    )
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        if (!isSupported) return

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                setError(null)
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                })
            },
            (error) => {
                console.log('Location error:', error.message)
                setError(
                    error.code === error.PERMISSION_DENIED
                        ? "Location access is blocked. Allow it in your browser settings, then try again."
                        : "We couldn't get your location. Check your GPS and try again."
                )
            },
            { enableHighAccuracy: true }
        )
        return () => navigator.geolocation.clearWatch(watcher)
    }, [attempt])

    const retry = () => {
        setError(null)
        setAttempt((prev) => prev + 1)
    }

    return { location, error, retry }
}
