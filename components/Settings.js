"use client";

import React, { useState, useEffect } from "react";
import {
  XCircle,
  CheckCircle2,
  User,
  Shield,
  Bell,
  Mail,
  Lock,
  MessageSquare,
  Clock,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

const Button = ({
  children,
  type = "button",
  color = "primary",
  className = "",
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

  const colorClasses = {
    primary:
      "bg-gradient-to-r from-[#094074] to-[#0f5d8c] text-white hover:from-[#073559] hover:to-[#0d4d75] focus:ring-[#094074] shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 bg-white",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${colorClasses[color]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const InputBox = ({
  label,
  name,
  id,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#094074] focus:border-transparent ${
          disabled || readOnly
            ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-200 hover:border-gray-300 focus:border-[#094074]"
        }`}
        {...props}
      />
    </div>
  );
};

const TextArea = ({
  label,
  name,
  id,
  rows = 3,
  value,
  onChange,
  placeholder,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
      </label>
      <textarea
        name={name}
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#094074] focus:border-transparent hover:border-gray-300 resize-none"
        {...props}
      />
    </div>
  );
};

const ToggleSwitch = ({ id, label, description, defaultChecked = true }) => {
  const [isOn, setIsOn] = useState(defaultChecked);

  const handleToggle = () => setIsOn(!isOn);

  return (
    <div className="flex items-center justify-between py-4 px-6 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex-1">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-900 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      <button
        type="button"
        id={id}
        onClick={handleToggle}
        aria-pressed={isOn}
        aria-label={label}
        className={`${
          isOn ? "bg-gradient-to-r from-[#094074] to-[#0f5d8c]" : "bg-gray-200"
        } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#094074] focus:ring-offset-2 hover:shadow-lg`}
      >
        <span
          aria-hidden="true"
          className={`${
            isOn ? "translate-x-5" : "translate-x-0"
          } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out`}
        />
      </button>
    </div>
  );
};

const navItems = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "sign-in-security", label: "Security", Icon: Shield },
  { id: "notifications", label: "Notifications", Icon: Bell },
  //{ id: "reminders", label: "Reminders", Icon: Clock },
  //{ id: "messages", label: "Messages", Icon: MessageSquare },
];

export default function AccountSettings() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: null,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    bio: "",
  });

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch user profile.");
        }
        const data = await res.json();
        setFormData({
          id: data.userId,
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          bio: data.bio || "",
        });
        setInitialData(data);
      } catch (err) {
        setError(
          err.message ||
            "An unexpected error occurred while fetching your profile."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.id) {
      setError("User ID is missing. Cannot save profile.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          bio: formData.bio,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to save settings (Status: ${res.status}).`
        );
      }

      const updatedUser = await res.json();
      setSuccessMessage("Profile updated successfully!");
      setFormData((prev) => ({
        ...prev,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        bio: updatedUser.bio,
      }));
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred while saving your profile."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        firstName: initialData.firstName || "",
        middleName: initialData.middleName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        bio: initialData.bio || "",
      });
    }
    router.push("/");
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#094074] border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mx-auto max-w-2xl mt-8 flex items-center">
        <XCircle className="w-5 h-5 mr-2" />
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 text-blue-600 hover:underline"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div></div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-6 bg-gradient-to-r from-[#094074] to-[#0f5d8c] text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {formData.firstName} {formData.lastName}
                    </h3>
                    <p className="text-blue-100 text-sm">{formData.email}</p>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                      activeSection === id
                        ? "bg-gradient-to-r from-[#094074] to-[#0f5d8c] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            )}

            <div className="space-y-8" onSubmit={handleSubmit}>
              {/* Profile Section */}
              <section
                id="profile"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Profile Information
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Manage your personal details and public profile
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <InputBox
                      label="First name"
                      name="firstName"
                      id="first-name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                    <InputBox
                      label="Last name"
                      name="lastName"
                      id="last-name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                    <InputBox
                      label="Middle name"
                      name="middleName"
                      id="middle-name"
                      value={formData.middleName}
                      onChange={handleChange}
                    />
                    <InputBox
                      label="Email address"
                      name="email"
                      id="email-address"
                      type="email"
                      value={formData.email}
                      readOnly
                      disabled
                    />
                    <div className="sm:col-span-2">
                      <TextArea
                        label="Bio"
                        name="bio"
                        id="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell others about yourself..."
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Let others know who you are and what makes you stand
                        out.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section
                id="sign-in-security"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Security Settings
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Manage your account security and authentication
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Sign-in Email
                        </p>
                        <p className="text-sm text-gray-600">
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Password</p>
                        <p className="text-sm text-gray-600">
                          Last updated 30 days ago
                        </p>
                      </div>
                    </div>
                    <Button
                      color="outline"
                      className="!py-2 !px-4"
                      onClick={() => router.push("/forgot-password")}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </div>

                  <ToggleSwitch
                    id="two-factor-auth"
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    defaultChecked
                  />
                </div>
              </section>

              {/* Notifications Section */}
              <section
                id="notifications"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Notifications
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Stay updated with your account activity
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <ToggleSwitch
                    id="account-activity"
                    label="Account Activity"
                    description="Get notified about login attempts and security changes"
                    defaultChecked
                  />
                  <ToggleSwitch
                    id="listing-activity"
                    label="Listing Activity"
                    description="Updates about your listings and applications"
                    defaultChecked
                  />
                </div>
              </section>

              {/* Reminders Section */}
              <section
                id="reminders"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Reminders
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Important reminders for your bookings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <ToggleSwitch
                    id="reminders-toggle"
                    label="Booking Reminders"
                    description="Get reminded about upcoming bookings and deadlines"
                    defaultChecked
                  />
                </div>
              </section>

              {/* Messages Section */}
              <section
                id="messages"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#094074] to-[#0f5d8c] rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Messages
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Communication preferences with clients
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <ToggleSwitch
                    id="messages"
                    label="Client & Resolver Messages"
                    description="Receive messages from clients and resolvers"
                    defaultChecked
                  />
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                <Button
                  type="button"
                  color="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} onClick={handleSubmit}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
