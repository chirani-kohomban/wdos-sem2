# 🧪 Urban Harvest Hub - Simple Manual Testing Guide

A clear, step-by-step manual testing protocol anyone can follow in 5 minutes to verify all features.

---

## 📋 Quick Test Summary Table (For Slides & Report)

| # | Feature Tested | Action | What You See (Pass Condition) | Status |
|:-:|:---|:---|:---|:-:|
| **1** | **PWA Offline Mode** | Turn on "Offline" in DevTools & refresh | App still loads smoothly from cache (no Dino game) | **PASS** ✅ |
| **2** | **PWA Installability** | Look at browser address bar | "Install Urban Harvest Hub" icon appears | **PASS** ✅ |
| **3** | **Master-Detail Views** | Click "View Details" on any product | Opens `/products/:id` with full description & price | **PASS** ✅ |
| **4** | **Search & Filter** | Type in Search bar or choose Category | Items filter instantly without page reload | **PASS** ✅ |
| **5** | **Form Validation** | Submit booking with invalid email | Red error: "Please provide a valid email address" | **PASS** ✅ |
| **6** | **Dark / Light Mode** | Click Moon/Sun icon in Navbar | Background switches between dark and light smoothly | **PASS** ✅ |
| **7** | **Language Switcher** | Click "EN / SI" in Navbar | Content switches between English and Sinhala | **PASS** ✅ |
| **8** | **Live Weather & GPS** | Open Home page | Shows real-time weather using browser location | **PASS** ✅ |
| **9** | **Database Connection** | Visit `/admin` or `/api/health` | Displays `CONNECTED: True` (MySQL / TiDB Cloud) | **PASS** ✅ |
| **10**| **Automated Tests** | Run `npm test` in `backend` | All 6 automated API tests pass (100%) | **PASS** ✅ |

---

## 🔍 Step-by-Step Manual Testing Walkthrough

---

### Test 1: PWA Offline Mode (Proves Service Worker Works)
* **Goal**: Show that the website works even without an internet connection.
* **Steps**:
  1. Open the app in Chrome: [https://urbanharvesthub-ecru.vercel.app](https://urbanharvesthub-ecru.vercel.app)
  2. Press `F12` to open Developer Tools.
  3. Click the **Network** tab at the top.
  4. Find the **Throttling** dropdown (where it says *No throttling*) and select **Offline**.
  5. Refresh the page (`F5`).
* **Expected Result**: The app still loads completely! Products and navigation remain visible because the Service Worker (`sw.js`) serves them from the offline cache.
* **Status**: **PASS ✅**

---

### Test 2: Master–Detail Navigation (Task 1 Requirement)
* **Goal**: Show dynamic routing from a catalog list to an individual item's details.
* **Steps**:
  1. Click **Products** in the navigation bar.
  2. Click on the **"Organic Heirloom Tomato Seeds"** card (or click *View Details*).
  3. Look at your browser URL bar: it changes to `/products/1`.
* **Expected Result**: A dedicated details page opens showing high-res photo, pricing, rating, stock information, and description without reloading the browser.
* **Status**: **PASS ✅**

---

### Test 3: Search & Category Filtering (Task 1 Requirement)
* **Goal**: Prove that products can be filtered in real time.
* **Steps**:
  1. Go to the **Products** page.
  2. In the Search bar, type `"Tomato"`.
  3. Observe the products grid: only the tomato seeds are shown.
  4. Clear the search and click the **"Tools & Equipment"** category filter.
* **Expected Result**: The grid updates instantly, showing only gardening tools.
* **Status**: **PASS ✅**

---

### Test 4: Form Input Validation (Task 2 & 3 Defensive Security)
* **Goal**: Prove that forms reject invalid data cleanly.
* **Steps**:
  1. Go to **Workshops** ➔ Click on any workshop.
  2. In the booking form, type an invalid email (e.g. `bademail`).
  3. Click **Submit Booking**.
* **Expected Result**: The form prevents submission and shows a clear validation error: *"Please provide a valid email address."*
* **Status**: **PASS ✅**

---

### Test 5: Dark / Light Mode (Mobile Capabilities)
* **Goal**: Verify theme switching and Tailwind class toggling.
* **Steps**:
  1. Look at the top-right of the navigation bar.
  2. Click the **Moon / Sun** toggle button.
* **Expected Result**: The entire application switches to dark mode (`bg-gray-950`), cards become dark gray, and text turns light. Click it again to return to light mode.
* **Status**: **PASS ✅**

---

### Test 6: Multilingual Support (English / Sinhala)
* **Goal**: Demonstrate accessibility and inclusivity for community users.
* **Steps**:
  1. Click the language button in the Navbar (`EN / SI`).
* **Expected Result**: Navigation links, buttons, and titles instantly translate to Sinhala without reloading the page.
* **Status**: **PASS ✅**

---

### Test 7: Live Cloud Database Verification (Task 3)
* **Goal**: Prove that data is coming from a real relational MySQL database.
* **Steps**:
  1. In your browser, open: [https://urbanharvest-iota.vercel.app/api/health](https://urbanharvest-iota.vercel.app/api/health)
* **Expected Result**: You see JSON output:
  ```json
  {
    "status": "ok",
    "database": {
      "connected": true,
      "engine": "MySQL Database",
      "host": "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
    }
  }
  ```
* **Status**: **PASS ✅**

---

### Test 8: Automated Integration Test Suite
* **Goal**: Run the automated test script to verify backend endpoints.
* **Steps**:
  1. Open terminal and run:
     ```bash
     cd backend
     npm test
     ```
* **Expected Result**:
  ```text
  ✅ PASS: GET /api/health returns HTTP 200 and status ok
  ✅ PASS: GET /api/db-status returns connection status and table stats
  ✅ PASS: GET /products returns list of products
  ✅ PASS: POST /products fails with 400 on invalid input
  ✅ PASS: GET /workshops returns list of workshops
  ✅ PASS: GET /events returns list of events

  Test Results: 6 Passed, 0 Failed
  ```
* **Status**: **PASS ✅**
