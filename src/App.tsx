import { useRef, useState } from "react"
import type { Map as LeafletMap } from "leaflet"
import { useSearchParams } from "react-router-dom"
import Map from "./components/Map"
import MapControls from "./components/MapControls"
import CreateEvent from "./components/createEvent"
import JoinEvent from "./components/JoinEvent"
import SquadPanel from "./components/SquadPanel"
import Landing from "./components/Landing"
import Toast from "./components/Toast"
import EventCard from "./components/EventCard"
import JoiningOverlay from "./components/JoiningOverlay"
import LocationOverlay from "./components/LocationOverlay"
import WelcomeBack from "./components/WelcomeBack"
import { useLocation } from "./hooks/useLocation"
import { useSquadEvent } from "./hooks/useSquadEvent"
import type { Coordinates, User } from "./types"

export default function App() {
  const [flyTo, setFlyTo] = useState<Coordinates | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const prefilledCode = searchParams.get("join")?.toUpperCase() ?? ""
  const mapRef = useRef<LeafletMap | null>(null)

  const { location, error: locationError, retry: retryLocation } = useLocation()
  const {
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
  } = useSquadEvent(location)

  const currentUser = event
    ? {
        id: "me",
        name: event.userName,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      }
    : null

  const flyToMe = () => {
    if (location) setFlyTo({ latitude: location.latitude, longitude: location.longitude })
  }

  // picking a friend draws the line to them, picking yourself clears it
  const handleFindFriend = (user: User) => {
    setSelectedUserId(user.id === "me" ? null : user.id)
    if (user.id === "me" && location) {
      flyToMe()
    } else {
      setFlyTo({ latitude: user.latitude, longitude: user.longitude })
    }
  }

  // the "just joined" toast flies to that person when tapped
  const handleToastClick = () => {
    const user = users.find((u) => u.id === toast?.userId)
    if (user) {
      setFlyTo({ latitude: user.latitude, longitude: user.longitude })
      setSelectedUserId(user.id)
    }
    setToast(null)
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-50">
      {joining && (
        <JoiningOverlay
          connected={connected}
          isCreator={event?.isCreator ?? false}
          onCancel={leaveEvent}
        />
      )}

      <Map
        users={users}
        currentLocation={location}
        flyTo={flyTo}
        userName={event?.userName ?? "You"}
        mapRef={mapRef}
        selectedUserId={selectedUserId}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          onClick={toast.userId ? handleToastClick : undefined}
        />
      )}

      {pendingSession && !event && (
        <WelcomeBack
          session={pendingSession}
          onRejoin={resumeSession}
          onEndEvent={endPendingEvent}
          onDismiss={forgetPendingSession}
        />
      )}

      {screen === "landing" && (
        <Landing onGetStarted={() => setScreen("home")} />
      )}

      {screen === "home" && (
        <JoinEvent
          onJoinEvent={joinEvent}
          onCreateInstead={() => setScreen("create")}
          prefilledCode={prefilledCode}
        />
      )}

      {screen === "create" && (
        <CreateEvent onCreateEvent={createEvent} />
      )}

      {screen === "map" && event && !location && (
        <LocationOverlay
          error={locationError}
          onRetry={retryLocation}
          onBack={leaveEvent}
        />
      )}

      {screen === "map" && event && (
        <>
          <EventCard
            event={event}
            friendCount={users.length}
            onLeave={leaveEvent}
            onNotify={(message) => setToast({ message, type: "success" })}
          />
          <SquadPanel
            users={currentUser ? [currentUser, ...users] : users}
            controls={
              <>
                <MapControls
                  onZoomIn={() => mapRef.current?.zoomIn()}
                  onZoomOut={() => mapRef.current?.zoomOut()}
                />
                <button
                  onClick={flyToMe}
                  aria-label="Centre the map on me"
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
            myLocation={location}
            selectedUserId={selectedUserId}
            onFindFriend={handleFindFriend}
          />
        </>
      )}
    </div>
  )
}
