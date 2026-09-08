const mysql = require('mysql2');
require('dotenv').config();

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "urban_harvest_hub";

const ssl = (process.env.DB_SSL === 'true' || (process.env.DB_PORT && process.env.DB_PORT != 3306))
  ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  : undefined;

// Step 1: Connect to MySQL root to ensure database exists
const rootConn = mysql.createConnection({ host, port, user, password, ...(ssl ? { ssl } : {}) });

rootConn.connect((err) => {
  if (err) {
    console.error("❌ Could not connect to MySQL server. Is XAMPP MySQL started?");
    console.error("Error details:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to XAMPP MySQL server.");
  console.log(`📦 Ensuring database '${dbName}' exists...`);

  rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
    if (err) {
      console.error("Error creating database:", err.message);
      process.exit(1);
    }
    console.log(`✅ Database '${dbName}' is ready.`);
    rootConn.end();

    // Step 2: Connect to urban_harvest_hub database and create tables
    const db = mysql.createConnection({ host, port, user, password, database: dbName, ...(ssl ? { ssl } : {}) });

    const queries = [
      `CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        rating DECIMAL(3,1) DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS workshops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATETIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        slots INT NOT NULL,
        image VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS workshop_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workshop_id INT,
        user_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATETIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        user_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        attendees INT NOT NULL,
        notes TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(500) NOT NULL UNIQUE,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL
      )`,
      `INSERT INTO admins (username, password) SELECT 'admin', 'admin123' WHERE NOT EXISTS (SELECT * FROM admins WHERE username='admin')`,
      // Seed Products
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Organic Tomatoes', 'Vegetables', 4.99, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', 'Freshly picked organic tomatoes from local farms.', 4.8 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Organic Tomatoes')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Fresh Basil Bundle', 'Herbs', 2.49, 'https://images.unsplash.com/photo-1618164420084-29ec3ce4970f?auto=format&fit=crop&w=800&q=80', 'Aromatic fresh basil perfect for pesto.', 4.9 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Fresh Basil Bundle')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Organic Lettuce', 'Vegetables', 3.99, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80', 'Crisp and fresh organic lettuce, perfect for salads.', 4.7 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Organic Lettuce')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Fresh Carrots', 'Vegetables', 2.99, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80', 'Sweet and crunchy farm-fresh carrots.', 4.6 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Fresh Carrots')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Heirloom Peppers', 'Vegetables', 5.99, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80', 'Colorful heirloom peppers with rich, complex flavors.', 4.8 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Heirloom Peppers')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Organic Spinach', 'Vegetables', 4.49, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80', 'Tender organic spinach leaves, nutrient-packed and versatile.', 4.7 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Organic Spinach')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Cherry Tomatoes', 'Vegetables', 3.49, 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=800&q=80', 'Bite-sized cherry tomatoes bursting with sweetness.', 4.9 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Cherry Tomatoes')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Fresh Mint', 'Herbs', 1.99, 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=800&q=80', 'Fragrant fresh mint, great for teas, cocktails, and cooking.', 4.8 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Fresh Mint')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Organic Parsley', 'Herbs', 2.99, 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?auto=format&fit=crop&w=800&q=80', 'Bright and fresh organic parsley, a kitchen staple.', 4.6 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Organic Parsley')`,
      `INSERT INTO products (name, category, price, image, description, rating) SELECT 'Sunflower Seeds', 'Seeds', 6.99, 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80', 'Premium sunflower seeds for planting or snacking.', 4.5 FROM DUAL WHERE NOT EXISTS (SELECT * FROM products WHERE name='Sunflower Seeds')`,
      // Seed Workshops
      `INSERT INTO workshops (title, description, date, location, slots, image) SELECT 'Balcony Gardening 101', 'Learn how to maximize your small apartment balcony to grow fresh vegetables.', '2026-07-15 10:00:00', 'Downtown Center', 15, 'https://images.unsplash.com/photo-1416879598555-46747209e99a?auto=format&fit=crop&w=800&q=80' FROM DUAL WHERE NOT EXISTS (SELECT * FROM workshops WHERE title='Balcony Gardening 101')`,
      `INSERT INTO workshops (title, description, date, location, slots, image) SELECT 'Indoor Herb Garden', 'Learn to grow herbs indoors year-round.', '2026-07-22 14:00:00', 'Community Hall', 20, 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80' FROM DUAL WHERE NOT EXISTS (SELECT * FROM workshops WHERE title='Indoor Herb Garden')`,
      `INSERT INTO workshops (title, description, date, location, slots, image) SELECT 'Composting Basics', 'Master the art of composting for your garden.', '2026-08-05 10:00:00', 'Environmental Center', 25, 'https://images.unsplash.com/photo-1542601906897-ecd3f7d0e2e3?auto=format&fit=crop&w=800&q=80' FROM DUAL WHERE NOT EXISTS (SELECT * FROM workshops WHERE title='Composting Basics')`,
      // Seed Events
      `INSERT INTO events (title, description, date, location, category, image) SELECT 'Summer Harvest Festival', 'Join the community to celebrate this season\'s bountiful harvest.', '2026-08-20 14:00:00', 'City Park', 'Festival', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' FROM DUAL WHERE NOT EXISTS (SELECT * FROM events WHERE title='Summer Harvest Festival')`,
      `INSERT INTO events (title, description, date, location, category, image) SELECT 'Farmers Market Day', 'Weekly farmers market with local vendors.', '2026-06-15 09:00:00', 'Central Square', 'Market', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80' FROM DUAL WHERE NOT EXISTS (SELECT * FROM events WHERE title='Farmers Market Day')`
    ];

    db.connect((err) => {
      if (err) {
        console.error("Failed to connect to urban_harvest_hub database:", err.message);
        process.exit(1);
      }
      console.log("⚡ Creating MySQL tables and inserting initial data...");
      let completed = 0;
      queries.forEach((q) => {
        db.query(q, (qErr) => {
          if (qErr) console.error("Query warning:", qErr.message);
          completed++;
          if (completed === queries.length) {
            console.log("🎉 MySQL Database 'urban_harvest_hub' initialized successfully!");
            // Load seed.sql if it exists
            const fs = require('fs');
            if (fs.existsSync('seed.sql')) {
              const seedSQL = fs.readFileSync('seed.sql', 'utf8');
              db.query(seedSQL, (seedErr) => {
                if (seedErr) console.error('Seed load error:', seedErr.message);
                else console.log('✅ Seed data loaded from seed.sql');
                db.end();
              });
            } else {
              db.end();
            }
          }
        });
      });
    });
  });
});
