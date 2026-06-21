const { Pool } = require("pg");
require("dotenv").config();

// Supabase (and most Postgres hosts) require SSL for external connections.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err.message);
});

module.exports = pool;
