"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import {
  CalendarDays,
  ClipboardList,
  MessageSquare,
  X,
  ArrowRight,
  Volume2,
  VolumeX,
  Bell,
} from "lucide-react";

const typeConfig = {
  application: {
    icon: ClipboardList,
    label: "Career Application",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    accentColor: "border-l-primary",
  },
  booking: {
    icon: CalendarDays,
    label: "Consultation Booking",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    accentColor: "border-l-emerald-500",
  },
  message: {
    icon: MessageSquare,
    label: "Contact Message",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    accentColor: "border-l-blue-500",
  },
};

export default function NotificationToast({ onNavigate }) {
  const { activeToast, dismissToast, soundEnabled, toggleSound, markAsRead } =
    useNotifications();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!activeToast) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 7000; // 7 seconds
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    const dismissTimeout = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(dismissTimeout);
    };
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const config = typeConfig[activeToast.type] || {
    icon: Bell,
    label: "Notification",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
    accentColor: "border-l-primary",
  };
  const Icon = config.icon;

  const handleAction = () => {
    markAsRead(activeToast.id);
    if (activeToast.targetView && onNavigate) {
      onNavigate(activeToast.targetView);
    }
    dismissToast();
  };

  return (
    <div className="fixed top-5 right-5 z-100 max-w-sm sm:max-w-md w-full animate-slide-in">
      <div
        className={`
          bg-white rounded-2xl shadow-2xl border border-gray-200/80
          border-l-4 ${config.accentColor}
          overflow-hidden backdrop-blur-xl relative transition-all duration-300
        `}
      >
        <div className="p-4 sm:p-4.5">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {config.label}
              </span>
              <span className="text-[10px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                Just now
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? "Mute alert chime" : "Unmute alert chime"}
                className="p-1 rounded-lg text-gray-400 hover:text-dark hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
              <button
                type="button"
                onClick={dismissToast}
                className="p-1 rounded-lg text-gray-400 hover:text-dark hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body content */}
          <div className="flex items-start gap-3 mt-1">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-dark shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-dark" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-dark truncate">
                {activeToast.subtitle || activeToast.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                {activeToast.description}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissToast}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleAction}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-dark bg-primary hover:bg-primary-hover px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
