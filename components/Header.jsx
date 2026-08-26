"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import {
  Menu,
  Bell,
  Search,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Laptop,
  Trash2,
} from "lucide-react";

const viewTitles = {
  dashboard: "Dashboard",
  teachers: "Teachers",
  applications: "Applications",
  bookings: "Bookings",
  resources: "Resources",
  messages: "Messages",
  subjects: "Subjects",
  blogs: "Blogs",
};

const categoryIcons = {
  application: ClipboardList,
  booking: CalendarDays,
  message: MessageSquare,
};

function formatRelativeTime(rawTimestamp) {
  if (!rawTimestamp) return "Recent";
  try {
    let dateObj;
    if (rawTimestamp?.toDate && typeof rawTimestamp.toDate === "function") {
      dateObj = rawTimestamp.toDate();
    } else if (rawTimestamp?.seconds) {
      dateObj = new Date(rawTimestamp.seconds * 1000);
    } else if (rawTimestamp instanceof Date) {
      dateObj = rawTimestamp;
    } else {
      dateObj = new Date(rawTimestamp);
    }

    const diffSec = Math.floor((Date.now() - dateObj.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Recent";
  }
}

export default function Header({ activeView, onMenuToggle, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    unreadByCategory,
    soundEnabled,
    toggleSound,
    desktopPermission,
    requestDesktopPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearCategoryNotifications,
    clearAllNotifications,
    readIds,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "all") return true;
    return n.type === filterType;
  });

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    if (item.targetView && onNavigate) {
      onNavigate(item.targetView);
    }
    setIsDropdownOpen(false);
  };

  const handleClearCurrent = (e) => {
    e.stopPropagation();
    if (filterType === "all") {
      clearAllNotifications();
    } else {
      clearCategoryNotifications(filterType);
    }
  };

  const handleSingleClear = (e, id) => {
    e.stopPropagation();
    clearNotification(id);
  };

  const categoryLabelMap = {
    all: "All",
    booking: "Bookings",
    application: "Applications",
    message: "Messages",
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left: Menu toggle + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-dark" />
          </button>

          <div>
            <h1 className="text-xl font-(family-name:--font-archivo-black) text-dark">
              {viewTitles[activeView] || "Dashboard"}
            </h1>
            <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) hidden sm:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 rounded-xl
                bg-canvas border border-gray-200
                text-sm text-dark placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer
                ${
                  isDropdownOpen
                    ? "bg-primary text-dark shadow-sm"
                    : "text-dark hover:bg-gray-100"
                }
              `}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-90 sm:w-105 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
                {/* Dropdown Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-dark">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-dark text-xs font-bold font-(family-name:--font-ibm-plex-mono)">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleSound}
                      title={
                        soundEnabled ? "Mute alert chime" : "Unmute alert chime"
                      }
                      className="p-1.5 rounded-lg text-gray-500 hover:text-dark hover:bg-gray-200/60 transition-colors cursor-pointer"
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-dark" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-gray-600 hover:text-dark hover:underline cursor-pointer flex items-center gap-1 px-1.5 py-1 rounded-md"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}

                    {filteredNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCurrent}
                        className="text-xs font-semibold text-danger hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title={`Clear ${categoryLabelMap[filterType]} notifications`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {filterType === "all"
                            ? "Clear All"
                            : `Clear ${categoryLabelMap[filterType]}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Permission Prompt Banner (if not granted yet) */}
                {desktopPermission === "default" && (
                  <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-amber-900 font-medium min-w-0">
                      <Laptop className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="truncate">
                        Enable desktop push for real-time tab alerts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestDesktopPermission}
                      className="px-2.5 py-1 rounded-lg bg-dark text-white text-[11px] font-bold hover:bg-dark-hover transition-colors shrink-0 cursor-pointer"
                    >
                      Enable
                    </button>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-white overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType("all")}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer
                      ${
                        filterType === "all"
                          ? "bg-dark text-white shadow-xs"
                          : "text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("booking")}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1
                      ${
                        filterType === "booking"
                          ? "bg-dark text-white shadow-xs"
                          : "text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    <CalendarDays className="w-3 h-3" />
                    Bookings
                    {unreadByCategory.bookings > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("application")}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1
                      ${
                        filterType === "application"
                          ? "bg-dark text-white shadow-xs"
                          : "text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    <ClipboardList className="w-3 h-3" />
                    Applications
                    {unreadByCategory.applications > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("message")}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1
                      ${
                        filterType === "message"
                          ? "bg-dark text-white shadow-xs"
                          : "text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Messages
                    {unreadByCategory.messages > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-95 overflow-y-auto divide-y divide-gray-50">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                      <p className="text-xs font-medium text-gray-500">
                        No notifications in this section.
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((item) => {
                      const Icon =
                        categoryIcons[item.type] || Bell;
                      const isItemUnread =
                        !readIds.has(item.id) && item.isItemUnread;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`
                            p-3.5 flex items-start gap-3 hover:bg-gray-50/80 transition-colors cursor-pointer relative group
                            ${isItemUnread ? "bg-primary/5" : "bg-white"}
                          `}
                        >
                          <div
                            className={`
                              p-2 rounded-xl shrink-0 mt-0.5
                              ${
                                item.type === "booking"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.type === "application"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-blue-50 text-blue-700"
                              }
                            `}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-dark truncate">
                                {item.subtitle}
                              </p>
                              <span className="text-[10px] text-gray-400 font-(family-name:--font-ibm-plex-mono) shrink-0">
                                {formatRelativeTime(item.rawTimestamp)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>

                            <div className="flex items-center justify-between mt-1.5">
                              <span
                                className={`
                                  text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
                                  ${
                                    item.type === "booking"
                                      ? "bg-emerald-100/60 text-emerald-800"
                                      : item.type === "application"
                                      ? "bg-amber-100/60 text-amber-900"
                                      : "bg-blue-100/60 text-blue-800"
                                  }
                                `}
                              >
                                {item.type}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-primary-hover font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  View details <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleSingleClear(e, item.id)}
                                  title="Dismiss notification"
                                  className="p-1 rounded-md text-gray-400 hover:text-danger hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Unread indicator dot */}
                          {isItemUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between px-4">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    Real-time updates active
                  </p>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-[11px] text-gray-400 hover:text-danger font-medium transition-colors cursor-pointer"
                    >
                      Clear all history
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 bg-deep-blue rounded-xl flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">AD</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-dark leading-tight">
                Admin
              </p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
