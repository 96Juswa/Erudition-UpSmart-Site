"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import UserDropdownMenu from "./UserDropdownMenu";
import UserProfilePic from "./UserProfilePic";

export default function DropdownPicture({ user, menuItems = [], activeRole }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();
  const { showToast } = useToast();

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      router.push("/login");
    } else {
      showToast("Logout failed.", "danger");
    }
  };

  // ⛔ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 📍 Calculate dropdown position
  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 6 + window.scrollY, // small vertical gap
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  const firstInitial = user?.firstName?.trim().charAt(0).toUpperCase() || "U";
  const hasProfilePic = !!user?.profilePicture;

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          onClick={toggleDropdown}
          className="flex text-sm rounded-full w-10 h-10 overflow-hidden items-center justify-center bg-gray-200"
          type="button"
        >
          {hasProfilePic ? (
            <UserProfilePic user={user} width={40} height={40} />
          ) : (
            <span className="text-[#094074] font-semibold text-sm">
              {firstInitial}
            </span>
          )}
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999,
            }}
          >
            <UserDropdownMenu
              user={user}
              menuItems={menuItems}
              activeRole={activeRole}
              onLogout={handleLogout}
            />
          </div>,
          document.body
        )}
    </>
  );
}
