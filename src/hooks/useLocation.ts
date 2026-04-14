import { useEffect, useState } from "react"

interface Location {
    latitude: number
    longitude: number
}

export const useLocation = () => {
    const [location, setLocation] = useState<Location | null>(null)

    useEffect(() => {
    const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                })
            },
            (error) => 
                console.log('Location error:', error.message),
                { enableHighAccuracy: true}
            )
            return () => navigator.geolocation.clearWatch(watcher)
            }, [])

    return location
     

}