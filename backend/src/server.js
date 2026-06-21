require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { requireAuth } = require("./authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// ---- Conversion factors (rounded campus-scale estimates, cite in report) ----
const TREE_PER_KG = 0.017;
const WATER_PER_KG = 26;
const CO2_PER_KG = 1.3;

// ---------- Health check ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Auth ----------
app.post("/api/login", async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) {
    return res.status(400).json({ error: "Department code and password are required" });
  }
  try {
    const result = await pool.query("SELECT * FROM departments WHERE code = $1", [code.toLowerCase()]);
    const dept = result.rows[0];
    if (!dept) {
      return res.status(401).json({ error: "Unknown department code" });
    }
    const valid = await bcrypt.compare(password, dept.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    const token = jwt.sign(
      { id: dept.id, code: dept.code, name: dept.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, department: { id: dept.id, code: dept.code, name: dept.name } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Something went wrong on our end. Please try again." });
  }
});

// ---------- Log waste (requires auth) ----------
app.post("/api/logs", requireAuth, async (req, res) => {
  const { waste_type, kg } = req.body;
  const kgNum = parseFloat(kg);
  if (!waste_type || typeof waste_type !== "string") {
    return res.status(400).json({ error: "Waste type is required" });
  }
  if (Number.isNaN(kgNum) || kgNum <= 0) {
    return res.status(400).json({ error: "Weight must be a number greater than 0" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO waste_logs (department_id, waste_type, kg) VALUES ($1, $2, $3) RETURNING *",
      [req.department.id, waste_type, kgNum]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Log creation error:", err.message);
    res.status(500).json({ error: "Couldn't save this entry. Please try again." });
  }
});

// ---------- Get all logs (public dashboard data, no auth needed to view) ----------
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wl.id, wl.waste_type, wl.kg, wl.logged_at, d.code AS department_code, d.name AS department_name
      FROM waste_logs wl
      JOIN departments d ON d.id = wl.department_id
      ORDER BY wl.logged_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch logs error:", err.message);
    res.status(500).json({ error: "Couldn't load logs right now." });
  }
});

// ---------- Dashboard summary stats ----------
app.get("/api/stats", async (req, res) => {
  try {
    const totalsByDept = await pool.query(`
      SELECT d.code, d.name, COALESCE(SUM(wl.kg), 0) AS total_kg
      FROM departments d
      LEFT JOIN waste_logs wl ON wl.department_id = d.id
      GROUP BY d.id, d.code, d.name
      ORDER BY total_kg DESC
    `);
    const grandTotalResult = await pool.query(`SELECT COALESCE(SUM(kg), 0) AS total FROM waste_logs`);
    const totalKg = parseFloat(grandTotalResult.rows[0].total);

    res.json({
      total_kg: totalKg,
      trees_saved: +(totalKg * TREE_PER_KG).toFixed(2),
      water_saved_litres: Math.round(totalKg * WATER_PER_KG),
      co2_avoided_kg: +(totalKg * CO2_PER_KG).toFixed(1),
      by_department: totalsByDept.rows.map((r) => ({
        code: r.code,
        name: r.name,
        total_kg: parseFloat(r.total_kg),
      })),
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ error: "Couldn't load stats right now." });
  }
});

// ---------- Who am I (for frontend to verify token on load) ----------
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ department: req.department });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PaperLoop backend running on port ${PORT}`);
});
