"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import InputBox from "@/components/InputBox";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import TextLink from "@/components/TextLink";
import ButtonIcon from "@/components/ButtonIcon";
import LoginImageCard from "@/components/LoginImageCard";
import LoginFormCard from "@/components/LoginFormCard";
import Or from "@/components/Or";
import LogoText from "@/components/LogoText";
import { useToast } from "@/components/ToastProvider";

function GoogleButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/client" })}
      className="px-4 py-2 w-full text-sm border flex justify-center gap-2 border-[#094074] rounded-lg text-[#094074] hover:bg-[#094074] hover:text-white mt-2"
    >
      <img
        className="w-6 h-6"
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        loading="lazy"
        alt="google logo"
      />
      <span>Continue with Google</span>
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // 🔍 Debug logging
  useEffect(() => {
    console.log("🔍 Session status:", status);
    console.log("🔍 Session data:", session);
  }, [status, session]);

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      console.log("✅ User authenticated, redirecting to homepage");
      router.push("/");
    }
  }, [status, router]);

  // ✅ Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // 🔍 If authenticated but still rendering, show debug info
  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Authenticated! Redirecting...</p>
          <p className="text-sm text-gray-500 mt-2">
            Session: {JSON.stringify(session)}
          </p>
        </div>
      </div>
    );
  }

  const goHome = () => router.push("/");

  const validateEmail = (value) => {
    if (!value) return "Email is required.";
    if (!value.endsWith("@my.jru.edu"))
      return "Email must be a @my.jru.edu address.";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouchedEmail(true);
    setTouchedPassword(true);

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) return;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json();

      if (res.ok) {
        const user = data.user;
        const currentYear = new Date().getFullYear();
        const graduationYear = user.yearStarted + 5;

        let message = data.message || "Login successful.";

        if (
          graduationYear === currentYear ||
          graduationYear === currentYear + 1
        ) {
          message +=
            "\nYour account will be deactivated soon. Finish ongoing transactions immediately.";
        }

        showToast(message, "success");

        if (user?.isAdmin) router.push("/admin/listings");
        else router.push("/");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "danger");
    }
  };

  return (
    <div className="flex h-screen p-5">
      <LoginImageCard>
        <img
          className="object-cover rounded-4xl h-full w-full"
          src="/images/jru-students.jpg"
          alt="JRU Students"
        />
        <ButtonIcon
          onClick={goHome}
          icon={ArrowLeft}
          ariaLabel="Go to homepage"
          className="absolute top-0 left-0 m-5"
        />
      </LoginImageCard>

      <LoginFormCard>
        <div className="w-3/4">
          <LogoText />
        </div>

        <div className="w-3/4">
          <h2>Welcome back!</h2>
          <p>Login using your JRU email credentials to continue.</p>

          <form
            className="w-full mt-14"
            onSubmit={handleSubmit}
          >
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

            <InputBox
              label="Password"
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

            <div className="flex justify-between text-xs mb-4 -mt-3">
              <Checkbox
                label="Remember me."
                name="remember"
                className="text-xs"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <TextLink
                text="Forgot password?"
                source="/forgot-password"
              />
            </div>

            <Button
              type="submit"
              variant="filled"
              color="primary"
              size="base"
              className="w-full"
            >
              LOGIN
            </Button>
          </form>

          <Or />
          <GoogleButton />
        </div>

        <div className="w-3/4 text-sm mt-4">
          <p>
            Don't have an account?{" "}
            <TextLink
              text="Sign up."
              source="/signup"
            />
          </p>
        </div>
      </LoginFormCard>
    </div>
  );
}
