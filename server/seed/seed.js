// Seeds one zone admin (Dibakar Paudel) and the 4 clubs from the request.
// Contact persons are NOT seeded with fake data (real names/emails/photos
// should be added via the admin dashboard) except placeholder club numbers.
//
// Run with: npm run seed   (from the /server folder, after setting .env)

require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Club = require("../models/Club");

const CLUBS = [
  { name: "Lions Club of Kathmandu Balaju Height", clubNumber: "CLUB-001" },
  { name: "Lions Club of Kathmandu Balaju Bright", clubNumber: "CLUB-002" },
  { name: "Lions Club of Kathmandu Mount Dhaulagiri", clubNumber: "CLUB-003" },
  { name: "Lions Club of Kathmandu Pioneer Executive", clubNumber: "CLUB-004" },
];

const run = async () => {
  await connectDB();

  const email = (process.env.SEED_ADMIN_EMAIL || "dibakar.paudel@example.com").toLowerCase();
  let admin = await Admin.findOne({ email });

  if (!admin) {
    admin = await Admin.create({
      name: process.env.SEED_ADMIN_NAME || "Dibakar Paudel",
      title: "Zonal Head",
      email,
      password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
      zoneName: "Zone - Kathmandu",
    });
    console.log(`Created admin: ${admin.email}`);
  } else {
    console.log(`Admin already exists: ${admin.email}`);
  }

  for (const c of CLUBS) {
    const exists = await Club.findOne({ admin: admin._id, clubNumber: c.clubNumber });
    if (exists) {
      console.log(`Club already exists: ${c.name}`);
      continue;
    }
    await Club.create({ admin: admin._id, name: c.name, clubNumber: c.clubNumber });
    console.log(`Created club: ${c.name}`);
  }

  console.log("\nSeed complete.");
  console.log(`Login with email: ${email}`);
  console.log(`Password: ${process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!"}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
