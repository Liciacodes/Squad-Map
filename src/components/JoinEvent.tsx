import { useState } from "react";

interface Props {
  onJoinEvent: (name: string, code: string) => void;
  onCreateInstead: () => void;
}

export default function JoinEvent({ onJoinEvent, onCreateInstead }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleJoin = () => {
    if (!name.trim() || !code.trim()) return;
    onJoinEvent(name, code);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1000] bg-black/50">
      <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Squad Map</h1>
        <p className="text-gray-500 text-sm">
          Find your friends at any event in real time
        </p>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
        />

        <input
          type="text"
          placeholder="Event code e.g ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-mono tracking-widest"
        />

        <button
          onClick={handleJoin}
          className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
        >
          Join Event
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
  );
}
