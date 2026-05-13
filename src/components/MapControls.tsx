import { useMap } from 'react-leaflet'

export default function MapControls() {
  const map = useMap()

  return (
    <div className="absolute bottom-28 md:bottom-32 left-4 z-[1100] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 text-xl font-light hover:bg-gray-50 transition-colors"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 text-xl font-light hover:bg-gray-50 transition-colors"
      >
        −
      </button>
    </div>
  )
}