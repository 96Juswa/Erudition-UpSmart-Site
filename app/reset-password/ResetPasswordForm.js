"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoText from "@/components/LogoText";
import ButtonIcon from "@/components/ButtonIcon";
import { ArrowLeft } from "lucide-react";
import InputBox from "@/components/InputBox";
import Button from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirmPassword, setTouchedConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      showToast("Invalid or missing reset token.", "error");
      setIsValidToken(false);
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, showToast]);

  const goBack = () => router.push("/login");

  const validatePassword = (value) => {
    if (!value) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const validateConfirmPassword = (value) => {
    if (!value) return "Please confirm your password.";
    if (value !== password) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedPassword(true);
    setTouchedConfirmPassword(true);

    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword);

    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmPasswordValidation);

    if (passwordValidation || confirmPasswordValidation) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Password reset successful!", "success");
        router.push("/login");
      } else {
        showToast(data.message || "Failed to reset password.", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- INVALID TOKEN SCREEN --------------------
  if (!isValidToken) {
    return (
      <div className="flex flex-col min-h-screen p-5 w-screen">
        <LogoText />
        <div className="flex flex-1 p-5 items-center justify-center">
          <div className="flex flex-col p-5 sm:p-10 border border-[#094074] w-full sm:w-3/4 md:w-1/2 lg:w-1/3 items-center rounded-lg">
            <h2 className="text-red-600">Invalid Reset Link</h2>
            <p className="text-sm text-center mt-3">
              This password reset link is invalid or has expired.
            </p>
            <Button
              onClick={goBack}
              variant="filled"
              color="primary"
              className="mt-5 w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- VALID TOKEN SCREEN --------------------
  return (
    <div className="flex flex-col min-h-screen p-5 w-screen">
      <LogoText />
      <div className="flex flex-1 p-5 items-center justify-center">
        <div className="flex flex-col p-5 sm:p-10 border border-[#094074] w-full sm:w-3/4 md:w-1/2 lg:w-1/3 items-center justify-between rounded-lg">
          {/* Back Button */}
          <ButtonIcon
            icon={ArrowLeft}
            className="self-start"
            onClick={goBack}
          />

          {/* Logo and Title */}
          <div className="flex flex-col items-center">
            <img
              src="/images/logo.png"
              className="mb-2 w-24 h-24 sm:w-28 sm:h-28"
              alt="Logo"
            />
            <h2>Reset Password</h2>
            <p className="text-sm text-center">
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <form className="w-full mt-7" onSubmit={handleSubmit}>
            <InputBox
              label="New Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                setTouchedPassword(true);
                setPasswordError(validatePassword(password));
              }}
              error={passwordError}
              touched={touchedPassword}
              required
            />
            <InputBox
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => {
                setTouchedConfirmPassword(true);
                setConfirmPasswordError(
                  validateConfirmPassword(confirmPassword)
                );
              }}
              error={confirmPasswordError}
              touched={touchedConfirmPassword}
              required
              className="mt-4"
            />
            <Button
              type="submit"
              variant="filled"
              color="primary"
              className="mt-5 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "RESETTING..." : "RESET PASSWORD"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
