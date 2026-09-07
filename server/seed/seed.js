// Seeds only the one super admin account. Zonal heads (e.g. a "zonal head"
// account per zone) are created afterwards from the Super Admin dashboard,
// each getting their own clubs, contacts, questions, and public assessment
// link — nothing zone-specific is seeded here.
//
// Run with: npm run seed   (from the /server folder, after setting .env)

require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const run = async () => {
  await connectDB();

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

  console.log("\nSeed complete.");
  console.log("\n--- Super Admin login (creates zonal head accounts) ---");
  console.log(`Email: ${superEmail}`);
  console.log(`Password: ${process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe123!"}`);
  console.log("\nLog in as the super admin and use \"Add Zonal Head\" to create each");
  console.log("zonal head. Each one gets their own clubs, default guiding questions,");
  console.log("and a unique assessment link scoped to just their clubs.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
