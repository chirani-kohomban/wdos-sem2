import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../i18n";
import EventCard from "../components/EventCard";
import SearchBar from "../components/SearchBar";

function Events() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", location: "", category: "", image: "" });

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/events`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setEvents(res.data);
      } else {
        const seedRes = await fetch("/data/seed_events.json");
        const seedData = await seedRes.json();
        setEvents(seedData);
      }
    } catch (err) {
      try {
        const seedRes = await fetch("/data/seed_events.json");
        const seedData = await seedRes.json();
        setEvents(seedData);
      } catch (e) {
        setError("Failed to load events");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/events/registrations`);
      const regMap = {};
      res.data.forEach((r) => {
        regMap[r.event_id] = true;
      });
      setRegistrations(regMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // DELETE EVENT
  const deleteEvent = async (id) => {
    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/events/${id}`, {
        headers: { "x-admin-password": password }
      });
      setEvents(events.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Unauthorized"));
    }
  };

  // ADD EVENT
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/events`, newEvent);
      setEvents([...events, res.data]);
      setNewEvent({ title: "", description: "", date: "", location: "", category: "", image: "" });
      setShowAddForm(false);
    } catch (err) {
      alert("Failed to add event");
    }
  };

  // Get unique categories for filtering
  const categories = ["all", ...new Set(events.map((e) => e.category).filter(Boolean))];

  // Filtering
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <h1 className="text-3xl font-black mb-6 text-green-700 dark:text-green-400">
        {t("events.title")}
      </h1>

      {/* Filters Panel */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex-1 w-full">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
        
        <div className="w-full md:w-64 flex gap-2 items-center mb-4">
          <label htmlFor="category-select" className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t("events.category")}:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">{t("events.allCategories")}</option>
            {categories.filter(cat => cat !== "all").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADD NEW EVENT */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
      >
        {showAddForm ? "Hide Form" : "Add New Event"}
      </button>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Add New Event</h2>
          <form onSubmit={handleAddEvent} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event Title"
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Category"
              required
              value={newEvent.category}
              onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="date"
              required
              value={newEvent.date}
              onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Location"
              required
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newEvent.image}
              onChange={(e) => setNewEvent({...newEvent, image: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <textarea
              placeholder="Description"
              rows="2"
              required
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="md:col-span-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                Add Event
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-400 text-white py-2 rounded font-bold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-300">
          <div className="animate-pulse">Loading events...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center py-6 font-semibold">
          {error}
        </p>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-semibold">
          No events found 😢
        </div>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isRegistered={registrations[event.id]}
            onRegister={handleRegister}
            onDelete={deleteEvent}
          />
        ))}
      </div>

    </div>
  );
}

export default Events;
