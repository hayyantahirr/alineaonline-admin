"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Eye, Mail,
  Phone,
  MessageCircle,
  User,
  GraduationCap,
  BookOpen,
  Sparkles,
  Loader2,
  Calendar
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { Select, SearchInput } from "@/components/ui/Input";

const statusVariant = {
  Pending: "warning",
  Confirmed: "info",
  Completed: "success",
  Cancelled: "danger",
};

const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return "Pending";
  const s = rawStatus.toString().toLowerCase().trim();
  if (s === "confirmed") return "Confirmed";
  if (s === "completed") return "Completed";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "Cancelled";
  return "Pending";
};

export default function BookingsView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  
  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const helperFormatDate = (rawDate, createdAt) => {
    try {
      if (createdAt?.toDate && typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (createdAt?.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Error formatting date", e);
    }
    return rawDate || "Recent";
  };

  // Real-time listener for consultation_bookings collection in Firestore
  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, "consultation_bookings");

    const unsubscribe = onSnapshot(
      bookingsRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const status = normalizeStatus(data.status);
          const formattedDate = helperFormatDate(data.date, data.createdAt);

          return {
            id: docSnap.id,
            ...data,
            status,
            studentName: data.studentName || "N/A",
            parentName: data.parentName || "N/A",
            email: data.email || "",
            phone: data.phone || "",
            subject: data.subject || "General Consultation",
            level: data.level || "N/A",
            examBoard: data.examBoard || "N/A",
            teacherName: data.teacherName || "Unassigned Specialist",
            teacherRole: data.teacherRole || "Academic Specialist",
            sessionFormat: data.sessionFormat || "1:1 Intensive Mentorship",
            timeSlot: data.timeSlot || "Flexible Timing",
            formattedDate,
          };
        });

        // Sort by createdAt timestamp (newest first)
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setBookings(list);
        setLoading(false);

        // Keep selected booking in sync if modal is open
        if (selectedBooking) {
          const updated = list.find((b) => b.id === selectedBooking.id);
          if (updated) {
            setSelectedBooking(updated);
          }
        }
      },
      (error) => {
        console.error("Firestore real-time listener error (consultation_bookings):", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedBooking?.id]);

  // Unique subjects list for filter dropdown
  const allSubjects = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.subject).filter(Boolean)));
  }, [bookings]);

  // Filtered and searched list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      const matchSubject = subjectFilter === "All" || b.subject === subjectFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.studentName.toLowerCase().includes(q) ||
        b.parentName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.teacherName.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.examBoard.toLowerCase().includes(q) ||
        b.level.toLowerCase().includes(q);

      return matchStatus && matchSubject && matchSearch;
    });
  }, [bookings, statusFilter, subjectFilter, searchQuery]);

  // Status counts for summary cards
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "Pending").length,
      confirmed: bookings.filter((b) => b.status === "Confirmed").length,
      completed: bookings.filter((b) => b.status === "Completed").length,
      cancelled: bookings.filter((b) => b.status === "Cancelled").length,
    };
  }, [bookings]);

  // Update Status in Firestore
  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, "consultation_bookings", id);
      await updateDoc(docRef, {
        status: newStatus.toLowerCase(),
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Booking in Firestore
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    setActionLoading(true);
    try {
      const docRef = doc(db, "consultation_bookings", bookingToDelete.id);
      await deleteDoc(docRef);
      setShowDeleteModal(false);
      setBookingToDelete(null);
      if (selectedBooking?.id === bookingToDelete.id) {
        setShowDetailModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const promptDelete = (e, booking) => {
    e?.stopPropagation?.();
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const cleanPhone = (phone) => phone ? phone.replace(/[^0-9+]/g, "") : "";

  // Table column configuration
  const columns = [
    {
      header: "Student Info",
      render: (row) => (
        <div className="min-w-40">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-dark">{row.studentName}</p>
            {row.status === "Pending" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                NEW
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-gray-400">P:</span> {row.parentName}
          </p>
          {row.email && (
            <p className="text-[11px] text-gray-400 truncate max-w-45 mt-0.5">{row.email}</p>
          )}
        </div>
      ),
    },
    {
      header: "Subject Details",
      render: (row) => (
        <div className="min-w-37.5">
          <span className="font-medium text-dark block">{row.subject}</span>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-semibold tracking-wide font-(family-name:--font-ibm-plex-mono) bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {row.level}
            </span>
            {row.examBoard !== "N/A" && (
              <span className="text-[10px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                {row.examBoard}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Assigned Teacher",
      render: (row) => (
        <div className="min-w-35">
          <p className="text-sm font-medium text-dark">{row.teacherName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{row.teacherRole}</p>
        </div>
      ),
    },
    {
      header: "Session Details",
      render: (row) => (
        <div className="min-w-52.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-dark text-white text-[11px] font-medium font-(family-name:--font-ibm-plex-mono) mb-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-300" />
            {row.timeSlot}
          </div>
          <p className="text-[11px] font-medium text-gray-600">{row.sessionFormat}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 font-(family-name:--font-ibm-plex-mono)">
            Booked: {row.formattedDate}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => {
        const bgColors = {
          Pending: "bg-warning-bg text-warning-hover border-warning/20 hover:border-warning/50",
          Confirmed: "bg-info-bg text-info-hover border-info/20 hover:border-info/50",
          Completed: "bg-success-bg text-success-hover border-success/20 hover:border-success/50",
          Cancelled: "bg-danger-bg text-danger-hover border-danger/20 hover:border-danger/50",
        };
        
        return (
          <div className="min-w-30" onClick={(e) => e.stopPropagation()}>
            <select
              value={row.status}
              disabled={actionLoading}
              onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
              className={`
                text-xs font-bold py-1.5 px-3 rounded-xl border appearance-none cursor-pointer
                focus:ring-2 focus:ring-primary focus:outline-none w-full transition-colors
                ${bgColors[row.status] || bgColors.Pending}
              `}
              style={{
                 backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                 backgroundRepeat: "no-repeat",
                 backgroundPosition: "right 0.75rem top 50%",
                 backgroundSize: "0.65rem auto",
                 paddingRight: "2rem"
              }}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        );
      },
    },
    {
      header: "Actions",
      render: (row) => (
        <div
          className="flex items-center gap-1.5 min-w-27.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => openDetails(row)}
            title="View details"
            className="px-2!"
          >
            <span className="sr-only">View</span>
          </Button>

          {row.phone && (
            <a
              href={`https://wa.me/${cleanPhone(row.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Open WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={(e) => promptDelete(e, row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer ml-auto"
            title="Delete booking"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-(family-name:--font-archivo-black) text-dark">
            Consultation Bookings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your student consultation requests in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-700 font-(family-name:--font-ibm-plex-mono)">
            LIVE SYNC
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100">
              <CalendarDays className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {stats.total}
              </p>
              <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) tracking-wider">
                TOTAL
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-bg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {stats.pending}
              </p>
              <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) tracking-wider">
                PENDING
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info-bg">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {stats.confirmed}
              </p>
              <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) tracking-wider">
                CONFIRMED
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-bg">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {stats.completed}
              </p>
              <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) tracking-wider">
                COMPLETED
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-bg">
              <XCircle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {stats.cancelled}
              </p>
              <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono) tracking-wider">
                CANCELLED
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Search Bookings
            </label>
            <SearchInput
              placeholder="Search by student, parent, email, teacher, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-end gap-3">
            <div className="w-full sm:w-40">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Pending", label: "Pending" },
                  { value: "Confirmed", label: "Confirmed" },
                  { value: "Completed", label: "Completed" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                label="Subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                options={[
                  { value: "All", label: "All Subjects" },
                  ...allSubjects.map((s) => ({ value: s, label: s })),
                ]}
              />
            </div>

            {(statusFilter !== "All" || subjectFilter !== "All" || searchQuery) && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setStatusFilter("All");
                  setSubjectFilter("All");
                  setSearchQuery("");
                }}
                className="text-danger hover:bg-danger-bg text-xs shrink-0"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bookings Table View */}
      <Card noPadding>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-500 font-(family-name:--font-ibm-plex-mono)">
              Fetching real-time consultation bookings...
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredBookings}
            onRowClick={(row) => openDetails(row)}
          />
        )}
      </Card>

      {/* Booking Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Consultation Booking Details"
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => promptDelete(null, selectedBooking)}
              disabled={actionLoading}
            >
              Delete Booking
            </Button>

            <div className="flex items-center gap-2">
              {selectedBooking?.phone && (
                <>
                  <Button
                    variant="outline"
                    icon={Phone}
                    onClick={() =>
                      window.open(`tel:${cleanPhone(selectedBooking.phone)}`, "_self")
                    }
                  >
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    icon={MessageCircle}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${cleanPhone(selectedBooking.phone)}`,
                        "_blank"
                      )
                    }
                  >
                    WhatsApp
                  </Button>
                </>
              )}
              {selectedBooking?.email && (
                <Button
                  icon={Mail}
                  onClick={() =>
                    window.open(`mailto:${selectedBooking.email}`, "_blank")
                  }
                >
                  Email
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Header / Main Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-canvas border border-gray-100">
              <div>
                <span className="text-xs font-(family-name:--font-ibm-plex-mono) text-gray-400 uppercase tracking-wider">
                  STUDENT & PARENT
                </span>
                <h3 className="text-lg font-bold text-dark mt-0.5">
                  {selectedBooking.studentName}
                </h3>
                <p className="text-xs text-gray-600">
                  Parent / Guardian: <span className="font-semibold text-dark">{selectedBooking.parentName}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[selectedBooking.status]}>
                  {selectedBooking.status}
                </Badge>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-(family-name:--font-ibm-plex-mono)">
                    Change Status
                  </span>
                  <select
                    value={selectedBooking.status}
                    disabled={actionLoading}
                    onChange={(e) =>
                      handleUpdateStatus(selectedBooking.id, e.target.value)
                    }
                    className="text-xs font-semibold py-1 px-2.5 bg-white border border-gray-200 rounded-lg text-dark focus:ring-2 focus:ring-primary cursor-pointer mt-0.5"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) text-gray-400 mb-3 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" /> Academic Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    SUBJECT
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.subject}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    CURRICULUM LEVEL
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.level}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    EXAM BOARD
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.examBoard}
                  </p>
                </div>

              </div>
            </div>

            {/* Teacher & Session Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) text-gray-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-deep-blue" /> Session & Mentor
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    ASSIGNED TEACHER
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.teacherName}
                  </p>
                  <p className="text-xs text-gray-400">{selectedBooking.teacherRole}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    SESSION FORMAT
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.sessionFormat}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    REQUESTED TIME SLOT
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {selectedBooking.timeSlot}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) text-gray-400 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" /> Contact Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    EMAIL ADDRESS
                  </p>
                  <a
                    href={`mailto:${selectedBooking.email}`}
                    className="text-sm font-medium text-deep-blue hover:underline mt-1 block truncate"
                  >
                    {selectedBooking.email || "No email provided"}
                  </a>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    WHATSAPP / PHONE
                  </p>
                  <a
                    href={`tel:${cleanPhone(selectedBooking.phone)}`}
                    className="text-sm font-medium text-emerald-600 hover:underline mt-1 block"
                  >
                    {selectedBooking.phone || "No phone provided"}
                  </a>
                </div>
              </div>
            </div>



            {/* Meta info */}
            <div className="flex items-center justify-between text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Booked: {selectedBooking.formattedDate}
              </span>
              <span>ID: {selectedBooking.id}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Consultation Booking"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleConfirmDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-danger-bg rounded-xl flex items-center gap-3 text-danger">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">
              This action cannot be undone.
            </p>
          </div>
          {bookingToDelete && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700">
              <p>
                <span className="text-gray-400">Student:</span>{" "}
                <span className="font-semibold text-dark">{bookingToDelete.studentName}</span>
              </p>
              <p className="mt-1">
                <span className="text-gray-400">Subject:</span>{" "}
                <span className="font-semibold text-dark">{bookingToDelete.subject}</span> ({bookingToDelete.level})
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
