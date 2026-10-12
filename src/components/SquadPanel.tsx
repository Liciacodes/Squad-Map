// interface User {
//     id: string
//     name: string
//     latitude: number
//     longitude: number
//   }
  
//   interface Props {
//     users: User[]
//     onFindFriend: (user: User) => void
//   }
  
//   const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
//   export default function SquadPanel({ users, onFindFriend }: Props) {
//     return (
//       <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[24px] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] md:w-auto "  
//       style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
//         <div className="px-4 py-3 border-b border-gray-100">
//           <p className="text-sm font-medium text-gray-900">
//             Squad · {users.length} {users.length === 1 ? 'person' : 'people'}
//           </p>
//         </div>
  
//         {users.length === 0 ? (
//           <div className="px-4 py-4 text-center">
//             <p className="text-sm text-gray-400">No one else here yet</p>
//             <p className="text-xs text-gray-300 mt-1">Share the event code with your squad</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-50 max-h-36 overflow-y-auto">
//             {users.map((user, index) => (
//               <button
//                 key={user.id}
//                 onClick={() => onFindFriend(user)}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
//               >
//                 <div
//                   className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
//                   style={{ background: COLORS[index % COLORS.length] }}
//                 >
//                   {user.name.charAt(0).toUpperCase()}
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-medium text-gray-900">{user.name}</p>
//                     {user.id === 'me' && (
//                       <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">You</span>
//                     )}
//                   </div>
//                   <p className="text-xs text-gray-400">
//                     {user.id === 'me' ? 'Tap to find yourself' : 'Tap to locate'}
//                   </p>
//                 </div>
//                 <div
//                   className="w-2 h-2 rounded-full flex-shrink-0"
//                   style={{ background: COLORS[index % COLORS.length] }}
//                 />
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     )
//   }


import type { ReactNode } from 'react'
import { getUserColor } from '../utils/userColor'
import { distanceMeters, formatDistance } from '../utils/distance'

interface User {
    id: string
    name: string
    latitude: number
    longitude: number
  }

  interface Props {
    users: User[]
    onFindFriend: (user: User) => void
    controls?: ReactNode
    myLocation: { latitude: number; longitude: number } | null
    selectedUserId: string | null
  }

  export default function SquadPanel({ users, onFindFriend, controls, myLocation, selectedUserId }: Props) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <div className="relative w-[92%] max-w-md pointer-events-auto">
          {/* map buttons sit just above the panel and move with its height */}
          {controls && (
            <div className="absolute bottom-full left-0 right-0 mb-3 flex items-end justify-between pointer-events-none">
              {controls}
            </div>
          )}
        <div className="bg-white rounded-t-2xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              Squad · {users.length} {users.length === 1 ? 'person' : 'people'}
            </p>
          </div>
  
          {users.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No one else here yet</p>
              <p className="text-xs text-gray-300 mt-1">Share the event code with your squad</p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onFindFriend(user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    user.id === selectedUserId ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ background: getUserColor(user.id) }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      {user.id === 'me' && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {user.id === 'me'
                        ? 'Tap to find yourself'
                        : myLocation
                          ? `${formatDistance(distanceMeters(myLocation, user))} away · tap to locate`
                          : 'Tap to locate'}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getUserColor(user.id) }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    )
  }