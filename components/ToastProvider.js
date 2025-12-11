"use client";

import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  };

  const getIcon = (type) => {
    const iconProps = { className: "w-5 h-5 mt-0.5 flex-shrink-0" };
    switch (type) {
      case "success":
        return <CheckCircle {...iconProps} />;
      case "error":
        return <XCircle {...iconProps} />;
      case "warning":
        return <AlertTriangle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-600";
      case "danger":
        return "bg-red-600";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-purple-600";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 space-y-3 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start gap-3 text-white px-4 py-3 rounded-lg shadow-md ${getBgColor(
                toast.type
              )}`}
            >
              {getIcon(toast.type)}
              <div className="flex flex-col">
                {toast.message.split("\n").map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
