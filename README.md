# LocalGigHub

LocalGigHub is a local gig marketplace connecting job providers (shops/businesses) and job seekers (students).

## Features

- Role-based auth (shop, student)
- Gig posting and marketplace browsing
- Applications workflow (apply, accept, reject)
- Trust and safety layer
: report gigs, block users, moderation states
- Moderation queue for shops
- Live chat between provider and seeker
- In-app notifications with real-time updates (SSE)
- AI-assisted modules
: recommendations, skill extraction, demand prediction, pricing suggestions

## Tech Stack

- Frontend: React (CRA), Tailwind CSS, Axios, Framer Motion
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JWT via HttpOnly cookies

## Project Structure

- `client/` - React frontend
- `server/` - Express backend

## Local Setup

### 1. Clone

```bash
git clone https://github.com/CHETHCODEX/LocalGigHub.git
cd LocalGigHub
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGO=your_mongodb_connection_string
JWT_KEY=your_jwt_secret
```

Run backend:

```bash
npm start
```

### 3. Frontend

```bash
cd ../client
npm install
npm start
```

Frontend runs on `http://localhost:3000`.
Backend runs on `http://localhost:8000`.

## Main API Areas

- Auth: `/api/auth`
- Users: `/api/users`
- Gigs: `/api/gigs`
- Applications: `/api/applications`
- Chat: `/api/chat`
- Notifications: `/api/notifications`
- AI: `/api/ai`

## Notes

- Keep `.env` private (already ignored by `.gitignore`).
- If you change backend URL, update Axios base URL in `client/src/utils/newRequest.js`.

## License

No license specified.
