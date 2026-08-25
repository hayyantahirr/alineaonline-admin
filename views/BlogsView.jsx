"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Search,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Clock,
  Tag,
  FolderOpen,
  FileText,
  Check,
  AlertCircle,
  FileUp,
  Sparkles,
  FileType,
} from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { Input, Textarea } from "@/components/ui/Input";
import BlogEditor from "@/components/admin/BlogEditor";
import parse from "html-react-parser";

// ─── Constants ──────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  "Study Tips",
  "Education",
  "Science",
  "Mathematics",
  "Technology",
  "Parenting",
  "Exam Prep",
  "Career Guidance",
  "General",
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  category: "",
  tags: [],
  featuredImage: "",
  readTime: "",
  author: "",
  status: "Draft",
  content: "",
  excerpt: "",
};

// ─── Helpers ────────────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

function formatDate(timestamp) {
  try {
    if (timestamp?.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch (e) {
    console.error("Date formatting error:", e);
  }
  return "—";
}

// ─── Toast Notification ─────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-100 animate-slide-up">
      <div
        className={`
          flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border
          ${
            type === "success"
              ? "bg-white border-success/20 text-success"
              : "bg-white border-danger/20 text-danger"
          }
        `}
      >
        {type === "success" ? (
          <Check className="w-5 h-5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0" />
        )}
        <p className="text-sm font-medium text-dark">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 cursor-pointer hover:opacity-60 transition-opacity"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Tag Input Component ────────────────────────────────────────
function TagInput({ tags = [], onChange }) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-dark">Tags</label>
      <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-gray-200 bg-white min-h-10.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all duration-200">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-dark"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-danger transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
          className="flex-1 min-w-30 text-sm text-dark placeholder:text-gray-400 outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function BlogsView() {
  // ─── State ──────────────────────────────────────────────────
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subView, setSubView] = useState("list"); // "list" | "editor" | "preview"
  const [editingBlog, setEditingBlog] = useState(null);
  const [previewBlog, setPreviewBlog] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const coverInputRef = useRef(null);

  // ─── Import Document Modal States ───────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const importInputRef = useRef(null);

  // ─── Real-time Firestore Listener ───────────────────────────
  useEffect(() => {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setBlogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore blogs listener error:", error);
        setLoading(false);
        showToast("Failed to load blogs", "error");
      },
    );

    return () => unsubscribe();
  }, []);

  // ─── Toast Helper ───────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ─── Filtered Blogs ─────────────────────────────────────────
  const filtered = blogs.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.title || "").toLowerCase().includes(q) ||
      (b.author || "").toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q)
    );
  });

  // ─── Navigation ─────────────────────────────────────────────
  const openCreate = () => {
    setEditingBlog(null);
    setFormData({ ...EMPTY_FORM });
    setSubView("editor");
  };

  const openEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      slug: blog.slug || "",
      category: blog.category || "",
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      featuredImage: blog.featuredImage || "",
      readTime: blog.readTime || "",
      author: blog.author || "",
      status: blog.status || "Draft",
      content: blog.content || "",
      excerpt: blog.excerpt || "",
    });
    setSubView("editor");
  };

  const openPreview = (blog) => {
    setPreviewBlog(blog);
    setSubView("preview");
  };

  const backToList = () => {
    setSubView("list");
    setEditingBlog(null);
    setPreviewBlog(null);
    setFormData({ ...EMPTY_FORM });
  };

  // ─── Import Word (.docx) or PDF Document ─────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf"].includes(ext)) {
      setImportError(
        "Please select a .docx (Microsoft Word) or text-based .pdf file.",
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setImportError("");
  };

  const handleProcessImport = async () => {
    if (!selectedFile) {
      setImportError("Please select a file to import.");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch("/api/blogs/import", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process document.");
      }

      const imported = json.data;

      // Pre-fill form with extracted data and Cloudinary images
      setEditingBlog(null);
      setFormData({
        ...EMPTY_FORM,
        title: imported.title || "",
        slug: imported.slug || "",
        content: imported.content || "",
        excerpt: imported.excerpt || "",
        readTime: imported.readTime || "4 min read",
        featuredImage: imported.featuredImage || "",
        status: "Draft",
      });

      setShowImportModal(false);
      setSelectedFile(null);
      setSubView("editor");

      showToast(
        `Imported successfully! ${imported.imagesCount} image(s) uploaded to Cloudinary.`,
      );
    } catch (err) {
      console.error("Document import error:", err);
      setImportError(err.message || "Failed to process document.");
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  // ─── Cover Image Upload ─────────────────────────────────────
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, featuredImage: data.url }));
      }
    } catch (error) {
      console.error("Cover upload error:", error);
      showToast("Failed to upload cover image: " + error.message, "error");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // ─── Save Blog (Create or Update) ──────────────────────────
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const method = editingBlog ? "PUT" : "POST";
      const payload = {
        ...formData,
        slug: generateSlug(formData.title),
      };

      if (editingBlog) {
        payload.id = editingBlog.id;
      }

      const res = await fetch("/api/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.errors?.join(", ") || data.error || "Failed to save blog",
        );
      }

      showToast(
        editingBlog
          ? "Blog post updated successfully!"
          : "Blog post created successfully!",
      );
      backToList();
    } catch (error) {
      console.error("Save blog error:", error);
      showToast(error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Toggle Status ──────────────────────────────────────────
  const toggleStatus = async (blog) => {
    setIsTogglingStatus(blog.id);
    try {
      const newStatus = blog.status === "Published" ? "Draft" : "Published";

      const res = await fetch("/api/blogs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          category: blog.category,
          tags: blog.tags,
          featuredImage: blog.featuredImage,
          readTime: blog.readTime,
          author: blog.author,
          status: newStatus,
          content: blog.content,
          excerpt: blog.excerpt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      showToast(
        `Post ${newStatus === "Published" ? "published" : "moved to drafts"}`,
      );
    } catch (error) {
      console.error("Toggle status error:", error);
      showToast(error.message, "error");
    } finally {
      setIsTogglingStatus(null);
    }
  };

  // ─── Delete Blog ────────────────────────────────────────────
  const confirmDelete = (blog) => {
    setDeleteTarget(blog);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/blogs?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete blog");
      }

      showToast("Blog post deleted successfully");
    } catch (error) {
      console.error("Delete blog error:", error);
      showToast(error.message, "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // ─── Title → Slug Sync ─────────────────────────────────────
  const handleTitleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
    }));
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: LIST VIEW
  // ═══════════════════════════════════════════════════════════
  if (subView === "list") {
    const columns = [
      {
        header: "Post",
        render: (row) => (
          <div className="flex items-center gap-3 max-w-sm">
            {row.featuredImage ? (
              <img
                src={row.featuredImage}
                alt={row.title}
                className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0">
              <p
                onClick={() => openEdit(row)}
                className="text-sm font-semibold text-dark truncate hover:text-primary cursor-pointer transition-colors"
              >
                {row.title}
              </p>
              {row.excerpt && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {row.excerpt}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        header: "Category",
        render: (row) =>
          row.category ? (
            <Badge variant="info">{row.category}</Badge>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          ),
      },
      {
        header: "Author",
        render: (row) => (
          <span className="text-sm text-gray-600">
            {row.author || "Anonymous"}
          </span>
        ),
      },
      {
        header: "Date",
        render: (row) => (
          <span className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        header: "Status",
        render: (row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(row);
            }}
            disabled={isTogglingStatus === row.id}
            className="cursor-pointer disabled:opacity-50"
          >
            {isTogglingStatus === row.id ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            ) : (
              <Badge
                variant={row.status === "Published" ? "success" : "default"}
              >
                {row.status || "Draft"}
              </Badge>
            )}
          </button>
        ),
      },
      {
        header: "Actions",
        render: (row) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPreview(row);
              }}
              className="p-2 rounded-lg hover:bg-info-bg transition-colors cursor-pointer"
              title="Preview"
            >
              <Eye className="w-4 h-4 text-gray-400 hover:text-info" />
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
                confirmDelete(row);
              }}
              className="p-2 rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-danger" />
            </button>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              icon={FileUp}
              onClick={() => {
                setImportError("");
                setSelectedFile(null);
                setShowImportModal(true);
              }}
            >
              Import Word / PDF
            </Button>
            <Button icon={Plus} onClick={openCreate}>
              New Post
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileText className="w-5 h-5 text-dark" />
              </div>
              <div>
                <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                  {blogs.length}
                </p>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  TOTAL POSTS
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success-bg">
                <Eye className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                  {blogs.filter((b) => b.status === "Published").length}
                </p>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  PUBLISHED
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-100">
                <Edit className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                  {blogs.filter((b) => b.status === "Draft").length}
                </p>
                <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  DRAFTS
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Blog Table */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-sm text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                  Loading posts...
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card noPadding>
            <Table columns={columns} data={filtered} />
          </Card>
        )}

        {/* ── Document Import Modal ── */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            if (!isImporting) {
              setShowImportModal(false);
              setSelectedFile(null);
              setImportError("");
            }
          }}
          title="Import Article from Word (.docx) or PDF"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                icon={isImporting ? Loader2 : Sparkles}
                onClick={handleProcessImport}
                disabled={isImporting || !selectedFile}
              >
                {isImporting
                  ? "Processing & Uploading to Cloudinary..."
                  : "Import & Edit Blog"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Upload your article in <strong>.docx</strong> (Microsoft Word) or
              text-extractable <strong>.pdf</strong> format. All formatted text,
              headings, bullet lists, and embedded images will be extracted and
              hosted on Cloudinary automatically.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => !isImporting && importInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
                ${
                  selectedFile
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary bg-gray-50/50 hover:bg-primary/5"
                }
                ${isImporting ? "pointer-events-none opacity-60" : ""}
              `}
            >
              <input
                ref={importInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isImporting ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-9 h-9 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-dark">
                      Extracting Document Content...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Parsing headings, paragraphs, and streaming inline images
                      to Cloudinary CDN
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-primary/30 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-dark shrink-0">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to
                        import
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-xs text-primary mb-1">
                    <FileUp className="w-6 h-6 text-dark" />
                  </div>
                  <p className="text-sm font-semibold text-dark">
                    Click to select or drag &amp; drop document
                  </p>
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    Supports .docx and .pdf • Up to 25MB
                  </p>
                </div>
              )}
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Post"
          size="sm"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={isDeleting ? Loader2 : Trash2}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-dark">
              &ldquo;{deleteTarget?.title}&rdquo;
            </span>
            ? This action cannot be undone.
          </p>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: EDITOR VIEW
  // ═══════════════════════════════════════════════════════════
  if (subView === "editor") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={backToList}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-dark" />
            </button>
            <div>
              <h2 className="text-lg font-(family-name:--font-archivo-black) text-dark">
                {editingBlog ? "Edit Post" : "Create New Post"}
              </h2>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mt-0.5">
                {editingBlog
                  ? `Editing: ${editingBlog.title}`
                  : "Write and publish a new blog post"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editingBlog && (
              <Button
                variant="outline"
                icon={FileUp}
                onClick={() => {
                  setImportError("");
                  setSelectedFile(null);
                  setShowImportModal(true);
                }}
              >
                Import Word / PDF
              </Button>
            )}
            <Button variant="ghost" onClick={backToList} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.title.trim()}
              icon={isSaving ? Loader2 : Check}
            >
              {isSaving
                ? "Saving..."
                : editingBlog
                  ? "Save Changes"
                  : "Create Post"}
            </Button>
          </div>
        </div>

        {/* Quick import banner for new posts */}
        {!editingBlog && !formData.content && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-dark">
                  Have an article written in Word (.docx) or PDF?
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Import your document to automatically extract headings,
                  paragraphs, and upload all embedded images to Cloudinary.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={FileUp}
              onClick={() => {
                setImportError("");
                setSelectedFile(null);
                setShowImportModal(true);
              }}
            >
              Import Document
            </Button>
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content — Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter your blog post title..."
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
                {formData.slug && (
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) -mt-2">
                    Slug: /{formData.slug}
                  </p>
                )}
                <Textarea
                  label="Excerpt"
                  placeholder="Brief summary of the post (displayed in previews)..."
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                />
              </div>
            </Card>

            {/* Rich Text Editor */}
            <Card>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark">Content</label>
                <BlogEditor
                  content={formData.content}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, content: html }))
                  }
                />
              </div>
            </Card>
          </div>

          {/* Sidebar — Right Column */}
          <div className="space-y-6">
            {/* Status & Publish */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Publish Settings
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === "Draft" ? "Published" : "Draft",
                      }))
                    }
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                      ${
                        formData.status === "Published"
                          ? "bg-success-bg text-success"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    {formData.status}
                  </button>
                </div>
              </div>
            </Card>

            {/* Featured Image */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-400" />
                  Featured Image
                </h3>

                {formData.featuredImage ? (
                  <div className="relative group">
                    <img
                      src={formData.featuredImage}
                      alt="Cover"
                      className="w-full h-40 object-cover rounded-xl border border-gray-100"
                    />
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          featuredImage: "",
                        }))
                      }
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark/70 text-white hover:bg-danger transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary bg-gray-50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          Click to upload cover image
                        </span>
                        <span className="text-[10px] text-gray-300 font-(family-name:--font-ibm-plex-mono)">
                          JPEG, PNG, WebP • Max 10MB
                        </span>
                      </>
                    )}
                  </button>
                )}

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>
            </Card>

            {/* Meta Fields */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Meta Information
                </h3>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-dark">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    <option value="">Select category...</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) =>
                    setFormData((prev) => ({ ...prev, tags }))
                  }
                />

                {/* Author */}
                <Input
                  label="Author"
                  placeholder="e.g. Sarah Ahmed"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      author: e.target.value,
                    }))
                  }
                />

                {/* Read Time */}
                <Input
                  label="Read Time"
                  placeholder="e.g. 5 min read"
                  value={formData.readTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      readTime: e.target.value,
                    }))
                  }
                />
              </div>
            </Card>
          </div>
        </div>

        {/* ── Document Import Modal (Also available from editor) ── */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            if (!isImporting) {
              setShowImportModal(false);
              setSelectedFile(null);
              setImportError("");
            }
          }}
          title="Import Article from Word (.docx) or PDF"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                icon={isImporting ? Loader2 : Sparkles}
                onClick={handleProcessImport}
                disabled={isImporting || !selectedFile}
              >
                {isImporting
                  ? "Processing & Uploading to Cloudinary..."
                  : "Import & Edit Blog"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Upload your article in <strong>.docx</strong> (Microsoft Word) or
              text-extractable <strong>.pdf</strong> format. All formatted text,
              headings, bullet lists, and embedded images will be extracted and
              hosted on Cloudinary automatically.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => !isImporting && importInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
                ${
                  selectedFile
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary bg-gray-50/50 hover:bg-primary/5"
                }
                ${isImporting ? "pointer-events-none opacity-60" : ""}
              `}
            >
              <input
                ref={importInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isImporting ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-9 h-9 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-dark">
                      Extracting Document Content...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Parsing headings, paragraphs, and streaming inline images
                      to Cloudinary CDN
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-primary/30 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-dark shrink-0">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to
                        import
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-xs text-primary mb-1">
                    <FileUp className="w-6 h-6 text-dark" />
                  </div>
                  <p className="text-sm font-semibold text-dark">
                    Click to select or drag &amp; drop document
                  </p>
                  <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                    Supports .docx and .pdf • Up to 25MB
                  </p>
                </div>
              )}
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: PREVIEW VIEW
  // ═══════════════════════════════════════════════════════════
  if (subView === "preview" && previewBlog) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={backToList}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-dark" />
            </button>
            <div>
              <h2 className="text-lg font-(family-name:--font-archivo-black) text-dark">
                Preview
              </h2>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mt-0.5">
                Blog post preview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                previewBlog.status === "Published" ? "success" : "default"
              }
            >
              {previewBlog.status || "Draft"}
            </Badge>
            <Button variant="ghost" onClick={() => openEdit(previewBlog)}>
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
            <Button variant="ghost" onClick={backToList}>
              Back to List
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <Card>
          <article className="max-w-3xl mx-auto py-4">
            {/* Featured Image */}
            {previewBlog.featuredImage && (
              <img
                src={previewBlog.featuredImage}
                alt={previewBlog.title}
                className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8 border border-gray-100"
              />
            )}

            {/* Category Badge */}
            {previewBlog.category && (
              <div className="mb-4">
                <Badge variant="info">{previewBlog.category}</Badge>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-(family-name:--font-archivo-black) text-dark leading-tight mb-4">
              {previewBlog.title}
            </h1>

            {/* Excerpt */}
            {previewBlog.excerpt && (
              <p className="text-lg text-gray-500 mb-6 leading-relaxed">
                {previewBlog.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-6 mb-8 border-b border-gray-100">
              {previewBlog.author && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {previewBlog.author}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(previewBlog.createdAt)}
              </span>
              {previewBlog.readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {previewBlog.readTime}
                </span>
              )}
            </div>

            {/* Tags */}
            {previewBlog.tags && previewBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {previewBlog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Content Body */}
            <div className="prose prose-lg max-w-none prose-headings:font-(family-name:--font-archivo-black) prose-headings:text-dark prose-p:text-gray-600 prose-a:text-info prose-img:rounded-xl prose-blockquote:border-l-primary">
              {previewBlog.content ? (
                parse(previewBlog.content)
              ) : (
                <p className="text-gray-400 italic">No content yet.</p>
              )}
            </div>
          </article>
        </Card>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // Fallback
  return null;
}
