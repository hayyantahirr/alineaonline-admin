"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, Briefcase, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { applications as initialApps } from "@/data/mockData";

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

export default function ApplicationsView() {
  const [applications, setApplications] = useState(initialApps);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const filtered =
    filterStatus === "All"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const handleApprove = (id) => {
    setApplications(
      applications.map((a) => (a.id === id ? { ...a, status: "Approved" } : a))
    );
    setShowReviewModal(false);
  };

  const handleReject = (id) => {
    setApplications(
      applications.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a))
    );
    setShowReviewModal(false);
  };

  const openReview = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const statusTabs = ["All", "Pending", "Approved", "Rejected"];

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
          <Card key={app.id} className="hover:border-primary/30 transition-colors">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-deep-blue rounded-xl flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {app.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-dark">
                      {app.name}
                    </h3>
                    <p className="text-xs text-gray-400">{app.email}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {app.experience}
                </span>
                <span className="font-(family-name:--font-ibm-plex-mono)">
                  {app.subject}
                </span>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {app.bio}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  Applied: {app.appliedDate}
                </p>
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => openReview(app)}>
                  Review
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No applications found for this filter.</p>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Application"
        size="lg"
        footer={
          selectedApp?.status === "Pending" ? (
            <>
              <Button
                variant="danger"
                icon={XCircle}
                onClick={() => handleReject(selectedApp.id)}
              >
                Reject
              </Button>
              <Button
                icon={CheckCircle}
                onClick={() => handleApprove(selectedApp.id)}
              >
                Approve
              </Button>
            </>
          ) : null
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Applicant info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-deep-blue rounded-2xl flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {selectedApp.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark">
                  {selectedApp.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedApp.email}</p>
                <Badge variant={statusVariant[selectedApp.status]} className="mt-1">
                  {selectedApp.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  SUBJECT
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedApp.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  EXPERIENCE
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedApp.experience}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  APPLIED DATE
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedApp.appliedDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  CV / RESUME
                </p>
                <a
                  href={selectedApp.cvUrl}
                  className="text-sm font-medium text-deep-blue hover:text-primary transition-colors"
                >
                  View CV →
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2">
                BIO / COVER LETTER
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedApp.bio}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
