import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../i18n";

function EventDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form states
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [notes, setNotes] = useState("");
  
  // Validation & Submit error states
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/events`);
      const found = Array.isArray(res.data) ? res.data.find((e) => Number(e.id) === Number(id)) : null;
      if (found) {
        setEvent(found);
        const stored = localStorage.getItem(`event_reg_${id}`);
        if (stored) {
          setIsRegistered(true);
        }
      } else {
        const seedRes = await fetch("/data/seed_events.json");
        const seedData = await seedRes.json();
        const seedFound = seedData.find((e) => Number(e.id) === Number(id));
        if (seedFound) {
          setEvent(seedFound);
        } else {
          setError("Event not found");
        }
      }
    } catch (err) {
      try {
        const seedRes = await fetch("/data/seed_events.json");
        const seedData = await seedRes.json();
        const seedFound = seedData.find((e) => Number(e.id) === Number(id));
        if (seedFound) {
          setEvent(seedFound);
        } else {
          setError("Failed to fetch event details");
        }
      } catch (e) {
        setError("Failed to fetch event details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setSubmitError("");

    // Validation
    const errors = {};
    const nameRegex = /^[A-Za-z\s]{3,100}$/;
    if (!userName.trim() || !nameRegex.test(userName.trim())) {
      errors.userName = "Name must contain only letters and spaces (min 3 characters)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const count = Number(attendees);
    if (isNaN(count) || count < 1 || count > 10) {
      errors.attendees = "Attendees must be a number between 1 and 10";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/events/register`, {
        event_id: id,
        user_name: userName.trim(),
        email: email.trim(),
        attendees: count,
        notes: notes.trim()
      });

      setIsRegistered(true);
      localStorage.setItem(`event_reg_${id}`, "true");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Event Registration Confirmed!", {
          body: `You are registered for: ${event.title}`,
          icon: "/pwa-192x192.png"
        });
      }

      alert(t("events.success"));
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.error || "Error registering for event. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-955 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow max-w-sm border border-gray-250 dark:border-gray-700">
          <h1 className="text-red-500 text-2xl font-bold mb-2">
            {error || "Event not found"} ❌
          </h1>
          <Link to="/events" className="text-green-600 dark:text-green-400 hover:underline mt-4 inline-block font-semibold">
            &larr; Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        
        {/* Cover Image */}
        <div className="h-64 md:h-96 relative bg-gray-100">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold bg-gray-200 dark:bg-gray-755">
              📅 No Image Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Link to="/events" className="text-xs font-bold uppercase tracking-wider text-green-300 hover:underline mb-2 inline-block">
              &larr; {t("navbar.events")}
            </Link>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-6 md:p-8 grid md:grid-cols-12 gap-8">
          
          {/* Details */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-750 dark:text-yellow-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {event.category}
              </span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-4 border-b pb-2 dark:border-gray-700">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-650 dark:text-gray-450 bg-gray-50 dark:bg-gray-750 p-4 rounded-xl">
              <p className="flex items-center gap-2">
                <span>📅</span>
                <strong>{t("events.date")}:</strong> {formattedDate}
              </p>
              <p className="flex items-center gap-2">
                <span>📍</span>
                <strong>{t("events.location")}:</strong> {event.location}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-5 bg-gray-50 dark:bg-gray-750 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                {t("events.registrationTitle")}
              </h2>

              {submitError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold text-center border border-red-200/50 dark:border-red-900/30">
                  {submitError}
                </div>
              )}

              {isRegistered ? (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl text-center font-bold text-sm">
                  ✓ {t("events.registered")}
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="event-user-name" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      {t("events.userName")} *
                    </label>
                    <input
                      id="event-user-name"
                      type="text"
                      required
                      placeholder="Enter name (e.g. John Doe)..."
                      value={userName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUserName(val);
                        // Real-time validation: letters and spaces only
                        const nameRegex = /^[A-Za-z\s]{3,100}$/;
                        if (val && !nameRegex.test(val)) {
                          setValidationErrors((prev) => ({ ...prev, userName: "Name must contain only letters and spaces (min 3 characters)" }));
                        } else {
                          setValidationErrors((prev) => { const e = { ...prev }; delete e.userName; return e; });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Block numbers and special characters from being typed
                        const allowed = /^[A-Za-z\s]$/;
                        if (!allowed.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full bg-white dark:bg-gray-850 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.userName ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.userName && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.userName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="event-email" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Email Address *
                    </label>
                    <input
                      id="event-email"
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-white dark:bg-gray-850 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="event-attendees" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Number of Attendees *
                    </label>
                    <input
                      id="event-attendees"
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      className={`w-full bg-white dark:bg-gray-850 border rounded-lg p-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        validationErrors.attendees ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {validationErrors.attendees && (
                      <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.attendees}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="event-notes" className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1 uppercase">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      id="event-notes"
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
                    {t("events.submit")}
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

export default EventDetail;
