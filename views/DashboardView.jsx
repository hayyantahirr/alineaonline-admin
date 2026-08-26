"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  CalendarDays,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  BookOpen,
  ArrowRight, ChevronRight, CalendarCheck,
  Plus,
  Loader2, Layers,
  Activity,
  ArrowUpRight
} from "lucide-react";

// Helper for formatting timestamps
function formatTimeAgo(rawTimestamp) {
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

export default function DashboardView({ onNavigate }) {
  const [loading, setLoading] = useState(true);

  // Raw Firestore state
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [blogs, setBlogs] = useState([]);

  const [activityFilter, setActivityFilter] = useState("all");

  // ── 1. Real-time Firestore Listeners ──
  useEffect(() => {
    setLoading(true);

    // Bookings
    const unsubBookings = onSnapshot(
      collection(db, "consultation_bookings"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setBookings(list);
      },
      (err) => console.warn("Bookings listener error:", err),
    );

    // Applications
    const unsubApps = onSnapshot(
      collection(db, "career_applications"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setApplications(list);
      },
      (err) => console.warn("Apps listener error:", err),
    );

    // Teachers
    const unsubTeachers = onSnapshot(
      collection(db, "teachers"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setTeachers(list);
      },
      (err) => console.warn("Teachers listener error:", err),
    );

    // Messages
    const unsubMessages = onSnapshot(
      collection(db, "contact_messages"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setMessages(list);
      },
      (err) => console.warn("Messages listener error:", err),
    );

    // Blogs
    const unsubBlogs = onSnapshot(
      collection(db, "blogs"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setBlogs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Blogs listener error:", err);
        setLoading(false);
      },
    );

    return () => {
      unsubBookings();
      unsubApps();
      unsubTeachers();
      unsubMessages();
      unsubBlogs();
    };
  }, []);

  // ── 2. Aggregated Metrics ──
  const metrics = useMemo(() => {
    // Bookings breakdown
    const pendingBookings = bookings.filter(
      (b) => (b.status || "").toLowerCase() === "pending",
    ).length;
    const confirmedBookings = bookings.filter(
      (b) => (b.status || "").toLowerCase() === "confirmed",
    ).length;
    const completedBookings = bookings.filter(
      (b) => (b.status || "").toLowerCase() === "completed",
    ).length;

    // Applications breakdown
    const pendingApps = applications.filter((a) => {
      const s = (a.status || "").toLowerCase();
      return s === "pending" || s === "unread";
    }).length;
    const approvedApps = applications.filter(
      (a) => (a.status || "").toLowerCase() === "approved",
    ).length;

    // Messages breakdown
    const unreadMessages = messages.filter(
      (m) => m.read === false || (m.status || "").toLowerCase() === "unread",
    ).length;

    // Blogs breakdown
    const publishedBlogs = blogs.filter(
      (b) => (b.status || "").toLowerCase() === "published",
    ).length;

    // Subjects covered in teachers
    const subjectSet = new Set();
    teachers.forEach((t) => {
      if (t.subject) subjectSet.add(t.subject.trim());
    });

    return {
      totalBookings: bookings.length,
      pendingBookings,
      confirmedBookings,
      completedBookings,

      totalTeachers: teachers.length,
      subjectsCovered: subjectSet.size,

      totalApplications: applications.length,
      pendingApps,
      approvedApps,

      totalMessages: messages.length,
      unreadMessages,

      totalBlogs: blogs.length,
      publishedBlogs,
    };
  }, [bookings, applications, teachers, messages, blogs]);

  // ── 3. Unified Real-Time Activity Feed ──
  const activityFeed = useMemo(() => {
    const items = [];

    // Map bookings
    bookings.forEach((b) => {
      const student = b.studentName || b.parentName || "Student";
      const subject = b.subject || "Consultation";
      const status = (b.status || "Pending").toLowerCase();
      items.push({
        id: `b_${b.id}`,
        type: "booking",
        categoryLabel: "Session Booking",
        title: `${student} (${subject})`,
        description: `Requested session with ${b.teacherName || "Assigned Tutor"} • ${b.timeSlot || "Flexible"}`,
        rawTimestamp: b.createdAt || b.date,
        timeAgo: formatTimeAgo(b.createdAt || b.date),
        targetView: "bookings",
        isPending: status === "pending",
        statusBadge: b.status || "Pending",
        icon: CalendarDays,
      });
    });

    // Map applications
    applications.forEach((a) => {
      const name = a.fullName || a.name || "Applicant";
      const subject = a.subject || "Academic";
      const status = (a.status || "Pending").toLowerCase();
      items.push({
        id: `a_${a.id}`,
        type: "application",
        categoryLabel: "Career Application",
        title: name,
        description: `Applied for ${subject} Tutor (${a.experience || "Experience N/A"})`,
        rawTimestamp: a.createdAt || a.date,
        timeAgo: formatTimeAgo(a.createdAt || a.date),
        targetView: "applications",
        isPending: status === "pending" || status === "unread",
        statusBadge: a.status || "Pending",
        icon: ClipboardList,
      });
    });

    // Map messages
    messages.forEach((m) => {
      const name = m.name || m.studentName || m.parentName || "Visitor";
      const isUnread =
        m.read === false || (m.status || "").toLowerCase() === "unread";
      items.push({
        id: `m_${m.id}`,
        type: "message",
        categoryLabel: "Contact Inquiry",
        title: name,
        description: m.subject || m.message || "New message received",
        rawTimestamp: m.createdAt || m.date,
        timeAgo: formatTimeAgo(m.createdAt || m.date),
        targetView: "messages",
        isPending: isUnread,
        statusBadge: isUnread ? "Unread" : "Read",
        icon: MessageSquare,
      });
    });

    // Map blogs
    blogs.forEach((bl) => {
      items.push({
        id: `bl_${bl.id}`,
        type: "blog",
        categoryLabel: "Blog Article",
        title: bl.title || "Untitled Post",
        description: `Category: ${bl.category || "Academic"} • ${bl.readTime || "5 min read"}`,
        rawTimestamp: bl.createdAt || bl.publishedAt,
        timeAgo: formatTimeAgo(bl.createdAt || bl.publishedAt),
        targetView: "blogs",
        isPending: false,
        statusBadge: bl.status || "Published",
        icon: BookOpen,
      });
    });

    // Sort newest first
    items.sort((a, b) => {
      const tA = a.rawTimestamp?.seconds || 0;
      const tB = b.rawTimestamp?.seconds || 0;
      return tB - tA;
    });

    return items;
  }, [bookings, applications, messages, blogs]);

  // Filtered activity
  const filteredActivity = useMemo(() => {
    if (activityFilter === "all") return activityFeed.slice(0, 8);
    return activityFeed.filter((item) => item.type === activityFilter).slice(0, 8);
  }, [activityFeed, activityFilter]);

  // ── 4. Subject Demand Statistics ──
  const subjectDistribution = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      const subj = b.subject || "General Consultation";
      counts[subj] = (counts[subj] || 0) + 1;
    });

    const total = bookings.length || 1;
    const sorted = Object.entries(counts)
      .map(([subject, count]) => ({
        subject,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 5);
  }, [bookings]);

  // ── 5. Upcoming / Recent Bookings for Pipeline ──
  const recentBookingsList = useMemo(() => {
    const list = [...bookings];
    list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    return list.slice(0, 5);
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-112.5 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-dark font-(family-name:--font-ibm-plex-mono)">
          Syncing Real-Time Admin Metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
    

      {/* ── 4 Main Live KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Bookings */}
        <div
          onClick={() => onNavigate?.("bookings")}
          className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Consultations
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-(family-name:--font-archivo-black) text-dark">
                {metrics.totalBookings}
              </span>
              <span className="text-xs font-semibold text-gray-400">Total</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {metrics.pendingBookings > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {metrics.pendingBookings} Pending
                </span>
              ) : (
                <span className="text-xs text-gray-400">0 Pending</span>
              )}
              <span className="text-xs text-gray-500 font-medium">
                {metrics.confirmedBookings} Confirmed
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* KPI 2: Teachers */}
        <div
          onClick={() => onNavigate?.("teachers")}
          className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Active Faculty
              </span>
              <div className="p-2.5 rounded-xl bg-primary/20 text-dark group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-(family-name:--font-archivo-black) text-dark">
                {metrics.totalTeachers}
              </span>
              <span className="text-xs font-semibold text-gray-400">Specialists</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">
              {metrics.subjectsCovered} Subjects Offered
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-dark group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* KPI 3: Teacher Applications */}
        <div
          onClick={() => onNavigate?.("applications")}
          className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Applications
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-(family-name:--font-archivo-black) text-dark">
                {metrics.totalApplications}
              </span>
              <span className="text-xs font-semibold text-gray-400">Applicants</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metrics.pendingApps > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {metrics.pendingApps} Pending Review
                </span>
              ) : (
                <span className="text-xs text-gray-400">All Reviewed</span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* KPI 4: Inquiries & Blogs */}
        <div
          onClick={() => onNavigate?.("messages")}
          className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Contact Inquiries
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-(family-name:--font-archivo-black) text-dark">
                {metrics.totalMessages}
              </span>
              <span className="text-xs font-semibold text-gray-400">Inquiries</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metrics.unreadMessages > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {metrics.unreadMessages} Unread
                </span>
              ) : (
                <span className="text-xs text-gray-400">0 Unread</span>
              )}
              <span className="text-xs text-gray-500 font-medium">
                {metrics.publishedBlogs} Blogs
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* ── Main Dual Section: Real-Time Activity Feed + Bookings Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Real-Time Live Activity Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-dark text-primary">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark">
                    Live Operational Stream
                  </h2>
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    Real-time timeline across all departments
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl text-xs overflow-x-auto">
                {["all", "booking", "application", "message"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className={`
                      px-3 py-1.5 rounded-lg font-medium transition-all capitalize cursor-pointer shrink-0
                      ${
                        activityFilter === f
                          ? "bg-dark text-white shadow-xs"
                          : "text-gray-500 hover:text-dark hover:bg-gray-100"
                      }
                    `}
                  >
                    {f === "all" ? "All Activity" : `${f}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream List */}
            <div className="divide-y divide-gray-50 pt-2">
              {filteredActivity.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">
                    No activity recorded in this stream yet.
                  </p>
                </div>
              ) : (
                filteredActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onNavigate?.(item.targetView)}
                      className={`
                        p-4 -mx-2 rounded-2xl flex items-start gap-3.5 hover:bg-gray-50/80 transition-all cursor-pointer group relative
                        ${item.isPending ? "bg-primary/5" : ""}
                      `}
                    >
                      <div
                        className={`
                          p-2.5 rounded-xl shrink-0 mt-0.5
                          ${
                            item.type === "booking"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.type === "application"
                              ? "bg-amber-50 text-amber-800"
                              : item.type === "message"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-dark truncate">
                              {item.title}
                            </span>
                            {item.isPending && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Action Required
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) shrink-0">
                            {item.timeAgo}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                            {item.categoryLabel}
                          </span>
                          <span className="text-xs font-bold text-primary-hover inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Open View <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Bookings Pipeline & Subject Demand */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Consultation Requests */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-dark">
                  Latest Bookings Pipeline
                </h3>
              </div>
              <button
                onClick={() => onNavigate?.("bookings")}
                className="text-xs font-bold text-primary-hover hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentBookingsList.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  No consultation requests yet.
                </p>
              ) : (
                recentBookingsList.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onNavigate?.("bookings")}
                    className="p-3.5 rounded-2xl bg-canvas border border-gray-100 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-xs font-bold text-dark truncate">
                          {b.studentName || "Student"}
                        </p>
                        {b.status?.toLowerCase() === "pending" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <span
                        className={`
                          text-[10px] font-bold uppercase px-2 py-0.5 rounded-md
                          ${
                            b.status?.toLowerCase() === "confirmed"
                              ? "bg-info-bg text-info"
                              : b.status?.toLowerCase() === "completed"
                              ? "bg-success-bg text-success"
                              : "bg-warning-bg text-warning"
                          }
                        `}
                      >
                        {b.status || "Pending"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium">
                      {b.subject || "Economics"} • {b.level || "A-Level"} ({b.examBoard || "CAIE"})
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50 text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      <span className="truncate">
                        Tutor: {b.teacherName || "Assigned"}
                      </span>
                      <span>{b.timeSlot || "Flexible"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Demand Visualizer */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-dark" />
                <h3 className="text-base font-bold text-dark">
                  Subject Demand Breakdown
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                Based on Bookings
              </span>
            </div>

            {subjectDistribution.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Subject demand data will populate as bookings arrive.
              </p>
            ) : (
              <div className="space-y-4">
                {subjectDistribution.map((item, idx) => (
                  <div key={item.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-dark">
                        {item.subject}
                      </span>
                      <span className="font-bold text-gray-500 font-(family-name:--font-ibm-plex-mono)">
                        {item.count} sessions ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? "bg-primary"
                            : idx === 1
                            ? "bg-dark"
                            : idx === 2
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.max(item.percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
