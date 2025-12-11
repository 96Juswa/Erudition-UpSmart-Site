"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import InputBox from "@/components/InputBox";
import Dropdown from "@/components/Dropdown";
import Button from "@/components/Button";
import TextLink from "@/components/TextLink";
import ButtonIcon from "@/components/ButtonIcon";
import LoginImageCard from "@/components/LoginImageCard";
import LoginFormCard from "@/components/LoginFormCard";
import Or from "@/components/Or";
import GoogleButton from "@/components/GoogleButton";
import LogoText from "@/components/LogoText";
import { useToast } from "@/components/ToastProvider";

export default function SignupForm() {
  const programOptions = [
    "Bachelor of Arts Major in Economics",
    "Bachelor of Arts Major in English Language",
    "Bachelor of Arts Major in History",
    "Bachelor of Science in Psychology",
    "Bachelor of Secondary Education Major in English",
    "Bachelor of Secondary Education Major in Mathematics",
    "Bachelor of Secondary Education Major in Social Studies",
    "Bachelor of Science in Applied Mathematics",
    "Bachelor of Elementary Education",
    "Teaching Certificate Program",
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Business Administration Major in Accounting",
    "Bachelor of Science in Business Administration Major in Financial Management",
    "Bachelor of Science in Business Administration Major in Business Economics",
    "Bachelor of Science in Business Administration Major in Management",
    "Bachelor of Science in Business Administration Major in Marketing",
    "Bachelor of Science in Business Administration Major in Supply Management",
    "Bachelor of Science in Legal Management",
    "Bachelor of Science in Computer Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Technology Major in Business Analytics",
    "Bachelor of Science in Entertainment and Multimedia Computing Major in Digital Animation Technology",
    "Bachelor of Science in Entertainment and Multimedia Computing Major in Game Development",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Hospitality Management Major in Cruise Management",
    "Bachelor of Science in Tourism Management",
    "Bachelor of Science in Nursing",
    "Bachelor of Science in Criminology",
  ].map((name, index) => ({ id: index + 1, name }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { id: year, name: year.toString() };
  });

  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [dropdownTouched, setDropdownTouched] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    program: null,
    yearStarted: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const goHome = () => router.push("/");

  const validateField = (field, value) => {
    const jruEmailPattern = /^[^\s@]+@my\.jru\.edu$/;
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const namePattern = /^[A-Za-z\s'-]+$/;

    switch (field) {
      case "email":
        if (!value) return "Email is required.";
        if (!jruEmailPattern.test(value)) return "Enter a valid JRU email.";
        return null;
      case "password":
        if (!value) return "Password is required.";
        if (!passwordPattern.test(value))
          return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        return null;
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== formData.password) return "Passwords do not match.";
        return null;
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (!namePattern.test(value))
          return "First name should only contain letters.";
        return null;
      case "middleName":
        if (value && !namePattern.test(value))
          return "Middle name should only contain letters.";
        return null;
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (!namePattern.test(value))
          return "Last name should only contain letters.";
        return null;
      case "program":
        if (!value) return "Program selection is required.";
        return null;
      case "yearStarted":
        if (!value) return "Year is required.";
        const validYears = yearOptions.map((opt) => opt.id);
        if (!validYears.includes(value.id))
          return "Only current students may sign up.";
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => () => {
    if (field === "program" || (field === "yearStarted" && !dropdownTouched))
      return;
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    const { email, password, confirmPassword } = formData;

    newErrors.email = validateField("email", email);
    newErrors.password = validateField("password", password);
    newErrors.confirmPassword = validateField(
      "confirmPassword",
      confirmPassword
    );

    setErrors(newErrors);
    setTouched((prev) => ({
      ...prev,
      email: true,
      password: true,
      confirmPassword: true,
    }));

    return !Object.values(newErrors).some(Boolean);
  };

  const validateStep2 = () => {
    const newErrors = {};
    const { firstName, middleName, lastName, program, yearStarted } = formData;

    newErrors.firstName = validateField("firstName", firstName);
    newErrors.middleName = validateField("middleName", middleName);
    newErrors.lastName = validateField("lastName", lastName);
    newErrors.program = validateField("program", program);
    newErrors.yearStarted = validateField("yearStarted", yearStarted);

    setErrors(newErrors);
    setTouched((prev) => ({
      ...prev,
      firstName: true,
      middleName: true,
      lastName: true,
      program: true,
      yearStarted: true,
    }));

    return !Object.values(newErrors).some(Boolean);
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (res.ok) {
      showToast(
        result.message || "Signup successful. You may now login.",
        "success"
      );
      router.push("/login");
    } else {
      showToast(result.message || "Signup failed.", "danger");
    }
  };

  return (
    <div className="flex h-screen p-5">
      <LoginFormCard>
        <ButtonIcon
          onClick={goHome}
          icon={ArrowLeft}
          ariaLabel="Go to homepage"
          className="top-0 left-0 self-start"
        />

        <div className="self-start items-start w-3/4">
          <LogoText />
          <h2 className="mt-4">Let's get you started.</h2>
          <p>Sign up using your JRU email credentials to continue.</p>

          <form
            className="mt-8"
            onSubmit={step === 1 ? handleNext : handleSubmit}
            noValidate
          >
            <GoogleButton />
            <Or />

            {step === 1 && (
              <>
                <InputBox
                  {...{
                    label: "Email Address",
                    name: "email",
                    type: "text",
                    value: formData.email,
                    onChange: handleChange("email"),
                    onBlur: handleBlur("email"),
                    error: errors.email,
                    touched: touched.email,
                    required: true,
                  }}
                />
                <InputBox
                  {...{
                    label: "Password",
                    name: "password",
                    type: "password",
                    value: formData.password,
                    onChange: handleChange("password"),
                    onBlur: handleBlur("password"),
                    error: errors.password,
                    touched: touched.password,
                    required: true,
                  }}
                />
                <InputBox
                  {...{
                    label: "Confirm Password",
                    name: "confirmPassword",
                    type: "password",
                    value: formData.confirmPassword,
                    onChange: handleChange("confirmPassword"),
                    onBlur: handleBlur("confirmPassword"),
                    error: errors.confirmPassword,
                    touched: touched.confirmPassword,
                    required: true,
                  }}
                />
                <Button
                  type="submit"
                  variant="filled"
                  color="primary"
                  size="base"
                  className="w-full mt-4"
                >
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <InputBox
                  {...{
                    label: "First Name",
                    name: "firstName",
                    type: "text",
                    value: formData.firstName,
                    onChange: handleChange("firstName"),
                    onBlur: handleBlur("firstName"),
                    error: errors.firstName,
                    touched: touched.firstName,
                    required: true,
                  }}
                />
                <InputBox
                  {...{
                    label: "Middle Name",
                    name: "middleName",
                    type: "text",
                    value: formData.middleName,
                    onChange: handleChange("middleName"),
                    onBlur: handleBlur("middleName"),
                    error: errors.middleName,
                    touched: touched.middleName,
                  }}
                />
                <InputBox
                  {...{
                    label: "Last Name",
                    name: "lastName",
                    type: "text",
                    value: formData.lastName,
                    onChange: handleChange("lastName"),
                    onBlur: handleBlur("lastName"),
                    error: errors.lastName,
                    touched: touched.lastName,
                    required: true,
                  }}
                />
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-normal text-gray-900">
                    Program <span className="text-red-600 ml-1">*</span>
                  </label>
                  <Dropdown
                    label="Select Program"
                    options={programOptions}
                    selected={formData.program}
                    onSelect={(option) => {
                      setFormData((prev) => ({ ...prev, program: option }));
                      setDropdownTouched(true);
                      const error = validateField("program", option);
                      setErrors((prev) => ({
                        ...prev,
                        program: error || undefined,
                      }));
                    }}
                    onBlur={handleBlur("program")}
                    error={errors.program}
                    touched={touched.program}
                    className={
                      formData.program
                        ? "border-green-600 focus:ring-green-300 focus:border-green-300"
                        : ""
                    }
                    getLabel={(opt) => opt.name}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-normal text-gray-900">
                    Year Started <span className="text-red-600 ml-1">*</span>
                  </label>
                  <Dropdown
                    label="Year Started"
                    options={yearOptions}
                    selected={formData.yearStarted}
                    onSelect={(option) => {
                      setFormData((prev) => ({ ...prev, yearStarted: option }));
                      const error = validateField("yearStarted", option);
                      setErrors((prev) => ({
                        ...prev,
                        yearStarted: error || undefined,
                      }));
                    }}
                    onBlur={handleBlur("yearStarted")}
                    error={errors.yearStarted}
                    touched={touched.yearStarted}
                    getLabel={(opt) => opt.name}
                  />
                </div>
                {formData.program && formData.yearStarted && (
                  <div className="mt-6 p-4 text-sm rounded-lg bg-blue-50 border border-blue-200 leading-relaxed">
                    <p className="text-gray-800">
                      <strong>Note:</strong> Your account access is linked to
                      your official
                      <strong> JRU Google account.</strong> Access privileges
                      may be{" "}
                      <strong>discontinued one year after graduation</strong> or{" "}
                      <strong>
                        suspended if you are not actively enrolled for one
                        academic year.
                      </strong>{" "}
                      In the event of account deactivation, you are still
                      required to{" "}
                      <strong>
                        fulfill any pending booked services or financial
                        obligations under an active contract.
                      </strong>{" "}
                      Communication with the other party may continue{" "}
                      <strong>outside the platform</strong> as necessary to
                      complete such commitments.
                    </p>
                  </div>
                )}

                <div className="flex justify-between gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    color="primary"
                    size="base"
                    onClick={handlePrevious}
                    className="w-1/2"
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    variant="filled"
                    color="primary"
                    size="base"
                    className="w-1/2"
                  >
                    Sign Up
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="self-start items-start text-sm mt-6">
          <p>
            Have an account? <TextLink text="Login here." source="/login" />
          </p>
        </div>
      </LoginFormCard>

      <LoginImageCard>
        <img
          className="object-cover rounded-4xl h-full w-full"
          src="/images/jru-campus.jpg"
          alt="JRU Campus"
        />
      </LoginImageCard>
    </div>
  );
}
