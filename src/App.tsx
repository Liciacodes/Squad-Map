import { useState, useEffect, useRef } from "react"
import Map from "./components/Map"
import CreateEvent from "./components/createEvent"
import JoinEvent from "./components/JoinEvent"
import SquadPanel from './components/SquadPanel'
import socket from "./hooks/useSocket"
import { useLocation } from "./hooks/useLocation"
import Landing from "./components/Landing"
import { useSearchParams } from "react-router-dom"
import Toast from "./components/Toast"
import EventTimer from "./components/EventTimer"

type Screen = "landing" | "home" | "create" | "map"

interface EventState {
  name: string
  code: string
  userName: string
  isCreator: boolean
  createdAt: number
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

  const location = useLocation()
  const hasJoined = useRef(false)
  const listenersRegistered = useRef(false)
  const usersRef = useRef<User[]>([])

  // keep usersRef in sync
  useEffect(() => {
    usersRef.current = users
  }, [users])

  const currentUser = event
    ? {
        id: "me",
        name: event.userName,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      }
    : null

  // register socket listeners once
  useEffect(() => {
    if (listenersRegistered.current) return
    listenersRegistered.current = true

    console.log('🔌 Registering socket listeners')

    socket.on("event-users", (data: { eventName: string; users: User[] } | User[]) => {
      if (Array.isArray(data)) {
        const filtered = data.filter((u) => u.id !== socket.id)
        usersRef.current = filtered
        setUsers(filtered)
      } else {
        const filtered = data.users.filter((u) => u.id !== socket.id)
        usersRef.current = filtered
        setUsers(filtered)
        setEvent((prev) =>
          prev ? { ...prev, name: data.eventName ?? prev.name } : prev
        )
      }
      setJoining(false)
      setScreen("map")
    })

    socket.on("user-joined", (user: User) => {
      if (usersRef.current.find((u) => u.id === user.id)) return
      usersRef.current = [...usersRef.current, user]
      setUsers([...usersRef.current])
    })

    socket.on("user-moved", ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      usersRef.current = usersRef.current.map((u) =>
        u.id === id ? { ...u, latitude, longitude } : u
      )
      setUsers([...usersRef.current])
    })

    socket.on("user-left", (id: string, userName: string) => {
       setToast({ message: `${userName} has left the event.`, type: "info" })
      console.log("✅ user-left received:", id)
      usersRef.current = usersRef.current.filter((u) => u.id !== id)
      setUsers([...usersRef.current])
    })

    socket.on("event-not-found", () => {
      setToast({
        message: "Event not found. Please check the code and try again.",
        type: "error",
      })
      setJoining(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("home")
    })

    socket.on("event-ended", () => {
      sessionStorage.removeItem("squadmap-event")
      sessionStorage.removeItem("squadmap-screen")
      setToast({ message: "The event has ended.", type: "error" })
      setJoining(false)
      setEvent(null)
      usersRef.current = []
      setUsers([])
      hasJoined.current = false
      setScreen("home")
    })
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

    socket.emit("join-event", {
      eventCode: event.code,
      eventName: event.name || null,
      userName: event.userName,
      latitude: location.latitude,
      longitude: location.longitude,
    })

    hasJoined.current = true
    if (!event.isCreator) {
      setJoining(true)
    const timer = setTimeout(() => {
      setJoining((prev) => {
        if (prev) {
          setToast({message: 'Finding squad taking too long...', type: 'info'})
          return false
        }
        return false
      })
    }, 10000)

    return () => clearTimeout(timer)
    }
  }, [event, location])

  // location updates
  useEffect(() => {
    if (!event || !location || !hasJoined.current) return
    socket.emit("location-update", {
      eventCode: event.code,
      latitude: location.latitude,
      longitude: location.longitude,
    })
  }, [location, event])

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
    if (event?.isCreator) {
      socket.emit("end-event", { eventCode: event.code })
    } else {
      socket.emit("leave-event")
    }
    setTimeout(() => {
    setEvent(null)
    usersRef.current = []
    setUsers([])
    hasJoined.current = false
    sessionStorage.clear()
    setScreen("home")
  }, 100)
  }

  return (
    <div className="relative w-screen h-screen">
      {joining && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[2000] bg-black/60">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Finding your squad...</p>
          </div>
        </div>
      )}

      <Map
        users={users}
        currentLocation={location}
        flyTo={flyTo}
        userName={event?.userName ?? "You"}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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

      {screen === "map" && event && (
        <>
          <div className="absolute left-0 right-0 z-[1000] bg-white shadow-md px-4 pb-3 flex flex-col gap-1" 
           style={{ top: 0, paddingTop: 'max(env(safe-area-inset-top), 44px)' }}>
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-gray-500">You are in</p>
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

          <button
            onClick={() => {
              if (location)
                setFlyTo({ latitude: location.latitude, longitude: location.longitude })
            }}
            className="absolute bottom-52 right-4 z-1000 bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          </button>

          <SquadPanel
            users={currentUser ? [currentUser, ...users] : users}
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