import { useEffect } from "react"

interface Props {
  message: string
  type: "error" | "success" | "info"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 2000)
    return () => clearTimeout(timer)
  }, [message, type, onClose])

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-[92%] max-w-sm px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 ${
        type === "error" ? "bg-red-500" 
        : type === "info" ? "bg-gray-800" 
        : "bg-green-500"
      }`}
    >
      <span className="text-white text-sm flex-1">{message}</span>
      <button onClick={onClose} className="text-white text-lg leading-none">
        ×
      </button>
    </div>
  )
}