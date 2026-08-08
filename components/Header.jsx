"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useState } from "react";

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

export default function Header({ activeView, onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");

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
            <h1 className="text-xl font-[family-name:var(--font-archivo-black)] text-dark">
              {viewTitles[activeView] || "Dashboard"}
            </h1>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)] hidden sm:block">
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
          {/* Notification Bell */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <Bell className="w-5 h-5 text-dark" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

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
