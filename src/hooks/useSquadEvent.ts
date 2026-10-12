import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react"
import socket, { BACKEND_URL } from "./useSocket"
import { distanceMeters } from "../utils/distance"
import {
  clearSavedSession,
  forgetLastEvent,
  readJoinCode,
  readLastEvent,
  readSavedEvent,
  saveSession,
} from "../utils/session"
import type { Coordinates, EventState, Screen, ToastMessage, User } from "../types"

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

// Everything about being in an event: talking to the server, who else is
// there, which screen to show, and the session that survives a refresh.
export function useSquadEvent(location: Coordinates | null) {
  // a refresh goes straight back to the map, a share link straight to the join form
  const [screen, setScreen] = useState<Screen>(() =>
    readSavedEvent() ? "map" : readJoinCode() ? "home" : "landing"
  )
  const [toast, setToast] = useState<ToastMessage | null>(null)
  // true once the server has answered our create or join with event-users
  const [confirmed, setConfirmed] = useState(false)
  const [event, setEvent] = useState<EventState | null>(readSavedEvent)
  const [users, setUsers] = useState<User[]>([])
  const [pendingSession, setPendingSession] = useState<EventState | null>(null)
  const connected = useSyncExternalStore(subscribeToConnection, () => socket.connected)

  // the create or join is sent as soon as we have an event and a location,
  // so from then until the server answers we are waiting
  const joining = event !== null && location !== null && !confirmed
  const hasJoined = useRef(false)
  const lastSent = useRef<(Coordinates & { time: number }) | null>(null)
  const usersRef = useRef<User[]>([])
  const eventRef = useRef<EventState | null>(null)
  const locationRef = useRef<Coordinates | null>(null)

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

  // register socket listeners, removed again on unmount
  useEffect(() => {
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
        sessionKey: eventRef.current.sessionKey,
        latitude: locationRef.current.latitude,
        longitude: locationRef.current.longitude,
      })
      lastSent.current = { ...locationRef.current, time: Date.now() }
    }

    const onEventUsers = (data: { eventName: string; users: User[]; createdAt?: number; expiresAt?: number; selfId?: string } | User[]) => {
      if (Array.isArray(data)) {
        const filtered = data.filter((u) => u.id !== socket.id)
        usersRef.current = filtered
        setUsers(filtered)
      } else {
        // after a reconnect our id is no longer the socket id, the server says which one is ours
        const selfId = data.selfId ?? socket.id
        const filtered = data.users.filter((u) => u.id !== selfId)
        usersRef.current = filtered
        setUsers(filtered)
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                name: data.eventName ?? prev.name,
                createdAt: data.createdAt ?? prev.createdAt,
                expiresAt: data.expiresAt ?? prev.expiresAt,
              }
            : prev
        )
      }
      setConfirmed(true)
      setScreen("map")
    }

    const onUserJoined = (user: User) => {
      if (usersRef.current.find((u) => u.id === user.id)) return
      usersRef.current = [...usersRef.current, user]
      setUsers([...usersRef.current])
      setToast({ message: `${user.name} just joined 👋 tap to locate`, type: "info", userId: user.id })
    }

    const onUserMoved = ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      usersRef.current = usersRef.current.map((u) =>
        u.id === id ? { ...u, latitude, longitude } : u
      )
      setUsers([...usersRef.current])
    }

    const onUserLeft = (id: string, userName: string) => {
      setToast({ message: `${userName} has left the event.`, type: "info" })
      usersRef.current = usersRef.current.filter((u) => u.id !== id)
      setUsers([...usersRef.current])
    }

    const onEventCreated = ({ eventCode, creatorToken }: { eventCode: string; creatorToken: string }) => {
      setEvent((prev) =>
        prev && prev.code === eventCode ? { ...prev, creatorToken } : prev
      )
    }

    const onEventCreateFailed = ({ reason }: { reason: string }) => {
      clearSavedSession()
      setToast({
        message: reason === "code-taken"
          ? "That event code is already in use. Please try again."
          : reason === "server-full"
            ? "The server is busy right now. Please try again later."
            : "Could not create the event. Please check the names and try again.",
        type: "error",
      })
      setConfirmed(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("create")
    }

    const onEventFull = () => {
      clearSavedSession()
      setToast({ message: "This event is full.", type: "error" })
      setConfirmed(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("home")
    }

    const onEventNotFound = () => {
      clearSavedSession()
      setToast({
        message: "Event not found. It may have ended, or the code is wrong.",
        type: "error",
      })
      setConfirmed(false)
      setEvent(null)
      hasJoined.current = false
      setScreen("home")
    }

    const onEventEnded = () => {
      clearSavedSession()
      setToast({ message: "The event has ended.", type: "error" })
      setConfirmed(false)
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
    socket.on("event-full", onEventFull)
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
      socket.off("event-full", onEventFull)
      socket.off("event-not-found", onEventNotFound)
      socket.off("event-ended", onEventEnded)
    }
  }, [])

  // offer to go back into an event that was open when the tab was closed
  useEffect(() => {
    // a refresh already restored the event when the state was first created
    if (readSavedEvent()) return

    // the tab was closed and reopened: ask before going back, so location
    // sharing never restarts without the person choosing it
    const saved = readLastEvent()
    if (!saved) return

    // a share link for a different event wins over the old one
    const joinCode = readJoinCode()
    if (joinCode && joinCode !== saved.code) return

    let cancelled = false
    fetch(`${BACKEND_URL}/event/${saved.code}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (cancelled) return
        if (info && !info.exists) {
          // it ended while the tab was closed
          forgetLastEvent()
        } else {
          setPendingSession(saved)
        }
      })
      .catch(() => {
        if (!cancelled) setPendingSession(saved)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // join event
  useEffect(() => {
    if (!event || !location || hasJoined.current) return

    const payload = {
      eventCode: event.code,
      userName: event.userName,
      sessionKey: event.sessionKey,
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
  }, [event, location])

  // give up if the server is reachable but never answers the create or join
  useEffect(() => {
    if (!joining || !connected) return

    const timer = setTimeout(() => {
      const wasCreator = eventRef.current?.isCreator
      clearSavedSession()
      setToast({ message: "The server did not respond. Please try again.", type: "error" })
      setConfirmed(false)
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
    if (event && screen === "map") saveSession(event)
  }, [event, screen])

  const createEvent = (name: string, code: string, userName: string) => {
    hasJoined.current = false
    setPendingSession(null)
    setEvent({ name, code, userName, isCreator: true, createdAt: Date.now(), sessionKey: crypto.randomUUID() })
    setScreen("map")
    setConfirmed(false)
  }

  const joinEvent = (userName: string, code: string, createdAt?: number) => {
    hasJoined.current = false
    setPendingSession(null)
    setConfirmed(false)
    setEvent({ name: "", code, userName, isCreator: false, createdAt: createdAt ?? Date.now(), sessionKey: crypto.randomUUID() })
    setScreen("map")
  }

  // "Welcome back" card: go back into the event that was open before the tab closed
  const resumeSession = () => {
    if (!pendingSession) return
    hasJoined.current = false
    setConfirmed(false)
    setEvent(pendingSession)
    setPendingSession(null)
    setScreen("map")
  }

  // the creator can end the event from the card without rejoining it
  const endPendingEvent = () => {
    if (!pendingSession?.creatorToken) return
    socket.emit("end-event", { eventCode: pendingSession.code, creatorToken: pendingSession.creatorToken })
    clearSavedSession()
    setPendingSession(null)
    setToast({ message: "Event ended.", type: "success" })
  }

  const forgetPendingSession = () => {
    clearSavedSession()
    setPendingSession(null)
  }

  const leaveEvent = () => {
    // without a token the event was never confirmed, so just leave
    if (event?.isCreator && event.creatorToken) {
      socket.emit("end-event", { eventCode: event.code, creatorToken: event.creatorToken })
    } else {
      socket.emit("leave-event")
    }
    setTimeout(() => {
      setConfirmed(false)
      setEvent(null)
      usersRef.current = []
      setUsers([])
      hasJoined.current = false
      clearSavedSession()
      setScreen("home")
    }, 100)
  }

  return {
    screen,
    setScreen,
    toast,
    setToast,
    closeToast,
    event,
    users,
    joining,
    connected,
    pendingSession,
    createEvent,
    joinEvent,
    leaveEvent,
    resumeSession,
    endPendingEvent,
    forgetPendingSession,
  }
}
