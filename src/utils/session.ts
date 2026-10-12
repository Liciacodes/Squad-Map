import type { EventState } from "../types"

// sessionStorage survives a refresh, localStorage also survives closing the tab
const EVENT_KEY = "squadmap-event"
const SCREEN_KEY = "squadmap-screen"
const LAST_EVENT_KEY = "squadmap-last-event"

const EVENT_LIFETIME_MS = 60 * 60 * 1000

export const saveSession = (event: EventState) => {
  sessionStorage.setItem(EVENT_KEY, JSON.stringify(event))
  sessionStorage.setItem(SCREEN_KEY, "map")
  localStorage.setItem(LAST_EVENT_KEY, JSON.stringify(event))
}

export const clearSavedSession = () => {
  sessionStorage.removeItem(EVENT_KEY)
  sessionStorage.removeItem(SCREEN_KEY)
  localStorage.removeItem(LAST_EVENT_KEY)
}

export const forgetLastEvent = () => {
  localStorage.removeItem(LAST_EVENT_KEY)
}

// the event this tab was in before a refresh, if any
export const readSavedEvent = (): EventState | null => {
  if (sessionStorage.getItem(SCREEN_KEY) !== "map") return null
  const saved = sessionStorage.getItem(EVENT_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

// the event that was open when the tab was last closed, if it could still be running
export const readLastEvent = (): EventState | null => {
  const lastEvent = localStorage.getItem(LAST_EVENT_KEY)
  if (!lastEvent) return null

  let saved: EventState
  try {
    saved = JSON.parse(lastEvent)
  } catch {
    forgetLastEvent()
    return null
  }

  if (Date.now() > (saved.expiresAt ?? saved.createdAt + EVENT_LIFETIME_MS)) {
    forgetLastEvent()
    return null
  }

  return saved
}

// the code from a share link such as ?join=ABC123
export const readJoinCode = () =>
  new URLSearchParams(window.location.search).get("join")?.toUpperCase() ?? ""
