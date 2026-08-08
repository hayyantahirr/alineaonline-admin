"use client";

import { useState } from "react";
import {
  Mail,
  MailOpen,
  Eye,
  Archive,
  Reply,
  Circle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { contactMessages as initialMessages } from "@/data/mockData";

export default function ContactMessagesView() {
  const [messages, setMessages] = useState(initialMessages);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? messages
      : filter === "Unread"
      ? messages.filter((m) => !m.read)
      : messages.filter((m) => m.read);

  const unreadCount = messages.filter((m) => !m.read).length;

  const openMessage = (msg) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
    // Mark as read
    setMessages(
      messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
    );
  };

  const handleArchive = (id) => {
    setMessages(messages.filter((m) => m.id !== id));
    setShowMessageModal(false);
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
                ${!msg.read ? "bg-info-bg/30" : ""}
              `}
            >
              {/* Read indicator */}
              <div className="pt-1.5 shrink-0">
                {!msg.read ? (
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
                      !msg.read ? "font-semibold text-dark" : "font-medium text-gray-600"
                    }`}
                  >
                    {msg.name}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0 font-(family-name:--font-ibm-plex-mono)">
                    {msg.date}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    !msg.read ? "text-dark font-medium" : "text-gray-500"
                  }`}
                >
                  {msg.subject}
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
          <>
            <Button
              variant="ghost"
              icon={Archive}
              onClick={() => handleArchive(selectedMessage?.id)}
            >
              Archive
            </Button>
            <Button icon={Reply}>Reply</Button>
          </>
        }
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  From: <span className="font-medium">{selectedMessage.name}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {selectedMessage.email}
                </p>
              </div>
              <Badge variant={selectedMessage.read ? "default" : "info"}>
                {selectedMessage.read ? "Read" : "Unread"}
              </Badge>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-(family-name:--font-ibm-plex-mono) mb-2">
                {selectedMessage.date}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {selectedMessage.message}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
