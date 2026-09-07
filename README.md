# Zone Assessment System (MERN)

A full MERN application for Lions zone chairpersons to manage clubs, club
officers, and the "Zone Assessment" guiding-question responses described in
*Zone Chairperson Training – Pre-Assignment: Completing a Zone Assessment*.

## What's included

- **Two account types**:
  - **Super Admin** — doesn't own any clubs; can create, edit, and delete
    **Zonal Head** accounts from the **Zonal Heads** page (`/super-admin`).
    Nothing is auto-seeded beyond the super admin — the super admin creates
    every zonal head from the dashboard.
  - **Zonal Head** ("Admin") — manages their own clubs, contacts, zone
    leadership, questions, and responses. Fully multi-tenant: one zonal
    head can never see or affect another zonal head's clubs, contacts,
    responses, or questions.
- **Clubs**: name, club number, logo photo (stored on Cloudinary). Each
  zonal head adds and manages their own clubs — including deleting a club,
  which also removes its contacts and any submitted responses.
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
  unguessable link (`/respond/:token`), plus a per-zonal-head
  `/assessment/:zoneSlug` gateway (shown on that zonal head's Dashboard)
  where anyone in their zone can pick their role, confirm their identity
  by date of birth, and land on their questions. Because the gateway is
  scoped to one zonal head's unique slug, it only ever lists that zonal
  head's own clubs and zone leadership roles — never another zone's. A
  link stays open for edits — people can update and resubmit their
  answers any time.
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
npm run seed     # creates only the super admin account
npm run dev      # starts the API on http://localhost:5000
```

The seed script creates a single **super admin** account (default
`superadmin@example.com` / `ChangeMe123!`) and prints its login. Sign in
as the super admin and use **+ Add Zonal Head** to create every zonal
head account yourself — each one gets its own clubs, its own default
guiding questions, and its own `/assessment/:zoneSlug` link automatically.

**Change the super admin password in `.env` before seeding**, or update
it afterwards.

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
   zone name, email, password) — this is how you add every zonal head.
3. Each row shows a **Copy Link** button for that zonal head's own
   `/assessment/:zoneSlug` link, if you want to hand it out yourself.
4. Edit a zonal head's basic info or reset their password, or delete their
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
   to that officer by email/SMS/WhatsApp — or just share **your** zone's
   assessment link (shown on the Dashboard as "Your Assessment Link"),
   which lets any of your club presidents or zone leaders find their own
   form. That link only ever lists your own clubs, so it's safe to publish
   or reuse — other zonal heads' clubs never appear on it.
4. The officer opens the link, fills in the guiding questions, and
   submits — they can come back and update their answers any time.
5. Back in the admin dashboard you'll see their status flip to
   **Responded**, with the response viewable, deletable, and included in
   the all-in-one **Export All Responses (.docx)** download.
6. **Zone Leadership** page → set up the Immediate Past Zone Chairperson
   and 1st Vice District Governor/DGE, same flow as club presidents.
7. **Questions** page → review/add/edit/delete the guiding questions for
   each of the three assessment types. Every new zonal head starts from
   the same default question set, then can customize it independently.
8. **Analytics** and **Export All Responses (.docx)** are scoped to your
   own clubs only — you can only see and export your zone's assessment
   reports, never another zonal head's.
9. Need to remove a club entirely? Open it and click **Delete Club** —
   this also removes its officers, contacts, and any submitted responses.

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
