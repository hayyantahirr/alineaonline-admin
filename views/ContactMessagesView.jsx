"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  MailOpen,
  Circle, Trash2,
  User,
  Calendar
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ContactMessagesView() {
  const [messages, setMessages] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("All");

  const helperFormatDate = (rawDate, createdAt) => {
    try {
      if (createdAt?.toDate && typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (createdAt?.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Error formatting date", e);
    }
    return rawDate || "Recent";
  };

  useEffect(() => {
    const messagesRef = collection(db, "contact_messages");

    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const isRead = data.status === "read" || data.read === true;
          const formattedDate = helperFormatDate(data.date, data.createdAt);
          const displayName =
            data.name || data.studentName || data.parentName || "Anonymous";

          return {
            id: docSnap.id,
            ...data,
            isRead,
            formattedDate,
            displayName,
          };
        });

        // Sort by timestamp or fallback
        msgs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setMessages(msgs);

        // Update selected message if open
        if (selectedMessage) {
          const updatedSelected = msgs.find((m) => m.id === selectedMessage.id);
          if (updatedSelected) {
            setSelectedMessage(updatedSelected);
          } else {
            setShowMessageModal(false);
          }
        }
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [selectedMessage]);

  const filtered =
    filter === "All"
      ? messages
      : filter === "Unread"
        ? messages.filter((m) => !m.isRead)
        : messages.filter((m) => m.isRead);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const openMessage = async (msg) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
    // Mark as read in Firestore if unread
    if (!msg.isRead) {
      try {
        const msgRef = doc(db, "contact_messages", msg.id);
        await updateDoc(msgRef, {
          read: true,
          status: "read",
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  const handleArchive = async (id) => {
    try {
      const msgRef = doc(db, "contact_messages", id);
      await deleteDoc(msgRef);
      setShowMessageModal(false);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info-bg">
              <Mail className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {messages.length}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                TOTAL MESSAGES
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-bg">
              <Mail className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {unreadCount}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                UNREAD
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-bg">
              <MailOpen className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-(family-name:--font-archivo-black) text-dark">
                {messages.length - unreadCount}
              </p>
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono)">
                READ
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["All", "Unread", "Read"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2
              ${
                filter === tab
                  ? "bg-dark text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            <span>{tab}</span>
            {tab === "Unread" && unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-dark text-xs font-bold font-(family-name:--font-ibm-plex-mono) animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-dark" />
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <Card noPadding>
        <div className="divide-y divide-gray-50">
          {filtered.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`
                w-full flex items-start gap-4 p-4 text-left relative
                hover:bg-primary/5 transition-all cursor-pointer
                ${
                  !msg.isRead
                    ? "bg-blue-50/40 border-l-4 border-l-blue-500"
                    : "border-l-4 border-l-transparent"
                }
              `}
            >
              {/* Read indicator */}
              <div className="pt-1.5 shrink-0">
                {!msg.isRead ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
                  </span>
                ) : (
                  <Circle className="w-2.5 h-2.5 text-gray-200" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        !msg.isRead
                          ? "font-bold text-dark"
                          : "font-medium text-gray-600"
                      }`}
                    >
                      {msg.displayName}
                      {msg.studentName && msg.parentName && (
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          (Parent: {msg.parentName})
                        </span>
                      )}
                    </p>

                    {/* Unread Bubble Indicator */}
                    {!msg.isRead && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-xs shrink-0 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        NEW INQUIRY
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 shrink-0 font-(family-name:--font-ibm-plex-mono)">
                    {msg.formattedDate}
                  </span>
                </div>

                <p
                  className={`text-sm truncate ${
                    !msg.isRead ? "text-dark font-semibold" : "text-gray-500"
                  }`}
                >
                  {msg.subject || "No Subject"}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {msg.message}
                </p>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <MailOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages found.</p>
          </div>
        )}
      </Card>

      {/* Message Detail Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Message Details"
        size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => handleArchive(selectedMessage?.id)}
            >
              Delete
            </Button>
            <Button onClick={() => setShowMessageModal(false)}>Close</Button>
          </div>
        }
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-dark">
                    {selectedMessage.displayName}
                  </span>
                  {!selectedMessage.isRead && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                      New
                    </span>
                  )}
                </div>
                {selectedMessage.studentName && selectedMessage.parentName && (
                  <p className="text-xs text-gray-500 ml-6">
                    Student: {selectedMessage.studentName} | Parent:{" "}
                    {selectedMessage.parentName}
                  </p>
                )}
                {selectedMessage.email && (
                  <p className="text-xs text-gray-500 ml-6">
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-primary-hover hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </p>
                )}
                {selectedMessage.phone && (
                  <p className="text-xs text-gray-500 ml-6">
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="text-primary-hover hover:underline"
                    >
                      {selectedMessage.phone}
                    </a>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 self-start font-(family-name:--font-ibm-plex-mono)">
                <Calendar className="w-4 h-4" />
                <span>{selectedMessage.formattedDate}</span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Subject
              </label>
              <p className="text-sm font-bold text-dark mt-1">
                {selectedMessage.subject || "No Subject"}
              </p>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-(family-name:--font-ibm-plex-mono)">
                Message Content
              </label>
              <div className="mt-1 p-4 rounded-xl bg-gray-50/50 border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
