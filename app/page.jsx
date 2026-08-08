"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardView from "@/views/DashboardView";
import TeachersView from "@/views/TeachersView";
import ApplicationsView from "@/views/ApplicationsView";
import BookingsView from "@/views/BookingsView";
import ResourcesView from "@/views/ResourcesView";
import ContactMessagesView from "@/views/ContactMessagesView";
import SubjectsView from "@/views/SubjectsView";
import BlogsView from "@/views/BlogsView";

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
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const ActiveViewComponent = views[activeView] || DashboardView;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
      >
        {/* Header */}
        <Header
          activeView={activeView}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <ActiveViewComponent />
        </main>
      </div>
    </div>
  );
}
