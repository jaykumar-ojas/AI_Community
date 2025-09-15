import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const hideNotification = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, visible: false } : n))
    );

    // Remove completely after animation
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 500);
  };

  const showNotification = useCallback((message, type = "warning") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, visible: true }]);

    // Auto hide after 5s
    setTimeout(() => hideNotification(id), 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Notifications container (fixed global) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-80">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between p-4 rounded-md shadow-md border-l-4 transition-all duration-500 ease-in-out
              ${
                n.type === "success"
                  ? "bg-green-50 border-green-500 text-green-700"
                  : n.type === "error"
                  ? "bg-red-50 border-red-500 text-red-700"
                  : n.type === "info"
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-yellow-50 border-yellow-500 text-yellow-700"
              }
              ${n.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}
            `}
          >
            <div className="flex items-center">
              {/* Icon */}
              {n.type === "success" && (
                <span className="mr-2">✅</span>
              )}
              {n.type === "error" && (
                <span className="mr-2">❌</span>
              )}
              {n.type === "info" && (
                <span className="mr-2">ℹ️</span>
              )}
              {n.type === "warning" && (
                <span className="mr-2">⚠️</span>
              )}
              <span>{n.message}</span>
            </div>

            {/* Close button */}
            <button
              onClick={() => hideNotification(n.id)}
              className="ml-3 text-gray-500 hover:text-gray-900"
            >
              ✖
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
