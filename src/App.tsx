import { useState, useEffect, useRef } from 'react'
import Map from './components/Map'
import CreateEvent from './components/createEvent'
import JoinEvent from './components/JoinEvent'
import SquadPanel from './components/SquadPanel'
import socket from './hooks/useSocket'

import { useLocation } from './hooks/useLocation'
import Landing from './components/Landing'

type Screen = 'landing' |'home' | 'create' | 'map'

interface EventState {
  name: string
  code: string
  userName: string
}

interface User {
  id: string
  name: string
  latitude: number
  longitude: number
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [event, setEvent] = useState<EventState | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [flyTo, setFlyTo] = useState<{ latitude: number; longitude: number } | null>(null)
 
  const location = useLocation()
  const hasJoined = useRef(false)

  useEffect(() => {
    if (!event || !location || hasJoined.current) return

    console.log('Joining event:', event.code)

    socket.emit('join-event', {
      eventCode: event.code,
      eventName: event.name,
      userName: event.userName,
      latitude: location.latitude,
      longitude: location.longitude
    })

    hasJoined.current = true

    socket.on('event-users', (existingUsers: User[]) => {
      console.log('Existing users:', existingUsers)
      setUsers(existingUsers.filter(u => u.id !== socket.id))
    })

    socket.on('user-joined', (user: User) => {
      console.log('User joined:', user)
      setUsers(prev => [...prev, user])
    })

    socket.on('user-moved', ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, latitude, longitude } : u))
    })

    socket.on('user-left', (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id))
    })
  }, [event, location])

  useEffect(() => {
    if (!event || !location || !hasJoined.current) return

    socket.emit('location-update', {
      eventCode: event.code,
      latitude: location.latitude,
      longitude: location.longitude
    })
  }, [location])

  const handleCreateEvent = (name: string, code: string, userName: string) => {
    hasJoined.current = false
    setEvent({ name, code, userName })
    setScreen('map')
  }

  const handleJoinEvent = (userName: string, code: string) => {
    hasJoined.current = false
    setEvent({ name: 'Event', code, userName })
    setScreen('map')
  }

  return (
    <div className="relative w-screen h-screen">
      <Map users={users} currentLocation={location} flyTo={flyTo} userName={event?.userName ?? 'You'} />

      {screen === 'landing' && (
        <Landing onGetStarted={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <JoinEvent
          onJoinEvent={handleJoinEvent}
          onCreateInstead={() => setScreen('create')}
        />
      )}

      {screen === 'create' && (
        <CreateEvent onCreateEvent={handleCreateEvent} />
      )}

      {screen === 'map' && event && (
         <>
    {/* Event code card - top center */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl px-6 py-4 shadow-lg flex flex-col items-center gap-1">
      <p className="text-xs text-gray-500">You are in</p>
      <h2 className="text-lg font-semibold text-gray-900">{event.name}</h2>
      <div className="bg-green-50 rounded-xl px-4 py-2 mt-1">
        <p className="text-green-600 font-mono font-bold tracking-widest text-xl">{event.code}</p>
      </div>
      <p className="text-xs text-gray-400 mt-1">Share this code with your squad</p>
      <p className="text-xs text-gray-400">{users.length} friend{users.length !== 1 ? 's' : ''} in this event</p>
    </div>

    <button
  onClick={() => {
    if (location) setFlyTo({ latitude: location.latitude, longitude: location.longitude })
  }}
  className="absolute bottom-52 right-4 z-[1000] bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
  </svg>
</button>

    {/* Squad panel - bottom */}
    <SquadPanel
      users={users}
      onFindFriend={(user) => setFlyTo({ latitude: user.latitude, longitude: user.longitude })}
    />
  </>
      )}
    </div>
  )
}