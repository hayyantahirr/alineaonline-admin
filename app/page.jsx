"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NotificationToast from "@/components/NotificationToast";
import DashboardView from "@/views/DashboardView";
import TeachersView from "@/views/TeachersView";
import ApplicationsView from "@/views/ApplicationsView";
import BookingsView from "@/views/BookingsView";
import ResourcesView from "@/views/ResourcesView";
import ContactMessagesView from "@/views/ContactMessagesView";
import SubjectsView from "@/views/SubjectsView";
import BlogsView from "@/views/BlogsView";
import { Loader2 } from "lucide-react";

const views = {
  dashboard: DashboardView,
  teachers: TeachersView,
  applications: ApplicationsView,
  bookings: BookingsView,
  resources: ResourcesView,
  messages: ContactMessagesView,
  subjects: SubjectsView,
  blogs: BlogsView,
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading state — checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-dark text-xl font-bold font-(family-name:--font-archivo-black)">
              A
            </span>
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-gray-400 font-(family-name:--font-ibm-plex-mono)">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated — show dashboard
  const ActiveViewComponent = views[activeView] || DashboardView;

  return (
    <div className="min-h-screen bg-canvas relative">
      {/* Floating Real-time Notification Alert Toast */}
      <NotificationToast onNavigate={setActiveView} />

      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`
          transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
      >
        <Header
          activeView={activeView}
          onMenuToggle={() => setSidebarOpen(true)}
          onNavigate={setActiveView}
        />

        <main className="p-4 lg:p-8">
          <ActiveViewComponent onNavigate={setActiveView} />
        </main>
      </div>
    </div>
  );
}
