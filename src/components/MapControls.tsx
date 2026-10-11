interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
}

export default function MapControls({ onZoomIn, onZoomOut }: Props) {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      <button
        onClick={onZoomIn}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 text-xl font-light hover:bg-gray-50 transition-colors"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 text-xl font-light hover:bg-gray-50 transition-colors"
      >
        −
      </button>
    </div>
  )
}
