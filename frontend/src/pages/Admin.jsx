import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "../i18n";
import DashboardCard from "../components/DashboardCard";
import PushSubscription from "./PushSubscription";
import DBStatusWidget from "../components/DBStatusWidget";

function Admin() {
  const { t } = useTranslation();
  
  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("stats"); // stats, products, workshops, events, requests, push

  // Lists State
  const [products, setProducts] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [events, setEvents] = useState([]);
  const [workshopRequests, setWorkshopRequests] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [stats, setStats] = useState({ products: 0, workshops: 0, events: 0, requests: 0 });

  // Form states for adding/editing items
  const [productForm, setProductForm] = useState({ id: null, name: "", category: "", price: "", image: "", description: "", rating: "" });
  const [workshopForm, setWorkshopForm] = useState({ id: null, title: "", description: "", date: "", location: "", slots: "", image: "" });
  const [eventForm, setEventForm] = useState({ id: null, title: "", description: "", date: "", location: "", category: "", image: "" });
  
  const [formMessage, setFormMessage] = useState("");
  // Push Notification Form State
  const [pushForm, setPushForm] = useState({ title: "", body: "" });
  const [pushResult, setPushResult] = useState("");

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/stats`);
      setStats(statsRes.data);

      const prodRes = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProducts(prodRes.data);

      const workRes = await axios.get(`${import.meta.env.VITE_API_URL}/workshops`);
      setWorkshops(workRes.data);

      const eventRes = await axios.get(`${import.meta.env.VITE_API_URL}/events`);
      setEvents(eventRes.data);

      const wReqRes = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/requests`);
      setWorkshopRequests(wReqRes.data);

      const eRegRes = await axios.get(`${import.meta.env.VITE_API_URL}/events/registrations`);
      setEventRegistrations(eRegRes.data);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    }
  };

  // LOGIN FLOW
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, loginForm);
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("adminToken", res.data.token);
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || t("admin.invalidCreds"));
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("adminToken");
  };

  // PUSH NOTIFICATION HANDLERS
  const handlePushChange = (e) => {
    setPushForm({ ...pushForm, [e.target.name]: e.target.value });
  };

  const handlePushSubmit = async (e) => {
    e.preventDefault();
    setPushResult("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/notifications/send`, pushForm);
      setPushResult(res.data.message || "Notification sent successfully!");

      // Fire local notification popup on active screen for instant testing
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(pushForm.title || "Urban Harvest Hub 🌱", {
          body: pushForm.body || "Push notification broadcast received!",
          icon: "/pwa-192x192.png"
        });
      }
    } catch (err) {
      setPushResult(err.response?.data?.error || "Failed to send notification");
      // Fallback local display trigger
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(pushForm.title || "Urban Harvest Hub 🌱", {
          body: pushForm.body || "Notification broadcast!",
          icon: "/pwa-192x192.png"
        });
      }
    }
  };

  // PRODUCT CRUD
  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productForm.id) {
        // Update
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/products/${productForm.id}`, productForm);
        setFormMessage(res.data.message);
      } else {
        // Create
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/products`, productForm);
        setFormMessage(res.data.message);
      }
      setProductForm({ id: null, name: "", category: "", price: "", image: "", description: "", rating: "" });
      fetchDashboardData();
    } catch (err) {
      setFormMessage("Failed to save product.");
    }
  };

  const editProduct = (prod) => {
    setProductForm(prod);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // WORKSHOP CRUD
  const handleWorkshopChange = (e) => {
    setWorkshopForm({ ...workshopForm, [e.target.name]: e.target.value });
  };

  const handleWorkshopSubmit = async (e) => {
    e.preventDefault();
    try {
      if (workshopForm.id) {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/workshops/${workshopForm.id}`, workshopForm);
        setFormMessage(res.data.message);
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/workshops`, workshopForm);
        setFormMessage(res.data.message);
      }
      setWorkshopForm({ id: null, title: "", description: "", date: "", location: "", slots: "", image: "" });
      fetchDashboardData();
    } catch (err) {
      setFormMessage("Failed to save workshop.");
    }
  };

  const editWorkshop = (w) => {
    // Format date string for HTML input
    const formattedDate = w.date ? w.date.split("T")[0] : "";
    setWorkshopForm({ ...w, date: formattedDate });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteWorkshop = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/workshops/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRequestStatus = async (reqId, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/workshops/requests/${reqId}`, { status });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // EVENT CRUD
  const handleEventChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      if (eventForm.id) {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/events/${eventForm.id}`, eventForm);
        setFormMessage(res.data.message);
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/events`, eventForm);
        setFormMessage(res.data.message);
      }
      setEventForm({ id: null, title: "", description: "", date: "", location: "", category: "", image: "" });
      fetchDashboardData();
    } catch (err) {
      setFormMessage("Failed to save event.");
    }
  };

  const editEvent = (e) => {
    const formattedDate = e.date ? e.date.split("T")[0] : "";
    setEventForm({ ...e, date: formattedDate });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEvent = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/events/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // LOGIN SCREEN RENDER
  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-6">
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-lg max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-green-700 dark:text-green-400">
              {t("admin.loginTitle")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Sign in to manage products, workshops, and events.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t("admin.username")}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={loginForm.username}
                onChange={handleLoginChange}
                placeholder="Enter username"
                className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t("admin.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Enter password"
                className="w-full bg-gray-50 dark:bg-gray-855 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-sm shadow-sm transition"
              >
                {t("admin.signIn")}
              </button>
              <button
                type="button"
                onClick={() => setLoginForm({ username: "admin", password: "admin123" })}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-lg text-sm shadow-sm transition"
              >
                Use Dummy Profile
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b pb-4 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-black text-green-700 dark:text-green-400">
            {t("admin.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, admin. Keep the community growing!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-650 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
        >
          Sign Out
        </button>
      </header>

      {/* DASHBOARD TAB NAVIGATION */}
      <nav className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2">
        {[
          { id: "stats", label: t("admin.stats") },
          { id: "products", label: t("admin.manageProducts") },
          { id: "workshops", label: t("admin.manageWorkshops") },
          { id: "events", label: t("admin.manageEvents") },
          { id: "requests", label: "Join Requests" },
          { id: "push", label: "Push Notifications" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFormMessage("");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-green-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-650 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {formMessage && (
        <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/35 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold">
          {formMessage}
        </div>
      )}

      {/* TABS CONTENT */}

      {/* 1. STATS TAB */}
      {activeTab === "stats" && (
        <section className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <DashboardCard title={t("admin.productCount")} value={stats.products} icon="📦" colorClass="text-blue-500" />
            <DashboardCard title={t("admin.workshopCount")} value={stats.workshops} icon="🌿" colorClass="text-green-500" />
            <DashboardCard title={t("admin.eventCount")} value={stats.events} icon="📅" colorClass="text-yellow-500" />
            <DashboardCard title={t("admin.requestCount")} value={stats.requests} icon="📨" colorClass="text-indigo-500" />
          </div>

          {/* Real-Time Database Connection & Health Widget */}
          <DBStatusWidget />
        </section>
      )}

      {/* 2. PRODUCTS TAB */}
      {activeTab === "products" && (
        <section className="grid md:grid-cols-12 gap-8">
          
          {/* Add / Edit Form */}
          <div className="md:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              {productForm.id ? "Edit Product" : t("admin.addProduct")}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label htmlFor="prod-name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.productName")}</label>
                <input
                  id="prod-name"
                  name="name"
                  required
                  value={productForm.name}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="prod-category" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.selectCategory")}</label>
                <select
                  id="prod-category"
                  name="category"
                  required
                  value={productForm.category}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                >
                  <option value="">{t("admin.selectCategory")}</option>
                  <option value="food">{t("products.food")}</option>
                  <option value="lifestyle">{t("products.lifestyle")}</option>
                  <option value="education">{t("products.education")}</option>
                  <option value="eco-products">{t("products.ecoProducts")}</option>
                </select>
                        <div>
                <label htmlFor="prod-price" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1">{t("admin.price")}</label>
                <input
                  id="prod-price"
                  name="price"
                  type="number"
                  required
                  value={productForm.price}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="prod-image" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1">{t("admin.imageUrlLabel")}</label>
                <input
                  id="prod-image"
                  name="image"
                  value={productForm.image}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="prod-desc" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1">Description</label>
                <textarea
                  id="prod-desc"
                  name="description"
                  rows="2"
                  value={productForm.description}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="prod-rating" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1">Rating (0-5)</label>
                <input
                  id="prod-rating"
                  name="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={productForm.rating}
                  onChange={handleProductChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700">
                  {productForm.id ? t("admin.update") : t("admin.save")}
                </button>
                {productForm.id && (
                  <button
                    type="button"
                    onClick={() => setProductForm({ id: null, name: "", category: "", price: "", image: "", description: "", rating: "" })}
                    className="bg-gray-550 text-white py-2 px-3 rounded text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>      </div>
            </form>
          </div>

          {/* List Table */}
          <div className="md:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  <th className="p-4">{t("admin.productName")}</th>
                  <th className="p-4">{t("admin.selectCategory")}</th>
                  <th className="p-4">{t("admin.price")}</th>
                  <th className="p-4 text-right">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm text-gray-650 dark:text-gray-300">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-semibold text-gray-850 dark:text-white">{prod.name}</td>
                    <td className="p-4 capitalize">{prod.category}</td>
                    <td className="p-4 font-mono font-bold">Rs {prod.price}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => editProduct(prod)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("admin.edit")}
                      </button>
                      <button onClick={() => deleteProduct(prod.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("products.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. WORKSHOPS TAB */}
      {activeTab === "workshops" && (
        <section className="grid md:grid-cols-12 gap-8">
          
          {/* Add / Edit Form */}
          <div className="md:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              {workshopForm.id ? "Edit Workshop" : t("admin.addWorkshop")}
            </h2>
            <form onSubmit={handleWorkshopSubmit} className="space-y-3">
              <div>
                <label htmlFor="ws-title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.titleLabel")}</label>
                <input
                  id="ws-title"
                  name="title"
                  required
                  value={workshopForm.title}
                  onChange={handleWorkshopChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="ws-desc" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.descLabel")}</label>
                <textarea
                  id="ws-desc"
                  name="description"
                  rows="3"
                  value={workshopForm.description}
                  onChange={handleWorkshopChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="ws-date" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.dateLabel")}</label>
                  <input
                    id="ws-date"
                    name="date"
                    type="date"
                    required
                    value={workshopForm.date}
                    onChange={handleWorkshopChange}
                    className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="ws-slots" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.slotsLabel")}</label>
                  <input
                    id="ws-slots"
                    name="slots"
                    type="number"
                    required
                    value={workshopForm.slots}
                    onChange={handleWorkshopChange}
                    className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ws-loc" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.locationLabel")}</label>
                <input
                  id="ws-loc"
                  name="location"
                  required
                  value={workshopForm.location}
                  onChange={handleWorkshopChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="ws-image" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.imageUrlLabel")}</label>
                <input
                  id="ws-image"
                  name="image"
                  value={workshopForm.image}
                  onChange={handleWorkshopChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700">
                  {workshopForm.id ? t("admin.update") : t("admin.save")}
                </button>
                {workshopForm.id && (
                  <button
                    type="button"
                    onClick={() => setWorkshopForm({ id: null, title: "", description: "", date: "", location: "", slots: "", image: "" })}
                    className="bg-gray-550 text-white py-2 px-3 rounded text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table */}
          <div className="md:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  <th className="p-4">{t("admin.titleLabel")}</th>
                  <th className="p-4">{t("admin.dateLabel")}</th>
                  <th className="p-4">{t("admin.locationLabel")}</th>
                  <th className="p-4">{t("admin.slotsLabel")}</th>
                  <th className="p-4 text-right">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm text-gray-650 dark:text-gray-300">
                {workshops.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-semibold text-gray-850 dark:text-white">{w.title}</td>
                    <td className="p-4">{new Date(w.date).toLocaleDateString()}</td>
                    <td className="p-4">{w.location}</td>
                    <td className="p-4 font-bold">{w.slots}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => editWorkshop(w)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("admin.edit")}
                      </button>
                      <button onClick={() => deleteWorkshop(w.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("products.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. EVENTS TAB */}
      {activeTab === "events" && (
        <section className="grid md:grid-cols-12 gap-8">
          
          {/* Add / Edit Form */}
          <div className="md:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              {eventForm.id ? "Edit Event" : t("admin.addEvent")}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-3">
              <div>
                <label htmlFor="evt-title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.titleLabel")}</label>
                <input
                  id="evt-title"
                  name="title"
                  required
                  value={eventForm.title}
                  onChange={handleEventChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="evt-desc" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.descLabel")}</label>
                <textarea
                  id="evt-desc"
                  name="description"
                  rows="3"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="evt-date" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.dateLabel")}</label>
                  <input
                    id="evt-date"
                    name="date"
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={handleEventChange}
                    className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="evt-cat" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("events.category")}</label>
                  <input
                    id="evt-cat"
                    name="category"
                    required
                    placeholder="e.g. Cleanup"
                    value={eventForm.category}
                    onChange={handleEventChange}
                    className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="evt-loc" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.locationLabel")}</label>
                <input
                  id="evt-loc"
                  name="location"
                  required
                  value={eventForm.location}
                  onChange={handleEventChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="evt-image" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("admin.imageUrlLabel")}</label>
                <input
                  id="evt-image"
                  name="image"
                  value={eventForm.image}
                  onChange={handleEventChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700">
                  {eventForm.id ? t("admin.update") : t("admin.save")}
                </button>
                {eventForm.id && (
                  <button
                    type="button"
                    onClick={() => setEventForm({ id: null, title: "", description: "", date: "", location: "", category: "", image: "" })}
                    className="bg-gray-550 text-white py-2 px-3 rounded text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table */}
          <div className="md:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  <th className="p-4">{t("admin.titleLabel")}</th>
                  <th className="p-4">{t("admin.dateLabel")}</th>
                  <th className="p-4">{t("admin.locationLabel")}</th>
                  <th className="p-4">{t("events.category")}</th>
                  <th className="p-4 text-right">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm text-gray-650 dark:text-gray-300">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-semibold text-gray-850 dark:text-white">{e.title}</td>
                    <td className="p-4">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-4">{e.location}</td>
                    <td className="p-4 capitalize">{e.category}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => editEvent(e)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("admin.edit")}
                      </button>
                      <button onClick={() => deleteEvent(e.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded">
                        {t("products.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. REQUESTS TAB */}
      {activeTab === "push" && (
         <section className="space-y-6">
           <PushSubscription />
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm max-w-md">
             <form onSubmit={handlePushSubmit} className="space-y-4">
               <div>
                 <label htmlFor="push-title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Title</label>
                 <input
                   id="push-title"
                   name="title"
                   required
                   value={pushForm.title}
                   onChange={handlePushChange}
                   className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                 />
               </div>
               <div>
                 <label htmlFor="push-body" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Message</label>
                 <textarea
                   id="push-body"
                   name="body"
                   rows={3}
                   required
                   value={pushForm.body}
                   onChange={handlePushChange}
                   className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-sm text-gray-800 dark:text-white"
                 />
               </div>
               <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
                 Send Push
               </button>
             </form>
             {pushResult && (
               <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                 {pushResult}
               </div>
             )}
           </div>
         </section>
       )}
      {activeTab === "requests" && (
        <section className="space-y-8">          {/* Workshop requests */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {t("admin.workshopRequests")}
              </h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-750 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="p-4">{t("workshops.userName")}</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">{t("admin.titleLabel")}</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">{t("admin.status")}</th>
                  <th className="p-4 text-right">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm text-gray-650 dark:text-gray-300">
                {workshopRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-semibold text-gray-850 dark:text-white">{req.user_name}</td>
                    <td className="p-4">
                      <div className="text-xs font-medium">{req.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{req.phone}</div>
                    </td>
                    <td className="p-4">{req.title}</td>
                    <td className="p-4 text-xs italic max-w-xs truncate" title={req.notes}>{req.notes || "-"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        req.status === "Approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : req.status === "Rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-905/40 dark:text-yellow-300"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(req.id, "Approved")}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded"
                          >
                            {t("admin.approve")}
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req.id, "Rejected")}
                            className="bg-red-500 hover:bg-red-650 text-white text-xs px-2.5 py-1 rounded"
                          >
                            {t("admin.reject")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Event registrations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {t("admin.eventRegistrations")}
              </h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-750 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="p-4">Attendee Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Event Title</th>
                  <th className="p-4 text-center">Seats</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm text-gray-650 dark:text-gray-300">
                {eventRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-semibold text-gray-855 dark:text-white">{reg.user_name}</td>
                    <td className="p-4 text-xs">{reg.email}</td>
                    <td className="p-4">{reg.title}</td>
                    <td className="p-4 text-center font-bold">{reg.attendees}</td>
                    <td className="p-4 text-xs italic max-w-xs truncate" title={reg.notes}>{reg.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>
      )}

    </div>
  );
}

export default Admin;