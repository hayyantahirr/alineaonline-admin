"use client";

import {
  Users,
  GraduationCap,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  DollarSign,
  UserPlus,
  CalendarCheck,
  FileText,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { dashboardStats, recentActivity, bookings } from "@/data/mockData";

const activityIcons = {
  booking: CalendarCheck,
  application: ClipboardList,
  resource: FileText,
  message: MessageSquare,
  blog: BookOpen,
  teacher: GraduationCap,
};

export default function DashboardView() {
  const stats = [
    {
      label: "Total Students",
      value: dashboardStats.totalStudents.toLocaleString(),
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "bg-primary/10 text-primary",
      iconColor: "text-primary",
    },
    {
      label: "Active Teachers",
      value: dashboardStats.activeTeachers,
      icon: GraduationCap,
      trend: "+3",
      trendUp: true,
      color: "bg-deep-blue/10 text-deep-blue",
      iconColor: "text-deep-blue",
    },
    {
      label: "Pending Applications",
      value: dashboardStats.pendingApplications,
      icon: ClipboardList,
      trend: "-2",
      trendUp: false,
      color: "bg-warning/10 text-warning",
      iconColor: "text-warning",
    },
    {
      label: "Total Bookings",
      value: dashboardStats.totalBookings.toLocaleString(),
      icon: CalendarDays,
      trend: "+8%",
      trendUp: true,
      color: "bg-success/10 text-success",
      iconColor: "text-success",
    },
  ];

  const secondaryStats = [
    {
      label: "Revenue This Month",
      value: `$${dashboardStats.revenueThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      label: "New Signups",
      value: dashboardStats.newSignups,
      icon: UserPlus,
      color: "text-deep-blue",
    },
  ];

  const upcomingBookings = bookings.filter((b) => b.status === "Upcoming").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-(family-name:--font-archivo-black) text-dark mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trendUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-danger" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        stat.trendUp ? "text-success" : "text-danger"
                      }`}
                    >
                      {stat.trend}
                    </span>
                    <span className="text-xs text-gray-400">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secondaryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-canvas ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom grid: Activity + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <Card
          className="lg:col-span-3"
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-base font-(family-name:--font-archivo-black) text-dark">
                Recent Activity
              </h3>
              <span className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                Last 7 days
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            {recentActivity.slice(0, 6).map((activity) => {
              const Icon = activityIcons[activity.type] || CalendarCheck;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="p-2 rounded-lg bg-canvas shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-deep-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark leading-snug">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-(family-name:--font-ibm-plex-mono)">
                      {activity.time}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Sessions */}
        <Card
          className="lg:col-span-2"
          header={
            <h3 className="text-base font-(family-name:--font-archivo-black) text-dark">
              Upcoming Sessions
            </h3>
          }
        >
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 rounded-xl bg-canvas border border-gray-100 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-dark">
                    {booking.subject}
                  </p>
                  <Badge variant="info">{booking.status}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {booking.studentName} → {booking.teacherName}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-(family-name:--font-ibm-plex-mono)">
                  {booking.date} · {booking.time} · {booking.duration}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
