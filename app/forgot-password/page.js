"use client";

import { useState } from "react";
import LogoText from "@/components/LogoText";
import ButtonIcon from "@/components/ButtonIcon";
import { ArrowLeft } from "lucide-react";
import InputBox from "@/components/InputBox";
import Button from "@/components/Button";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => router.push("/login");

  const validateEmail = (value) => {
    if (!value) return "Email is required.";
    if (!value.endsWith("@my.jru.edu"))
      return "Email must be a @my.jru.edu address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouchedEmail(true);

    const emailValidation = validateEmail(email);

    setEmailError(emailValidation);

    if (emailValidation) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Password reset link sent.", "success");
        router.push("/login");
      } else {
        showToast(data.message || "Failed to send reset link.", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-5 bg-gray-50">
      <LogoText />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col p-6 sm:p-10 border border-[#094074] w-full sm:w-96 rounded-lg shadow-md">
          <ButtonIcon
            icon={ArrowLeft}
            className="self-start mb-4"
            onClick={goBack}
          />
          <div className="flex flex-col items-center mb-6">
            <img
              src="/images/logo.png"
              width="80"
              height="80"
              className="mb-2"
              alt="Logo"
            />
            <h2 className="text-xl font-semibold mb-1">Reset Password</h2>
            <p className="text-sm text-center text-gray-600">
              Enter your JRU email address. We will send you an email to reset
              your password.
            </p>
          </div>
          <form className="w-full" onSubmit={handleSubmit}>
            <InputBox
              label="Email Address"
              name="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                setTouchedEmail(true);
                setEmailError(validateEmail(email));
              }}
              error={emailError}
              touched={touchedEmail}
              required
            />
            <Button
              type="submit"
              variant="filled"
              color="primary"
              className="mt-5 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
