import { useState, useEffect } from "react";
import axios from "axios";

function NotificationButton() {
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const triggerLocalNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/pwa-192x192.png",
          badge: "/favicon.svg"
        });
      } catch (err) {
        console.warn("Direct Notification constructor failed, relying on service worker:", err);
      }
    }
  };

  const handleNotificationClick = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    // If permission is already granted, trigger a live test notification popup!
    if (Notification.permission === "granted") {
      triggerLocalNotification("Urban Harvest Hub 🌱", "Notification test successful! Alerts are active.");
      alert("🔔 Notification test sent! Check your screen/tray for the popup.");
      return;
    }

    if (Notification.permission === "denied") {
      alert("⚠️ Notifications are blocked in your browser settings.\n\nTo enable:\n1. Click the lock/settings icon next to localhost in your browser address bar.\n2. Change Notifications to 'Allow'.\n3. Refresh the page.");
      return;
    }

    setLoading(true);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === "granted") {
        // Immediate local notification popup
        triggerLocalNotification("Welcome to Urban Harvest Hub 🌱", "Push notifications are now active!");

        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const vapidRes = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/vapidPublicKey`);
            const { publicKey } = vapidRes.data;

            if (publicKey && registration.pushManager) {
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
              });

              await axios.post(`${import.meta.env.VITE_API_URL}/notifications/subscribe`, subscription);
            }
          } catch (swErr) {
            console.warn("Push subscription registered locally (SW push sync optional):", swErr.message);
          }
        }
      } else if (status === "denied") {
        alert("Notification permission was blocked.");
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!("Notification" in window)) {
    return null;
  }

  return (
    <button
      onClick={handleNotificationClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
        permission === "granted"
          ? "bg-green-800 text-green-100 hover:bg-green-900 border border-green-600"
          : permission === "denied"
          ? "bg-red-800/80 text-red-100 hover:bg-red-900 border border-red-600"
          : "bg-black/30 text-white hover:bg-black/50 border border-white/20"
      }`}
      aria-label={
        permission === "granted"
          ? "Click to test notification popup"
          : permission === "denied"
          ? "Notifications blocked in browser"
          : "Enable notifications"
      }
      title={
        permission === "granted"
          ? "Click to send a test notification popup"
          : permission === "denied"
          ? "Notifications blocked. Click to see how to enable."
          : "Click to enable notifications"
      }
    >
      {permission === "granted" ? (
        <>
          <span>🔔</span>
          <span className="hidden sm:inline">Test Notify</span>
        </>
      ) : permission === "denied" ? (
        <>
          <span>🔕</span>
          <span className="hidden sm:inline">Blocked</span>
        </>
      ) : (
        <>
          <span className="animate-bounce">🔔</span>
          <span>{loading ? "Enabling..." : "Enable Alerts"}</span>
        </>
      )}
    </button>
  );
}

export default NotificationButton;
