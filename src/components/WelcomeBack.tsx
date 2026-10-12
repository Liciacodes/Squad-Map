import type { EventState } from "../types"

interface Props {
  session: EventState
  onRejoin: () => void
  onEndEvent: () => void
  onDismiss: () => void
}

// shown when the app is reopened while an earlier event may still be running
export default function WelcomeBack({ session, onRejoin, onEndEvent, onDismiss }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1600] bg-black/60 px-4">
      <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 w-full max-w-sm text-center">
        <p className="text-base font-semibold text-gray-900">Welcome back</p>
        <p className="text-sm text-gray-600">
          You were in {session.name || "an event"} ({session.code}).
        </p>
        <button
          onClick={onRejoin}
          className="w-full bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
        >
          Rejoin
        </button>
        {session.isCreator && session.creatorToken && (
          <button
            onClick={onEndEvent}
            className="w-full border border-red-400 text-red-500 rounded-xl py-3 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            End event
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  )
}
