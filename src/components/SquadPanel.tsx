interface User {
    id: string
    name: string
    latitude: number
    longitude: number
}

interface Props {
    users: User[]
    onFindFriend: (user: User) => void
}

const COLORS = ['#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899']

export default function SquadPanel({ users, onFindFriend }: Props) {
    return (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
          <div className="divide-y divide-gray-50">
            {users.map((user, index) => (
              <button
                key={user.id}
                onClick={() => onFindFriend(user)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                  style={{ background: COLORS[index % COLORS.length] }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400">Tap to locate</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    )
}