import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react"
import type { Map as LeafletMap } from "leaflet"
import Map from "./components/Map"
import MapControls from "./components/MapControls"
import CreateEvent from "./components/createEvent"
import JoinEvent from "./components/JoinEvent"
import SquadPanel from './components/SquadPanel'
import socket from "./hooks/useSocket"
import { useLocation } from "./hooks/useLocation"
import { distanceMeters } from "./utils/distance"
import Landing from "./components/Landing"
import { useSearchParams } from "react-router-dom"
import Toast from "./components/Toast"
import EventTimer from "./components/EventTimer"

type Screen = "landing" | "home" | "create" | "map"

const MIN_MOVE_METERS = 5
const MIN_UPDATE_INTERVAL_MS = 3000
const JOIN_TIMEOUT_MS = 10000

const subscribeToConnection = (onChange: () => void) => {
  socket.on("connect", onChange)
  socket.on("disconnect", onChange)
  return () => {
    socket.off("connect", onChange)
    socket.off("disconnect", onChange)
  }
}

interface EventState {
  name: string
  code: string
  userName: string
  isCreator: boolean
  createdAt: number
  creatorToken?: string
}

interface User {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface ToastMessage {
  message: string
  type: "success" | "error" | "info"
  userId?: string
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [joining, setJoining] = useState(false)
  const [event, setEvent] = useState<EventState | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [flyTo, setFlyTo] = useState<{ latitude: number; longitude: number } | null>(null)
  const [searchParams] = useSearchParams()
  const [prefilledCode, setPrefilledCode] = useState("")
  const connected = useSyncExternalStore(subscribeToConnection, () => socket.connected)

  const { location, error: locationError, retry: retryLocation } = useLocation()
  const hasJoined = useRef(false)
  const lastSent = useRef<{ latitude: number; longitude: number; time: number } | null>(null)
  const usersRef = useRef<User[]>([])
  const eventRef = useRef<EventState | null>(null)
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  // stable so the toast timer isn't restarted on every render
  const closeToast = useCallback(() => setToast(null), [])

  // keep usersRef in sync
  useEffect(() => {
    usersRef.current = users
  }, [users])

  // keep event and location readable from the reconnect handler
  useEffect(() => {
    eventRef.current = event
    locationRef.current = location
  }, [event, location])

  const currentUser = event
    ? {
        id: "me",
        name: event.userName,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      }
    : null

  // register socket listeners, removed again on unmount
  useEffect(() => {

    console.log('🔌 Registering socket listeners')

    // a reconnect gets a new socket id, so the server needs a fresh join
    let connectedBefore = socket.connected
    const onConnect = () => {
      if (!connectedBefore) {
        connectedBefore = true
        return
      }
      if (!hasJoined.current || !eventRef.current || !locationRef.current) return
      socket.emit("join-event", {
        eventCode: eventRef.current.code,
        userName: eventRef.current.userName,
        latitude: locationRef.current.latitude,
        longitude: locationRef.current.longitude,
      })
      lastSent.current = { ...locationRef.current, time: Date.now() }
    }

    const onEventUsers = (data: { eventName: string; users: User[]; createdAt?: number } | User[]) => {
      if (Array.isArray(data)) {
        const filtered = data.filter((u) => u.id !== socket.id)
        usersRef.current = filtered
        setUsers(filtered)
      } else {
        const filtered = data.users.filter((u) => u.id !== socket.id)
        usersRef.current = filtered
        setUsers(filtered)
        setEvent((prev) =>
          prev ? { ...prev, name: data.eventName ?? prev.name, 
            createdAt: data.createdAt ?? prev.createdAt
           } : prev
        )
      }
      setJoining(false)
      setScreen("map")
    }

    const onUserJoined = (user: User) => {
      if (usersRef.current.find((u) => u.id === user.id)) return
      usersRef.current = [...usersRef.current, user]
      setUsers([...usersRef.current])
      setToast({message: `${user.name} just joined 👋 tap to locate`, type: 'info', userId: user.id})
    }

    const onUserMoved = ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      usersRef.current = usersRef.current.map((u) =>
        u.id === id ? { ...u, latitude, longitude } : u
      )
      setUsers([...usersRef.current])
    }

    const onUserLeft = (id: string, userName: string) => {
       setToast({ message: `${userName} has left the event.`, type: "info" })
      console.log("✅ user-left received:", id)
      usersRef.current = usersRef.current.filter((u) => u.id !== id)
      setUsers([...usersRef.current])
    }

    const onEventCreated = ({ eventCode, creatorToken }: { eventCode: string; creatorToken: string }) => {
      setEvent((prev) =>
        prev && prev.code === eventCode ? { ...prev, creatorToken } : prev
      )
    }

    const onEventCreateFailed = ({ reason }: { reason: string }) => {
      sessionStorage.removeItem("squadmap-event")
      sessionStorage.removeItem("squadmap-screen")
      setToast({
        message: reason === "code-taken"
          ? "That event code is already in use. Please try again."
          : "Could not create the event. Please check the names and try again.",
        type: "error",
      })
      setJoining(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("create")
    }

    const onEventNotFound = () => {
      sessionStorage.removeItem("squadmap-event")
      sessionStorage.removeItem("squadmap-screen")
      setToast({
        message: "Event not found. It may have ended, or the code is wrong.",
        type: "error",
      })
      setJoining(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("home")
    }

    const onEventEnded = () => {
      sessionStorage.removeItem("squadmap-event")
      sessionStorage.removeItem("squadmap-screen")
      setToast({ message: "The event has ended.", type: "error" })
      setJoining(false)
      setEvent(null)
      usersRef.current = []
      setUsers([])
      hasJoined.current = false
      setScreen("home")
    }

    socket.on("connect", onConnect)
    socket.on("event-users", onEventUsers)
    socket.on("user-joined", onUserJoined)
    socket.on("user-moved", onUserMoved)
    socket.on("user-left", onUserLeft)
    socket.on("event-created", onEventCreated)
    socket.on("event-create-failed", onEventCreateFailed)
    socket.on("event-not-found", onEventNotFound)
    socket.on("event-ended", onEventEnded)

    return () => {
      socket.off("connect", onConnect)
      socket.off("event-users", onEventUsers)
      socket.off("user-joined", onUserJoined)
      socket.off("user-moved", onUserMoved)
      socket.off("user-left", onUserLeft)
      socket.off("event-created", onEventCreated)
      socket.off("event-create-failed", onEventCreateFailed)
      socket.off("event-not-found", onEventNotFound)
      socket.off("event-ended", onEventEnded)
    }
  }, [])

  // prefill code from URL
  useEffect(() => {
    const code = searchParams.get("join")
    if (code) {
      setScreen("home")
      setPrefilledCode(code)
    }
  }, [searchParams])

  useEffect(() => {
    const savedEvent = sessionStorage.getItem("squadmap-event")
    const savedScreen = sessionStorage.getItem("squadmap-screen")
    if (savedEvent && savedScreen && savedScreen === "map") {
      const parsed = JSON.parse(savedEvent)
      setEvent(parsed)
      setScreen(savedScreen as Screen)
      // don't re-join automatically on refresh
      // let the join useEffect handle it fresh
    }
  }, [])
  // restore session
  // useEffect(() => {
  //   const savedEvent = sessionStorage.getItem("squadmap-event")
  //   const savedScreen = sessionStorage.getItem("squadmap-screen")
  //   if (savedEvent && savedScreen && savedScreen === "map") {
  //     setEvent(JSON.parse(savedEvent))
  //     setScreen(savedScreen as Screen)
  //   }
  // }, [])

  // join event
  useEffect(() => {
    if (!event || !location || hasJoined.current) return

    const payload = {
      eventCode: event.code,
      userName: event.userName,
      latitude: location.latitude,
      longitude: location.longitude,
    }
    // the creator's first join creates the event, anything later is a plain join
    if (event.isCreator && !event.creatorToken) {
      socket.emit("create-event", { ...payload, eventName: event.name })
    } else {
      socket.emit("join-event", payload)
    }

    hasJoined.current = true
    lastSent.current = { ...location, time: Date.now() }
    // stays on until the server answers with event-users
    setJoining(true)
  }, [event, location])

  // give up if the server is reachable but never answers the create or join
  useEffect(() => {
    if (!joining || !connected) return

    const timer = setTimeout(() => {
      const wasCreator = eventRef.current?.isCreator
      sessionStorage.removeItem("squadmap-event")
      sessionStorage.removeItem("squadmap-screen")
      setToast({ message: "The server did not respond. Please try again.", type: "error" })
      setJoining(false)
      setEvent(null)
      usersRef.current = []
      setUsers([])
      hasJoined.current = false
      setScreen(wasCreator ? "create" : "home")
    }, JOIN_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [joining, connected])

  // location updates, only after real movement and at most once per interval
  const eventCode = event?.code
  useEffect(() => {
    if (!eventCode || !location || !hasJoined.current) return

    const last = lastSent.current
    if (last && distanceMeters(last, location) < MIN_MOVE_METERS) return

    const send = () => {
      socket.emit("location-update", {
        eventCode,
        latitude: location.latitude,
        longitude: location.longitude,
      })
      lastSent.current = { ...location, time: Date.now() }
    }

    const wait = last ? MIN_UPDATE_INTERVAL_MS - (Date.now() - last.time) : 0
    if (wait <= 0) {
      send()
      return
    }
    // too soon, send once the interval is up unless a newer position replaces it
    const timer = setTimeout(send, wait)
    return () => clearTimeout(timer)
  }, [location, eventCode])

  // save session
  useEffect(() => {
    if (event && screen === "map") {
      sessionStorage.setItem("squadmap-event", JSON.stringify(event))
      sessionStorage.setItem("squadmap-screen", screen)
    }
  }, [event, screen])

  const handleCreateEvent = (name: string, code: string, userName: string) => {
    hasJoined.current = false
    setEvent({ name, code, userName, isCreator: true , createdAt: Date.now()})
    setScreen("map")
    setJoining(false)
  }

  const handleJoinEvent = (userName: string, code: string, createdAt?: number) => {
    hasJoined.current = false
    setEvent({ name: "", code, userName, isCreator: false, createdAt: createdAt ?? Date.now() })
    setScreen("map")
  }

  const handleLeaveEvent = () => {
    // without a token the event was never confirmed, so just leave
    if (event?.isCreator && event.creatorToken) {
      socket.emit("end-event", { eventCode: event.code, creatorToken: event.creatorToken })
    } else {
      socket.emit("leave-event")
    }
    setTimeout(() => {
    setJoining(false)
    setEvent(null)
    usersRef.current = []
    setUsers([])
    hasJoined.current = false
    sessionStorage.clear()
    setScreen("home")
  }, 100)
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-50">
      {joining && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[2000] bg-black/60">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">
              {!connected
                ? "Connecting to the server..."
                : event?.isCreator
                  ? "Creating your event..."
                  : "Finding your squad..."}
            </p>
            <button
              onClick={handleLeaveEvent}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Map
        users={users}
        currentLocation={location}
        flyTo={flyTo}
        userName={event?.userName ?? "You"}
        mapRef={mapRef}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          onClick={
            toast.userId
              ? () => {
                  const user = users.find((u) => u.id === toast.userId)
                  if (user) setFlyTo({ latitude: user.latitude, longitude: user.longitude })
                  setToast(null)
                }
              : undefined
          }
        />
      )}

      {screen === "landing" && (
        <Landing onGetStarted={() => setScreen("home")} />
      )}

      {screen === "home" && (
        <JoinEvent
          onJoinEvent={handleJoinEvent}
          onCreateInstead={() => setScreen("create")}
          prefilledCode={prefilledCode}
        />
      )}

      {screen === "create" && (
        <CreateEvent onCreateEvent={handleCreateEvent} />
      )}

      {screen === "map" && event && !location && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1500] bg-black/60 px-4">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 w-full max-w-sm text-center">
            {locationError ? (
              <>
                <p className="text-base font-semibold text-gray-900">We need your location</p>
                <p className="text-sm text-gray-600">{locationError}</p>
                <button
                  onClick={retryLocation}
                  className="w-full bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={handleLeaveEvent}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Go back
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Getting your location...</p>
              </>
            )}
          </div>
        </div>
      )}

      {screen === "map" && event && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl p-3  flex flex-col gap-1 w-[92%] max-w-sm" 
           style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
        
            <div className="w-full flex items-center justify-between">
              <p className="text-[10px] text-gray-500">You are in</p>
              <button
                className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                onClick={handleLeaveEvent}
              >
                {event.isCreator ? "🔴 End Event" : "👋 Leave Event"}
              </button>
            </div>

            <h2 className="text-base font-semibold text-gray-900">
              {event.name || "Event"}
            </h2>

            <div
              className="bg-green-50 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer active:bg-green-100 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(event.code)
                setToast({ message: "Code copied!", type: "success" })
              }}
            >
              <p className="text-green-600 font-mono font-bold tracking-widest text-lg">
                {event.code}
              </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </div>
            <p className="text-xs text-gray-300">tap to copy</p>

            <p className="text-xs text-gray-400">
              {users.length} friend{users.length !== 1 ? "s" : ""} in this event
            </p>

            {event.createdAt && 
            <EventTimer createdAt={event.createdAt} />}

            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}?join=${event.code}`
                if (navigator.share) {
                  navigator.share({
                    title: "Join my squad on SquadMap",
                    text: `Join ${event.name} on SquadMap!`,
                    url: shareUrl,
                  })
                } else {
                  navigator.clipboard.writeText(shareUrl)
                  setToast({ message: "Link copied!", type: "success" })
                }
              }}
              className="w-full mt-1 border border-green-500 text-green-500 rounded-xl py-2 text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share with squad
            </button>
            
          </div>
          <SquadPanel
            users={currentUser ? [currentUser, ...users] : users}
            controls={
              <>
                <MapControls
                  onZoomIn={() => mapRef.current?.zoomIn()}
                  onZoomOut={() => mapRef.current?.zoomOut()}
                />
                <button
                  onClick={() => {
                    if (location)
                      setFlyTo({ latitude: location.latitude, longitude: location.longitude })
                  }}
                  className="pointer-events-auto bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                  </svg>
                </button>
              </>
            }
            onFindFriend={(user) => {
              if (user.id === "me" && location) {
                setFlyTo({ latitude: location.latitude, longitude: location.longitude })
              } else {
                setFlyTo({ latitude: user.latitude, longitude: user.longitude })
              }
            }}
          />
        </>
      )}
    </div>
  )
}