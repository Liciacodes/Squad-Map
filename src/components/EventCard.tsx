import { useState } from "react"
import EventTimer from "./EventTimer"
import type { EventState } from "../types"

interface Props {
  event: EventState
  friendCount: number
  onLeave: () => void
  // for short confirmations such as "Code copied!"
  onNotify: (message: string) => void
}

// the card at the top of the map: event name, code, timer and share button
export default function EventCard({ event, friendCount, onLeave, onNotify }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const handleShare = () => {
    const shareUrl = `${window.location.origin}?join=${event.code}`
    if (navigator.share) {
      navigator.share({
        title: "Join my squad on SquadMap",
        text: `Join ${event.name} on SquadMap!`,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      onNotify("Link copied!")
    }
  }

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl p-3  flex flex-col gap-1 w-[92%] max-w-sm"
      style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Show event details"
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-semibold text-gray-900 truncate">
            {event.name || "Event"}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-green-600 font-mono font-bold tracking-widest text-sm">
              {event.code}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
      ) : (
        <>
          <div className="w-full flex items-center justify-between">
            <p className="text-[10px] text-gray-500">You are in</p>
            <div className="flex items-center gap-3">
              <button
                className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                onClick={onLeave}
              >
                {event.isCreator ? "🔴 End Event" : "👋 Leave Event"}
              </button>
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Hide event details"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
            </div>
          </div>

          <h2 className="text-base font-semibold text-gray-900">
            {event.name || "Event"}
          </h2>

          <div
            className="bg-green-50 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer active:bg-green-100 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(event.code)
              onNotify("Code copied!")
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
            {friendCount} friend{friendCount !== 1 ? "s" : ""} in this event
          </p>

          {event.createdAt && (
            <EventTimer createdAt={event.createdAt} expiresAt={event.expiresAt} />
          )}

          <button
            onClick={handleShare}
            className="w-full mt-1 border border-green-500 text-green-500 rounded-xl py-2 text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share with squad
          </button>
        </>
      )}
    </div>
  )
}
