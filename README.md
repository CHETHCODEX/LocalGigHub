# LocalGigHub

LocalGigHub is a local gig marketplace that connects students (job seekers) with shops and businesses (job providers).

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Visual Preview](#visual-preview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Modules](#api-modules)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

## Overview

The platform is designed for local-first hiring where small tasks and part-time opportunities can be posted, discovered, discussed, and managed in one place.

## Core Features

- Role-based authentication for students and shop owners
- Gig posting, marketplace browsing, and applications management
- Trust and safety tools: reporting, blocking, and moderation queue
- Real-time chat between gig providers and seekers
- In-app notifications with live streaming updates (SSE)
- AI-assisted tools:
	- Gig recommendations
	- Skill extraction
	- Local demand prediction
	- Pricing suggestions

## Visual Preview

Current project assets:

![LocalGigHub Banner](client/public/images/last_hero.webp)

![Business Graphic](client/public/images/business-desktop-870-x1.webp)

### Product Screenshots (Add Your Photos Here)

Replace these paths after you share your screenshots:

![Home Page](docs/screenshots/home.png)

![Marketplace Page](docs/screenshots/marketplace.png)

![Chat Page](docs/screenshots/chat.png)

![Notifications Page](docs/screenshots/notifications.png)

## Architecture

```text
React Client (client/) --> Express API (server/) --> MongoDB
													 |                  |
													 |                  --> AI modules (recommendation, pricing, demand, skills)
													 --> Real-time SSE notifications
```

## Tech Stack

- Frontend: React (CRA), Tailwind CSS, Axios, Framer Motion
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB
- Authentication: JWT via HttpOnly cookies
- Realtime: Server-Sent Events (SSE)

## Project Structure

```text
LocalGigHub/
	client/   # React frontend
	server/   # Express backend
```

## Getting Started

### 1) Clone Repository

```bash
git clone https://github.com/CHETHCODEX/LocalGigHub.git
cd LocalGigHub
```

### 2) Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/` using the variables below.

Start backend:

```bash
npm start
```

### 3) Frontend Setup

```bash
cd ../client
npm install
npm start
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Environment Variables

Create `server/.env`:

```env
MONGO=your_mongodb_connection_string
JWT_KEY=your_jwt_secret
```

## API Modules

- Auth: `/api/auth`
- Users: `/api/users`
- Gigs: `/api/gigs`
- Applications: `/api/applications`
- Chat: `/api/chat`
- Notifications: `/api/notifications`
- AI: `/api/ai`

## Roadmap

- Push notifications to mobile/web clients
- Advanced moderation automation and fraud detection
- Better analytics for providers
- Public profile improvements and ratings system

## Contributing

Issues and pull requests are welcome. For major feature proposals, open an issue first with use-case details.
