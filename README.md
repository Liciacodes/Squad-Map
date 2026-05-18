# SquadMap

Real-time event location sharing app. Create an event, share a 6-character code, and see your squad as live dots on a map — no accounts, no sign up, just show up.

🗺️ **Live:** https://squad-map-kappa.vercel.app
💻 **Backend:** https://github.com/Liciacodes/Squad-Map-server

---

## What it does

- Create an event and get a shareable 6-character code
- Friends join using the code and appear as live dots on the map
- See everyone's location updating in real time via WebSockets
- Tap a name in the squad panel to fly the map to that person
- Leave or end the event — updates instantly for everyone
- Event auto-expires after 1 hour and notifies all members
- See live user count and event name before joining
- Installable as a PWA on your phone home screen
- Session persists on refresh — no need to rejoin

---

## Tech Stack

- **React + TypeScript** — Frontend
- **Tailwind CSS v4** — Styling
- **Leaflet + OpenStreetMap** — Maps, free, no API key needed
- **Socket.io Client** — Real-time WebSocket connection
- **React Router** — Client-side routing
- **Vite** — Build tool
- **Vercel** — Deployment

---

## Project Structure

src/
├── components/
│   ├── Map.tsx           # Leaflet map with live markers
│   ├── MapControls.tsx   # Custom zoom buttons
│   ├── SquadPanel.tsx    # List of squad members
│   ├── CreateEvent.tsx   # Create event form
│   ├── JoinEvent.tsx     # Join event form with live count
│   ├── Landing.tsx       # Landing screen
│   ├── EventTimer.tsx    # Event expiry countdown
│   └── Toast.tsx         # Notification toasts
├── hooks/
│   ├── useSocket.ts      # Socket.io singleton
│   └── useLocation.ts    # Geolocation hook
└── App.tsx               # Main app with socket logic

---

## Run Locally

```bash
# Clone the repo
git clone https://github.com/Liciacodes/Squad-Map.git
cd Squad-Map

# Install dependencies
npm install --legacy-peer-deps

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:3001" > .env

# Start the dev server
npm run dev
```

Make sure the backend is also running locally.
Backend repo: https://github.com/Liciacodes/Squad-Map-server

---

## Environment Variables

VITE_BACKEND_URL=https://your-backend-url.onrender.com

---

## How It Works

Each event is a Socket.io room identified by a 6-character code. When a user joins, their socket connects to that room. Every location update they emit gets broadcast to everyone else in the room in real time. When they leave, all other users are notified instantly.

User creates event → backend stores event in memory
Friend joins with code → added to socket room
User moves → coordinates broadcast to everyone in room
User leaves → everyone notified instantly
Event expires → everyone taken back to home screen

---

## Related

- [SquadMap Backend](https://github.com/Liciacodes/Squad-Map-server)
- [Live App](https://squad-map-kappa.vercel.app)
- [Case Study](your medium link here)
