import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const typeStyles = {
  success: {
    bg: "bg-green-50 border-green-400",
    icon: <CheckCircle className="text-green-500 w-5 h-5" />,
    text: "text-green-800",
  },
  alert: {
    bg: "bg-yellow-50 border-yellow-400",
    icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
    text: "text-yellow-800",
  },
  error: {
    bg: "bg-red-50 border-red-400",
    icon: <XCircle className="text-red-500 w-5 h-5" />,
    text: "text-red-800",
  },
  info: {
    bg: "bg-blue-50 border-blue-400",
    icon: <Info className="text-blue-500 w-5 h-5" />,
    text: "text-blue-800",
  },
};

export default function ErrorBar({ type = "info", message, onClose }) {
  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`flex items-center w-full px-4 py-2 rounded-md shadow-md border ${style.bg}`}
    >
      {/* Left Icon */}
      <div className="mr-2">{style.icon}</div>

      {/* Message */}
      <span className={`flex-1 text-sm font-medium ${style.text}`}>
        {message}
      </span>

      {/* Close Button (optional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
