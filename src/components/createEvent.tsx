// import { useState } from "react";

// interface Props {
//   onCreateEvent: (eventName: string, code: string, userName: string) => void;
// }

// export default function CreateEvent({ onCreateEvent }: Props) {
//   const [eventName, setEventName] = useState("");
//   const [userName, setUserName] = useState("");

//   const generateCode = () => {
//     return Math.random().toString(36).substring(2, 8).toUpperCase();
//   };

//   const handleCreate = () => {
//     if (!eventName.trim() || !userName.trim()) return;
//     const code = generateCode();
//     onCreateEvent(eventName, code, userName);
//   };

//   return (
//     <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[1000] bg-black/50 px-4">
//       <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md flex flex-col gap-4">
//         <h1 className="text-2xl font-semibold text-gray-900">Create Event</h1>
//         <p className="text-gray-500 text-sm">
//           Share the code with your squad so they can find you
//         </p>
//         <input
//           type="text"
//           placeholder="Your name"
//           value={userName}
//           onChange={(e) => setUserName(e.target.value)}
//           className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
//         />
//         <input
//           type="text"
//           placeholder="Event name e.g Lagos Fitness Fest"
//           value={eventName}
//           onChange={(e) => setEventName(e.target.value)}
//           className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
//         />

//         <button
//           onClick={handleCreate}
//           className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
//         >
//           Create Event
//         </button>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";

interface Props {
  onCreateEvent: (eventName: string, code: string, userName: string) => void;
}

export default function CreateEvent({ onCreateEvent }: Props) {
  const [eventName, setEventName] = useState("");
  const [userName, setUserName] = useState("");

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = () => {
    if (!eventName.trim() || !userName.trim()) return;
    const code = generateCode();
    onCreateEvent(eventName, code, userName);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-[1000] bg-black/50 px-4 overflow-y-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
      <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md flex flex-col gap-4 my-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Create Event</h1>
        <p className="text-gray-500 text-sm">
          Share the code with your squad so they can find you
        </p>
        <input
          type="text"
          placeholder="Your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
        />
        <input
          type="text"
          placeholder="Event name e.g Lagos Fitness Fest"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
        />

        <button
          onClick={handleCreate}
          className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors"
        >
          Create Event
        </button>
      </div>
    </div>
  );
}

