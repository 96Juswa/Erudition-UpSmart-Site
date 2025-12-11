// app/admin/reports/page.js

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
import ReportsManagementDashboard from "@/components/admin/ReportsManagementDashboard";

export default function AdminReportsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/test", { credentials: "include" });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Portal - Reports</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/portfolios")}
              className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
            >
              Portfolios
            </button>

            <button
              onClick={() => router.push("/admin/listings")}
              className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
            >
              Listings
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/api/logout", {
                  method: "POST",
                  credentials: "include",
                });

                if (res.ok) {
                  localStorage.removeItem("activeRole");
                  window.location.href = "/login";
                } else {
                  alert("Logout failed.");
                }
              }}
              className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <ReportsManagementDashboard />
    </div>
  );
}
