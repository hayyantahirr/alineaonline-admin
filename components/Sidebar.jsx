"use client";

import { useAuth } from "@/context/AuthContext";

import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  CalendarDays,
  FolderOpen,
  MessageSquare,
  BookOpen,
  FileEdit,
  Settings,
  LogOut,
  X,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "teachers", label: "Teachers", icon: GraduationCap },
  { key: "applications", label: "Applications", icon: ClipboardList },
  { key: "bookings", label: "Bookings", icon: CalendarDays },
  { key: "resources", label: "Resources", icon: FolderOpen },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "blogs", label: "Blogs", icon: FileEdit },
];

export default function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-dark text-white
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          ${isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-dark font-bold text-sm">A</span>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-sm font-(family-name:--font-archivo-black) tracking-wide">
                  ALINEA
                </h1>
                <p className="text-[10px] text-gray-400 font-(family-name:--font-ibm-plex-mono) -mt-0.5">
                  ADMIN PANEL
                </p>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onNavigate(item.key);
                    onClose?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 rounded-xl
                    transition-all duration-200 cursor-pointer
                    ${collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5"}
                    ${
                      isActive
                        ? "bg-deep-blue text-primary border-l-[3px] border-primary shadow-lg shadow-deep-blue/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent"
                    }
                  `}
                >
                  <Icon
                    className={`shrink-0 ${
                      isActive ? "w-5 h-5" : "w-5 h-5"
                    }`}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1 shrink-0">
          <button
            title={collapsed ? "Settings" : undefined}
            className={`
              w-full flex items-center gap-3 rounded-xl
              text-gray-400 hover:text-white hover:bg-white/5
              transition-all duration-200 cursor-pointer
              ${collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5"}
            `}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </button>
          <button
            title={collapsed ? "Logout" : undefined}
            onClick={logout}
            className={`
              w-full flex items-center gap-3 rounded-xl
              text-gray-400 hover:text-danger hover:bg-danger/10
              transition-all duration-200 cursor-pointer
              ${collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5"}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
