import { useState, useEffect } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_OPEN_API_KEY || "0386c9d722e0e47087b28fc08e2f89ab";

// Standard mock weather utility for Colombo, Kandy, Galle, Jaffna, etc.
const getMockWeather = (query) => {
  const queryLower = query.toLowerCase();
  let city = "Colombo";
  let temp = 29.5;
  let description = "moderate rain";
  let icon = "10d"; // rain icon

  if (queryLower.includes("kandy")) {
    city = "Kandy";
    temp = 25.2;
    description = "broken clouds";
    icon = "04d";
  } else if (queryLower.includes("galle")) {
    city = "Galle";
    temp = 28.1;
    description = "few clouds";
    icon = "02d";
  } else if (queryLower.includes("jaffna")) {
    city = "Jaffna";
    temp = 32.4;
    description = "clear sky";
    icon = "01d";
  } else if (queryLower.includes("negombo")) {
    city = "Negombo";
    temp = 30.0;
    description = "scattered clouds";
    icon = "03d";
  } else {
    // Custom formatted name capitalize
    city = query.charAt(0).toUpperCase() + query.slice(1);
    temp = Math.floor(Math.random() * 15) + 20; // 20 to 35
    const descriptions = ["clear sky", "few clouds", "scattered clouds", "light rain", "moderate rain"];
    const icons = ["01d", "02d", "03d", "10d", "10d"];
    const idx = Math.floor(Math.random() * descriptions.length);
    description = descriptions[idx];
    icon = icons[idx];
  }

  return {
    name: city,
    main: { temp },
    weather: [{ description, icon, main: "Mocked" }]
  };
};

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationDenied, setLocationDenied] = useState(false);

  // Fetch weather by lat/lon
  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError("");
    if (!API_KEY) {
      // Simulate mock response for user location
      setTimeout(() => {
        setWeather(getMockWeather("Colombo"));
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const res = await axios.get(url);
      setWeather(res.data);
    } catch (err) {
      console.error("OpenWeather API Error:", err);
      // Fallback to mock
      setWeather(getMockWeather("Colombo"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather by city name search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setLoading(true);
    setError("");

    if (!API_KEY) {
      setTimeout(() => {
        setWeather(getMockWeather(searchCity));
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=metric`;
      const res = await axios.get(url);
      setWeather(res.data);
    } catch (err) {
      console.error("OpenWeather Search Error:", err);
      setError("City not found. Using mock weather info instead.");
      setWeather(getMockWeather(searchCity));
    } finally {
      setLoading(false);
    }
  };

  // Run geolocation on load
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (err) => {
          console.warn("Geolocation denied or failed:", err.message);
          setLocationDenied(true);
          // Load default Colombo weather
          fetchWeatherByCoords(6.9271, 79.8612); // Colombo coordinates
        }
      );
    } else {
      setLocationDenied(true);
      fetchWeatherByCoords(6.9271, 79.8612);
    }
  }, []);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md w-full max-w-sm">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Weather Garden Advisor ⛅</span>
        {locationDenied && (
          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 lowercase font-normal">
            (location denied)
          </span>
        )}
      </h2>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      )}

      {!loading && weather && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {weather.name}
            </h3>
            <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">
              {Math.round(weather.main?.temp)}°C
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
              {weather.weather?.[0]?.description}
            </p>
          </div>

          <div className="flex flex-col items-center">
            {weather.weather?.[0]?.icon ? (
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather?.[0]?.icon}@2x.png`}
                alt={weather.weather?.[0]?.description || "Weather Icon"}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-gray-400 dark:text-gray-600 text-2xl">
                ⛅
              </div>
            )}
            {weather.weather?.[0]?.main === "Mocked" && (
              <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                Simulated
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mb-2">
          {error}
        </p>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <label htmlFor="weather-city-input" className="sr-only">
          Search City
        </label>
        <input
          id="weather-city-input"
          type="text"
          placeholder="Search city (e.g. Jaffna)..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-xs transition"
        >
          Go
        </button>
      </form>
    </div>
  );
}

export default WeatherWidget;
