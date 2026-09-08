# 🧪 Urban Harvest Hub - Manual & Automated Testing Matrix

This document provides a comprehensive breakdown of **Manual Test Protocols** and **Automated Verification Procedures** for Urban Harvest Hub across all evaluation criteria.

---

## 1. PWA & Service Worker Testing Matrix

| Test ID | Test Scenario | Manual Step-by-Step Procedure | Expected Result | Result |
| :--- | :--- | :--- | :--- | :---: |
| **PWA-01** | Service Worker Registration | 1. Open Chrome DevTools (`F12`).<br>2. Navigate to **Application > Service Workers**.<br>3. Load `http://localhost:5173`. | SW status displays `activated and is running` with source `sw.js`. | **PASS** ✅ |
| **PWA-02** | Web App Manifest Validation | 1. Open DevTools **Application > Manifest**.<br>2. Inspect `name`, `short_name`, `icons`, `theme_color`. | Manifest loaded with valid `192x192` & `512x512` PNG icons, `standalone` display mode. | **PASS** ✅ |
| **PWA-03** | Offline Mode & Runtime Caching | 1. Navigate to `/products` and `/workshops`.<br>2. In DevTools **Network** tab, tick **Offline**.<br>3. Refresh page or navigate between products & detail views. | Page loads smoothly from SW cache with cached API data and images. | **PASS** ✅ |
| **PWA-04** | PWA Installation Prompt | 1. Open app in Chrome/Edge desktop or mobile browser.<br>2. Look for install icon in address bar or header prompt. | Browser presents "Install Urban Harvest Hub" app prompt. | **PASS** ✅ |
| **PWA-05** | Push Notification Subscription | 1. Click "Enable Notifications" button in Navbar.<br>2. Accept browser permissions prompt.<br>3. Send push test from Admin panel (`/admin`). | Toast/Banner notification pops up with sound/vibration: *"Welcome to Urban Harvest Hub 🌱"*. | **PASS** ✅ |
| **PWA-06** | Lighthouse Audit (PWA ≥ 90 Target) | 1. Open Chrome DevTools **Lighthouse** tab.<br>2. Select **PWA** & **Performance** audit.<br>3. Run report. | PWA badge awarded, all PWA installability requirements verified green. | **PASS** ✅ |

---

## 2. Client-Side SPA & Component Hierarchy Matrix

| Test ID | Test Scenario | Manual Step-by-Step Procedure | Expected Result | Result |
| :--- | :--- | :--- | :--- | :---: |
| **SPA-01** | Client-Side Routing | 1. Click navigation links (`/products`, `/workshops`, `/events`, `/admin`). | Page transitions instantly without full browser reload (Vite + React Router DOM v7). | **PASS** ✅ |
| **SPA-02** | Dynamic Master-Detail Views | 1. Go to `/products`.<br>2. Click on a product card (e.g., "Organic Tomatoes"). | Router navigates to `/products/1` displaying detailed view, price, rating, and description. | **PASS** ✅ |
| **SPA-03** | Workshop Slot Booking Form | 1. Navigate to `/workshops/1`.<br>2. Fill out user name, email, phone, and submit request. | Client-side validation checks input format; sends POST `/workshops/request` and updates status. | **PASS** ✅ |
| **SPA-04** | Search & Category Filter | 1. Go to `/products`.<br>2. Type "Basil" in Search bar.<br>3. Select "Herbs" filter dropdown. | Grid dynamically filters products in real-time. | **PASS** ✅ |
| **SPA-05** | Dark / Light Theme Toggle | 1. Click moon/sun button in Navbar. | DOM `<html>` toggles `.dark` class seamlessly with 300ms transition. | **PASS** ✅ |
| **SPA-06** | 404 Route Catch | 1. Navigate to `/non-existent-page`. | Displays custom styled NotFound page with button returning to Home. | **PASS** ✅ |

---

## 3. Database Integration & API Testing Matrix

| Test ID | Test Scenario | Manual Step-by-Step Procedure | Expected Result | Result |
| :--- | :--- | :--- | :--- | :---: |
| **DB-01** | Live Database Connection Status | 1. Navigate to `/admin`.<br>2. Inspect **Database Inspector** widget in Stats tab. | Displays `CONNECTED`, Latency in ms, and 7 verified DB tables. | **PASS** ✅ |
| **DB-02** | Interactive SQL Query Test | 1. In DB Inspector, click **"Run Live SQL Query Test"**. | Executes `SELECT * FROM products` and returns latency and row count. | **PASS** ✅ |
| **DB-03** | API Health Endpoint | 1. Open `http://localhost:5000/api/health` in browser. | Returns JSON: `{ "status": "ok", "uptime": ..., "database": { ... } }`. | **PASS** ✅ |
| **DB-04** | Form Validation & Error Handling | 1. Send POST request to `/products` with empty name/price. | Server returns HTTP 400 with clean error JSON: `{ "success": false, "error": "Product name must be at least 2 characters long." }`. | **PASS** ✅ |
| **DB-05** | CRUD Operations | 1. Add new product in Admin page.<br>2. Edit existing workshop slots.<br>3. Delete product with admin password. | Database executes INSERT/UPDATE/DELETE queries cleanly. | **PASS** ✅ |

---

## 4. External API & Mobile Capabilities Matrix

| Test ID | Test Scenario | Manual Step-by-Step Procedure | Expected Result | Result |
| :--- | :--- | :--- | :--- | :---: |
| **MOB-01** | External Weather API Integration | 1. View Weather Widget on Home page. | Dynamic fetch from Open-Meteo API displaying real-time temperature, wind, and conditions. | **PASS** ✅ |
| **MOB-02** | Geolocation Device Access | 1. Click "Use My Location" on Weather Widget.<br>2. Grant location access. | Fetches local latitude & longitude and updates city weather data instantly. | **PASS** ✅ |
| **MOB-03** | Fallback Data Handling | 1. Disconnect backend API server.<br>2. Load `/products` page. | App gracefully falls back to internal `/data/seed_products.json` static file without crashing. | **PASS** ✅ |

---

## 5. Automated Test Suite Execution

Run the automated API & DB verification script:

```bash
cd backend
npm test
```

### Sample Automated Test Output:
```text
🧪 Starting Urban Harvest Hub API & Database Integration Tests...

✅ PASS: GET /api/health returns HTTP 200 and status ok
✅ PASS: GET /api/db-status returns connection status and table stats
✅ PASS: GET /products returns list of products
✅ PASS: POST /products fails with 400 on invalid input
✅ PASS: GET /workshops returns list of workshops
✅ PASS: GET /events returns list of events

===================================
Test Results: 6 Passed, 0 Failed
===================================
```
