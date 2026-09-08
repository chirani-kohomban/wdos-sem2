import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../i18n";

function WorkshopDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form states
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  // Validation & Submit error states
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [bookingStatus, setBookingStatus] = useState(""); // "", "Pending", "Success"

  useEffect(() => {
    fetchWorkshopDetails();
  }, [id]);

  const fetchWorkshopDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/workshops`);
      const found = Array.isArray(res.data) ? res.data.find((w) => Number(w.id) === Number(id)) : null;
      if (found) {
        setWorkshop(found);
        const stored = localStorage.getItem(`workshop_req_${id}`);
        if (stored) {
          setBookingStatus(stored);
        }
      } else {
        const seedRes = await fetch("/data/seed_workshops.json");
        const seedData = await seedRes.json();
        const seedFound = seedData.find((w) => Number(w.id) === Number(id));
        if (seedFound) {
          setWorkshop(seedFound);
        } else {
          setError("Workshop not found");
        }
      }
    } catch (err) {
      try {
        const seedRes = await fetch("/data/seed_workshops.json");
        const seedData = await seedRes.json();
        const seedFound = seedData.find((w) => Number(w.id) === Number(id));
        if (seedFound) {
          setWorkshop(seedFound);
        } else {
          setError("Failed to fetch workshop details");
        }
      } catch (e) {
        setError("Failed to fetch workshop details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setSubmitError("");

    // Frontend validation
    const errors = {};
    const nameRegex = /^[A-Za-z\s]{3,100}$/;
    if (!userName.trim() || !nameRegex.test(userName.trim())) {
      errors.userName = "Name must contain only letters and spaces (min 3 characters)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      errors.phone = "Please enter a valid phone number (at least 8 digits)";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/workshops/request`, {
        workshop_id: id,
        user_name: userName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim()
      });

      setBookingStatus("Pending");
      localStorage.setItem(`workshop_req_${id}`, "Pending");

      setWorkshop((prev) => ({
        ...prev,
        slots: Math.max(0, prev.slots - 1)
      }));

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Workshop Booked!", {
          body: `You requested to join: ${workshop.title}`,
          icon: "/pwa-192x192.png"
        });
      }

      alert(t("workshops.success"));
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.error || "Error booking workshop. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow max-w-sm border border-gray-250 dark:border-gray-700">
          <h1 className="text-red-500 text-2xl font-bold mb-2">
            {error || "Workshop not found"} ❌
          </h1>
          <Link to="/workshops" className="text-green-600 dark:text-green-400 hover:underline mt-4 inline-block font-semibold">
            &larr; Back to Workshops
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(workshop.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-955 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        
        {/* Cover Image */}
        <div className="h-64 md:h-96 relative bg-gray-100">
          {workshop.image ? (
            <img
              src={workshop.image}
              alt={workshop.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold bg-gray-200 dark:bg-gray-750">
              🌱 No Image Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Link to="/workshops" className="text-xs font-bold uppercase tracking-wider text-green-300 hover:underline mb-2 inline-block">
              &larr; {t("navbar.workshops")}
            </Link>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
              {workshop.title}
            </h1>
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-6 md:p-8 grid md:grid-cols-12 gap-8">
          
          {/* Details */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-2 dark:border-gray-700">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                {workshop.description}
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-650 dark:text-gray-450 bg-gray-50 dark:bg-gray-750 p-4 rounded-xl">
              <p className="flex items-center gap-2">
                <span>📅</span>
                <strong>{t("workshops.date")}:</strong> {formattedDate}
              </p>
              <p className="flex items-center gap-2">
                <span>📍</span>
                <strong>{t("workshops.location")}:</strong> {workshop.location}
              </p>
              <p className="flex items-center gap-2">
                <span>🎫</span>
                <strong>{t("workshops.slots")}:</strong>{" "}
                <span className="font-bold text-green-600 dark:text-green-400">{workshop.slots} left</span>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-5 bg-gray-50 dark:bg-gray-750 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                {t("workshops.bookingTitle")}
              </h2>

              {submitError && (
                <div className="mb-4 p-3 bg-red-105 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold text-center border border-red-200/50 dark:border-red-900/30">
                  {submitError}
                </div>
              )}

              {bookingStatus ? (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl text-center font-bold text-sm">
                  ✓ Request Status: {bookingStatus}
                </div>
              ) : workshop.slots <= 0 ? (
                <div className="bg-red-100 dark:bg-red-905/30 text-red-800 dark:text-red-300 p-4 rounded-xl text-center font-bold text-sm">
                  Fully Booked 😢
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="user-name" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      {t("workshops.userName")} *
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      required
                      placeholder="Enter name (e.g. John Doe)..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className={`w-full bg-white dark:bg-gray-850 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.userName ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.userName && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.userName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-white dark:bg-gray-855 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="e.g. +94771234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-white dark:bg-gray-855 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows="2"
                      placeholder="Dietary requests, questions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    {t("workshops.submit")}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default WorkshopDetail;
