# Zone Assessment System (MERN)

A full MERN application for Lions zone chairpersons to manage clubs, club
officers, and the "Zone Assessment" guiding-question responses described in
*Zone Chairperson Training – Pre-Assignment: Completing a Zone Assessment*.

## What's included

- **Two account types**:
  - **Super Admin** — doesn't own any clubs; can create, edit, and delete
    other **Zonal Head** accounts (e.g. **Dibakar Paudel**) from the
    **Zonal Heads** page (`/super-admin`).
  - **Zonal Head** ("Admin") — manages their own clubs, contacts, zone
    leadership, questions, and responses. Multi-tenant by design.
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
- **Zone Leadership**: two zone-level (non-club) roles — Immediate Past
  Zone Chairperson ("zonal head" handover) and 1st Vice District
  Governor/District Governor Elect ("district vice president") — each with
  their own assessment.
- **Editable assessment questions**: each zonal head can add, edit, and
  delete the guiding questions (and category names/descriptions) used for
  all three assessment types — Club President, Immediate Past Zone
  Chairperson, and 1st Vice District Governor/DGE — from the **Questions**
  page (`/questions`). Edits only affect future responses; anything already
  submitted keeps the exact wording it was answered with.
- **Public online response form**: each contact person gets a unique,
  unguessable link (`/respond/:token`), plus a universal `/assessment`
  gateway where anyone can pick their role, confirm their identity by date
  of birth, and land on their questions. A link stays open for edits —
  people can update and resubmit their answers any time.
- **Response storage, viewing, and deletion**: every submission is saved
  with a timestamp, viewable per-club and per-response in the admin
  dashboard. Zonal heads can delete any response (club president or zone
  leadership) — the underlying contact/official is reset so they can be
  re-invited to respond.
- **Export to Word (.docx)**: a single **Export All Responses** button
  (on the Clubs dashboard) generates one comprehensive report covering
  every club's president response plus both zone leadership responses —
  no more hunting through several per-page export buttons.
- **Analytics dashboard**: totals (clubs, required vs. completed
  responses, completion rate), per-club completion bars, a submissions
  timeline chart, and a recent-submissions feed — including the date each
  form was filled.
- **Mobile-friendly design**: responsive layout throughout, including a
  collapsible hamburger menu in the top bar, single-column grids/forms on
  small screens, and horizontally-scrollable tables.

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
npm run seed     # creates the super admin + Dibakar Paudel (zonal head) + the 4 clubs
npm run dev      # starts the API on http://localhost:5000
```

The seed script creates **two** accounts and prints both logins:

1. A **super admin** (default `superadmin@example.com` /
   `ChangeMe123!`) — signs in and lands on `/super-admin` to create/manage
   zonal head accounts.
2. A **zonal head**, Dibakar Paudel (default `dibakar.paudel@example.com` /
   `ChangeMe123!`) — signs in and lands on `/dashboard` to manage clubs.

**Change both passwords in `.env` before seeding**, or update them
afterwards (the super admin can reset a zonal head's password from the
Zonal Heads page).

## 3. Frontend setup

```bash
cd client
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173/login` and sign in with either seeded account.

## 4. Using the system

### As the super admin
1. Sign in and open **Zonal Heads** (`/super-admin`).
2. Click **+ Add Zonal Head** to create a new zone admin (name, title,
   zone name, email, password) — this is how you add more zonal heads
   beyond Dibakar Paudel.
3. Edit a zonal head's basic info or reset their password, or delete their
   account entirely (this also removes their clubs, contacts, responses,
   and questions).

### As a zonal head
1. **Dashboard** → open a club.
2. For each of the 4 positions, click **Add Contact** and fill in their
   details (photo optional but recommended). Uncheck "Requires online
   guiding-question response" for any position that should NOT get a
   public form (President, by default, is left checked but you can toggle
   any position).
3. Once a contact with `requiresResponse = true` is added, a **public
   link** appears on their card (`/respond/<token>`). Copy it and send it
   to that officer by email/SMS/WhatsApp — or just share the universal
   `/assessment` link, which lets any president/zone leader find their own
   form.
4. The officer opens the link, fills in the guiding questions, and
   submits — they can come back and update their answers any time.
5. Back in the admin dashboard you'll see their status flip to
   **Responded**, with the response viewable, deletable, and included in
   the all-in-one **Export All Responses (.docx)** download.
6. **Zone Leadership** page → set up the Immediate Past Zone Chairperson
   and 1st Vice District Governor/DGE, same flow as club presidents.
7. **Questions** page → review/add/edit/delete the guiding questions for
   each of the three assessment types.
8. **Analytics** tab shows zone-wide completion rate, per-club breakdown,
   a submissions timeline, and recent activity — all form-fill dates are
   tracked automatically (`respondedAt` on the contact, `submittedAt` on
   the response).

## 5. Guiding questions

Each zonal head owns their own editable copy of the guiding questions,
seeded from the **Guiding Questions for Club Presidents** section of the
training document (Membership, Leadership, Service, Communication,
General categories) the first time their account is used, plus the
Immediate Past Zone Chairperson and 1st Vice District Governor/DGE
question sets. Edit them any time from the **Questions** page — past
responses keep the exact wording they were answered with, since each
submitted answer stores a snapshot of its question text.

## 6. Notes & next steps

- Passwords are hashed with bcrypt; API auth uses short-lived JWTs.
- Photos/logos are uploaded directly to Cloudinary via `multer-storage-cloudinary`;
  swap the `Cloudinary` config for S3/GCS later if preferred — only
  `config/cloudinary.js` and `middleware/upload.js` would need to change.
- To add more zone admins (for other zonal heads), sign in as the super
  admin and use the **Zonal Heads** page — no direct database/script
  access needed.
- For production, deploy `server/` (Node host) and `client/` (static
  build via `npm run build`) separately, set `CLIENT_URL`/CORS correctly,
  and put both behind HTTPS.
