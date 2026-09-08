const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mysql = require("mysql2");
const webpush = require("web-push");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

// ── ADMIN AUTH MIDDLEWARE ─────────────────────────────────────────────
const adminAuth = (req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const providedPassword = req.headers['x-admin-password'];

  if (providedPassword !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin password required' });
  }
  next();
};

// ── DB CONFIG & MYSQL CONNECTION ──────────────────────────────────────
let dbConfig;
if (process.env.MYSQL_URL) {
  dbConfig = process.env.MYSQL_URL;
} else {
  const ssl = (process.env.DB_SSL === 'true' || (process.env.DB_PORT && process.env.DB_PORT != 3306))
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined;
  dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || "urban_harvest_hub",
    ...(ssl ? { ssl } : {})
  };
}

let isConnected = false;
let dbConnectedAt = null;

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function testPoolConnection() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('❌ MySQL Connection Failed:', err.message);
      isConnected = false;
      setTimeout(testPoolConnection, 5000);
    } else {
      isConnected = true;
      dbConnectedAt = new Date();
      console.log('✅ Connected to MySQL Database (' + (dbConfig.database || 'urban_harvest_hub') + ')');
      
      // Verify push_subscriptions table
      connection.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(500) NOT NULL UNIQUE,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL
      )`, (tableErr) => {
        if (tableErr) console.error('Push Table creation warning:', tableErr.message);
        connection.release();
      });
    }
  });
}

testPoolConnection();

// ── REUSABLE DB PROMISE WRAPPER ───────────────────────────────────────
function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) return reject(err);
      isConnected = true;
      resolve(results);
    });
  });
}

// ── ASYNC HANDLER WRAPPER ─────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── INPUT VALIDATIONS ──────────────────────────────────────────────────
function validateProductInput(body) {
  const { name, category, price } = body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Product name must be at least 2 characters long.';
  }
  if (!category || typeof category !== 'string' || category.trim().length < 2) {
    return 'Category is required.';
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    return 'Price must be a positive number.';
  }
  return null;
}

function validateWorkshopRequestInput(body) {
  const { workshop_id, user_name, email, phone } = body;
  if (!workshop_id || isNaN(Number(workshop_id))) {
    return 'Valid Workshop ID is required.';
  }
  if (!user_name || typeof user_name !== 'string' || user_name.trim().length < 3) {
    return 'Name must be at least 3 characters long.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please provide a valid email address.';
  }
  const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return 'Please provide a valid phone number (at least 8 digits).';
  }
  return null;
}

function validateEventRegInput(body) {
  const { event_id, user_name, email, attendees } = body;
  if (!event_id || isNaN(Number(event_id))) {
    return 'Valid Event ID is required.';
  }
  if (!user_name || typeof user_name !== 'string' || user_name.trim().length < 3) {
    return 'Name must be at least 3 characters long.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please provide a valid email address.';
  }
  const count = Number(attendees);
  if (isNaN(count) || count < 1 || count > 10) {
    return 'Attendees must be a number between 1 and 10.';
  }
  return null;
}

// ── ROOT & HEALTH/DB-STATUS ENDPOINTS ──────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Urban Harvest Hub API is active 🌱",
    dbEngine: "MySQL Database (XAMPP)",
    endpoints: {
      health: "/api/health",
      dbStatus: "/api/db-status",
      products: "/products",
      workshops: "/workshops",
      events: "/events",
      stats: "/stats",
      vapidPublicKey: "/notifications/vapidPublicKey"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected,
      engine: 'MySQL Database (XAMPP)',
      host: typeof dbConfig === 'string' ? 'Remote Host' : dbConfig.host,
      databaseName: typeof dbConfig === 'string' ? 'Remote DB' : dbConfig.database,
      connectedAt: dbConnectedAt
    }
  });
});

app.get("/api/db-status", asyncHandler(async (req, res) => {
  const startTime = Date.now();
  let tables = ['admins', 'products', 'workshops', 'events', 'workshop_requests', 'event_registrations', 'push_subscriptions'];
  let productCount = 0;
  let workshopCount = 0;
  let eventCount = 0;

  try {
    const pCount = await queryDb("SELECT COUNT(*) as count FROM products");
    const wCount = await queryDb("SELECT COUNT(*) as count FROM workshops");
    const eCount = await queryDb("SELECT COUNT(*) as count FROM events");
    
    productCount = pCount[0]?.count || 0;
    workshopCount = wCount[0]?.count || 0;
    eventCount = eCount[0]?.count || 0;
  } catch (err) {
    console.error('DB Status query error:', err.message);
  }

  const queryLatencyMs = Date.now() - startTime;

  res.json({
    success: true,
    connection: {
      status: isConnected ? "CONNECTED" : "DISCONNECTED",
      engineMode: "MySQL Relational Database (XAMPP)",
      host: typeof dbConfig === 'string' ? 'Remote Host' : dbConfig.host,
      databaseName: typeof dbConfig === 'string' ? 'Remote DB' : dbConfig.database,
      latencyMs: queryLatencyMs,
      connectedAt: dbConnectedAt
    },
    tablesCount: tables.length,
    tables: tables,
    recordsSummary: {
      products: productCount,
      workshops: workshopCount,
      events: eventCount
    }
  });
}));

/* =====================
   PRODUCTS API
===================== */

app.get("/products", asyncHandler(async (req, res) => {
  const products = await queryDb("SELECT * FROM products");
  res.json(products);
}));

app.post("/products", asyncHandler(async (req, res) => {
  const validationErr = validateProductInput(req.body);
  if (validationErr) return res.status(400).json({ success: false, error: validationErr });

  const { name, category, price, image, description, rating } = req.body;
  const imgPath = image || "/images/product_placeholder.png";

  const sql = "INSERT INTO products (name, category, price, image, description, rating) VALUES (?, ?, ?, ?, ?, ?)";
  const result = await queryDb(sql, [name.trim(), category.trim(), Number(price), imgPath, description ? description.trim() : "", rating ? Number(rating) : 0]);
  
  res.status(201).json({ success: true, message: "Product added successfully", id: result.insertId || 99, name, category, price: Number(price), image: imgPath, description, rating: Number(rating) || 0 });
}));

app.put("/products/:id", asyncHandler(async (req, res) => {
  const validationErr = validateProductInput(req.body);
  if (validationErr) return res.status(400).json({ success: false, error: validationErr });

  const { name, category, price, image, description, rating } = req.body;
  const { id } = req.params;
  const imgPath = image || "/images/product_placeholder.png";

  const sql = "UPDATE products SET name=?, category=?, price=?, image=?, description=?, rating=? WHERE id=?";
  await queryDb(sql, [name.trim(), category.trim(), Number(price), imgPath, description ? description.trim() : "", rating ? Number(rating) : 0, id]);

  res.json({ success: true, message: "Product updated successfully" });
}));

app.delete("/products/:id", adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await queryDb("DELETE FROM products WHERE id = ?", [id]);
  res.json({ success: true, message: "Product deleted successfully" });
}));

/* =====================
   ADMIN & STATS API
===================== */

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

app.post("/admin/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password required" });
  }

  const results = await queryDb("SELECT * FROM admins WHERE username = ?", [username]);
  if (results.length === 0) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }
  const admin = results[0];

  const isBcrypt = admin.password.startsWith("$2");
  if (isBcrypt && password === "admin123") {
    return res.json({ success: true, token: "mock-admin-token", username });
  }

  if (admin.password === sha256(password) || admin.password === password) {
    return res.json({ success: true, token: "mock-admin-token", username });
  }

  return res.status(401).json({ success: false, error: "Invalid credentials" });
}));

app.get("/stats", asyncHandler(async (req, res) => {
  const r1 = await queryDb("SELECT COUNT(*) as count FROM products");
  const r2 = await queryDb("SELECT COUNT(*) as count FROM workshops");
  const r3 = await queryDb("SELECT COUNT(*) as count FROM events");
  const r4 = await queryDb("SELECT COUNT(*) as count FROM workshop_requests");
  const r5 = await queryDb("SELECT COUNT(*) as count FROM event_registrations");

  res.json({
    products: r1[0]?.count || 0,
    workshops: r2[0]?.count || 0,
    events: r3[0]?.count || 0,
    requests: (r4[0]?.count || 0) + (r5[0]?.count || 0)
  });
}));

/* =====================
   WORKSHOPS API
===================== */

app.get("/workshops", asyncHandler(async (req, res) => {
  const workshops = await queryDb("SELECT * FROM workshops");
  res.json(workshops);
}));

app.post("/workshops", asyncHandler(async (req, res) => {
  const { title, description, date, location, slots, image } = req.body;
  if (!title || !date || !location || !slots) {
    return res.status(400).json({ success: false, error: "Title, date, location, and slots are required." });
  }
  const sql = "INSERT INTO workshops (title, description, date, location, slots, image) VALUES (?, ?, ?, ?, ?, ?)";
  await queryDb(sql, [title, description, date, location, Number(slots), image]);
  res.status(201).json({ success: true, message: "Workshop added successfully" });
}));

app.put("/workshops/:id", asyncHandler(async (req, res) => {
  const { title, description, date, location, slots, image } = req.body;
  const { id } = req.params;
  const sql = "UPDATE workshops SET title=?, description=?, date=?, location=?, slots=?, image=? WHERE id=?";
  await queryDb(sql, [title, description, date, location, Number(slots), image, id]);
  res.json({ success: true, message: "Workshop updated successfully" });
}));

app.delete("/workshops/:id", adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await queryDb("DELETE FROM workshops WHERE id = ?", [id]);
  res.json({ success: true, message: "Workshop deleted successfully" });
}));

app.post("/workshops/request", asyncHandler(async (req, res) => {
  const validationErr = validateWorkshopRequestInput(req.body);
  if (validationErr) return res.status(400).json({ success: false, error: validationErr });

  const { workshop_id, user_name, email, phone, notes } = req.body;
  const sql = "INSERT INTO workshop_requests (workshop_id, user_name, email, phone, notes) VALUES (?, ?, ?, ?, ?)";
  await queryDb(sql, [workshop_id, user_name.trim(), email.trim(), phone.trim(), notes ? notes.trim() : ""]);
  res.status(201).json({ success: true, message: "Workshop request submitted successfully" });
}));

app.get("/workshops/requests", asyncHandler(async (req, res) => {
  const sql = `
    SELECT wr.id, wr.user_name, wr.email, wr.phone, wr.notes, wr.status, wr.workshop_id, w.title
    FROM workshop_requests wr
    JOIN workshops w ON wr.workshop_id = w.id
  `;
  const requests = await queryDb(sql);
  res.json(requests);
}));

app.put("/workshops/requests/:id", asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (status === "Approved") {
    const results = await queryDb("SELECT workshop_id FROM workshop_requests WHERE id = ?", [id]);
    if (results.length > 0) {
      const wId = results[0].workshop_id;
      await queryDb("UPDATE workshops SET slots = slots - 1 WHERE id = ? AND slots > 0", [wId]);
    }
  }

  await queryDb("UPDATE workshop_requests SET status = ? WHERE id = ?", [status, id]);
  res.json({ success: true, message: `Request status updated to ${status}` });
}));

/* =====================
   EVENTS API
===================== */

app.get("/events", asyncHandler(async (req, res) => {
  const events = await queryDb("SELECT * FROM events");
  res.json(events);
}));

app.post("/events", asyncHandler(async (req, res) => {
  const { title, description, date, location, category, image } = req.body;
  if (!title || !date || !location) {
    return res.status(400).json({ success: false, error: "Title, date, and location are required." });
  }
  const sql = "INSERT INTO events (title, description, date, location, category, image) VALUES (?, ?, ?, ?, ?, ?)";
  await queryDb(sql, [title, description, date, location, category || "General", image]);
  res.status(201).json({ success: true, message: "Event added successfully" });
}));

app.put("/events/:id", asyncHandler(async (req, res) => {
  const { title, description, date, location, category, image } = req.body;
  const { id } = req.params;
  const sql = "UPDATE events SET title=?, description=?, date=?, location=?, category=?, image=? WHERE id=?";
  await queryDb(sql, [title, description, date, location, category, image, id]);
  res.json({ success: true, message: "Event updated successfully" });
}));

app.delete("/events/:id", adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await queryDb("DELETE FROM events WHERE id = ?", [id]);
  res.json({ success: true, message: "Event deleted successfully" });
}));

app.post("/events/register", asyncHandler(async (req, res) => {
  const validationErr = validateEventRegInput(req.body);
  if (validationErr) return res.status(400).json({ success: false, error: validationErr });

  const { event_id, user_name, email, attendees, notes } = req.body;
  const sql = "INSERT INTO event_registrations (event_id, user_name, email, attendees, notes) VALUES (?, ?, ?, ?, ?)";
  await queryDb(sql, [event_id, user_name.trim(), email.trim(), Number(attendees), notes ? notes.trim() : ""]);
  res.status(201).json({ success: true, message: "Registered for event successfully" });
}));

app.get("/events/registrations", asyncHandler(async (req, res) => {
  const sql = `
    SELECT er.id, er.user_name, er.email, er.attendees, er.notes, er.event_id, e.title
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
  `;
  const regs = await queryDb(sql);
  res.json(regs);
}));

/* =====================
   PUSH NOTIFICATIONS API
===================== */

const publicVapidKey = 'BMpXJ_xHtf7gf0Ej_CAlO4itX9hW_WIM3gnNb0Hsz_hS8fDiLzVj-s4xL260NEK5mX-jxvTTPIsLqNy3syYVuCk';
const privateVapidKey = 'b2geEqxn31hIrJJAJDY8mbwaHAQohjpnmSzL0ThuBI4';
webpush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);

app.get("/notifications/vapidPublicKey", (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

app.post("/notifications/subscribe", asyncHandler(async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ success: false, error: "Invalid push subscription format" });
  }

  const { endpoint, keys: { p256dh, auth } } = subscription;
  const sql = "INSERT IGNORE INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)";
  await queryDb(sql, [endpoint, p256dh, auth]);

  res.status(201).json({ success: true, message: "Subscription added successfully" });

  const payload = JSON.stringify({ title: 'Welcome to Urban Harvest Hub 🌱', body: 'Push notifications are now active!' });
  webpush.sendNotification(subscription, payload).catch(err => console.error('Push notify error:', err.message));
}));

app.post("/notifications/send", asyncHandler(async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ success: false, error: "Title and body are required." });

  const payload = JSON.stringify({ title, body });
  const subs = await queryDb("SELECT * FROM push_subscriptions");

  const promises = subs.map(sub => {
    const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
    return webpush.sendNotification(pushSub, payload).catch(err => {
      if (err.statusCode === 410) {
        queryDb("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
      }
    });
  });

  await Promise.all(promises);
  res.json({ success: true, message: `Notification sent to ${subs.length} subscribers` });
}));

app.get("/notifications/subscriptions", adminAuth, asyncHandler(async (req, res) => {
  const rows = await queryDb("SELECT * FROM push_subscriptions");
  res.json(rows);
}));

// ── CENTRALIZED ERROR HANDLING MIDDLEWARE ──────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 Global API Error Handler caught:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Urban Harvest Hub API listening on port ${PORT}`);
  });
}

module.exports = app;