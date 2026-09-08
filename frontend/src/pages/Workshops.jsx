import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../i18n";
import WorkshopCard from "../components/WorkshopCard";
import SearchBar from "../components/SearchBar";

function Workshops() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [requests, setRequests] = useState({});
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkshop, setNewWorkshop] = useState({ title: "", description: "", date: "", location: "", slots: "", image: "" });

  // Fetch workshops and existing requests on mount
  useEffect(() => {
    fetchWorkshops();
    fetchRequests();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/workshops`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setWorkshops(res.data);
      } else {
        const seedRes = await fetch("/data/seed_workshops.json");
        const seedData = await seedRes.json();
        setWorkshops(seedData);
      }
    } catch (err) {
      try {
        const seedRes = await fetch("/data/seed_workshops.json");
        const seedData = await seedRes.json();
        setWorkshops(seedData);
      } catch (e) {
        setError("Failed to load workshops");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/requests`);
      // Map requests by workshop_id for the current dummy user
      const reqMap = {};
      res.data.forEach((r) => {
        reqMap[r.workshop_id] = r.status;
      });
      setRequests(reqMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestJoin = (workshopId) => {
    navigate(`/workshops/${workshopId}`);
  };

  // DELETE WORKSHOP
  const deleteWorkshop = async (id) => {
    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/workshops/${id}`, {
        headers: { "x-admin-password": password }
      });
      setWorkshops(workshops.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Unauthorized"));
    }
  };

  // ADD WORKSHOP
  const handleAddWorkshop = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/workshops`, newWorkshop);
      setWorkshops([...workshops, res.data]);
      setNewWorkshop({ title: "", description: "", date: "", location: "", slots: "", image: "" });
      setShowAddForm(false);
    } catch (err) {
      alert("Failed to add workshop");
    }
  };

  // Get unique locations for dropdown filter
  const locations = ["all", ...new Set(workshops.map((w) => w.location).filter(Boolean))];

  // Filtering
  const filteredWorkshops = workshops.filter((w) => {
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase()) || 
                          w.description.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = selectedLocation === "all" || w.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <h1 className="text-3xl font-black mb-6 text-green-700 dark:text-green-400">
        {t("workshops.title")}
      </h1>

      {/* Filters Panel */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex-1 w-full">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
        
        <div className="w-full md:w-64 flex gap-2 items-center mb-4">
          <label htmlFor="location-select" className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t("workshops.location")}:
          </label>
          <select
            id="location-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">{t("workshops.allLocations")}</option>
            {locations.filter(loc => loc !== "all").map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADD NEW WORKSHOP */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
      >
        {showAddForm ? "Hide Form" : "Add New Workshop"}
      </button>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Add New Workshop</h2>
          <form onSubmit={handleAddWorkshop} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Workshop Title"
              required
              value={newWorkshop.title}
              onChange={(e) => setNewWorkshop({...newWorkshop, title: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Location"
              required
              value={newWorkshop.location}
              onChange={(e) => setNewWorkshop({...newWorkshop, location: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="date"
              required
              value={newWorkshop.date}
              onChange={(e) => setNewWorkshop({...newWorkshop, date: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="number"
              placeholder="Available Slots"
              min="1"
              required
              value={newWorkshop.slots}
              onChange={(e) => setNewWorkshop({...newWorkshop, slots: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newWorkshop.image}
              onChange={(e) => setNewWorkshop({...newWorkshop, image: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <textarea
              placeholder="Description"
              rows="2"
              required
              value={newWorkshop.description}
              onChange={(e) => setNewWorkshop({...newWorkshop, description: e.target.value})}
              className="md:col-span-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                Add Workshop
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
          <div className="animate-pulse">Loading workshops...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center py-6 font-semibold">
          {error}
        </p>
      )}

      {/* Empty State */}
      {!loading && filteredWorkshops.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-semibold">
          No workshops found 😢
        </div>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {filteredWorkshops.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            workshop={workshop}
            isRequested={requests[workshop.id]}
            onRequest={handleRequestJoin}
            onDelete={deleteWorkshop}
          />
        ))}
      </div>

    </div>
  );
}

export default Workshops;