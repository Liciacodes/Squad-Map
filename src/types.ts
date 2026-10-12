export type Screen = "landing" | "home" | "create" | "map"

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface User {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface EventState {
  name: string
  code: string
  userName: string
  isCreator: boolean
  createdAt: number
  creatorToken?: string
  // secret that lets the server recognise this browser when it reconnects
  sessionKey?: string
  // when the server will end the event
  expiresAt?: number
}

export interface ToastMessage {
  message: string
  type: "success" | "error" | "info"
  userId?: string
}
