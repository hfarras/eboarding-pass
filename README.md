# KAI E-Boarding Pass - Project Documentation

A web application for managing train tickets (e-boarding passes). Admins manage trains and schedules. Passengers search trains, book tickets for one or more passengers, and choose their seats. This is a non-commercial learning project.

## 1. Overview

| Role | What they can do |
| --- | --- |
| Admin | Add, edit, delete, and turn trains on or off. Set train name, train type, departure station and time, seat count, and several arrival stations, each with its own arrival time. |
| Passenger | Register, log in, search trains by departure station, arrival station, and date, add up to 4 passengers per booking, pick seats on a seat map, view and cancel their tickets. |

Both roles use the same login page. After login, admins are sent to `/admin` and passengers to `/dashboard`.

## 2. Technology Stack

### Languages

| Language | Used for |
| --- | --- |
| TypeScript | All application code: pages, components, API routes, helpers |
| TSX (React JSX) | User interface components |
| SQL (PostgreSQL dialect) | Database schema and queries |
| CSS | Custom styles in `app/globals.css` |

### Frameworks and libraries

| Package | Purpose |
| --- | --- |
| Next.js 16 (App Router, Turbopack) | Full-stack framework: pages and API routes in one project |
| React | UI library |
| @neondatabase/serverless | Connects to Neon PostgreSQL over HTTPS |
| bcryptjs | Password hashing |
| jose | Signing and verifying JWT session tokens |
| Bootstrap 5 | Layout and components |
| Bootstrap Icons | Icons |
| Plus Jakarta Sans (next/font/google) | Font |

Note: `create-next-app` may also install Tailwind CSS. The UI is built mainly with Bootstrap 5.

### Hosting and tools

| Tool | Purpose |
| --- | --- |
| Neon | Managed serverless PostgreSQL |
| Vercel | Hosting and automatic deployment |
| GitHub | Source code repository |
| Node.js and npm | Runtime and package manager |
| Ubuntu on WSL | Local development environment |

## 3. APIs

### 3.1 Internal REST API (Next.js route handlers)

All endpoints live under `app/api/` and exchange JSON.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/register` | Public | Create a passenger account. Validates NIK (16 digits), phone, and password length (minimum 8). |
| POST | `/api/login` | Public | Check email and password, set the session cookie, return the role. |
| POST | `/api/logout` | Logged in | Delete the session cookie. |
| POST | `/api/bookings` | Passenger | Book tickets for 1 to 4 passengers. Checks the departure-time rule and seat validity. All passengers are saved in one transaction. |
| DELETE | `/api/boarding-passes/[id]` | Owner | Delete one of your own tickets. |
| POST | `/api/admin/trains` | Admin | Create a train with its arrival stations. |
| PUT | `/api/admin/trains/[id]` | Admin | Replace a train's details and arrival stations. |
| PATCH | `/api/admin/trains/[id]` | Admin | Turn a train on or off (`is_active`). |
| DELETE | `/api/admin/trains/[id]` | Admin | Delete a train and its stops. |

Typical error response:

```json
{ "error": "Message describing the problem" }
```

Status codes used: 200/201 success, 400 validation error, 401 not logged in, 403 not allowed, 404 not found, 409 conflict (duplicate email, NIK, or seat), 500 server error.

### 3.2 Pages

| Route | Description |
| --- | --- |
| `/` | Login page |
| `/register` | Registration page |
| `/dashboard` | Passenger ticket list |
| `/dashboard/book` | Step 1: search trains |
| `/dashboard/book/[trainId]` | Step 2: passengers and seat map |
| `/admin` | Admin train list |
| `/admin/trains/new` | Add a train |
| `/admin/trains/[id]/edit` | Edit a train |

### 3.3 External services

The project does not call any third-party public API. The only outside connection is to the Neon database through the `@neondatabase/serverless` driver, which sends SQL over HTTPS using `fetch`.

### 3.4 Authentication

- Passwords are hashed with bcrypt (cost 10) and never stored in plain text.
- After login, the server creates a JWT (HS256) signed with `JWT_SECRET`, valid for 7 days.
- The token is stored in an `httpOnly` cookie named `session` (`secure` in production, `sameSite=lax`).
- Pages and API routes read the cookie, then load the user from the database to get the current name and role.
- Admin-only routes check `role = 'admin'` on the server, not just in the interface.

## 4. Database (PostgreSQL on Neon)

### 4.1 Tables

| Table | Purpose |
| --- | --- |
| `accounts` | Users (passengers and admins) |
| `stations` | List of train stations |
| `trains` | Trains with type, departure station, departure time, seat count, and on/off status |
| `train_stops` | Arrival stations of a train, each with its own arrival time |
| `boarding_passes` | One row per passenger per booking; passengers in one booking share a booking code |

Relationships:

- `trains.departure_station_id` refers to `stations.id`.
- `train_stops.train_id` refers to `trains.id` (deleted with the train).
- `train_stops.station_id` refers to `stations.id`.
- `boarding_passes.account_id` refers to `accounts.id` (deleted with the account).
- `boarding_passes.train_id` refers to `trains.id` (set to NULL if the train is deleted, so tickets are kept).

### 4.2 Schema

Run this in the Neon SQL Editor.

```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nik CHAR(16) UNIQUE NOT NULL,
  birthday DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

INSERT INTO stations (code, name) VALUES
  ('PWT', 'Purwokerto'), ('GMR', 'Gambir'), ('PSE', 'Pasar Senen'),
  ('BD', 'Bandung'), ('CN', 'Cirebon'), ('TG', 'Tegal'),
  ('PK', 'Pekalongan'), ('SMT', 'Semarang Tawang'), ('YK', 'Yogyakarta'),
  ('SLO', 'Solo Balapan'), ('SGU', 'Surabaya Gubeng'), ('KTA', 'Kutoarjo');

CREATE TABLE trains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  train_type TEXT NOT NULL,
  departure_station_id INT NOT NULL REFERENCES stations(id),
  departure_time TIME NOT NULL,
  total_seats INT NOT NULL DEFAULT 40 CHECK (total_seats BETWEEN 4 AND 200),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE train_stops (
  id SERIAL PRIMARY KEY,
  train_id INT NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  station_id INT NOT NULL REFERENCES stations(id),
  arrival_time TIME NOT NULL,
  UNIQUE (train_id, station_id)
);

CREATE TABLE boarding_passes (
  id SERIAL PRIMARY KEY,
  account_id INT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  train_id INT REFERENCES trains(id) ON DELETE SET NULL,
  booking_code TEXT NOT NULL,
  train_name TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  origin_name TEXT NOT NULL,
  dest_code TEXT NOT NULL,
  dest_name TEXT NOT NULL,
  travel_date DATE NOT NULL,
  depart_time TIME NOT NULL,
  arrive_time TIME NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_nik CHAR(16) NOT NULL,
  passenger_type TEXT NOT NULL DEFAULT 'UMUM',
  seat TEXT NOT NULL,
  gate_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- A seat can be sold only once per train per date
CREATE UNIQUE INDEX uniq_seat_per_trip
  ON boarding_passes (train_id, travel_date, seat)
  WHERE train_id IS NOT NULL;
```

### 4.3 Creating the first admin

Register a normal account on the site, then promote it:

```sql
UPDATE accounts SET role = 'admin' WHERE email = 'admin@gmail.com';
```

### 4.4 Creating a Neon database

1. Sign up at neon.tech and click **New Project**.
2. Choose a name, PostgreSQL version, and a region close to your users.
3. Open **Connect** and copy the connection string. Use the pooled one (host contains `-pooler`) for Vercel.
4. Open the **SQL Editor** and run the schema above.

Neon branches each have their own tables. Make sure you run the SQL on the same branch that your `DATABASE_URL` points to.

## 5. Project Structure

```
my-app/
├── app/
│   ├── page.tsx                     Login page
│   ├── layout.tsx                   Loads Bootstrap, icons, and font
│   ├── globals.css                  Custom styles (cards, buttons, seat map)
│   ├── register/page.tsx
│   ├── components/Navbar.tsx        Shared navbar with user name and logout
│   ├── dashboard/                   Passenger area
│   │   ├── page.tsx
│   │   ├── AlertMessage.tsx
│   │   ├── DeleteButton.tsx
│   │   └── book/
│   │       ├── page.tsx
│   │       └── [trainId]/page.tsx, BookingForm.tsx
│   ├── admin/                       Admin area
│   │   ├── page.tsx, TrainActions.tsx
│   │   └── trains/
│   │       ├── TrainForm.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/edit/page.tsx
│   └── api/                         REST endpoints (see section 3)
├── lib/
│   ├── db.ts                        Neon connection
│   ├── auth.ts                      Session and current user helpers
│   ├── seats.ts                     Seat and coach generator
│   └── trainValidation.ts           Admin input validation
├── types.d.ts                       Type declaration for Bootstrap JS
├── .env.local                       Secrets (never commit)
├── next.config.ts
└── package.json
```

## 6. Installing Dependencies

### 6.1 Requirements

- Node.js 20 or newer and npm
- Git
- A Neon account and a GitHub account

Check your versions:

```bash
node -v
npm -v
git --version
```

### 6.2 First-time setup (new project)

```bash
npx create-next-app@latest my-app --typescript --app
cd my-app
npm install @neondatabase/serverless bcryptjs jose bootstrap bootstrap-icons
```

### 6.3 Existing project (cloned from GitHub)

```bash
git clone https://github.com/USERNAME/eboarding-pass.git
cd eboarding-pass
npm install
```

`npm install` reads `package.json` and installs everything listed there.

If TypeScript complains about the Bootstrap JavaScript import, create `types.d.ts` in the project root:

```typescript
declare module 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

## 7. Environment Variables

Create `.env.local` in the project root:

```bash
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="a-long-random-string"
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string, must end with `?sslmode=require` |
| `JWT_SECRET` | Secret used to sign session tokens. Generate one with `openssl rand -base64 32` |

Rules:

- `.env.local` must never be committed. It is ignored by Git through `.env*` in `.gitignore`.
- Use a different `JWT_SECRET` in production than in development.
- On Vercel, paste the values without quotation marks.
- Restart the dev server after changing environment variables.

## 8. Running Locally

```bash
npm run dev
```

Open `http://localhost:3000`. If port 3000 is busy, Next.js picks another port and prints it.

Useful commands:

```bash
ss -tulpn | grep -E ':300[0-9]'   # see which ports are in use
pkill -9 -f next-server            # stop leftover Next.js servers
npm run dev -- -p 4000             # run on a chosen port
```

## 9. Building

```bash
npm run build    # create the production build
npm start        # run the production build locally
```

Always run `npm run build` before pushing. It catches TypeScript errors, missing files, and Suspense problems early.

Next.js 16 requires components that read request-time data (cookies, database queries, URL search params) to sit inside a `<Suspense>` boundary. This project wraps such content in an inner component with `<Suspense>`.

## 10. Deployment

### 10.1 Push to GitHub

```bash
git init
git add .
git commit -m 'Initial commit'
git branch -M main
git remote add origin https://github.com/USERNAME/eboarding-pass.git
git push -u origin main
```

GitHub does not accept your account password. Use a Personal Access Token (Settings, Developer settings, Personal access tokens, with the `repo` permission) as the password, or log in with the GitHub CLI (`gh auth login`).

Keep the repository private, because the app handles personal data such as NIK.

### 10.2 Deploy on Vercel

1. Sign in at vercel.com with your GitHub account.
2. Click **Add New**, then **Project**, and import the repository.
3. Open **Environment Variables** and add `DATABASE_URL` and `JWT_SECRET`.
4. Click **Deploy**. You get a URL like `https://eboarding-pass.vercel.app`.

### 10.3 Updating the live site

Every push to `main` triggers a new deployment automatically:

```bash
git add .
git commit -m 'Describe your change'
git push
```

If you change an environment variable on Vercel, you must **Redeploy** for it to take effect.

### 10.4 Deployment checklist

- `npm run build` passes locally.
- The SQL schema has been run on the Neon branch used by `DATABASE_URL`.
- `DATABASE_URL` and `JWT_SECRET` are set in Vercel, with Production ticked.
- At least one account has been promoted to admin.
- `.env.local` is not in the repository.

## 11. Business Rules

- **Departure cutoff:** a ticket cannot be booked once the train's departure time on the chosen date has passed. The check uses the Asia/Jakarta (WIB) time zone inside the SQL query and runs both on the page and on the server.
- **Multiple arrival stations:** a train has one departure station and one or more arrival stations. Each arrival station has its own arrival time, which must be later than the departure time.
- **Passengers per booking:** 1 to 4. All passengers in one booking share a booking code.
- **Seats:** each coach has 8 rows of 5 seats (A, B, C, aisle, D, E), so 40 seats per coach. Seat codes look like `2-3A` (coach 2, row 3, seat A). The train's seat count decides how many coaches exist.
- **No double booking:** a unique index on train, date, and seat prevents two people from getting the same seat. If two bookings collide, the second one is rolled back.
- **Train on/off:** only active trains appear in passenger search. Deleting a train keeps existing tickets.
- **Gate access code:** generated automatically for each ticket.

## 12. Security Notes

- Passwords are hashed. Session cookies are `httpOnly`, so JavaScript in the browser cannot read them.
- All SQL uses tagged templates from the Neon driver, which parameterize values and protect against SQL injection.
- Ticket deletion checks `account_id`, so users cannot delete other users' tickets.
- Admin routes verify the role on the server.
- NIK is sensitive personal data. Use fake numbers while testing, and do not expose them publicly.
- Not included, to keep the project simple: password reset, email verification, and login rate limiting. Add these before any real-world use.

## 13. Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `Error connecting to database: fetch failed` | Network or DNS problem, or Neon waking from sleep. Refresh, check your internet, or run `wsl --shutdown` and restart. |
| Registration fails on Vercel | Table missing in the Neon branch, or `DATABASE_URL` not set. Check Vercel runtime logs, then redeploy. |
| `Module not found: ./BookingForm` | File is missing or in the wrong folder. It must sit next to `page.tsx` inside `[trainId]`. |
| Blocking route / uncached data error | Wrap the data access in `<Suspense>`, or remove `cacheComponents: true` from `next.config.ts`. |
| Port already in use | Stop old servers with `pkill -9 -f next-server`, or use another port. |
| `fdprocessedid` hydration warning or `removeChild` error | Caused by browser extensions (autofill or translate). Test in an Incognito window. |
| Save button stuck on 'Menyimpan...' | The API returned an error page. Check the terminal running `npm run dev` or the Network tab. |
| `git push` rejected or authentication failed | Use a Personal Access Token as the password, and run `git pull --rebase` if the remote has newer commits. |
