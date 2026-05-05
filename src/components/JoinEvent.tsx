import { useEffect, useState } from "react";

interface Props {
  onJoinEvent: (name: string, code: string, createdAt?: number) => void;
  onCreateInstead: () => void;
  prefilledCode?: string;
}

interface EventInfo {
  exists: boolean;
  count: number;
  name: string;
  createdAt: number | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function JoinEvent({ onJoinEvent, onCreateInstead, prefilledCode }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (prefilledCode) setCode(prefilledCode);
  }, [prefilledCode])

  // check event info when code is 6 chars
  useEffect(() => {
    if (code.length !== 6) {
      setEventInfo(null)
      return
    }

    const timeout = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`${BACKEND_URL}/event/${code}`)
        const data = await res.json()
        setEventInfo(data)
      } catch {
        setEventInfo(null)
      } finally {
        setChecking(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [code])

  const handleJoin = () => {
    if (!name.trim() || !code.trim()) {
      setError("Please enter both your name and the event code.");
      return;
    }

    if (code.length !== 6 ) {
      setError('Event code must be 6 characters long.');
    }

    if (eventInfo && !eventInfo.exists) {
      setError("Event not found.");
      return; 
    }
    setError("");
    onJoinEvent(name, code, eventInfo?.createdAt);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1000] bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">SquadMap</h1>
        <p className="text-gray-500 text-sm">Find your friends at any event in real time</p>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError("") }}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Event code e.g ABC123"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError("") }}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-mono tracking-widest"
          />

          {checking && (
            <p className="text-xs text-gray-400 px-1">Checking event...</p>
          )}

          {eventInfo && eventInfo.exists && (
            <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-green-700 font-medium">
                {eventInfo.name} · {eventInfo.count} {eventInfo.count === 1 ? 'person' : 'people'} already here
              </p>
            </div>
          )}

          {eventInfo && !eventInfo.exists && code.length === 6 && (
            <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-2">
              <p className="text-xs text-red-500">Event not found. Check the code.</p>
            </div>
          )}
        </div>

        <button
  onClick={handleJoin}
  disabled={code.length !== 6 || checking}
  className={`w-full rounded-xl py-3 text-sm font-medium transition-colors ${
    code.length !== 6 || checking
      ? "bg-gray-300 cursor-not-allowed text-gray-500"
      : "bg-green-500 text-white hover:bg-green-600"
  }`}
>
  {checking ? "Checking..." : "Join Event"}
</button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={onCreateInstead}
          className="border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:border-green-500 hover:text-green-500 transition-colors"
        >
          Create a new event
        </button>
      </div>
    </div>
  )
}