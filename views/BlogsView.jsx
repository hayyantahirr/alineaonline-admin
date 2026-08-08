"use client";

import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Search,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { Input, Textarea } from "@/components/ui/Input";
import { blogs as initialBlogs } from "@/data/mockData";

export default function BlogsView() {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    excerpt: "",
    content: "",
    status: "Draft",
  });

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (editingBlog) {
      setBlogs(
        blogs.map((b) =>
          b.id === editingBlog.id
            ? {
                ...b,
                ...formData,
                publishDate:
                  formData.status === "Published" && !b.publishDate
                    ? new Date().toISOString().split("T")[0]
                    : b.publishDate,
              }
            : b
        )
      );
    } else {
      const newBlog = {
        id: Date.now(),
        ...formData,
        publishDate:
          formData.status === "Published"
            ? new Date().toISOString().split("T")[0]
            : null,
      };
      setBlogs([newBlog, ...blogs]);
    }
    closeEditor();
  };

  const openCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: "",
      author: "",
      excerpt: "",
      content: "",
      status: "Draft",
    });
    setShowEditorModal(true);
  };

  const openEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      author: blog.author,
      excerpt: blog.excerpt,
      content: blog.content,
      status: blog.status,
    });
    setShowEditorModal(true);
  };

  const closeEditor = () => {
    setShowEditorModal(false);
    setEditingBlog(null);
    setFormData({ title: "", author: "", excerpt: "", content: "", status: "Draft" });
  };

  const togglePublish = (blog) => {
    setBlogs(
      blogs.map((b) =>
        b.id === blog.id
          ? {
              ...b,
              status: b.status === "Published" ? "Draft" : "Published",
              publishDate:
                b.status === "Draft"
                  ? new Date().toISOString().split("T")[0]
                  : b.publishDate,
            }
          : b
      )
    );
  };

  const handleDelete = () => {
    setBlogs(blogs.filter((b) => b.id !== deleteTarget.id));
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = (blog) => {
    setDeleteTarget(blog);
    setShowDeleteModal(true);
  };

  const columns = [
    {
      header: "Title",
      render: (row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-dark text-sm truncate">
            {row.title}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {row.excerpt}
          </p>
        </div>
      ),
    },
    {
      header: "Author",
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row.author}</span>
        </div>
      ),
    },
    {
      header: "Date",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">
            {row.publishDate || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePublish(row);
          }}
          className="cursor-pointer"
        >
          <Badge variant={row.status === "Published" ? "success" : "default"}>
            {row.status}
          </Badge>
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
              openEdit(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete(row);
            }}
            className="p-2 rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
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
        <Button icon={Plus} onClick={openCreate}>
          New Post
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-bg">
              <Eye className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
                {blogs.filter((b) => b.status === "Published").length}
              </p>
              <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
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
              <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
                {blogs.filter((b) => b.status === "Draft").length}
              </p>
              <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                DRAFTS
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Blog Table */}
      <Card noPadding>
        <Table columns={columns} data={filtered} />
      </Card>

      {/* Editor Modal */}
      <Modal
        isOpen={showEditorModal}
        onClose={closeEditor}
        title={editingBlog ? "Edit Post" : "Create New Post"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeEditor}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBlog ? "Save Changes" : "Create Post"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter post title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Input
            label="Author"
            placeholder="e.g. Sarah Ahmed"
            value={formData.author}
            onChange={(e) =>
              setFormData({ ...formData, author: e.target.value })
            }
          />
          <Input
            label="Excerpt"
            placeholder="Brief summary of the post"
            value={formData.excerpt}
            onChange={(e) =>
              setFormData({ ...formData, excerpt: e.target.value })
            }
          />
          <Textarea
            label="Content"
            placeholder="Write your article content here..."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />
          <div className="flex items-center gap-3 pt-2">
            <label className="text-sm font-medium text-dark">Status:</label>
            <button
              onClick={() =>
                setFormData({
                  ...formData,
                  status: formData.status === "Draft" ? "Published" : "Draft",
                })
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
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Post"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete}>
              Delete
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
    </div>
  );
}
