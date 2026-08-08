"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Search,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { resources as initialResources } from "@/data/mockData";

const categoryIcons = {
  PDF: FileText,
  "Past Paper": FileSpreadsheet,
  Worksheet: File,
};

const categoryVariant = {
  PDF: "info",
  "Past Paper": "warning",
  Worksheet: "success",
};

export default function ResourcesView() {
  const [resources, setResources] = useState(initialResources);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "PDF",
    subject: "",
  });

  const categories = ["All", "PDF", "Past Paper", "Worksheet"];

  const filtered = resources.filter((r) => {
    const matchCategory =
      activeCategory === "All" || r.category === activeCategory;
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAdd = () => {
    const newResource = {
      id: Date.now(),
      ...formData,
      fileUrl: "#",
      uploadDate: new Date().toISOString().split("T")[0],
      downloads: 0,
    };
    setResources([newResource, ...resources]);
    setShowAddModal(false);
    setFormData({ title: "", category: "PDF", subject: "" });
  };

  const handleDelete = () => {
    setResources(resources.filter((r) => r.id !== deleteTarget.id));
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = (resource) => {
    setDeleteTarget(resource);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Resource
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer
              ${
                activeCategory === cat
                  ? "bg-dark text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((resource) => {
          const Icon = categoryIcons[resource.category] || FileText;
          return (
            <Card key={resource.id} className="group">
              <div className="space-y-3">
                {/* Icon + Category */}
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-canvas">
                    <Icon className="w-6 h-6 text-deep-blue" />
                  </div>
                  <Badge variant={categoryVariant[resource.category]}>
                    {resource.category}
                  </Badge>
                </div>

                {/* Title & Subject */}
                <div>
                  <h3 className="text-sm font-semibold text-dark leading-snug line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{resource.subject}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {resource.downloads}
                  </span>
                  <span>{resource.uploadDate}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Download}
                    className="flex-1"
                  >
                    Download
                  </Button>
                  <button
                    onClick={() => confirmDelete(resource)}
                    className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No resources found.</p>
        </div>
      )}

      {/* Add Resource Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Resource"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Resource</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. O-Level Math Past Papers 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "PDF", label: "PDF" },
              { value: "Past Paper", label: "Past Paper" },
              { value: "Worksheet", label: "Worksheet" },
            ]}
          />
          <Input
            label="Subject"
            placeholder="e.g. Mathematics"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Resource"
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
