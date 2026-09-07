// Seeds one super admin account, one zone admin (Dibakar Paudel, a "zonal
// head" created by that super admin), and the 4 clubs from the request.
// Contact persons are NOT seeded with fake data (real names/emails/photos
// should be added via the admin dashboard) except placeholder club numbers.
//
// Run with: npm run seed   (from the /server folder, after setting .env)

require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Club = require("../models/Club");
const seedDefaultQuestions = require("../utils/seedDefaultQuestions");

const CLUBS = [
  { name: "Lions Club of Kathmandu Balaju Height", clubNumber: "CLUB-001" },
  { name: "Lions Club of Kathmandu Balaju Bright", clubNumber: "CLUB-002" },
  { name: "Lions Club of Kathmandu Mount Dhaulagiri", clubNumber: "CLUB-003" },
  { name: "Lions Club of Kathmandu Pioneer Executive", clubNumber: "CLUB-004" },
];

const run = async () => {
  await connectDB();

  // --- Super admin (creates/manages zonal head accounts) ---
  const superEmail = (process.env.SEED_SUPERADMIN_EMAIL || "superadmin@example.com").toLowerCase();
  let superAdmin = await Admin.findOne({ email: superEmail });
  if (!superAdmin) {
    superAdmin = await Admin.create({
      name: process.env.SEED_SUPERADMIN_NAME || "System Super Admin",
      title: "Super Admin",
      email: superEmail,
      password: process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe123!",
      role: "superadmin",
    });
    console.log(`Created super admin: ${superAdmin.email}`);
  } else {
    console.log(`Super admin already exists: ${superAdmin.email}`);
  }

  // --- Zonal head (e.g. Dibakar Paudel) ---
  const email = (process.env.SEED_ADMIN_EMAIL || "dibakar.paudel@example.com").toLowerCase();
  let admin = await Admin.findOne({ email });

  if (!admin) {
    admin = await Admin.create({
      name: process.env.SEED_ADMIN_NAME || "Dibakar Paudel",
      title: "Zonal Head",
      email,
      password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
      zoneName: "Zone - Kathmandu",
      role: "zonalhead",
      createdBy: superAdmin._id,
    });
    console.log(`Created admin: ${admin.email}`);
  } else {
    console.log(`Admin already exists: ${admin.email}`);
  }

  // Make sure the zonal head has an editable question set ready to go.
  await seedDefaultQuestions(admin._id);

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
  console.log("\n--- Super Admin login (creates other zonal heads) ---");
  console.log(`Email: ${superEmail}`);
  console.log(`Password: ${process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe123!"}`);
  console.log("\n--- Zonal Head login (manages clubs) ---");
  console.log(`Email: ${email}`);
  console.log(`Password: ${process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!"}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
