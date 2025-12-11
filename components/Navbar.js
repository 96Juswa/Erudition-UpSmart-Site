"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavLink from "./NavLink";
import Button from "./Button";
import LogoImage from "./LogoImage";
import LogoText from "./LogoText";
import RoleToggle from "./RoleToggle";
import DropdownPicture from "./DropdownPicture";
import NotificationDropdown from "./Notifications";
import UserProfilePic from "./UserProfilePic";
import {
  MessageCircle,
  LibraryBig,
  Settings,
  MessageCircleWarning,
  List,
  FileBox,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export default function Navbar({ user }) {
  const router = useRouter();
  const { showToast } = useToast();
  const goLogin = () => router.push("/login");

  const hasClient = user?.roles?.includes("client");
  const hasResolver = user?.roles?.includes("resolver");

  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState("client");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const storedRole = localStorage.getItem("activeRole");
    if (storedRole) setActiveRole(storedRole);
    else {
      const defaultRole = hasClient
        ? "client"
        : hasResolver
          ? "resolver"
          : "client";
      localStorage.setItem("activeRole", defaultRole);
      setActiveRole(defaultRole);
    }
  }, [user]);

  useEffect(() => {
    const syncRole = (e) => {
      if (e.key === "activeRole") setActiveRole(e.newValue);
    };
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleRoleToggle = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem("activeRole", newRole);
    router.push(`/${newRole}`);
    setMobileMenuOpen(false);
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
      setMobileMenuOpen(false);
    } else {
      showToast("Logout failed.", "danger");
    }
  };

  const clientMenu = [
    {
      label: "Bookings",
      href: "/bookings",
      icon: <LibraryBig className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/client/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const resolverMenu = [
    {
      label: "Bookings",
      href: "/bookings",
      icon: <LibraryBig className="h-5 w-5" />,
    },

    {
      label: "Manage Listings",
      href: "/resolver/manage-listings",
      icon: <List className="h-5 w-5" />,
    },
    {
      label: "Manage Portfolio",
      href: "/resolver/manage-portfolio",
      icon: <FileBox className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/resolver/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const clientNavItems = [
    { label: "HOME", href: "/" },
    { label: "CATEGORIES", href: "/client/categories" },
    { label: "REQUESTS", href: "/client/requests" },
  ];

  const resolverNavItems = [
    { label: "HOME", href: "/" },
    { label: "CATEGORIES", href: "/resolver/categories" },
    { label: "REQUESTS", href: "/resolver/requests" },
  ];

  const navItems =
    activeRole === "resolver" ? resolverNavItems : clientNavItems;
  const menuItems = activeRole === "resolver" ? resolverMenu : clientMenu;

  if (!mounted) return null;

  if (!user) {
    return (
      <>
        <div className="flex justify-between items-center border-b pb-2 border-[#094074] px-4 md:px-8">
          <div className="flex gap-2 items-center">
            <LogoImage />
            <LogoText />
          </div>

          <div className="hidden md:flex gap-5 items-center">
            <NavLink source="/signup" text="SIGN UP" />
            <Button
              type="button"
              variant="filled"
              color="primary"
              onClick={goLogin}
            >
              LOGIN
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`fixed right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <LogoImage />
                <LogoText />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <Button
                type="button"
                variant="filled"
                color="primary"
                onClick={() => {
                  goLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                LOGIN
              </Button>
              <button
                onClick={() => {
                  router.push("/signup");
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-[#094074] border border-[#094074] rounded-lg hover:bg-[#094074] hover:text-white transition-colors"
              >
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const firstInitial = user?.firstName?.trim().charAt(0).toUpperCase() || "U";
  const hasProfilePic = !!user?.profilePicture;

  return (
    <>
      <div className="flex justify-between items-center pb-2 border-b border-[#094074] px-4 md:px-8 relative">
        <div className="flex items-center gap-2">
          <LogoImage />
          <LogoText />
          <div className="hidden md:flex items-center gap-5 ms-5">
            {navItems.map(({ label, href }) => (
              <NavLink key={label} source={href} text={label} />
            ))}
          </div>
        </div>

        {/* Desktop menu - Fixed alignment */}
        <div className="hidden md:flex gap-5 items-center">
          {hasClient && hasResolver && (
            <RoleToggle value={activeRole} onToggle={handleRoleToggle} />
          )}
          {hasClient && !hasResolver && (
            <button
              onClick={async () => {
                await fetch("/api/become-resolver", { method: "POST" });
                router.refresh();
                router.push("resolver/new-listing/service-details");
              }}
              className="text-sm text-white bg-[#094074] hover:bg-[#06395f] px-4 py-1.5 rounded-md font-semibold transition"
            >
              Become a Resolver
            </button>
          )}
          <div className="flex items-center gap-5">
            <NotificationDropdown userId={user?.userId} userRole={activeRole} />
            <NavLink
              source="/messages"
              text={<MessageCircle className="w-6 h-6" />}
            />
          </div>
          <DropdownPicture
            user={user}
            menuItems={menuItems}
            activeRole={activeRole}
          />
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 bottom-0 w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200">
            <span className="font-semibold text-lg text-[#094074]">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 bg-gradient-to-r from-[#094074] to-[#0a5086] text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                {hasProfilePic ? (
                  <UserProfilePic user={user} width={64} height={64} />
                ) : (
                  <span className="text-[#094074] font-bold text-2xl">
                    {firstInitial}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-blue-100 truncate">{user?.email}</p>
              </div>
            </div>

            {hasClient && hasResolver ? (
              <RoleToggle value={activeRole} onToggle={handleRoleToggle} />
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-black bg-opacity-20 text-xs font-medium">
                {activeRole === "resolver" ? "Resolver Mode" : "Client Mode"}
              </div>
            )}
          </div>

          {/* Quick Actions - Now First */}
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                Quick Actions
              </h4>
              <div className="space-y-1">
                {/* Notifications - Full width, properly aligned */}
                <NotificationDropdown
                  userId={user?.userId}
                  userRole={activeRole}
                  isMobile={true}
                />

                {/* Messages */}
                <a
                  href="/messages"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/messages");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <MessageCircle
                    size={20}
                    className="text-gray-600 group-hover:text-[#094074]"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#094074]">
                    Messages
                  </span>
                </a>
              </div>
            </div>

            {/* Main Navigation - Now Second */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                Navigate
              </h4>
              <nav className="space-y-1">
                {navItems.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(href);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#094074]">
                      {label}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover:text-[#094074]"
                    />
                  </a>
                ))}
              </nav>
            </div>

            {/* Account Menu Items */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                Account
              </h4>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-gray-600 group-hover:text-[#094074]">
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#094074]">
                      {item.label}
                    </span>
                  </a>
                ))}
              </nav>
            </div>

            {hasClient && !hasResolver && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={async () => {
                    await fetch("/api/become-resolver", { method: "POST" });
                    router.refresh();
                    router.push("resolver/new-listing/service-details");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-sm text-white bg-[#094074] hover:bg-[#06395f] px-4 py-2.5 rounded-lg font-semibold transition"
                >
                  Become a Resolver
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
