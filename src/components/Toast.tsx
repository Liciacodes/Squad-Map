import { useEffect } from "react"

interface Props {
  message: string
  type: "error" | "success" | "info"
  onClose: () => void
  onClick?: () => void
}

export default function Toast({ message, type, onClose, onClick }: Props) {
  const tappable = Boolean(onClick)

  useEffect(() => {
    // tappable toasts stay longer so there is time to tap them
    const timer = setTimeout(() => {
      onClose()
    }, tappable ? 5000 : 2000)
    return () => clearTimeout(timer)
  }, [message, type, onClose, tappable])

  return (
    <div
      onClick={onClick}
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-[92%] max-w-sm px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 ${
        onClick ? "cursor-pointer" : ""
      } ${
        type === "error" ? "bg-red-500"
        : type === "info" ? "bg-gray-800"
        : "bg-green-500"
      }`}
    >
      <span className="text-white text-sm flex-1">{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
