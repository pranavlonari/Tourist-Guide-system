# Smart Tourist Guide System

Smart Tourist Guide System is a responsive tourism application built with a strictly
HTML/CSS frontend and a Node.js/Express backend backed by MySQL.

- `frontend/` contains only HTML templates and CSS. It has no JavaScript.
- `backend/` contains the Express server, server-side form handling, JSON API,
  MySQL schema and seed data, and automated tests.
- Express renders the HTML pages and serves the frontend and API from the same
  origin at `http://localhost:3000`.

## Requirements

- Node.js 20 or newer and npm
- MySQL 8.0 or newer

## Fresh database setup

From the project root, create the database and tables, then load sample
destinations and listings:

```powershell
Get-Content backend\sql\schema.sql | mysql.exe -u root -p
Get-Content backend\sql\seed.sql | mysql.exe -u root -p roam_tourism
```

The sample data includes destinations in Maharashtra, Goa, Rajasthan, Kerala,
Karnataka, Himachal Pradesh, and Punjab.

## Configure and run

Copy the example environment file and edit `backend\.env` with the credentials
for your local MySQL server. Set `SESSION_SECRET` to a random value at least 32
characters long.

```powershell
Copy-Item backend\.env.example backend\.env
Set-Location backend
npm.cmd install
npm.cmd run check
npm.cmd test
npm.cmd start
```

Then open <http://localhost:3000>. `npm.cmd run dev` starts the server with
Node's watch mode during development.

## Existing database upgrade

Back up the database first. The migrations below are one-time upgrades for a
database created with an earlier schema; do not run them on a fresh database
created from `schema.sql`.

```powershell
Get-Content backend\sql\migration-002-full-guide.sql | mysql.exe -u root -p roam_tourism
Get-Content backend\sql\migration-003-demo-experience.sql | mysql.exe -u root -p roam_tourism
Get-Content backend\sql\seed.sql | mysql.exe -u root -p roam_tourism
```

After configuring `backend\.env`, create or refresh local demo accounts with:

```powershell
Set-Location backend
npm.cmd run seed:demo
```

## Features

- Responsive destination search and filters for keyword, state, category,
  entry fee, and popularity, rating, or fee sorting.
- Destination detail pages with seasonal and heritage information, hotels,
  attractions, restaurants, and reviews.
- Tourist registration and sign-in using server-side validation, bcrypt
  password hashes, and persistent MySQL-backed sessions.
- A signed-in profile with editable name, email, and phone; successful
  registration and sign-in open the profile, and booking receipts use the
  saved contact details.
- About and contact pages; contact submissions are saved to MySQL and shown
  in the system administrator dashboard.
- A session-backed trip cart for stays, attraction tickets, and dining. Sign in,
  check availability, add an experience to the cart, and continue to its
  payment step. Each cart item gets availability and current price rechecked
  and is checked out as its own booking.
- Inventory-aware hotel, attraction-ticket, and restaurant-table availability,
  booking creation, booking history, and cancellation of eligible bookings.
- Simulated UPI/QR, card, net-banking, and cash-on-arrival payment choices;
  payment failure can be simulated for testing. Successful or cash-on-arrival
  bookings receive a receipt and verification QR code.
- Booking-gated tourist reviews and ratings.
- Role-based admin dashboard for destination/listing CRUD, booking status,
  payment/refund records, review moderation, and metrics.
- Provider/hotel-manager views for their assigned hotel reservations and
  inventory.
- System-administrator role management and read-only database health/schema
  views.

### Roles and dashboard access

All accounts created through registration start as `tourist`. For local
demonstrations, the database is preloaded with these accounts:

| Role | Email | Password |
|---|---|---|
| System administrator | `admin@gmail.com` | `admin@123` |
| Tourist | `demo.tourist@gmail.com` | `tourist@123` |

Open `/account` to sign in. These are local demo credentials only; change them
before deploying or exposing the app to other users. Passwords are stored as
bcrypt hashes, not plaintext. Newly registered visitors receive the tourist
role and are redirected to `/profile`, where their name, email, and phone can
be viewed and updated. To grant another trusted account a staff role, assign it through the
system administrator dashboard or update it in MySQL:

```sql
UPDATE tourists SET role = 'system_administrator' WHERE email = 'admin@example.com';
UPDATE tourists SET role = 'administrator' WHERE email = 'manager@example.com';
UPDATE tourists SET role = 'service_provider' WHERE email = 'provider@example.com';
UPDATE tourists SET role = 'hotel_manager' WHERE email = 'hotelmanager@example.com';
```

Administrators can sign in at `/admin/login`; their dashboard is at `/dashboard`.
The system administrator can review or suspend accounts (booking history is
retained), moderate reviews, and review contact submissions. Admin access is
restricted to staff roles and cannot be obtained through public registration.
The dashboard link is shown only to staff accounts; guests and tourists do not
see admin navigation.
To give a service provider or hotel manager access to a hotel, set that hotel's
`provider_id` to the corresponding tourist account ID.

## Payment and database safety

This is a local demonstration, not a payment integration. No real payment
gateway, bank, UPI address, card number, or CVV is used or stored. Never enter
real payment credentials. Refund actions only update the simulated payment
record and do not return money.

Database management endpoints expose limited, read-only health and schema
information to system administrators. There is no arbitrary SQL execution or
database reset endpoint.

## Bibliography and references

See [References.md](./References.md) for the web technology documentation,
accessibility and security guidance, payment-flow references, and demo-data
notes used for this project.

## API

JSON endpoints are available under `/api`; browser forms use the same backend.
Key endpoints include:

- `GET /api/health`
- `GET /api/auth/session`, `POST /api/auth/register`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/profile`
- `GET /api/destinations`, `GET /api/destinations/:id`,
  `GET /api/destinations/:id/nearby-places`
- `GET /api/hotels?destinationId=:id`, `GET /api/places?destinationId=:id`,
  `GET /api/restaurants?destinationId=:id`, `GET /api/reviews?destinationId=:id`
- `GET /api/availability`, `GET /api/bookings`, `POST /api/bookings`,
  `POST /api/bookings/:id/payments`, `DELETE /api/bookings/:id`
- `POST /api/reviews`
- Role-protected `/api/management/*`, `/api/provider/*`, and `/api/sql/*`
  endpoints for management and read-only database information

Production deployment requires HTTPS, a strong unique session secret, restricted
database credentials, and appropriate operational safeguards.
