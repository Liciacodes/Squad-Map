interface Props {
  onGetStarted: () => void
}

export default function Landing({ onGetStarted }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-[1000] bg-black/80 px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">

        {/* Logo */}
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </div>

        {/* Name and tagline */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold text-white">SquadMap</h1>
          <p className="text-gray-400 text-base">Find your people at any event, in real time.</p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: '📍', text: 'See your squad live on a map' },
            { icon: '🔑', text: 'Join any event with a simple code' },
            { icon: '⚡', text: 'No account needed, just show up' },
          ].map((feature) => (
            <div key={feature.text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <span className="text-lg">{feature.icon}</span>
              <p className="text-gray-800 text-sm font-medium">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="w-full bg-green-500 text-white rounded-xl py-4 text-base font-medium hover:bg-green-600 transition-colors shadow-lg"
        >
          Get Started
        </button>

        <p className="text-gray-300 text-xs">No sign up. No tracking. Just your squad.</p>
      </div>
    </div>
  )
}