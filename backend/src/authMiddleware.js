const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.department = payload; // { id, code, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token, please log in again" });
  }
}

module.exports = { requireAuth };
