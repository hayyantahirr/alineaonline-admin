"use client";

import { useState } from "react";
import { Filter, CalendarDays } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import { Select } from "@/components/ui/Input";
import { bookings } from "@/data/mockData";

const statusVariant = {
  Upcoming: "info",
  Completed: "success",
  Cancelled: "danger",
};

export default function BookingsView() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const allSubjects = [...new Set(bookings.map((b) => b.subject))];

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const matchSubject = subjectFilter === "All" || b.subject === subjectFilter;
    return matchStatus && matchSubject;
  });

  const columns = [
    {
      header: "Student",
      render: (row) => (
        <span className="font-medium text-dark">{row.studentName}</span>
      ),
    },
    {
      header: "Teacher",
      render: (row) => (
        <span className="text-gray-600">{row.teacherName}</span>
      ),
    },
    { header: "Subject", accessor: "subject" },
    {
      header: "Date & Time",
      render: (row) => (
        <div>
          <p className="text-sm text-dark font-medium">{row.date}</p>
          <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
            {row.time} · {row.duration}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info-bg">
              <CalendarDays className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {bookings.filter((b) => b.status === "Upcoming").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                UPCOMING
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-bg">
              <CalendarDays className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {bookings.filter((b) => b.status === "Completed").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                COMPLETED
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-bg">
              <CalendarDays className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {bookings.filter((b) => b.status === "Cancelled").length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                CANCELLED
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Upcoming", label: "Upcoming" },
              { value: "Completed", label: "Completed" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
          />
          <Select
            label="Subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: "All", label: "All Subjects" },
              ...allSubjects.map((s) => ({ value: s, label: s })),
            ]}
          />
          {(statusFilter !== "All" || subjectFilter !== "All") && (
            <button
              onClick={() => {
                setStatusFilter("All");
                setSubjectFilter("All");
              }}
              className="text-xs text-danger hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Bookings Table */}
      <Card noPadding>
        <Table columns={columns} data={filtered} />
      </Card>
    </div>
  );
}
