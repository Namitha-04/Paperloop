// Run once after setting DATABASE_URL: `npm run init-db`
// Creates tables and seeds the 4 department logins.
// Default password for every seeded account is "paperloop2026" - department
// representatives should change this after first login in a real deployment.
// (Password change flow is intentionally out of scope for this prototype phase.)

const bcrypt = require("bcryptjs");
const pool = require("./db");

const DEPARTMENTS = [
  { code: "cse", name: "CSE" },
  { code: "cse_ds", name: "CSE - Data Science" },
  { code: "cse_cy", name: "CSE - Cyber Security" },
  { code: "eee", name: "EEE" },
];

const DEFAULT_PASSWORD = "paperloop2026";

async function init() {
  console.log("Creating tables if they don't exist...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS waste_logs (
      id SERIAL PRIMARY KEY,
      department_id INTEGER REFERENCES departments(id) NOT NULL,
      waste_type TEXT NOT NULL,
      kg NUMERIC(8,2) NOT NULL CHECK (kg > 0),
      logged_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Seeding department accounts (skips any that already exist)...");

  for (const dept of DEPARTMENTS) {
    const existing = await pool.query("SELECT id FROM departments WHERE code = $1", [dept.code]);
    if (existing.rows.length > 0) {
      console.log(`  - ${dept.name} already exists, skipping`);
      continue;
    }
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await pool.query(
      "INSERT INTO departments (code, name, password_hash) VALUES ($1, $2, $3)",
      [dept.code, dept.name, hash]
    );
    console.log(`  - Created ${dept.name} (login code: ${dept.code})`);
  }

  console.log("\nDone. All departments use the password: " + DEFAULT_PASSWORD);
  console.log("Login codes: " + DEPARTMENTS.map((d) => d.code).join(", "));
  process.exit(0);
}

init().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
