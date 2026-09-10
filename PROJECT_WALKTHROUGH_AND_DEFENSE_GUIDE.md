# 🌿 Urban Harvest Hub - Simple Project Walkthrough & Defense Guide

A simple, practical guide for presenting and defending your project in 5 minutes.

---

## 🔗 Quick Links & Starting Points

- **Live Frontend (PWA)**: [https://urbanharvesthub-ecru.vercel.app](https://urbanharvesthub-ecru.vercel.app)
- **Live Backend (REST API)**: [https://urbanharvest-iota.vercel.app](https://urbanharvest-iota.vercel.app)
- **API Health Check**: [https://urbanharvest-iota.vercel.app/api/health](https://urbanharvest-iota.vercel.app/api/health)
- **GitHub Repository**: [https://github.com/chirani-kohomban/wdos-sem2](https://github.com/chirani-kohomban/wdos-sem2)

*(If demonstrating locally: run `node server.js` inside `/backend` on port 5000, and `npm run dev` inside `/frontend` on port 5173).*

---

## ⏱️ The 5-Minute Live Presentation Flow

Follow these 5 simple steps during your presentation. For each step, just **click the button** and **say the short sentence**.

---

### Step 1: Single-Page Application (SPA) & Dynamic Navigation
* **What to do**:
  1. Open [https://urbanharvesthub-ecru.vercel.app](https://urbanharvesthub-ecru.vercel.app).
  2. Click **Products** in the navigation bar, then click any product (e.g. *"Organic Heirloom Tomato Seeds"*).
  3. Notice the browser URL updates to `/products/1` with no full page refresh.
  4. Click the **Moon / Sun icon** in the top-right of the navbar to toggle Dark Mode.
* **What to say**:
  > *"Our frontend is built with React and Vite as a Single-Page Application (SPA). We use React Router DOM for client-side routing, so page transitions are instant without browser reloads. We also built a responsive design with Tailwind CSS including dark and light modes."*
* **Key Code to Show**: `frontend/src/App.jsx`

---

### Step 2: Product Search, Category Filtering & Add Product
* **What to do**:
  1. On the **Products** page, type `"Tomato"` into the search bar.
  2. Clear the search and click a category chip like **"Vegetables"** or **"Herbs"**.
  3. Click **"Add New Product"**, leave the fields empty, and click **"Add Product"**.
  4. Show the red inline validation error messages (*"Product name must be at least 2 characters"*, etc.).
* **What to say**:
  > *"The catalog features real-time search and category filtering. It dynamically fetches data from our Express REST API, with an internal JSON fallback for high reliability. All forms include clear client-side validation before any request is sent."*
* **Key Code to Show**: `frontend/src/pages/Products.jsx`

---

### Step 3: Interactive Workshops & Form Validation
* **What to do**:
  1. Click **Workshops** in the navigation bar.
  2. Click on the first workshop (*"Hydroponic Herb Gardening"*).
  3. In the booking form, type an invalid email (e.g. `test@`) and click **"Request Booking"**.
  4. Point out the error message: *"Please provide a valid email address"*.
  5. Enter valid details, submit, and show the confirmation status along with the *"Reset & Test Form Again"* button.
* **What to say**:
  > *"Our workshop module allows users to book sessions. All inputs (name, email, phone, participants) are strictly validated. Successful requests are saved to both local storage and the database, and we provide a reset button for quick re-testing."*
* **Key Code to Show**: `frontend/src/pages/WorkshopDetail.jsx`

---

### Step 4: PWA Offline Mode & Live Weather
* **What to do**:
  1. Press `F12` to open Chrome Developer Tools, switch to the **Network** tab, and select **Offline**.
  2. Refresh the page (`F5`).
  3. Point out that the application still loads instantly and completely from cache!
  4. Uncheck Offline. Go to the Home page and point out the **Weather Widget** showing real-time temperature and humidity based on browser GPS geolocation.
* **What to say**:
  > *"We implemented a Progressive Web App (PWA) with a custom Workbox Service Worker in `sw.js`. It precaches the entire app shell and caches API responses so the app works 100% offline. We also integrated the Open-Meteo Weather API with HTML5 Geolocation."*
* **Key Code to Show**: `frontend/src/sw.js` and `frontend/src/components/WeatherWidget.jsx`

---

### Step 5: Live Database Connection & Admin Dashboard
* **What to do**:
  1. Navigate to [https://urbanharvesthub-ecru.vercel.app/admin](https://urbanharvesthub-ecru.vercel.app/admin).
  2. Point out the **Database Inspector & Connection Health** card:
     - **Status**: `CONNECTED`
     - **Engine**: `MySQL Relational Database` (TiDB Cloud Serverless)
     - **Verified Tables**: Lists all 7 relational tables.
  3. Click the blue button: **"🧪 Run Live SQL Query Test"**.
  4. Show the live query response: `Query SELECT * FROM products executed successfully in X ms`.
* **What to say**:
  > *"Our backend runs on Express.js connected to a cloud MySQL database hosted on TiDB Cloud. It features 7 relational tables with foreign keys, a connection pool for high concurrency, and centralized error handling middleware."*
* **Key Code to Show**: `backend/server.js` and `backend/init_db.js`

---

## 📂 Where the Code Lives (Quick 5-File Cheat Sheet)

| Requirement | File Path | What It Does |
| :--- | :--- | :--- |
| **Routing & SPA** | `frontend/src/App.jsx` | Declares all client-side routes (`/products/:id`, `/workshops/:id`, `/admin`) |
| **PWA Service Worker** | `frontend/src/sw.js` | Workbox caching rules, navigation route, and offline support |
| **Express REST API** | `backend/server.js` | API endpoints, `queryDb()` connection pool wrapper, global error handler |
| **Database Schema** | `backend/schema.sql` & `init_db.js` | 7 normalized MySQL tables with foreign keys and initial seed data |
| **Live DB Widget** | `frontend/src/components/DBStatusWidget.jsx` | Dashboard component that tests and displays live database connection health |

---

## 🎯 Top 4 Questions Lecturers Ask & Simple Answers

### Q1: "Where is your data stored?"
> **Answer**: *"Primary data is stored in a live MySQL database hosted on TiDB Cloud and served through our Express REST API. For resilience, our frontend also contains internal seed JSON files in `public/data/` so the interface always works even if the server is starting up or offline."*

### Q2: "How does your offline mode work?"
> **Answer**: *"We use Vite PWA with a custom Service Worker (`sw.js`). It precaches the static application bundle (HTML, CSS, JS) and uses Workbox routing with `createHandlerBoundToURL('/index.html')` to serve the SPA shell offline without internet."*

### Q3: "How do you handle backend errors and prevent crashes?"
> **Answer**: *"All asynchronous routes are wrapped in an `asyncHandler` that catches rejected promises. At the bottom of `server.js`, a centralized error middleware catches all errors and returns structured JSON with the right HTTP status code (400, 404, 500) instead of crashing."*

### Q4: "How does the database prevent overbooking workshops?"
> **Answer**: *"We use atomic SQL update queries with a condition check: `UPDATE workshops SET slots = slots - 1 WHERE id = ? AND slots > 0`. This ensures booking a slot is thread-safe and slots can never drop below zero."*

---

## 🧪 Automated Testing (Quick Command)
If the lecturer asks to see your automated tests:
```bash
cd backend
npm test
```
*(Runs 6 automated integration tests verifying API health, DB connection, CRUD operations, and form validation with a 100% pass rate).*
