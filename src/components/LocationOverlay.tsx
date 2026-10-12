interface Props {
  error: string | null
  onRetry: () => void
  onBack: () => void
}

// shown on the map screen until the browser gives us a position
export default function LocationOverlay({ error, onRetry, onBack }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1500] bg-black/60 px-4">
      <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 w-full max-w-sm text-center">
        {error ? (
          <>
            <p className="text-base font-semibold text-gray-900">We need your location</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={onRetry}
              className="w-full bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={onBack}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Go back
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Getting your location...</p>
          </>
        )}
      </div>
    </div>
  )
}
