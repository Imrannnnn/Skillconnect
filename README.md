# SkillConnect

A marketplace connecting clients with service providers.

## Tech Stack
- Frontend: React 19 (Vite), Tailwind CSS, React Router, Axios, Socket.io client
- Backend: Node.js, Express, MongoDB/Mongoose, Socket.io, Nodemailer, Multer, Sharp

## Key Features
- Provider profiles with categories, bio, location, and avatar upload
- Provider rating system: `ratingAvg`, `ratingCount`
  - Provider search sorted by ratingAvg desc, then ratingCount desc, then createdAt desc
- Booking system with status flow: `pending`, `declined`, `successful`
  - Email notifications sent to the provider upon booking creation
- Real-time chat
  - Rooms keyed by `chatId` (userA_userB)
  - Message persistence (MongoDB)
  - Typing indicators with participant name
  - Unread badges per chat and total unread badge in the header
- Health/news/posts/blog stubs to prevent 404s in UI
 - Provider analytics & wallet
   - Provider dashboard overview (earnings, paid/pending/released jobs, calendar snapshot)
   - Basic profile analytics (profile view counts)
 - Notifications
   - In-app notification center for booking, chat, and system updates

### Provider modes & product catalog

- Users with role `provider` have a `providerMode`:
  - `"service"` — offers only services
  - `"product"` — offers only products
  - `"both"` — offers both services and products
- Dashboard (`/provider/dashboard`)
  - "Manage product catalog" button is visible only when `providerMode` is `"product"` or `"both"`.
  - Service‑only providers (`providerMode === "service"`) do **not** see catalog management.
- Catalog management (`/provider/products`)
  - Protected by `PrivateRoute` and an in‑page guard.
  - Only providers with `providerMode === "product"` or `"both"` can access.
  - Service‑only providers trying to access `/provider/products` are redirected back to `/provider/dashboard`.

## Project Structure
- backend/
  - server.js (Express + Socket.io wiring, routes)
  - src/
    - models/ (User, Booking, Message)
    - controllers/ (auth, providers, bookings, chat, uploads)
    - routes/ (authRoutes, providerRoutes, bookingRoutes, chatRoutes, categoriesRoutes, uploadRoutes)
    - utils/sendEmail.js
- frontend/SKill-Project/
  - src/pages (ProviderList, ProviderProfile, EditProfileProvider, Dashboard pages, Bookings pages, Chat, etc.)
  - src/components (Header, PrivateRoute, toast, etc.)
  - src/api/axios.js (API client, NetBus)

## Setup

1) Backend
- Copy `.env` and set variables (see Environment)
- Install deps: `npm install`
- Ensure native deps: `npm install sharp@^0.33.3 multer`
- Run: `npm run dev`

2) Frontend
- Create `frontend/SKill-Project/.env` (or `.env.local`) with `VITE_API_BASE` and `VITE_SOCKET_URL`
- Install deps: `npm install`
- Run: `npm run dev`

## Environment Variables

Backend
- `PORT=5000`
- `MONGO_URI=<your mongodb uri>`
- `JWT_SECRET=<your jwt secret>`
- `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` (for booking emails)

Frontend
- `VITE_API_BASE=http://localhost:5000/api/v1`
- `VITE_SOCKET_URL=http://localhost:5000`

## API Summary (v1)

### Providers
- GET `/api/v1/providers`
  - Query: `category`, `providerType`
- GET `/api/v1/providers/:id`
- PUT `/api/v1/providers/:id`
- DELETE `/api/v1/providers/:id`
- POST `/api/v1/providers/:id/rate` — `{ "rating": 1..5 }`

### Categories
- GET `/api/v1/categories` — unique sorted categories for suggestions

### Users & Uploads
- GET `/api/v1/users/:id`
- PUT `/api/v1/users/:id/avatar` — multipart image upload (PNG/JPG/WEBP), processed by `sharp`
- Static files: `/uploads/...`

### Bookings
- POST `/api/v1/bookings`
  - `{ providerId, clientId?, clientName, clientPhone, description, address?, details? }`
- PUT `/api/v1/bookings/:id/status`
  - `{ status: 'pending'|'declined'|'successful' }`
- GET `/api/v1/bookings?providerId=...&clientId=...`

### Chat
- GET `/api/v1/chats` — list chats with last message for current user
- POST `/api/v1/chats` — `{ toUserId }` returns `{ chatId }`
- GET `/api/v1/chats/:chatId` — `{ messages: [...] }`
- POST `/api/v1/chats/:chatId/messages` — `{ text }` persists message

Message model: `{ chatId, sender, receiver, content, createdAt, updatedAt }`

Socket.io events: `joinRoom`, `leaveRoom`, `message` (broadcast), `typing({chatId,userId,name})`, `stopTyping`

### Health & Content Stubs
- GET `/api/v1/health`
- GET `/api/v1/news`
- GET `/api/v1/posts`
- GET `/api/v1/blog`

## Testing with Postman (Examples)

### Providers
- GET http://localhost:5000/api/v1/providers
- GET http://localhost:5000/api/v1/providers?category=plumber
- GET http://localhost:5000/api/v1/providers?category=plumber&providerType=individual
- POST http://localhost:5000/api/v1/providers/:id/rate  
  Body: `{ "rating": 5 }`

### Bookings
- POST http://localhost:5000/api/v1/bookings  
```
{
  "providerId": "<id>",
  "clientName": "John Doe",
  "clientPhone": "+1 555 0000",
  "description": "Fix leaking sink",
  "address": "123 Street",
  "details": "Kitchen"
}
```
- PUT http://localhost:5000/api/v1/bookings/:id/status  
  Body: `{ "status": "successful" }`
- GET http://localhost:5000/api/v1/bookings?providerId=<id>` or `?clientId=<id>

### Chat
- POST http://localhost:5000/api/v1/chats  
  Body: `{ "toUserId": "<otherUserId>" }`
- GET http://localhost:5000/api/v1/chats/:chatId
- POST http://localhost:5000/api/v1/chats/:chatId/messages  
  Body: `{ "text": "Hello" }`

## Frontend Pages
- ProviderList (filters + category suggestions)
- ProviderProfile (rating + booking + chat)
- EditProfileProvider (avatar upload, categories, bio)
- DashboardClient / DashboardProvider
- ProviderProducts (provider product catalog creation & management, guarded by providerMode)
- ProviderBookings (status management, filters, toasts)
- ClientBookings (filters)
- Chats (chat list with unread, typing indicators, chat window)
 - Notifications (in-app notification center for bookings, chats, and system events)

## Notes
- If avatar upload fails, ensure `sharp` is installed and backend restarted
- SMTP env vars required for provider email notifications
- Keep frontend BASE and SOCKET URLs aligned to backend origin (default http://localhost:5000)
