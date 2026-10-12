import { useEffect, useState } from 'react'

interface Props {
  createdAt: number
  // sent by the server, the fallback only covers an older server that doesn't send it
  expiresAt?: number
}

const DEFAULT_LIFETIME_MS = 60 * 60 * 1000

function formatTime(ms: number) {
  const totalMins = Math.floor(ms / 60000)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

export default function EventTimer({ createdAt, expiresAt }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000) // update every 30s
    return () => clearInterval(interval)
  }, [])

  // now only refreshes every 30s, so it can be slightly behind createdAt
  const elapsed = Math.max(0, now - createdAt)
  const remaining = (expiresAt ?? createdAt + DEFAULT_LIFETIME_MS) - now

  if (remaining <= 0) return (
    <p className="text-xs text-red-400">Event has expired</p>
  )

  return (
    <p className="text-xs text-gray-400">
      Started {formatTime(elapsed)} ago · expires in {formatTime(remaining)}
    </p>
  )
}
