"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Check,
  MessageSquare,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function NotificationDropdown({
  userId,
  userRole = "client",
  isMobile = false,
}) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (type, id) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      // Remove from list after marking as read
      setNotifications((prev) =>
        prev.filter((n) => !(n.type === type && n.referenceId === id))
      );
    } catch (err) {
      console.error("Failed to mark notification:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "proposal":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "contract":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "changeRequest":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "bookingUpdate":
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case "progressUpdate":
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationLink = (notif) => {
    // Everything routes to the conversation if it exists
    if (notif.conversationId) {
      return `/messages?conversation=${notif.conversationId}`;
    }

    // Fallback to bookings page if no conversation yet
    if (notif.bookingId) {
      return `/${userRole}/bookings/${notif.bookingId}`;
    }

    return `/${userRole}/bookings`;
  };

  const unreadCount = notifications.length;

  // MOBILE VERSION - Full width button
  if (isMobile) {
    return (
      <div className="relative w-full" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group w-full"
        >
          <div className="relative">
            <Bell
              size={20}
              className="text-gray-600 group-hover:text-[#094074]"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-[#094074]">
            Notifications
          </span>
        </button>

        {/* Mobile Dropdown - Centered Modal */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-transparent z-[60]"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">No new notifications</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <a
                              href={getNotificationLink(notif)}
                              className="block hover:underline"
                              onClick={() => setIsOpen(false)}
                            >
                              <p className="font-medium text-gray-900 text-sm mb-1">
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {notif.message}
                                </p>
                              )}
                              {notif.timestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {notif.timestamp}
                                </p>
                              )}
                            </a>
                          </div>

                          {/* Mark as read button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationAction(
                                notif.type,
                                notif.referenceId
                              );
                            }}
                            className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VERSION - Icon with text label
  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 text-[#094074] hover:text-[#c89933] transition-colors"
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm font-medium inline lg:hidden">
          Notifications
        </span>
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-lg">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No new notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <a
                          href={getNotificationLink(notif)}
                          className="block hover:underline"
                        >
                          <p className="font-medium text-gray-900 text-sm mb-1">
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          {notif.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notif.timestamp}
                            </p>
                          )}
                        </a>
                      </div>

                      {/* Mark as read button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationAction(
                            notif.type,
                            notif.referenceId
                          );
                        }}
                        className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
