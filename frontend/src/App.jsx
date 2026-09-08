import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Workshops from "./pages/Workshops";
import WorkshopDetail from "./pages/WorkshopDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-250 transition-colors duration-300">
        
        {/* Navigation Bar */}
        <Navbar />

        {/* Dynamic Route Pages */}
        <div className="flex-grow">
          <Routes>
            {/* Home & Products */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />

            {/* Workshops Module */}
            <Route path="/workshops" element={<Workshops />} />
            <Route path="/workshops/:id" element={<WorkshopDetail />} />

            {/* Events Module */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            {/* Admin Management Dashboard */}
            <Route path="/admin" element={<Admin />} />

            {/* 404 Not Found Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;