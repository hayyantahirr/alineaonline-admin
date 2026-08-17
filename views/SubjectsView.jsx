"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  BookOpen,
  Edit,
  X,
  Loader2,
  Search,
  ChevronRight,
  GraduationCap,
  Check,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";

// ─── Preset Options ───────────────────────────────────────────────────────────
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

const LEVEL_PRESETS = [
  { id: "igcse", label: "IGCSE / O-Level" },
  { id: "as-level", label: "AS-Level" },
  { id: "a-level", label: "A-Level" },
  { id: "pre-u", label: "Pre-U / Foundation" },
];

const BOARD_PRESETS = [
  { id: "caie", label: "Cambridge (CAIE)" },
  { id: "edexcel", label: "Edexcel (Pearson)" },
  { id: "aqa", label: "AQA" },
  { id: "ocr", label: "OCR" },
  { id: "wjec", label: "WJEC" },
  { id: "ib", label: "IB" },
];

const TAG_OPTIONS = [
  "FLAGSHIP",
  "NEW",
  "POPULAR",
  "ADVANCED",
  "FOUNDATION",
  "CORE",
];

const BADGE_TYPES = [
  { value: "red-outline", label: "Red Outline" },
  { value: "blue-outline", label: "Blue Outline" },
  { value: "green-outline", label: "Green Outline" },
  { value: "yellow-outline", label: "Yellow Outline" },
  { value: "purple-outline", label: "Purple Outline" },
  { value: "gray-outline", label: "Gray Outline" },
];

const TAG_BADGE_VARIANT = {
  FLAGSHIP: "danger",
  NEW: "success",
  POPULAR: "warning",
  ADVANCED: "info",
  FOUNDATION: "default",
  CORE: "default",
};

// ─── Empty State Factories ────────────────────────────────────────────────────
const makeEmptyBoard = () => ({
  id: "",
  label: "",
  syllabus: "",
  modules: [""],
  examStructure: [""],
  skills: [""],
});

const makeEmptyForm = () => ({
  num: "",
  title: "",
  tag: "FLAGSHIP",
  badgeType: "red-outline",
  description: "",
  tutor: "",
  levels: [],
});

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100">
      {[
        { n: 1, label: "BASIC INFO" },
        { n: 2, label: "CURRICULUM" },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
          <div
            className={`flex items-center gap-2 text-xs font-semibold font-(family-name:--font-ibm-plex-mono) ${
              step === s.n ? "text-dark" : "text-gray-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                step === s.n
                  ? "bg-primary text-dark"
                  : step > s.n
                    ? "bg-success text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s.n ? <Check className="w-2.5 h-2.5" /> : s.n}
            </span>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── View: Level Accordion ────────────────────────────────────────────────────
function ViewLevelAccordion({ level }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-dark">{level.label}</span>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="divide-y divide-gray-50">
          {(level.boards || []).length === 0 ? (
            <p className="px-5 py-3 text-xs text-gray-400 italic">
              No boards added yet.
            </p>
          ) : (
            (level.boards || []).map((board) => (
              <ViewBoardSection key={board.id} board={board} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Board Section ──────────────────────────────────────────────────────
function ViewBoardSection({ board }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-dark">{board.label}</span>
          {board.syllabus && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-(family-name:--font-ibm-plex-mono)">
              {board.syllabus}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-4 bg-white">
          {board.modules?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                Modules / Topics
              </p>
              <ul className="space-y-1">
                {board.modules.filter(Boolean).map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {board.examStructure?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                Exam Structure
              </p>
              <ul className="space-y-1">
                {board.examStructure.filter(Boolean).map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-info shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {board.skills?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                Key Skills
              </p>
              <ul className="space-y-1">
                {board.skills.filter(Boolean).map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <Check className="w-3 h-3 text-success mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubjectsView() {
  // ── Data ──
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Modal state ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Form state ──
  const [formData, setFormData] = useState(makeEmptyForm());
  const [formStep, setFormStep] = useState(1);
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [activeBoardIdx, setActiveBoardIdx] = useState(0);

  // ── Firestore listeners ──
  useEffect(() => {
    const unsubSubjects = onSnapshot(collection(db, "subjects"), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, _docId: d.id, ...d.data() }))
        .sort((a, b) => (a.num || "").localeCompare(b.num || ""));
      setSubjects(docs);
      setLoading(false);
    });

    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSubjects();
      unsubTeachers();
    };
  }, []);

  // ── Search filter ──
  const filtered = subjects.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.title || "").toLowerCase().includes(q) ||
      (s.tag || "").toLowerCase().includes(q) ||
      (s.tutor || "").toLowerCase().includes(q)
    );
  });

  // ── Form helpers ──
  const updateField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const addLevel = (preset) => {
    if (formData.levels.some((l) => l.id === preset.id)) return;
    const newIdx = formData.levels.length;
    setFormData((prev) => ({
      ...prev,
      levels: [
        ...prev.levels,
        { id: preset.id, label: preset.label, boards: [] },
      ],
    }));
    setActiveLevelIdx(newIdx);
    setActiveBoardIdx(0);
  };

  const removeLevel = (idx) => {
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== idx),
    }));
    setActiveLevelIdx((cur) => {
      if (idx < cur) return cur - 1;
      if (idx === cur) return Math.max(0, cur - 1);
      return cur;
    });
    setActiveBoardIdx(0);
  };

  const addBoard = (levelIdx, preset) => {
    const level = formData.levels[levelIdx];
    if (!level || level.boards.some((b) => b.id === preset.id)) return;
    const newBoardIdx = level.boards.length;
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.map((l, li) => {
        if (li !== levelIdx) return l;
        return {
          ...l,
          boards: [
            ...l.boards,
            { ...makeEmptyBoard(), id: preset.id, label: preset.label },
          ],
        };
      }),
    }));
    setActiveBoardIdx(newBoardIdx);
  };

  const removeBoard = (levelIdx, boardIdx) => {
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.map((l, li) => {
        if (li !== levelIdx) return l;
        return {
          ...l,
          boards: l.boards.filter((_, bi) => bi !== boardIdx),
        };
      }),
    }));
    if (levelIdx === activeLevelIdx) {
      setActiveBoardIdx((cur) => {
        if (boardIdx < cur) return cur - 1;
        if (boardIdx === cur) return Math.max(0, cur - 1);
        return cur;
      });
    }
  };

  const updateBoard = (levelIdx, boardIdx, key, value) => {
    setFormData((prev) => ({
      ...prev,
      levels: prev.levels.map((l, li) => {
        if (li !== levelIdx) return l;
        return {
          ...l,
          boards: l.boards.map((b, bi) => {
            if (bi !== boardIdx) return b;
            return { ...b, [key]: value };
          }),
        };
      }),
    }));
  };

  const addListItem = (levelIdx, boardIdx, listKey) => {
    const cur = formData.levels[levelIdx]?.boards[boardIdx]?.[listKey] || [];
    updateBoard(levelIdx, boardIdx, listKey, [...cur, ""]);
  };

  const removeListItem = (levelIdx, boardIdx, listKey, itemIdx) => {
    const cur = formData.levels[levelIdx]?.boards[boardIdx]?.[listKey] || [];
    updateBoard(
      levelIdx,
      boardIdx,
      listKey,
      cur.filter((_, i) => i !== itemIdx),
    );
  };

  const updateListItem = (levelIdx, boardIdx, listKey, itemIdx, value) => {
    const cur = formData.levels[levelIdx]?.boards[boardIdx]?.[listKey] || [];
    updateBoard(
      levelIdx,
      boardIdx,
      listKey,
      cur.map((v, i) => (i === itemIdx ? value : v)),
    );
  };

  // ── CRUD Handlers ──
  const handleAdd = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...formData };
      const matching = payload.title
        ? teachers.filter((t) => t.subject === payload.title)
        : [];
      payload.tutor =
        matching.length > 0
          ? matching
              .map((t) => `${t.name}${t.role ? ` (${t.role})` : ""}`)
              .join(", ")
          : "Teacher not available";

      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.errors?.join(", ") || data.error || "Failed to create subject.",
        );
      }
      setShowAddModal(false);
      setFormData(makeEmptyForm());
      setFormStep(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...formData, id: selectedSubject.id };
      const matching = payload.title
        ? teachers.filter((t) => t.subject === payload.title)
        : [];
      payload.tutor =
        matching.length > 0
          ? matching
              .map((t) => `${t.name}${t.role ? ` (${t.role})` : ""}`)
              .join(", ")
          : "Teacher not available";

      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.errors?.join(", ") || data.error || "Failed to update subject.",
        );
      }
      setShowEditModal(false);
      setSelectedSubject(null);
      setFormStep(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSubject.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete subject.");
      }
      setShowDeleteModal(false);
      setSelectedSubject(null);
    } catch (err) {
      console.error("Delete subject error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Open Modals ──
  const openAdd = () => {
    setFormData(makeEmptyForm());
    setFormStep(1);
    setFormError("");
    setActiveLevelIdx(0);
    setActiveBoardIdx(0);
    setShowAddModal(true);
  };

  const openEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      num: subject.num || "",
      title: subject.title || "",
      tag: subject.tag || "FLAGSHIP",
      badgeType: subject.badgeType || "red-outline",
      description: subject.description || "",
      tutor: subject.tutor || "",
      levels: Array.isArray(subject.levels)
        ? subject.levels.map((level) => ({
            id: level.id || "",
            label: level.label || "",
            boards: Array.isArray(level.boards)
              ? level.boards.map((board) => ({
                  id: board.id || "",
                  label: board.label || "",
                  syllabus: board.syllabus || "",
                  modules: board.modules?.length > 0 ? board.modules : [""],
                  examStructure:
                    board.examStructure?.length > 0
                      ? board.examStructure
                      : [""],
                  skills: board.skills?.length > 0 ? board.skills : [""],
                }))
              : [],
          }))
        : [],
    });
    setFormStep(1);
    setFormError("");
    setActiveLevelIdx(0);
    setActiveBoardIdx(0);
    setShowEditModal(true);
  };

  const openView = (subject) => {
    setSelectedSubject(subject);
    setShowViewModal(true);
  };

  const openDelete = (subject) => {
    setSelectedSubject(subject);
    setShowDeleteModal(true);
  };

  // ── Render: Step 1 — Basic Info ──
  const renderStep1 = () => (
    <div className="space-y-4">
      {formError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Subject Title *"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          options={[
            { value: "", label: "Select a subject…" },
            ...SUBJECTS.map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          label="Tag / Badge"
          value={formData.tag}
          onChange={(e) => updateField("tag", e.target.value)}
          options={TAG_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Select
          label="Badge Style"
          value={formData.badgeType}
          onChange={(e) => updateField("badgeType", e.target.value)}
          options={BADGE_TYPES}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="What will students master in this subject?"
        value={formData.description}
        onChange={(e) => updateField("description", e.target.value)}
      />

      {/* Assigned Tutors Display */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1.5">
          Assigned Tutor(s)
        </label>
        {formData.title ? (
          (() => {
            const matching = teachers.filter(
              (t) => t.subject === formData.title,
            );
            return matching.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matching.map((t) => (
                  <div
                    key={t.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-dark"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    {t.name}
                    {t.role && (
                      <span className="text-xs text-gray-500 font-normal">
                        — {t.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500 italic">
                Teacher not available
              </div>
            );
          })()
        ) : (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-400">
            Select a subject title first to view available teachers.
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Step 2 — Curriculum Builder ──
  const renderStep2 = () => {
    const activeLevel = formData.levels[activeLevelIdx];
    const activeBoard = activeLevel?.boards[activeBoardIdx];

    const availableLevels = LEVEL_PRESETS.filter(
      (lp) => !formData.levels.some((l) => l.id === lp.id),
    );
    const availableBoards = activeLevel
      ? BOARD_PRESETS.filter(
          (bp) => !activeLevel.boards.some((b) => b.id === bp.id),
        )
      : BOARD_PRESETS;

    const renderDynamicList = (levelIdx, boardIdx, listKey, placeholder) => {
      const items =
        formData.levels[levelIdx]?.boards[boardIdx]?.[listKey] || [];
      return (
        <div className="space-y-2">
          {items.map((item, itemIdx) => (
            <div key={itemIdx} className="flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-dark placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-dark focus:border-transparent transition-all duration-200"
                placeholder={`${placeholder} ${itemIdx + 1}`}
                value={item}
                onChange={(e) =>
                  updateListItem(
                    levelIdx,
                    boardIdx,
                    listKey,
                    itemIdx,
                    e.target.value,
                  )
                }
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeListItem(levelIdx, boardIdx, listKey, itemIdx)
                  }
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem(levelIdx, boardIdx, listKey)}
            className="w-fit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 font-medium bg-gray-50 hover:bg-gray-100 hover:text-dark transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        {/* Level Tabs */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
            Levels
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {formData.levels.map((level, idx) => (
              <div key={level.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLevelIdx(idx);
                    setActiveBoardIdx(0);
                  }}
                  className={`
                    px-3 py-1.5 rounded-l-lg text-xs font-semibold border transition-all duration-200 cursor-pointer
                    ${
                      activeLevelIdx === idx
                        ? "bg-dark text-white border-dark"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-dark"
                    }
                  `}
                >
                  {level.label}
                </button>
                <button
                  type="button"
                  onClick={() => removeLevel(idx)}
                  className={`
                    px-2 py-1.5 rounded-r-lg border-y border-r text-xs transition-all duration-200 cursor-pointer
                    ${
                      activeLevelIdx === idx
                        ? "bg-dark/80 text-gray-300 border-dark hover:text-white"
                        : "bg-white text-gray-300 border-gray-200 hover:text-red-400 hover:border-gray-300"
                    }
                  `}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add Level selector */}
            {availableLevels.length > 0 && (
              <select
                className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 bg-white hover:border-dark hover:text-dark focus:outline-none focus:border-dark transition-all duration-200 cursor-pointer"
                value=""
                onChange={(e) => {
                  const preset = LEVEL_PRESETS.find(
                    (lp) => lp.id === e.target.value,
                  );
                  if (preset) addLevel(preset);
                  e.target.value = "";
                }}
              >
                <option value="">+ Add Level</option>
                {availableLevels.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    {lp.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Empty level state */}
        {formData.levels.length === 0 && (
          <div className="py-10 flex flex-col items-center gap-2 border border-dashed border-gray-200 rounded-xl text-center">
            <GraduationCap className="w-6 h-6 text-gray-300" />
            <p className="text-xs text-gray-400">
              Add a level above to start building curriculum
            </p>
          </div>
        )}

        {/* Board Tabs — for active level */}
        {activeLevel && (
          <div className="pl-4 border-l-2 border-gray-100 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) mb-2">
                Boards — {activeLevel.label}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {activeLevel.boards.map((board, bIdx) => (
                  <div key={board.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveBoardIdx(bIdx)}
                      className={`
                        px-3 py-1.5 rounded-l-lg text-xs font-medium border transition-all duration-200 cursor-pointer
                        ${
                          activeBoardIdx === bIdx
                            ? "bg-dark text-white border-dark"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-dark"
                        }
                      `}
                    >
                      {board.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBoard(activeLevelIdx, bIdx)}
                      className={`
                        px-2 py-1.5 rounded-r-lg border-y border-r text-xs transition-all duration-200 cursor-pointer
                        ${
                          activeBoardIdx === bIdx
                            ? "bg-dark/80 text-gray-300 border-dark hover:text-white"
                            : "bg-white text-gray-300 border-gray-200 hover:text-red-400 hover:border-gray-300"
                        }
                      `}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add Board selector */}
                {availableBoards.length > 0 && (
                  <select
                    className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 bg-white hover:border-dark hover:text-dark focus:outline-none focus:border-dark transition-all duration-200 cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const preset = BOARD_PRESETS.find(
                        (bp) => bp.id === e.target.value,
                      );
                      if (preset) addBoard(activeLevelIdx, preset);
                      e.target.value = "";
                    }}
                  >
                    <option value="">+ Add Board</option>
                    {availableBoards.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Empty board state */}
            {activeLevel.boards.length === 0 && (
              <div className="py-6 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400">
                  Add an exam board above to continue
                </p>
              </div>
            )}

            {/* Board Detail — Syllabus + Dynamic Lists */}
            {activeBoard && (
              <div className="space-y-4">
                <Input
                  label="Syllabus Code"
                  placeholder="e.g. 0455, 9EC0, 7136"
                  value={activeBoard.syllabus}
                  onChange={(e) =>
                    updateBoard(
                      activeLevelIdx,
                      activeBoardIdx,
                      "syllabus",
                      e.target.value,
                    )
                  }
                />

                {/* Modules */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                    Modules / Topics
                  </p>
                  {renderDynamicList(
                    activeLevelIdx,
                    activeBoardIdx,
                    "modules",
                    "Module",
                  )}
                </div>

                {/* Exam Structure */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                    Exam Structure
                  </p>
                  {renderDynamicList(
                    activeLevelIdx,
                    activeBoardIdx,
                    "examStructure",
                    "Paper",
                  )}
                </div>

                {/* Key Skills */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-dark uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                    Key Skills
                  </p>
                  {renderDynamicList(
                    activeLevelIdx,
                    activeBoardIdx,
                    "skills",
                    "Skill",
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Shared Modal Form Shell ──
  const renderFormModal = (isEdit) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    const onClose = () =>
      isEdit ? setShowEditModal(false) : setShowAddModal(false);
    const onSave = isEdit ? handleEdit : handleAdd;
    const title = isEdit ? "Edit Subject" : "Add New Subject";
    const saveLabel = isEdit ? "Save Changes" : "Save Subject";

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="lg"
        footer={
          <>
            {formStep === 1 ? (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setFormStep(2)}
                  disabled={!formData.title.trim()}
                >
                  Curriculum →
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setFormStep(1)}>
                  ← Basic Info
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving || !formData.title.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    saveLabel
                  )}
                </Button>
              </>
            )}
          </>
        }
      >
        <StepIndicator step={formStep} />
        {formStep === 1 ? renderStep1() : renderStep2()}
      </Modal>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-gray-500">Loading subjects…</span>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
              {subjects.length}
            </p>
            <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
              SUBJECTS
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all w-52"
            />
          </div>
        </div>
        <Button icon={Plus} onClick={openAdd}>
          Add Subject
        </Button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-gray-50">
            <GraduationCap className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">
              {searchQuery
                ? "No subjects match your search"
                : "No subjects yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery
                ? "Try a different search term"
                : `Click "Add Subject" to create your first subject.`}
            </p>
          </div>
        </div>
      )}

      {/* Subject Cards Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((subject) => (
            <Card
              key={subject.id}
              className="cursor-pointer group hover:shadow-md transition-all duration-200"
              onClick={() => openView(subject)}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-xs font-bold text-primary font-(family-name:--font-ibm-plex-mono) shrink-0">
                      {subject.num || "—"}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-dark leading-tight">
                        {subject.title}
                      </h3>
                      {subject.tutor && (
                        <p className="text-[11px] text-gray-400 truncate max-w-35">
                          {subject.tutor.split("(")[0].trim()}
                        </p>
                      )}
                    </div>
                  </div>
                  {subject.tag && (
                    <Badge
                      variant={TAG_BADGE_VARIANT[subject.tag] || "default"}
                    >
                      {subject.tag}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {subject.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {subject.description}
                  </p>
                )}

                {/* Levels & Boards preview */}
                {Array.isArray(subject.levels) && subject.levels.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {subject.levels.map((level) => (
                      <div
                        key={level.id}
                        className="flex items-center gap-2 flex-wrap"
                      >
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono) w-14 shrink-0">
                          {level.id === "igcse"
                            ? "IGCSE"
                            : level.id === "a-level"
                              ? "A-Level"
                              : level.id === "as-level"
                                ? "AS"
                                : level.label.split("/")[0].trim()}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(level.boards || []).map((board) => (
                            <span
                              key={board.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium"
                            >
                              {board.label.split("(")[0].trim()}
                            </span>
                          ))}
                          {(level.boards || []).length === 0 && (
                            <span className="text-[10px] text-gray-300 italic">
                              No boards
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(subject);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete(subject);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add Modal ── */}
      {renderFormModal(false)}

      {/* ── Edit Modal ── */}
      {renderFormModal(true)}

      {/* ── View Modal ── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Subject Detail"
        size="lg"
      >
        {selectedSubject && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-sm font-bold text-primary font-(family-name:--font-ibm-plex-mono) shrink-0">
                {selectedSubject.num || "—"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-dark">
                    {selectedSubject.title}
                  </h2>
                  {selectedSubject.tag && (
                    <Badge
                      variant={
                        TAG_BADGE_VARIANT[selectedSubject.tag] || "default"
                      }
                    >
                      {selectedSubject.tag}
                    </Badge>
                  )}
                </div>
                {selectedSubject.tutor && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedSubject.tutor}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEdit(selectedSubject);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                title="Edit Subject"
              >
                <Edit className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Description */}
            {selectedSubject.description && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {selectedSubject.description}
              </p>
            )}

            {/* Curriculum */}
            {Array.isArray(selectedSubject.levels) &&
              selectedSubject.levels.length > 0 && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                    Curriculum
                  </p>
                  {selectedSubject.levels.map((level) => (
                    <ViewLevelAccordion key={level.id} level={level} />
                  ))}
                </div>
              )}

            {(!Array.isArray(selectedSubject.levels) ||
              selectedSubject.levels.length === 0) && (
              <div className="pt-4 border-t border-gray-100 text-center py-6">
                <p className="text-xs text-gray-400">No curriculum data yet.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Subject"
        size="sm"
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
            {selectedSubject?.title}
          </span>
          ? This will remove all levels, boards, and curriculum data. This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
