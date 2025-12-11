"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, CalendarDays, User } from "lucide-react";

export default function BookingsPage({ currentUser }) {
  const [role, setRole] = useState("client");
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/bookings/summary?role=${role}`)
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [role]);

  const filterBookings = (statusType) => {
    const now = new Date();
    switch (statusType) {
      case "past":
        return bookings.filter(
          (b) => b.completedAt && new Date(b.completedAt) < now
        );
      case "present":
        return bookings.filter(
          (b) => b.status === "IN_PROGRESS" || b.status === "CONFIRMED"
        );
      case "future":
        return bookings.filter(
          (b) =>
            b.startDate &&
            new Date(b.startDate) > now &&
            b.status === "CONFIRMED"
        );
      default:
        return bookings;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      COMPLETED: "bg-green-50 text-green-700 border-green-200",
      IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
      CANCELLED: "bg-red-50 text-red-700 border-red-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#094074] border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      type: "past",
      title: "Past",
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      type: "present",
      title: "Active",
      icon: Clock,
      iconColor: "text-yellow-600",
    },
    {
      type: "future",
      title: "Upcoming",
      icon: CalendarDays,
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Bookings Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm">
                      Manage and track all your bookings
                    </p>
                  </div>
                </div>

                {/* Role Toggle */}
                <div className="flex gap-2 bg-white p-1.5 rounded-xl border-2 border-gray-200">
                  <button
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      role === "client"
                        ? "bg-gradient-to-r from-[#094074] to-[#0f5d8c] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setRole("client")}
                  >
                    Client
                  </button>
                  <button
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      role === "resolver"
                        ? "bg-gradient-to-r from-[#094074] to-[#0f5d8c] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setRole("resolver")}
                  >
                    Resolver
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sections.map((section) => {
                  const count = filterBookings(section.type).length;
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.type}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        <p className="text-gray-600 text-sm font-medium mb-1">
                          {section.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {count}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                        <Icon className={`w-6 h-6 ${section.iconColor}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Bookings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {sections.map((section) => {
              const data = filterBookings(section.type);
              const Icon = section.icon;

              return (
                <section
                  key={section.type}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full flex flex-col"
                >
                  {/* Section Header */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>

                  {/* Bookings List */}
                  <div className="p-6 flex-1 flex flex-col">
                    {data.length === 0 ? (
                      <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                          <Icon
                            className={`w-8 h-8 ${section.iconColor} opacity-50`}
                          />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No {section.type} bookings
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Your {section.type} bookings will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                        {data.map((b) => (
                          <div
                            key={b.id}
                            className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 leading-tight flex-1 pr-2">
                                {b.serviceListing?.title ||
                                  b.serviceRequest?.title ||
                                  "Untitled Service"}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(b.status)} whitespace-nowrap`}
                              >
                                {b.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <User className="w-4 h-4" />
                              <p className="text-sm">
                                {role === "client" ? (
                                  <>
                                    <span className="font-medium">
                                      Resolver:
                                    </span>{" "}
                                    {b.serviceListing?.resolver?.firstName ||
                                      "N/A"}{" "}
                                    {b.serviceListing?.resolver?.lastName || ""}
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium">Client:</span>{" "}
                                    {b.client?.firstName || "N/A"}{" "}
                                    {b.client?.lastName || ""}
                                  </>
                                )}
                              </p>
                            </div>

                            {b.bookingDate && (
                              <p className="text-xs text-gray-500">
                                Booked:{" "}
                                {new Date(b.bookingDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
