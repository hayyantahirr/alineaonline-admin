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
  Users,
  AlertCircle,
  Check,
  Upload,
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

// ─── preset options ─────────────────────────────────────────────
const SUBJECTS = [
  "Economics",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Literature",
  "English Language",
  "Computer Science",
  "History",
  "Geography",
  "Accounting",
  "Business Studies",
  "Psychology",
  "Sociology",
  "French",
  "Spanish",
  "Urdu",
  "Islamiyat",
  "Pakistan Studies",
];

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

// role tag templates — {subject} gets replaced
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
  const subj = subject || "Subject";
  return ROLE_TEMPLATES.map((t) => t.replace("{subject}", subj));
}

// ─── ChipSelect component ──────────────────────────────────────
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
      {label && <label className="text-sm font-medium text-dark">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
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

// ─── default form state ─────────────────────────────────────────
const emptyForm = {
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

// ─── component ──────────────────────────────────────────────────
export default function TeachersView() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });

  // Cloudinary image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  // ── Firestore realtime listener ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        _docId: d.id,
        ...d.data(),
      }));
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

  // ── image upload handler ──
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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload image");
      }

      const resData = await res.json();
      updateField("image", resData.url);
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setImageError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── build Firestore doc data from form ──
  const buildDoc = () => {
    const highlights = formData.highlights.filter((h) => h.trim() !== "");

    // auto-derive fields
    const levelsStr = formData.levels.join(" & ");
    const qualStr = formData.qualifications.join(" & ");
    const availabilityText =
      formData.availabilityStatus === "available"
        ? "Accepting New Students"
        : "Limited Availability";

    return {
      name: formData.name,
      role: formData.role,
      image: formData.image,
      subject: formData.subject,
      subjectBookingParam: formData.subject,
      levels: levelsStr,
      boards: formData.boards,
      experience: formData.experience,
      qualification: qualStr,
      availability: availabilityText,
      availabilityStatus: formData.availabilityStatus,
      bio: formData.bio,
      highlights,
    };
  };

  // ── CRUD handlers ──
  const handleAdd = async () => {
    setSaving(true);
    try {
      // Create a new Firestore document with auto-generated Cloud Firestore ID
      const newDocRef = doc(collection(db, "teachers"));
      const docData = {
        ...buildDoc(),
        id: newDocRef.id,
      };
      await setDoc(newDocRef, docData);
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
      const docId = selectedTeacher.id || selectedTeacher._docId;
      const docData = {
        ...buildDoc(),
        id: docId,
      };
      await updateDoc(doc(db, "teachers", docId), docData);
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
      const docId = selectedTeacher.id || selectedTeacher._docId;
      await deleteDoc(doc(db, "teachers", docId));
      setShowDeleteModal(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error("Delete teacher error:", err);
    }
    setSaving(false);
  };

  // ── open modals ──
  const openAdd = () => {
    setFormData({ ...emptyForm, highlights: [""] });
    setImageError("");
    setShowUrlInput(false);
    setShowAddModal(true);
  };

  const openEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setImageError("");
    setShowUrlInput(false);

    // parse levels string back to array (e.g. "IGCSE & A-Level" → ["IGCSE", "A-Level"])
    const levelsArr =
      typeof teacher.levels === "string"
        ? teacher.levels
            .split("&")
            .map((l) => l.trim())
            .filter(Boolean)
        : teacher.levels || [];

    // parse qualification string back to array
    const qualArr =
      typeof teacher.qualification === "string"
        ? teacher.qualification
            .split("&")
            .map((q) => q.trim())
            .filter(Boolean)
        : [];

    setFormData({
      name: teacher.name || "",
      role: teacher.role || "",
      image: teacher.image || "",
      subject: teacher.subject || "",
      levels: levelsArr,
      boards: Array.isArray(teacher.boards) ? teacher.boards : [],
      experience: teacher.experience || "",
      qualifications: qualArr,
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
          {row.image ? (
            <img
              src={row.image}
              alt={row.name}
              className="w-10 h-10 bg-gray-100 rounded-xl object-cover shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-10 h-10 bg-deep-blue rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {getInitials(row.name)}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-dark text-sm">{row.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-50">
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
            title="View Details"
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Edit Teacher"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDelete(row);
            }}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete Teacher"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  // ── role options based on selected subject ──
  const roleOptions = getRoleOptions(formData.subject);

  // ── form fields (shared between add & edit) ──
  const renderForm = () => (
    <div className="space-y-6">
      {/* ── Section: Basic Info ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
          Basic Info
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Khawar Ahmed"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />

            {/* Profile Photo Uploader */}
            <div className="flex flex-col gap-1.5 justify-end">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-dark">Teacher Photo</label>
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
                  value={formData.image}
                  onChange={(e) => updateField("image", e.target.value)}
                />
              ) : formData.image ? (
                <div className="flex items-center gap-3 h-11.5">
                  <div className="relative group w-11 h-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-primary font-medium hover:underline cursor-pointer">
                      <span>Change</span>
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
                      onClick={() => updateField("image", "")}
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
                <span className="text-xs text-red-500 font-medium">{imageError}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Subject & Teaching ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
          Subject & Teaching
        </p>
        <div className="space-y-4">
          {/* Subject dropdown */}
          <Select
            label="Subject"
            value={formData.subject}
            onChange={(e) => {
              updateField("subject", e.target.value);
              updateField("role", "");
            }}
            options={[
              { value: "", label: "Select a subject…" },
              ...SUBJECTS.map((s) => ({ value: s, label: s })),
            ]}
          />

          {/* Role/Tag dropdown — options depend on subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark">
              Role / Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateField("role", role)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer
                    ${
                      formData.role === role
                        ? "bg-dark text-white border-dark"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-dark"
                    }
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
            {/* custom role override */}
            <input
              className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 text-sm text-dark placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              placeholder="Or type a custom role…"
              value={roleOptions.includes(formData.role) ? "" : formData.role}
              onChange={(e) => updateField("role", e.target.value)}
            />
          </div>

          {/* Levels — chip multi-select */}
          <ChipSelect
            label="Levels"
            options={LEVELS}
            selected={formData.levels}
            onChange={(val) => updateField("levels", val)}
          />

          {/* Boards — chip multi-select */}
          <ChipSelect
            label="Exam Boards"
            options={BOARDS}
            selected={formData.boards}
            onChange={(val) => updateField("boards", val)}
          />
        </div>
      </div>

      {/* ── Section: Experience & Qualifications ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
          Experience & Qualifications
        </p>
        <div className="space-y-4">
          {/* Experience dropdown */}
          <Select
            label="Experience"
            value={formData.experience}
            onChange={(e) => updateField("experience", e.target.value)}
            options={[
              { value: "", label: "Select experience…" },
              ...EXPERIENCE_OPTIONS.map((e) => ({ value: e, label: e })),
            ]}
          />

          {/* Qualifications — chip multi-select */}
          <ChipSelect
            label="Qualifications"
            options={QUALIFICATIONS}
            selected={formData.qualifications}
            onChange={(val) => updateField("qualifications", val)}
          />

          {/* Availability */}
          <Select
            label="Availability"
            value={formData.availabilityStatus}
            onChange={(e) => updateField("availabilityStatus", e.target.value)}
            options={[
              { value: "available", label: "Accepting New Students" },
              { value: "limited", label: "Limited Availability" },
            ]}
          />
        </div>
      </div>

      {/* ── Section: Bio & Highlights ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-3">
          Bio & Highlights
        </p>
        <div className="space-y-4">
          <Textarea
            label="Bio"
            placeholder="Write a brief bio for this teacher…"
            value={formData.bio}
            onChange={(e) => updateField("bio", e.target.value)}
          />

          {/* Highlights — dynamic list */}
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
    (t) => t.availabilityStatus === "available"
  ).length;
  const limitedCount = teachers.filter(
    (t) => t.availabilityStatus === "limited"
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

      {/* Teachers Table — clickable row opens profile view */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filtered}
          onRowClick={(row) => openView(row)}
        />
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
            <Button
              onClick={handleAdd}
              disabled={saving || !formData.name || !formData.subject}
            >
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
            <Button
              onClick={handleEdit}
              disabled={saving || !formData.name || !formData.subject}
            >
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
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-deep-blue rounded-2xl flex items-center justify-center shrink-0">
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
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mt-0.5">
                  ID: {selectedTeacher.id}
                </p>
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
