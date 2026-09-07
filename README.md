# Zone Assessment System (MERN)

A full MERN application for Lions zone chairpersons to manage clubs, club
officers, and the "Zone Assessment" guiding-question responses described in
*Zone Chairperson Training – Pre-Assignment: Completing a Zone Assessment*.

## What's included

- **Admin login** (JWT-based). Each admin ("Zonal Head") manages their own
  set of clubs — multi-tenant by design, seeded here with **Dibakar Paudel**.
- **Clubs**: name, club number, logo photo (stored on Cloudinary).
  Seeded with the 4 clubs you listed:
  1. Lions Club of Kathmandu Balaju Height
  2. Lions Club of Kathmandu Balaju Bright
  3. Lions Club of Kathmandu Mount Dhaulagiri
  4. Lions Club of Kathmandu Pioneer Executive
- **4 contact persons per club** (President, Secretary, Treasurer,
  Membership Chairperson), each with photo (Cloudinary), position, club,
  membership no., address, mobile, email, date of birth (month + day only),
  and optional blood group.
- **Public online response form**: each contact person gets a unique,
  unguessable link (`/respond/:token`). By default 3 of the 4 positions
  (all except President — configurable per contact via a checkbox) are
  required to submit responses to the **guiding questions from the
  document** (Membership, Leadership, Service, Communication, General).
  A link can only be submitted once; already-submitted links show a
  thank-you/confirmation screen instead of the form.
- **Response storage & viewing**: every submission is saved with a
  timestamp, viewable per-club and per-response in the admin dashboard.
- **Export to Word (.docx)**: export a single response, or all responses
  for a club, as a formatted Word document (generated server-side with the
  `docx` npm package).
- **Analytics dashboard**: totals (clubs, required vs. completed
  responses, completion rate), per-club completion bars, a submissions
  timeline chart, and a recent-submissions feed — including the date each
  form was filled.

## Project structure

```
zonal-assessment-system/
├── server/       Express + MongoDB (Mongoose) API
└── client/       React (Vite) frontend
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB database (local `mongod`, or a free MongoDB Atlas cluster)
- A free [Cloudinary](https://cloudinary.com) account (for storing club
  logos and contact photos in the cloud)

## 2. Backend setup

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and your Cloudinary credentials
npm install
npm run seed     # creates the admin (Dibakar Paudel) + the 4 clubs
npm run dev      # starts the API on http://localhost:5000
```

The seed script prints the login email/password to use (from `.env`,
defaults to `dibakar.paudel@example.com` / `ChangeMe123!` — **change the
password in `.env` before seeding**, or update it afterwards).

## 3. Frontend setup

```bash
cd client
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173/login` and sign in with the seeded admin
credentials.

## 4. Using the system

1. **Dashboard** → open a club.
2. For each of the 4 positions, click **Add Contact** and fill in their
   details (photo optional but recommended). Uncheck "Requires online
   guiding-question response" for any position that should NOT get a
   public form (President, by default, is left checked but you can toggle
   any position).
3. Once a contact with `requiresResponse = true` is added, a **public
   link** appears on their card (`/respond/<token>`). Copy it and send it
   to that officer by email/SMS/WhatsApp.
4. The officer opens the link (no login needed), fills in the guiding
   questions, and submits. The link becomes single-use — reopening it
   shows a "thank you, already submitted" message.
5. Back in the admin dashboard you'll see their status flip to
   **Responded**, with the response viewable and exportable to `.docx`.
6. **Analytics** tab shows zone-wide completion rate, per-club breakdown,
   a submissions timeline, and recent activity — all form-fill dates are
   tracked automatically (`respondedAt` on the contact, `submittedAt` on
   the response).

## 5. Guiding questions

The questions presented on the public form come directly from the
**Guiding Questions for Club Presidents** section of the training document
(Membership, Leadership, Service, Communication, General categories) and
live in `server/data/questions.js` — edit that file to adjust wording or
add questions; IDs are stable so historical responses remain intact.

## 6. Notes & next steps

- Passwords are hashed with bcrypt; API auth uses short-lived JWTs.
- Photos/logos are uploaded directly to Cloudinary via `multer-storage-cloudinary`;
  swap the `Cloudinary` config for S3/GCS later if preferred — only
  `config/cloudinary.js` and `middleware/upload.js` would need to change.
- To add more zone admins (for other zonal heads), currently the fastest
  path is another `Admin.create(...)` call (e.g. via `mongosh` or a small
  script based on `seed/seed.js`) — an "add admin" UI can be layered on
  top if you want multiple zonal heads self-serving from the dashboard.
- For production, deploy `server/` (Node host) and `client/` (static
  build via `npm run build`) separately, set `CLIENT_URL`/CORS correctly,
  and put both behind HTTPS.
