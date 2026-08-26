"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  unreadByCategory: {
    applications: 0,
    bookings: 0,
    messages: 0,
  },
  activeToast: null,
  soundEnabled: true,
  desktopPermission: "default",
  toggleSound: () => {},
  requestDesktopPermission: async () => {},
  markAsRead: (id) => {},
  markAllAsRead: () => {},
  clearNotification: (id) => {},
  clearCategoryNotifications: (type) => {},
  clearAllNotifications: () => {},
  dismissToast: () => {},
  readIds: new Set(),
});

// ─── Synthetic Audio Chime using Web Audio API ──────────────────
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Create a cheerful 2-tone melodic chime (C6 -> G6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15); // G6

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Harmonizing second oscillator
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.25); // C7

    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("Audio chime playback error:", err);
  }
}

export function NotificationProvider({ children }) {
  const [allRawNotifications, setAllRawNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [clearedIds, setClearedIds] = useState(new Set());
  const [activeToast, setActiveToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopPermission, setDesktopPermission] = useState("default");

  // Keep track of loaded status so we don't trigger toast on initial bulk load
  const isInitialLoadRef = useRef({
    applications: true,
    bookings: true,
    messages: true,
  });

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Initialize sound preference, read IDs, cleared IDs & desktop permission from browser
  useEffect(() => {
    try {
      const savedSound = localStorage.getItem("alinea_admin_sound");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }
      const savedRead = localStorage.getItem("alinea_admin_read_notifs");
      if (savedRead) {
        setReadIds(new Set(JSON.parse(savedRead)));
      }
      const savedCleared = localStorage.getItem("alinea_admin_cleared_notifs");
      if (savedCleared) {
        setClearedIds(new Set(JSON.parse(savedCleared)));
      }
      if (typeof window !== "undefined" && "Notification" in window) {
        setDesktopPermission(Notification.permission);
      }
    } catch (e) {
      console.warn("Error reading localStorage", e);
    }
  }, []);

  const triggerAlert = useCallback((item) => {
    // If user previously cleared this item, un-clear it for the fresh incoming alert
    setClearedIds((prev) => {
      if (prev.has(item.id)) {
        const next = new Set(prev);
        next.delete(item.id);
        try {
          localStorage.setItem(
            "alinea_admin_cleared_notifs",
            JSON.stringify(Array.from(next)),
          );
        } catch (e) {
          console.warn(e);
        }
        return next;
      }
      return prev;
    });

    // 1. Set floating toast banner
    setActiveToast(item);

    // 2. Play sound chime if enabled
    if (soundEnabledRef.current) {
      playNotificationChime();
    }

    // 3. Trigger Browser Desktop Notification if granted
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        const notif = new Notification(item.title, {
          body: `${item.subtitle}\n${item.description}`,
          icon: "/favicon.ico",
          tag: item.id,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn("Desktop notification dispatch error:", err);
      }
    }
  }, []);

  // ── Firestore Listeners for Applications, Bookings, and Messages ──
  useEffect(() => {
    let rawApps = [];
    let rawBookings = [];
    let rawMessages = [];

    const rebuildNotifications = () => {
      const combined = [...rawApps, ...rawBookings, ...rawMessages];
      // Sort newest first
      combined.sort((a, b) => {
        const timeA = a.rawTimestamp?.seconds || 0;
        const timeB = b.rawTimestamp?.seconds || 0;
        return timeB - timeA;
      });
      setAllRawNotifications(combined);
    };

    // 1. Applications Listener
    const appsRef = collection(db, "career_applications");
    const unsubApps = onSnapshot(appsRef, (snapshot) => {
      if (!isInitialLoadRef.current.applications) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const applicantName =
              data.fullName || data.name || "New Applicant";
            const subject = data.subject || "Teacher Application";
            triggerAlert({
              id: `app_${change.doc.id}`,
              type: "application",
              title: "New Career Application",
              subtitle: applicantName,
              description: `Applied for ${subject} tutor position`,
              targetView: "applications",
              docId: change.doc.id,
              timestamp: new Date(),
            });
          }
        });
      }
      isInitialLoadRef.current.applications = false;

      rawApps = snapshot.docs.map((d) => {
        const data = d.data();
        const applicantName = data.fullName || data.name || "Applicant";
        const subject = data.subject || "Teacher Application";
        const isUnread =
          (data.status || "unread").toLowerCase() === "unread" ||
          (data.status || "").toLowerCase() === "pending";

        return {
          id: `app_${d.id}`,
          docId: d.id,
          type: "application",
          title: "Career Application",
          subtitle: applicantName,
          description: `Applied for ${subject} (${data.experience || "Experience N/A"})`,
          targetView: "applications",
          rawTimestamp: data.createdAt || data.date,
          status: data.status || "unread",
          isItemUnread: isUnread,
        };
      });

      rebuildNotifications();
    });

    // 2. Bookings Listener
    const bookingsRef = collection(db, "consultation_bookings");
    const unsubBookings = onSnapshot(bookingsRef, (snapshot) => {
      if (!isInitialLoadRef.current.bookings) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const student = data.studentName || data.parentName || "Student";
            const subject = data.subject || "Consultation";
            triggerAlert({
              id: `booking_${change.doc.id}`,
              type: "booking",
              title: "New Consultation Booking",
              subtitle: `${student} (${subject})`,
              description: `Session with ${data.teacherName || "Specialist"} • ${data.timeSlot || "Flexible"}`,
              targetView: "bookings",
              docId: change.doc.id,
              timestamp: new Date(),
            });
          }
        });
      }
      isInitialLoadRef.current.bookings = false;

      rawBookings = snapshot.docs.map((d) => {
        const data = d.data();
        const student = data.studentName || data.parentName || "Student";
        const subject = data.subject || "Consultation";
        const isUnread =
          (data.status || "pending").toLowerCase() === "pending";

        return {
          id: `booking_${d.id}`,
          docId: d.id,
          type: "booking",
          title: "Session Booking",
          subtitle: student,
          description: `${subject} • Teacher: ${data.teacherName || "Assigned"}`,
          targetView: "bookings",
          rawTimestamp: data.createdAt || data.date,
          status: data.status || "Pending",
          isItemUnread: isUnread,
        };
      });

      rebuildNotifications();
    });

    // 3. Contact Messages Listener
    const messagesRef = collection(db, "contact_messages");
    const unsubMessages = onSnapshot(messagesRef, (snapshot) => {
      if (!isInitialLoadRef.current.messages) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const sender = data.name || data.fullName || "Visitor";
            const subject = data.subject || data.topic || "Inquiry";
            triggerAlert({
              id: `msg_${change.doc.id}`,
              type: "message",
              title: "New Contact Message",
              subtitle: sender,
              description: subject,
              targetView: "messages",
              docId: change.doc.id,
              timestamp: new Date(),
            });
          }
        });
      }
      isInitialLoadRef.current.messages = false;

      rawMessages = snapshot.docs.map((d) => {
        const data = d.data();
        const sender = data.name || data.fullName || "Visitor";
        const isUnread =
          data.read === false ||
          (data.status || "").toLowerCase() === "unread";

        return {
          id: `msg_${d.id}`,
          docId: d.id,
          type: "message",
          title: "Contact Inquiry",
          subtitle: sender,
          description: data.subject || data.message || "New message received",
          targetView: "messages",
          rawTimestamp: data.createdAt || data.date,
          status: isUnread ? "unread" : "read",
          isItemUnread: isUnread,
        };
      });

      rebuildNotifications();
    });

    return () => {
      unsubApps();
      unsubBookings();
      unsubMessages();
    };
  }, [triggerAlert]);

  // ── Filter Out Cleared Notifications ──
  const notifications = allRawNotifications.filter(
    (n) => !clearedIds.has(n.id),
  );

  // ── Unread Counts Calculations ──
  const unreadByCategory = {
    applications: notifications.filter(
      (n) =>
        n.type === "application" && !readIds.has(n.id) && n.isItemUnread,
    ).length,
    bookings: notifications.filter(
      (n) => n.type === "booking" && !readIds.has(n.id) && n.isItemUnread,
    ).length,
    messages: notifications.filter(
      (n) => n.type === "message" && !readIds.has(n.id) && n.isItemUnread,
    ).length,
  };

  const unreadCount =
    unreadByCategory.applications +
    unreadByCategory.bookings +
    unreadByCategory.messages;

  // ── Actions ──
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("alinea_admin_sound", String(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopPermission(perm);
      } catch (err) {
        console.warn("Desktop notification permission error:", err);
      }
    }
  };

  const markAsRead = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(
          "alinea_admin_read_notifs",
          JSON.stringify(Array.from(next)),
        );
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = new Set(allRawNotifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(
        "alinea_admin_read_notifs",
        JSON.stringify(Array.from(allIds)),
      );
    } catch (e) {
      console.warn(e);
    }
  };

  // ── Clear Functions ──
  const clearNotification = (id) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(
          "alinea_admin_cleared_notifs",
          JSON.stringify(Array.from(next)),
        );
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const clearCategoryNotifications = (type) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      allRawNotifications
        .filter((n) => (type === "all" ? true : n.type === type))
        .forEach((n) => next.add(n.id));

      try {
        localStorage.setItem(
          "alinea_admin_cleared_notifs",
          JSON.stringify(Array.from(next)),
        );
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const clearAllNotifications = () => {
    clearCategoryNotifications("all");
  };

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadByCategory,
        activeToast,
        soundEnabled,
        desktopPermission,
        toggleSound,
        requestDesktopPermission,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearCategoryNotifications,
        clearAllNotifications,
        dismissToast,
        readIds,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
