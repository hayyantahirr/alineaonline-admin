"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen, Tag } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { subjects as initialSubjects } from "@/data/mockData";

const levelVariant = {
  "O-Level": "info",
  "A-Level": "warning",
  IGCSE: "success",
};

const categoryColors = {
  Science: "bg-blue-50 text-blue-600",
  Math: "bg-yellow-50 text-yellow-700",
  Humanities: "bg-purple-50 text-purple-600",
  Languages: "bg-green-50 text-green-600",
};

export default function SubjectsView() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    level: "O-Level",
    category: "Science",
  });

  const levels = [...new Set(subjects.map((s) => s.level))];
  const grouped = levels.reduce((acc, level) => {
    acc[level] = subjects.filter((s) => s.level === level);
    return acc;
  }, {});

  const handleAdd = () => {
    const newSubject = {
      id: Date.now(),
      ...formData,
    };
    setSubjects([...subjects, newSubject]);
    setShowAddModal(false);
    setFormData({ name: "", level: "O-Level", category: "Science" });
  };

  const handleDelete = () => {
    setSubjects(subjects.filter((s) => s.id !== deleteTarget.id));
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = (subject) => {
    setDeleteTarget(subject);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Subjects</p>
            <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
              {subjects.length}
            </p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Subject
        </Button>
      </div>

      {/* Grouped by Level */}
      {Object.entries(grouped).map(([level, levelSubjects]) => (
        <div key={level}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-base font-[family-name:var(--font-archivo-black)] text-dark">
              {level}
            </h3>
            <Badge variant={levelVariant[level]}>
              {levelSubjects.length} subjects
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {levelSubjects.map((subject) => (
              <Card key={subject.id}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-dark">
                      {subject.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          categoryColors[subject.category] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {subject.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmDelete(subject)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Add Subject Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Subject"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Subject</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Geography"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="Level"
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: e.target.value })
            }
            options={[
              { value: "O-Level", label: "O-Level" },
              { value: "A-Level", label: "A-Level" },
              { value: "IGCSE", label: "IGCSE" },
            ]}
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "Science", label: "Science" },
              { value: "Math", label: "Math" },
              { value: "Humanities", label: "Humanities" },
              { value: "Languages", label: "Languages" },
            ]}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove Subject"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-dark">
            {deleteTarget?.name} ({deleteTarget?.level})
          </span>
          ?
        </p>
      </Modal>
    </div>
  );
}
