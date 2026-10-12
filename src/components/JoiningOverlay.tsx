interface Props {
  connected: boolean
  isCreator: boolean
  onCancel: () => void
}

// shown from sending a create or join until the server answers
export default function JoiningOverlay({ connected, isCreator, onCancel }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[2000] bg-black/60">
      <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600">
          {!connected
            ? "Connecting to the server..."
            : isCreator
              ? "Creating your event..."
              : "Finding your squad..."}
        </p>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
