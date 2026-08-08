"use client";

import { useState } from "react";
import { Plus, Star, Search, Edit, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { teachers as initialTeachers } from "@/data/mockData";

export default function TeachersView() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    status: "Active",
  });

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    const newTeacher = {
      id: Date.now(),
      ...formData,
      rating: 0,
      initials: formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      joinDate: new Date().toISOString().split("T")[0],
      students: 0,
    };
    setTeachers([newTeacher, ...teachers]);
    setShowAddModal(false);
    setFormData({ name: "", email: "", subject: "", status: "Active" });
  };

  const handleEdit = () => {
    setTeachers(
      teachers.map((t) =>
        t.id === selectedTeacher.id ? { ...t, ...formData } : t
      )
    );
    setShowEditModal(false);
    setSelectedTeacher(null);
  };

  const openEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      status: teacher.status,
    });
    setShowEditModal(true);
  };

  const openView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(rating)
              ? "fill-primary text-primary"
              : "text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs text-gray-500 font-[family-name:var(--font-ibm-plex-mono)]">
        {rating}
      </span>
    </div>
  );

  const columns = [
    {
      header: "Teacher",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-deep-blue rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {row.initials}
            </span>
          </div>
          <div>
            <p className="font-semibold text-dark text-sm">{row.name}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Subject", accessor: "subject" },
    {
      header: "Rating",
      render: (row) => renderStars(row.rating),
    },
    {
      header: "Students",
      render: (row) => (
        <span className="font-[family-name:var(--font-ibm-plex-mono)] text-sm">
          {row.students}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "Active" ? "success" : "warning"}>
          {row.status}
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
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ),
    },
  ];

  const formFields = (
    <div className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Sarah Ahmed"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        placeholder="e.g. sarah@alinea.edu"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <Input
        label="Subject"
        placeholder="e.g. Mathematics"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Teacher
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-bg">
              <div className="w-2 h-2 bg-success rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
                {teachers.filter((t) => t.status === "Active").length}
              </p>
              <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                ACTIVE
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-bg">
              <div className="w-2 h-2 bg-warning rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
                {teachers.filter((t) => t.status === "On Leave").length}
              </p>
              <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                ON LEAVE
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info-bg">
              <Star className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-[family-name:var(--font-archivo-black)] text-dark">
                {(teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                AVG RATING
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card noPadding>
        <Table columns={columns} data={filtered} />
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Teacher"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Teacher</Button>
          </>
        }
      >
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Teacher"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </>
        }
      >
        {formFields}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Teacher Profile"
        size="md"
      >
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-deep-blue rounded-2xl flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {selectedTeacher.initials}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark">
                  {selectedTeacher.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedTeacher.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  SUBJECT
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  RATING
                </p>
                {renderStars(selectedTeacher.rating)}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  STUDENTS
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.students}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  JOINED
                </p>
                <p className="text-sm font-medium text-dark">
                  {selectedTeacher.joinDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-ibm-plex-mono)]">
                  STATUS
                </p>
                <Badge
                  variant={
                    selectedTeacher.status === "Active" ? "success" : "warning"
                  }
                >
                  {selectedTeacher.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
