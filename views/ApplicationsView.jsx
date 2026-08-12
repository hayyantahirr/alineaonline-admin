"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

export default function ApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

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

  useEffect(() => {
    const appsRef = collection(db, "career_applications");

    const unsubscribe = onSnapshot(
      appsRef,
      (snapshot) => {
        const apps = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = data.status || "Pending";

          // Map "unread" or other status to "Pending" / capitalize properly
          let status = "Pending";
          if (rawStatus.toLowerCase() === "approved") {
            status = "Approved";
          } else if (rawStatus.toLowerCase() === "rejected") {
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

          // Helpers to format arrays/objects safely
          const formatArray = (val) => {
            if (Array.isArray(val)) return val.join(", ");
            if (typeof val === "string") return val;
            return "N/A";
          };

          return {
            id: docSnap.id,
            ...data,
            name,
            status,
            formattedDate,
            cvUrl,
            email: data.email || "",
            phone: data.phone || "",
            country: data.country || "",
            city: data.city || "",
            location:
              [data.city, data.country].filter(Boolean).join(", ") || "N/A",
            subject: data.subject || "N/A",
            levels: formatArray(data.levels),
            experience: data.experience || "N/A",
            examBoards: formatArray(data.examBoards),
            availability: formatArray(data.availability),
            bio:
              data.about ||
              data.bio ||
              data.coverLetter ||
              data.message ||
              "No bio provided.",
            photoUrl: data.photoUrl || "",
          };
        });

        // Sort by createdAt timestamp (newest first)
        apps.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setApplications(apps);

        if (selectedApp) {
          const updated = apps.find((a) => a.id === selectedApp.id);
          if (updated) {
            setSelectedApp(updated);
          }
        }
      },
      (error) => {
        console.error("Firestore error reading career_applications:", error);
      },
    );

    return () => unsubscribe();
  }, [selectedApp]);

  const filtered =
    filterStatus === "All"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const handleApprove = async (id) => {
    try {
      const appRef = doc(db, "career_applications", id);
      await updateDoc(appRef, { status: "Approved" });
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error approving application:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      const appRef = doc(db, "career_applications", id);
      await updateDoc(appRef, { status: "Rejected" });
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
    }
  };

  const openReview = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const statusTabs = ["All", "Pending", "Approved", "Rejected"];

  const getInitials = (nameStr) => {
    if (!nameStr) return "A";
    const parts = nameStr.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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
                APPROVED
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                filterStatus === tab
                  ? "bg-dark text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Application Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((app) => (
          <Card
            key={app.id}
            className="hover:border-primary/30 transition-colors"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {app.photoUrl ? (
                    <img
                      src={app.photoUrl}
                      alt={app.name}
                      className="w-11 h-11 rounded-xl object-cover border border-primary/10 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-deep-blue rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {getInitials(app.name)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-dark">
                      {app.name}
                    </h3>
                    <p className="text-xs text-gray-400">{app.email}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[app.status] || "default"}>
                  {app.status}
                </Badge>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {app.experience}
                </span>
                <span className="font-(family-name:--font-ibm-plex-mono) font-medium text-dark bg-gray-100 px-2 py-0.5 rounded">
                  {app.subject}
                </span>
                {app.location !== "N/A" && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {app.location}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {app.bio}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  Applied: {app.formattedDate}
                </p>
                <div className="flex items-center gap-2">
                  {app.cvUrl && (
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-deep-blue hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Download / View CV"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      CV
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Eye}
                    onClick={() => openReview(app)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            No applications found for "{filterStatus}".
          </p>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Application"
        size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <Button
              variant="danger"
              icon={XCircle}
              onClick={() => handleReject(selectedApp?.id)}
            >
              Reject
            </Button>
            <Button
              variant="success"
              icon={CheckCircle}
              onClick={() => handleApprove(selectedApp?.id)}
            >
              Approve
            </Button>
          </div>
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Applicant info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedApp.photoUrl ? (
                  <img
                    src={selectedApp.photoUrl}
                    alt={selectedApp.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-deep-blue rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {getInitials(selectedApp.name)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-dark">
                    {selectedApp.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedApp.location}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
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
              <Badge variant={statusVariant[selectedApp.status] || "default"}>
                {selectedApp.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  SUBJECT / SPECIALIZATION
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  LEVELS
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.levels}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  EXPERIENCE
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.experience}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  EXAM BOARDS
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.examBoards}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  AVAILABILITY
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.availability}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  APPLIED DATE
                </p>
                <p className="text-sm font-medium text-dark mt-0.5">
                  {selectedApp.formattedDate}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-1.5">
                CV / RESUME
              </p>
              {selectedApp.cvUrl ? (
                <a
                  href={selectedApp.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-deep-blue hover:text-primary transition-colors underline"
                >
                  <Download className="w-4 h-4" />
                  Download / View CV
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-sm text-gray-400">No CV attached</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2">
                BIO / COVER LETTER
              </p>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedApp.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
