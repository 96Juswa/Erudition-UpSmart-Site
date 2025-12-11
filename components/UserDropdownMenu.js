"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import UserProfilePic from "./UserProfilePic";
import { LogOut } from "lucide-react";

export default function UserDropdownMenu({ user, menuItems = [] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeRole, setActiveRole] = useState("client");

  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem("activeRole") || "client";
    const userRoles = user?.roles || [];

    if (userRoles.includes(stored)) {
      setActiveRole(stored);
    } else if (userRoles.includes("client")) {
      setActiveRole("client");
      localStorage.setItem("activeRole", "client");
    } else if (userRoles.includes("resolver")) {
      setActiveRole("resolver");
      localStorage.setItem("activeRole", "resolver");
    }
  }, [user]);

  const handleLogout = async () => {
    const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("activeRole"); // ✅ Clear on logout
      showToast(data.message, "success");
      router.push("/login");
    } else {
      showToast("Logout failed.", "danger");
    }
  };

  return (
    <div className="absolute right-0 mt-2 z-10 w-60 bg-gray-50 divide-y divide-gray-200 rounded-lg shadow-sm">
      <div className="flex flex-col items-center justify-center gap-2 py-4 px-4 text-sm text-black">
        <UserProfilePic user={user} width={40} height={40} />
        {user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}
        <p className="text-xs text-gray-400 -mt-2">
          {activeRole.toUpperCase()}
        </p>
      </div>

      <ul className="py-2 text-sm text-black">
        {menuItems.map((item, index) => (
          <li key={index}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex items-center px-4 py-2 text-sm text-black hover:text-[#c89933] hover:bg-[#094074] hover:font-semibold"
              >
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#c89933] hover:text-[#094074]"
              >
                {item.icon}
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="py-2 text-sm text-black">
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-4 py-2 text-black hover:text-[#c89933] hover:bg-[#094074] hover:font-semibold"
        >
          <LogOut className="h-4 w-4 mr-2" />
          LOGOUT
        </button>
      </div>
    </div>
  );
}
