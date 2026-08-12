"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  MailOpen,
  Circle,
  Phone,
  MessageCircle,
  Trash2,
  User,
  Calendar,
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
import Badge from "@/components/ui/Badge";
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
            data.name ||
            data.studentName ||
            data.parentName ||
            "Anonymous";

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
      }
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
              px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
              ${
                filter === tab
                  ? "bg-dark text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            {tab}
            {tab === "Unread" && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-dark text-xs font-semibold">
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
                w-full flex items-start gap-4 p-4 text-left
                hover:bg-primary/5 transition-colors cursor-pointer
                ${!msg.isRead ? "bg-info-bg/30" : ""}
              `}
            >
              {/* Read indicator */}
              <div className="pt-1.5 shrink-0">
                {!msg.isRead ? (
                  <Circle className="w-2.5 h-2.5 fill-info text-info" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-gray-200" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p
                    className={`text-sm truncate ${
                      !msg.isRead
                        ? "font-semibold text-dark"
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
                  <span className="text-xs text-gray-400 shrink-0 font-(family-name:--font-ibm-plex-mono)">
                    {msg.formattedDate}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    !msg.isRead ? "text-dark font-medium" : "text-gray-500"
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
            {selectedMessage?.phone && (
              <>
                <Button
                  variant="outline"
                  icon={Phone}
                  onClick={() =>
                    window.open(`tel:${selectedMessage.phone}`, "_self")
                  }
                >
                  Call
                </Button>
                <Button
                  variant="outline"
                  icon={MessageCircle}
                  onClick={() =>
                    window.open(
                      `https://wa.me/${selectedMessage.phone.replace(
                        /[^0-9]/g,
                        ""
                      )}`,
                      "_blank"
                    )
                  }
                >
                  WhatsApp
                </Button>
              </>
            )}
            {selectedMessage?.email && (
              <Button
                icon={Mail}
                onClick={() =>
                  window.open(`mailto:${selectedMessage.email}`, "_blank")
                }
              >
                Email
              </Button>
            )}
          </div>
        }
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark">
                  {selectedMessage.subject || "No Subject"}
                </h3>
                <div className="space-y-1 mt-2 text-sm text-gray-600">
                  {selectedMessage.studentName && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Student:</span>
                      <span className="font-medium text-dark">
                        {selectedMessage.studentName}
                      </span>
                    </p>
                  )}
                  {selectedMessage.parentName && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Parent:</span>
                      <span className="font-medium text-dark">
                        {selectedMessage.parentName}
                      </span>
                    </p>
                  )}
                  {!selectedMessage.studentName &&
                    !selectedMessage.parentName &&
                    selectedMessage.name && (
                      <p className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>From:</span>
                        <span className="font-medium text-dark">
                          {selectedMessage.name}
                        </span>
                      </p>
                    )}
                  {selectedMessage.email && (
                    <p className="text-xs text-gray-500">
                      Email: {selectedMessage.email}
                    </p>
                  )}
                  {selectedMessage.phone && (
                    <p className="text-xs text-gray-500">
                      Phone: {selectedMessage.phone}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={selectedMessage.isRead ? "default" : "info"}>
                {selectedMessage.isRead ? "Read" : "Unread"}
              </Badge>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {selectedMessage.formattedDate}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {selectedMessage.message}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
