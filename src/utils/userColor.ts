export const MY_COLOR = '#22c55e'

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// same id always gets the same colour, on the map and in the squad panel
export function getUserColor(id: string) {
  if (id === 'me') return MY_COLOR
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}
