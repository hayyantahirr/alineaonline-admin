"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Loader2,
  X,
  UserPlus,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { Input, Textarea, Select } from "@/components/ui/Input";

// ─── helpers ────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyForm = {
  name: "",
  role: "",
  image: "",
  subject: "",
  subjectBookingParam: "",
  levels: "",
  boards: "",
  experience: "",
  qualification: "",
  availability: "Accepting New Students",
  availabilityStatus: "available",
  bio: "",
  highlights: [""],
};

// ─── component ──────────────────────────────────────────────────
export default function TeachersView() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });

  // ── Firestore realtime listener ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      const docs = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
      setTeachers(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── filtered list ──
  const filtered = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.subject || "").toLowerCase().includes(q) ||
      (t.role || "").toLowerCase().includes(q)
    );
  });

  // ── form helpers ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addHighlight = () =>
    setFormData((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));

  const removeHighlight = (idx) =>
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));

  const updateHighlight = (idx, value) =>
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => (i === idx ? value : h)),
    }));

  // ── build doc from form ──
  const buildDoc = () => {
    const boards =
      typeof formData.boards === "string"
        ? formData.boards
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : formData.boards;

    const highlights = formData.highlights.filter((h) => h.trim() !== "");

    return {
      id: slugify(formData.name),
      name: formData.name,
      role: formData.role,
      image: formData.image,
      subject: formData.subject,
      subjectBookingParam: formData.subjectBookingParam || formData.subject,
      levels: formData.levels,
      boards,
      experience: formData.experience,
      qualification: formData.qualification,
      availability: formData.availability,
      availabilityStatus: formData.availabilityStatus,
      bio: formData.bio,
      highlights,
    };
  };

  // ── CRUD handlers ──
  const handleAdd = async () => {
    setSaving(true);
    try {
      const data = buildDoc();
      await setDoc(doc(db, "teachers", data.id), data);
      setShowAddModal(false);
      setFormData({ ...emptyForm });
    } catch (err) {
      console.error("Add teacher error:", err);
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedTeacher) return;
    setSaving(true);
    try {
      const data = buildDoc();
      // if name changed the slug changes — delete old doc, create new
      if (data.id !== selectedTeacher._docId) {
        await deleteDoc(doc(db, "teachers", selectedTeacher._docId));
        await setDoc(doc(db, "teachers", data.id), data);
      } else {
        await updateDoc(doc(db, "teachers", selectedTeacher._docId), data);
      }
      setShowEditModal(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error("Edit teacher error:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "teachers", selectedTeacher._docId));
      setShowDeleteModal(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error("Delete teacher error:", err);
    }
    setSaving(false);
  };

  // ── open modals ──
  const openAdd = () => {
    setFormData({ ...emptyForm });
    setShowAddModal(true);
  };

  const openEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      role: teacher.role || "",
      image: teacher.image || "",
      subject: teacher.subject || "",
      subjectBookingParam: teacher.subjectBookingParam || "",
      levels: teacher.levels || "",
      boards: Array.isArray(teacher.boards)
        ? teacher.boards.join(", ")
        : teacher.boards || "",
      experience: teacher.experience || "",
      qualification: teacher.qualification || "",
      availability: teacher.availability || "Accepting New Students",
      availabilityStatus: teacher.availabilityStatus || "available",
      bio: teacher.bio || "",
      highlights:
        teacher.highlights && teacher.highlights.length > 0
          ? [...teacher.highlights]
          : [""],
    });
    setShowEditModal(true);
  };

  const openView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const openDelete = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteModal(true);
  };

  // ── initials helper ──
  const getInitials = (name) =>
    (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // ── table columns ──
  const columns = [
    {
      header: "Teacher",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-deep-blue rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {getInitials(row.name)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-dark text-sm">{row.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {row.role}
            </p>
          </div>
        </div>
      ),
    },
    { header: "Subject", accessor: "subject" },
    { header: "Levels", accessor: "levels" },
    {
      header: "Boards",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.boards || []).map((b) => (
            <Badge key={b} variant="info">
              {b}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Availability",
      render: (row) => (
        <Badge
          variant={
            row.availabilityStatus === "available" ? "success" : "warning"
          }
        >
          {row.availability}
        </Badge>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openView(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDelete(row);
            }}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  // ── form fields (shared between add & edit) ──
  const renderForm = () => (
    <div className="space-y-4">
      {/* row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. Khawar Ahmed"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        <Input
          label="Role"
          placeholder="e.g. Senior Economics Specialist"
          value={formData.role}
          onChange={(e) => updateField("role", e.target.value)}
        />
      </div>

      {/* row 2 */}
      <Input
        label="Image URL"
        placeholder="e.g. /stitch/founder.jpg"
        value={formData.image}
        onChange={(e) => updateField("image", e.target.value)}
      />

      {/* row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Subject"
          placeholder="e.g. Economics"
          value={formData.subject}
          onChange={(e) => updateField("subject", e.target.value)}
        />
        <Input
          label="Subject Booking Param"
          placeholder="e.g. Economics (used in booking URL)"
          value={formData.subjectBookingParam}
          onChange={(e) => updateField("subjectBookingParam", e.target.value)}
        />
      </div>

      {/* row 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Levels"
          placeholder="e.g. IGCSE & A-Level"
          value={formData.levels}
          onChange={(e) => updateField("levels", e.target.value)}
        />
        <Input
          label="Boards (comma-separated)"
          placeholder="e.g. Edexcel, AQA, CAIE"
          value={formData.boards}
          onChange={(e) => updateField("boards", e.target.value)}
        />
      </div>

      {/* row 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Experience"
          placeholder="e.g. 6+ Years"
          value={formData.experience}
          onChange={(e) => updateField("experience", e.target.value)}
        />
        <Input
          label="Qualification"
          placeholder="e.g. BSc Economics & Examiner Trained"
          value={formData.qualification}
          onChange={(e) => updateField("qualification", e.target.value)}
        />
      </div>

      {/* row 6 — availability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Availability Text"
          placeholder="e.g. Accepting New Students"
          value={formData.availability}
          onChange={(e) => updateField("availability", e.target.value)}
        />
        <Select
          label="Availability Status"
          value={formData.availabilityStatus}
          onChange={(e) => updateField("availabilityStatus", e.target.value)}
          options={[
            { value: "available", label: "Available" },
            { value: "limited", label: "Limited" },
          ]}
        />
      </div>

      {/* bio */}
      <Textarea
        label="Bio"
        placeholder="Write a brief bio for this teacher…"
        value={formData.bio}
        onChange={(e) => updateField("bio", e.target.value)}
      />

      {/* highlights */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark">Highlights</label>
        {formData.highlights.map((h, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-dark placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              placeholder={`Highlight ${idx + 1}`}
              value={h}
              onChange={(e) => updateHighlight(idx, e.target.value)}
            />
            {formData.highlights.length > 1 && (
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
          className="text-sm text-primary font-medium hover:underline cursor-pointer mt-1"
        >
          + Add Highlight
        </button>
      </div>
    </div>
  );

  // ── loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-gray-500">Loading teachers…</span>
      </div>
    );
  }

  // ── stats ──
  const totalTeachers = teachers.length;
  const availableCount = teachers.filter(
    (t) => t.availabilityStatus === "available",
  ).length;
  const limitedCount = teachers.filter(
    (t) => t.availabilityStatus === "limited",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <Button icon={Plus} onClick={openAdd}>
          Add Teacher
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info-bg">
              <Users className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {totalTeachers}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                TOTAL TEACHERS
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-bg">
              <div className="w-2 h-2 bg-success rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {availableCount}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                AVAILABLE
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-bg">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {limitedCount}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                LIMITED
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card noPadding>
        <Table columns={columns} data={filtered} />
      </Card>

      {/* ── Add Modal ── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Teacher"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !formData.name}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                "Add Teacher"
              )}
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Teacher"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving || !formData.name}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* ── View Modal ── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Teacher Profile"
        size="lg"
      >
        {selectedTeacher && (
          <div className="space-y-5">
            {/* header */}
            <div className="flex items-center gap-4">
              {selectedTeacher.image ? (
                <img
                  src={selectedTeacher.image}
                  alt={selectedTeacher.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-deep-blue rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {getInitials(selectedTeacher.name)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-dark">
                  {selectedTeacher.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedTeacher.role}</p>
              </div>
              <div className="ml-auto">
                <Badge
                  variant={
                    selectedTeacher.availabilityStatus === "available"
                      ? "success"
                      : "warning"
                  }
                >
                  {selectedTeacher.availability}
                </Badge>
              </div>
            </div>

            {/* info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  SUBJECT
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  LEVELS
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.levels}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  EXPERIENCE
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.experience}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  QUALIFICATION
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.qualification}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  BOOKING PARAM
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.subjectBookingParam}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  BOARDS
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(selectedTeacher.boards || []).map((b) => (
                    <Badge key={b} variant="info">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* bio */}
            {selectedTeacher.bio && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2">
                  BIO
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedTeacher.bio}
                </p>
              </div>
            )}

            {/* highlights */}
            {selectedTeacher.highlights &&
              selectedTeacher.highlights.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2">
                    HIGHLIGHTS
                  </p>
                  <ul className="space-y-2">
                    {selectedTeacher.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Teacher"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-dark">
            {selectedTeacher?.name}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
