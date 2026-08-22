"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Briefcase,
  Clock,
  FileText,
  Download,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Search,
  Check,
  Upload,
  Loader2,
  X,
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { formatSubjectTitle } from "@/lib/utils";

// ─── Preset Options for Teacher Setup ────────────────────────────
const LEVELS = ["IGCSE", "O-Level", "AS-Level", "A-Level"];
const BOARDS = ["CAIE", "Edexcel", "AQA", "OCR", "WJEC", "IB"];
const EXPERIENCE_OPTIONS = [
  "1-2 Years",
  "3-5 Years",
  "6+ Years",
  "10+ Years",
  "15+ Years",
];
const QUALIFICATIONS = [
  "BSc",
  "BA",
  "MSc",
  "MA",
  "MBA",
  "PhD",
  "PGCE",
  "Examiner Trained",
  "CIE Trained",
  "ACCA",
  "CFA",
];

// Role / Tag templates — {subject} gets replaced
const ROLE_TEMPLATES = [
  "Senior {subject} Specialist",
  "{subject} Specialist",
  "Head of {subject}",
  "Lead {subject} Tutor",
  "{subject} Instructor",
  "Senior {subject} Tutor",
  "{subject} Faculty",
];

function getRoleOptions(subject) {
  const subj = subject ? formatSubjectTitle(subject) : "Subject";
  return ROLE_TEMPLATES.map((t) => t.replace("{subject}", subj));
}

// ─── ChipSelect Component ───────────────────────────────────────
function ChipSelect({ label, options, selected = [], onChange }) {
  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-dark">{label}</label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium
                border transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? "bg-primary text-dark border-primary shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-dark"
                }
              `}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

// ─── Default Teacher Form State ─────────────────────────────────
const initialTeacherForm = {
  name: "",
  role: "",
  image: "",
  subject: "",
  levels: [],
  boards: [],
  experience: "",
  qualifications: [],
  availabilityStatus: "available",
  bio: "",
  highlights: [""],
};

export default function ApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("review"); // 'review' | 'approve'

  // Ref to track selectedApp id without causing re-subscriptions in useEffect
  const selectedAppIdRef = useRef(null);
  selectedAppIdRef.current = selectedApp?.id || null;

  // Teacher Approval Form state
  const [teacherForm, setTeacherForm] = useState({ ...initialTeacherForm });
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  // Cloudinary image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const helperFormatDate = (rawDate, createdAt) => {
    try {
      if (createdAt?.toDate && typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      if (createdAt?.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (e) {
      console.error("Error formatting date", e);
    }
    return rawDate || "Recent";
  };

  // ── Firestore Realtime Listeners ──
  useEffect(() => {
    const appsRef = collection(db, "career_applications");
    const unsubApps = onSnapshot(
      appsRef,
      (snapshot) => {
        const apps = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = (data.status || "unread").toLowerCase();

          let status = "Pending";
          if (rawStatus === "approved") {
            status = "Approved";
          } else if (rawStatus === "rejected") {
            status = "Rejected";
          } else {
            status = "Pending";
          }

          const formattedDate = helperFormatDate(
            data.appliedDate || data.date,
            data.createdAt,
          );
          const name = data.fullName || data.name || "Applicant";
          const cvUrl =
            data.cvUrl ||
            data.resumeUrl ||
            data.cv ||
            data.resume ||
            data.fileUrl ||
            "";
          const cvType = data.cvType || "pdf";

          const parseArray = (val) => {
            if (Array.isArray(val)) return val;
            if (typeof val === "string") {
              return val
                .split(/[,&]/)
                .map((s) => s.trim())
                .filter(Boolean);
            }
            return [];
          };

          const rawLevels = parseArray(data.levels);
          const rawBoards = parseArray(data.examBoards || data.boards);
          const rawSlots = parseArray(data.availabilitySlots);
          const rawHighlights = Array.isArray(data.highlights)
            ? data.highlights.filter(
                (h) => typeof h === "string" && h.trim() !== "",
              )
            : [];

          return {
            id: docSnap.id,
            _docId: docSnap.id,
            ...data,
            name,
            fullName: name,
            status,
            rawStatus: data.status,
            formattedDate,
            cvUrl,
            cvType,
            email: data.email || "",
            phone: data.phone || "",
            country: data.country || "",
            city: data.city || "",
            location:
              [data.city, data.country].filter(Boolean).join(", ") || "N/A",
            subject: data.subject || "",
            levels: rawLevels,
            levelsDisplay:
              rawLevels.length > 0 ? rawLevels.join(", ") : "Not specified",
            experience: data.experience || "N/A",
            examBoards: rawBoards,
            examBoardsDisplay:
              rawBoards.length > 0 ? rawBoards.join(", ") : "Not specified",
            availability: data.availability || "Flexible",
            availabilityHours: data.availabilityHours || "",
            availabilitySlots: rawSlots,
            highlights: rawHighlights,
            about:
              data.about ||
              data.bio ||
              data.coverLetter ||
              data.message ||
              "No bio provided.",
            photoUrl: data.photoUrl || data.image || "",
            teacherId: data.teacherId || null,
          };
        });

        // Sort by createdAt timestamp (newest first)
        apps.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setApplications(apps);
        setLoading(false);

        // Keep selectedApp updated in real-time without re-subscribing
        if (selectedAppIdRef.current) {
          const updated = apps.find((a) => a.id === selectedAppIdRef.current);
          if (updated) {
            setSelectedApp(updated);
          }
        }
      },
      (error) => {
        console.error("Firestore error reading career_applications:", error);
        setLoading(false);
      },
    );

    const unsubSubjects = onSnapshot(collection(db, "subjects"), (snap) => {
      const docs = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setSubjects(docs);
    });

    return () => {
      unsubApps();
      unsubSubjects();
    };
  }, []);

  // ── Filtered Applications ──
  const filtered = applications.filter((app) => {
    const matchesStatus =
      filterStatus === "All" ? true : app.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      app.name.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.subject.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      app.location.toLowerCase().includes(q) ||
      app.experience.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  // ── Teacher Form helpers ──
  const updateTeacherField = (field, value) =>
    setTeacherForm((prev) => ({ ...prev, [field]: value }));

  const addHighlight = () =>
    setTeacherForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ""],
    }));

  const removeHighlight = (idx) =>
    setTeacherForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));

  const updateHighlight = (idx, value) =>
    setTeacherForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => (i === idx ? value : h)),
    }));

  // ── Cloudinary Image Upload ──
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError("");

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "Failed to upload image");
      }

      updateTeacherField("image", resData.url);
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setImageError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Open Review Modal & Initialize Teacher Form ──
  const openReview = (app, initialTab = "review") => {
    setSelectedApp(app);
    setActiveModalTab(initialTab);
    setApprovalError("");
    setImageError("");
    setShowUrlInput(false);

    // Clean initial values from application
    const appSubj = (app.subject || "").trim().toLowerCase();
    const roleOptions = getRoleOptions(appSubj);
    const suggestedRole =
      roleOptions[1] || `${formatSubjectTitle(appSubj)} Specialist`;

    // Match levels to known LEVELS or use directly
    const appLevels = Array.isArray(app.levels) ? app.levels : [];
    const matchedLevels = appLevels.length > 0 ? appLevels : [];

    // Match boards to known BOARDS or use directly
    const appBoards = Array.isArray(app.examBoards) ? app.examBoards : [];
    const matchedBoards = appBoards.length > 0 ? appBoards : [];

    // Match experience
    const matchedExp =
      EXPERIENCE_OPTIONS.find(
        (e) => e.toLowerCase() === app.experience.toLowerCase(),
      ) ||
      app.experience ||
      "3-5 Years";

    // Setup teacher form
    setTeacherForm({
      name: app.name || "",
      role: suggestedRole,
      image: app.photoUrl || "",
      subject: appSubj,
      levels: matchedLevels,
      boards: matchedBoards,
      experience: matchedExp,
      qualifications: [],
      availabilityStatus: "available",
      bio: app.about || "",
      highlights:
        app.highlights && app.highlights.length > 0
          ? [...app.highlights]
          : [""],
    });

    setShowReviewModal(true);
  };

  // ── Approve and Create Teacher in Firestore ──
  const handleApproveTeacher = async () => {
    if (!selectedApp) return;

    // Checks & Validation
    if (!teacherForm.name.trim()) {
      setApprovalError("Teacher full name is required.");
      return;
    }
    if (!teacherForm.subject.trim()) {
      setApprovalError("Teacher subject is required.");
      return;
    }
    if (!teacherForm.role.trim()) {
      setApprovalError("Please select or specify a Role/Tag for this teacher.");
      return;
    }

    setSubmittingApproval(true);
    setApprovalError("");

    try {
      // Build teacher payload matching TeachersView & /api/teachers
      const highlights = teacherForm.highlights.filter((h) => h.trim() !== "");
      const levelsStr = teacherForm.levels.join(" & ");
      const qualStr = teacherForm.qualifications.join(" & ");
      const availabilityText =
        teacherForm.availabilityStatus === "available"
          ? "Accepting New Students"
          : "Limited Availability";
      const subjectLower = (teacherForm.subject || "").trim().toLowerCase();

      const teacherPayload = {
        name: teacherForm.name.trim(),
        role: teacherForm.role.trim(),
        image: teacherForm.image.trim(),
        subject: subjectLower,
        subjectBookingParam: subjectLower,
        levels: levelsStr,
        boards: teacherForm.boards,
        experience: teacherForm.experience,
        qualification: qualStr,
        availability: availabilityText,
        availabilityStatus: teacherForm.availabilityStatus,
        bio: teacherForm.bio.trim(),
        highlights,
      };

      // 1. Create Teacher via Secure Server API
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherPayload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(
          resData.errors?.join(", ") ||
            resData.error ||
            "Failed to create teacher profile.",
        );
      }

      const newTeacherId = resData.id;

      // 2. Update Application Status in Firestore
      const appRef = doc(db, "career_applications", selectedApp.id);
      await updateDoc(appRef, {
        status: "Approved",
        teacherId: newTeacherId || null,
        approvedAt: serverTimestamp(),
      });

      setShowReviewModal(false);
      setSelectedApp(null);
    } catch (err) {
      console.error("Error approving teacher application:", err);
      setApprovalError(err.message || "Failed to approve application.");
    } finally {
      setSubmittingApproval(false);
    }
  };

  // ── Reject Application ──
  const handleReject = async (id) => {
    try {
      const appRef = doc(db, "career_applications", id);
      await updateDoc(appRef, {
        status: "Rejected",
        rejectedAt: serverTimestamp(),
      });
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "A";
    const parts = nameStr.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleDownloadCV = async (e, cvUrl, name, cvType) => {
    e.preventDefault();
    if (!cvUrl) return;
    try {
      const response = await fetch(cvUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, "_")}_CV.${cvType || "pdf"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading CV:", err);
      window.open(cvUrl, "_blank");
    }
  };

  const statusTabs = ["All", "Pending", "Approved", "Rejected"];
  const roleOptions = getRoleOptions(teacherForm.subject);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-(family-name:--font-archivo-black) text-dark">
            Teacher Applications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review incoming teacher applications, assign role tags, and approve
            to instantly add them to the Teachers directory.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search applicants…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-bg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {applications.filter((a) => a.status === "Pending").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                PENDING REVIEW
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-bg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {applications.filter((a) => a.status === "Approved").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                APPROVED & ADDED
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
                {applications.filter((a) => a.status === "Rejected").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                REJECTED
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer shrink-0
              ${
                filterStatus === tab
                  ? "bg-dark text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            {tab}
            {tab !== "All" && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  filterStatus === tab
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {applications.filter((a) => a.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Loading State ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-gray-500">
            Loading applications…
          </span>
        </div>
      ) : (
        /* ── Application Cards Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <Card
              key={app.id}
              className="hover:border-primary/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {app.photoUrl ? (
                      <img
                        src={app.photoUrl}
                        alt={app.name}
                        className="w-12 h-12 rounded-xl object-cover border border-primary/20 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-deep-blue rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {getInitials(app.name)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-dark truncate">
                        {app.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {app.email}
                      </p>
                      {app.location !== "N/A" && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{app.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusVariant[app.status] || "default"}>
                    {app.status}
                  </Badge>
                </div>

                {/* Details Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-(family-name:--font-ibm-plex-mono) font-medium text-dark bg-gray-100 px-2.5 py-1 rounded-lg">
                    {formatSubjectTitle(app.subject) || "Subject Not Set"}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    {app.experience}
                  </span>
                  {app.levels.length > 0 && (
                    <span className="text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                      {app.levels.join(", ")}
                    </span>
                  )}
                  {app.examBoards.length > 0 && (
                    <span className="text-primary font-medium bg-primary/10 px-2 py-1 rounded-lg">
                      {app.examBoards.join(", ")}
                    </span>
                  )}
                </div>

                {/* Bio snippet */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {app.about}
                </p>

                {/* Availability info snippet */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {app.availability}
                    {app.availabilityHours ? ` • ${app.availabilityHours}` : ""}
                  </span>
                  {app.phone && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {app.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  Applied: {app.formattedDate}
                </p>
                <div className="flex items-center gap-2">
                  {app.cvUrl && (
                    <a
                      href={app.cvUrl}
                      onClick={(e) =>
                        handleDownloadCV(e, app.cvUrl, app.name, app.cvType)
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-deep-blue hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Download CV"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      CV
                    </a>
                  )}
                  {app.status === "Pending" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={UserCheck}
                      onClick={() => openReview(app, "approve")}
                    >
                      Review & Approve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eye}
                      onClick={() => openReview(app, "review")}
                    >
                      Review Details
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">
            No applications found for "{filterStatus}".
          </p>
          {searchQuery && (
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search query.
            </p>
          )}
        </div>
      )}

      {/* ── Comprehensive Review & Approval Modal ── */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Application Review & Teacher Approval"
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
              {selectedApp?.status === "Approved" ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Approved & added to Teachers Directory
                </div>
              ) : selectedApp?.status === "Rejected" ? (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Application marked as Rejected
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowReviewModal(false)}
                disabled={submittingApproval}
              >
                Cancel
              </Button>

              {selectedApp?.status !== "Rejected" &&
                selectedApp?.status !== "Approved" && (
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={() => handleReject(selectedApp?.id)}
                    disabled={submittingApproval}
                  >
                    Reject
                  </Button>
                )}

              {selectedApp?.status !== "Approved" && (
                <Button
                  variant="success"
                  icon={submittingApproval ? Loader2 : CheckCircle}
                  onClick={handleApproveTeacher}
                  disabled={
                    submittingApproval ||
                    !teacherForm.role ||
                    !teacherForm.subject
                  }
                >
                  {submittingApproval
                    ? "Approving & Creating Teacher…"
                    : "Approve & Add as Teacher"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Top Applicant Summary Banner */}
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {selectedApp.photoUrl ? (
                  <img
                    src={selectedApp.photoUrl}
                    alt={selectedApp.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-deep-blue rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {getInitials(selectedApp.name)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-dark">
                      {selectedApp.name}
                    </h3>
                    <Badge
                      variant={statusVariant[selectedApp.status] || "default"}
                    >
                      {selectedApp.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                    {selectedApp.location !== "N/A" && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedApp.location}
                      </span>
                    )}
                    {selectedApp.email && (
                      <a
                        href={`mailto:${selectedApp.email}`}
                        className="flex items-center gap-1 hover:text-dark transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {selectedApp.email}
                      </a>
                    )}
                    {selectedApp.phone && (
                      <a
                        href={`tel:${selectedApp.phone}`}
                        className="flex items-center gap-1 hover:text-dark transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedApp.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CV Download button in header */}
              {selectedApp.cvUrl && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleDownloadCV(
                      e,
                      selectedApp.cvUrl,
                      selectedApp.name,
                      selectedApp.cvType,
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-gray-200 text-deep-blue hover:text-primary hover:border-primary/40 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Resume ({selectedApp.cvType?.toUpperCase() || "CV"})
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModalTab("review")}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer
                  ${
                    activeModalTab === "review"
                      ? "border-primary text-dark"
                      : "border-transparent text-gray-400 hover:text-dark"
                  }
                `}
              >
                <Eye className="w-4 h-4" />
                Application Submission
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("approve")}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer
                  ${
                    activeModalTab === "approve"
                      ? "border-primary text-dark"
                      : "border-transparent text-gray-400 hover:text-dark"
                  }
                `}
              >
                <UserCheck className="w-4 h-4" />
                Teacher Setup & Approval
                {selectedApp.status === "Pending" && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* ── TAB 1: Application Submission Review ── */}
            {activeModalTab === "review" && (
              <div className="space-y-6 animate-fade-in">
                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      TEACHING SUBJECT
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {formatSubjectTitle(selectedApp.subject) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      EXPERIENCE
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {selectedApp.experience}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      LEVELS OFFERED
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {selectedApp.levelsDisplay}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      EXAM BOARDS
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {selectedApp.examBoardsDisplay}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      AVAILABILITY
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {selectedApp.availability}
                      {selectedApp.availabilityHours
                        ? ` (${selectedApp.availabilityHours})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                      APPLIED DATE
                    </p>
                    <p className="text-sm font-semibold text-dark mt-0.5">
                      {selectedApp.formattedDate}
                    </p>
                  </div>
                </div>

                {/* Preferred Availability Slots */}
                {selectedApp.availabilitySlots &&
                  selectedApp.availabilitySlots.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                        Preferred Availability Slots
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.availabilitySlots.map((slot, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-dark text-xs font-medium"
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Highlights */}
                {selectedApp.highlights &&
                  selectedApp.highlights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                        Key Highlights & Achievements
                      </p>
                      <ul className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        {selectedApp.highlights.map((h, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Bio / About */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                    About / Cover Letter
                  </p>
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedApp.about}
                    </p>
                  </div>
                </div>

                {/* Quick CTA to Setup & Approve */}
                {selectedApp.status === "Pending" && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-dark">
                        Ready to approve {selectedApp.name}?
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Assign a role tag and verify teaching settings before
                        adding to the Teachers directory.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      icon={UserCheck}
                      onClick={() => setActiveModalTab("approve")}
                    >
                      Configure & Approve
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: Teacher Setup & Approval Workspace ── */}
            {activeModalTab === "approve" && (
              <div className="space-y-6 animate-fade-in">
                {approvalError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{approvalError}</span>
                  </div>
                )}

                {/* ── Section: Role Tag Selection (Mandatory Check) ── */}
                <div className="p-4.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <label className="text-sm font-bold text-dark">
                        Teacher Role / Tag{" "}
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <span className="text-xs text-amber-700 font-medium">
                      Select or type a tag before approving
                    </span>
                  </div>

                  {/* Preset role tag chips */}
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((role) => {
                      const isSelected = teacherForm.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => updateTeacherField("role", role)}
                          className={`
                            px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 cursor-pointer
                            ${
                              isSelected
                                ? "bg-dark text-white border-dark shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-dark"
                            }
                          `}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Role input */}
                  <div className="pt-2">
                    <input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm text-dark placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Or type a custom role tag (e.g. Lead Cambridge Math Specialist)…"
                      value={teacherForm.role}
                      onChange={(e) =>
                        updateTeacherField("role", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* ── Section: Basic Info & Profile Photo ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
                    Basic Info & Photo
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Teacher Name"
                      placeholder="e.g. Sarah Jenkins"
                      value={teacherForm.name}
                      onChange={(e) =>
                        updateTeacherField("name", e.target.value)
                      }
                    />

                    {/* Photo Uploader */}
                    <div className="flex flex-col gap-1.5 justify-end">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-dark">
                          Teacher Photo
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-xs text-primary hover:underline cursor-pointer"
                        >
                          {showUrlInput ? "Use File Uploader" : "Or enter URL"}
                        </button>
                      </div>

                      {showUrlInput ? (
                        <Input
                          placeholder="e.g. https://res.cloudinary.com/..."
                          value={teacherForm.image}
                          onChange={(e) =>
                            updateTeacherField("image", e.target.value)
                          }
                        />
                      ) : teacherForm.image ? (
                        <div className="flex items-center gap-3 h-11.5">
                          <div className="relative group w-11 h-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                            <img
                              src={teacherForm.image}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-primary font-medium hover:underline cursor-pointer">
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => updateTeacherField("image", "")}
                              className="text-xs text-red-500 font-medium hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`
                            h-11.5 border border-dashed border-gray-300 rounded-lg
                            flex items-center justify-center gap-2 cursor-pointer
                            hover:border-primary hover:bg-primary/5 transition-all duration-200
                            ${uploadingImage ? "pointer-events-none opacity-60" : ""}
                          `}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-xs text-gray-500 font-medium">
                                Uploading to Cloudinary...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500 font-medium">
                                Upload Teacher Photo
                              </span>
                            </>
                          )}
                        </label>
                      )}
                      {imageError && (
                        <span className="text-xs text-red-500 font-medium">
                          {imageError}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Section: Subject, Levels & Boards ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
                    Teaching Subject & Curriculums
                  </p>
                  <div className="space-y-4">
                    <Select
                      label="Subject"
                      value={(teacherForm.subject || "").toLowerCase()}
                      onChange={(e) => {
                        const newSubj = e.target.value.toLowerCase();
                        updateTeacherField("subject", newSubj);
                        const roles = getRoleOptions(newSubj);
                        updateTeacherField(
                          "role",
                          roles[1] ||
                            `${formatSubjectTitle(newSubj)} Specialist`,
                        );
                      }}
                      options={[
                        {
                          value: "",
                          label:
                            subjects.length === 0
                              ? "No registered subjects — add in Subjects section"
                              : "Select a subject…",
                        },
                        ...subjects.map((s) => ({
                          value: (s.title || "").toLowerCase(),
                          label: formatSubjectTitle(s.title || ""),
                        })),
                        // Fallback if application subject is not in subjects collection
                        ...(teacherForm.subject &&
                        !subjects.some(
                          (s) =>
                            (s.title || "").toLowerCase() ===
                            teacherForm.subject.toLowerCase(),
                        )
                          ? [
                              {
                                value: teacherForm.subject.toLowerCase(),
                                label: formatSubjectTitle(teacherForm.subject),
                              },
                            ]
                          : []),
                      ]}
                    />

                    {/* Levels Chips */}
                    <ChipSelect
                      label="Levels"
                      options={LEVELS}
                      selected={teacherForm.levels}
                      onChange={(val) => updateTeacherField("levels", val)}
                    />

                    {/* Exam Boards Chips */}
                    <ChipSelect
                      label="Exam Boards"
                      options={BOARDS}
                      selected={teacherForm.boards}
                      onChange={(val) => updateTeacherField("boards", val)}
                    />
                  </div>
                </div>

                {/* ── Section: Experience, Qualifications & Availability ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
                    Experience & Status
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Experience"
                        value={teacherForm.experience}
                        onChange={(e) =>
                          updateTeacherField("experience", e.target.value)
                        }
                        options={[
                          { value: "", label: "Select experience…" },
                          ...EXPERIENCE_OPTIONS.map((e) => ({
                            value: e,
                            label: e,
                          })),
                          ...(teacherForm.experience &&
                          !EXPERIENCE_OPTIONS.includes(teacherForm.experience)
                            ? [
                                {
                                  value: teacherForm.experience,
                                  label: teacherForm.experience,
                                },
                              ]
                            : []),
                        ]}
                      />

                      <Select
                        label="Teacher Directory Availability"
                        value={teacherForm.availabilityStatus}
                        onChange={(e) =>
                          updateTeacherField(
                            "availabilityStatus",
                            e.target.value,
                          )
                        }
                        options={[
                          {
                            value: "available",
                            label: "Accepting New Students",
                          },
                          {
                            value: "limited",
                            label: "Limited Availability",
                          },
                        ]}
                      />
                    </div>

                    {/* Qualifications Chips */}
                    <ChipSelect
                      label="Teacher Qualifications / Accreditations"
                      options={QUALIFICATIONS}
                      selected={teacherForm.qualifications}
                      onChange={(val) =>
                        updateTeacherField("qualifications", val)
                      }
                    />
                  </div>
                </div>

                {/* ── Section: Bio & Highlights ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
                    Bio & Highlights for Teacher Directory
                  </p>
                  <div className="space-y-4">
                    <Textarea
                      label="Teacher Bio"
                      placeholder="Write or refine the bio for this teacher…"
                      value={teacherForm.bio}
                      onChange={(e) =>
                        updateTeacherField("bio", e.target.value)
                      }
                    />

                    {/* Dynamic Highlights */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark">
                        Teacher Highlights
                      </label>
                      {teacherForm.highlights.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-dark placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            placeholder={`Highlight ${idx + 1} (e.g. 5+ years CAIE examiner)`}
                            value={h}
                            onChange={(e) =>
                              updateHighlight(idx, e.target.value)
                            }
                          />
                          {teacherForm.highlights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHighlight(idx)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addHighlight}
                        className="text-sm text-primary font-medium hover:underline cursor-pointer mt-1 inline-block"
                      >
                        + Add Highlight
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
