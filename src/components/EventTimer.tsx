import { useEffect, useState } from 'react'

interface Props {
  createdAt: number
  expiresAfterMs?: number
}

function formatTime(ms: number) {
  const totalMins = Math.floor(ms / 60000)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

export default function EventTimer({ createdAt, expiresAfterMs = 60  * 1000 }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000) // update every 30s
    return () => clearInterval(interval)
  }, [])

  const elapsed = now - createdAt
  const remaining = expiresAfterMs - elapsed

  if (remaining <= 0) return (
    <p className="text-xs text-red-400">Event has expired</p>
  )

  return (
    <p className="text-xs text-gray-400">
      Started {formatTime(elapsed)} ago · expires in {formatTime(remaining)}
    </p>
  )
}