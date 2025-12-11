import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { email } = await req.json();

  if (!email) {
    return new Response(
      JSON.stringify({
        message: "Email is required.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }, // ✅ ADD THIS
      }
    );
  }

  // ✅ CHANGE 1: Change Client to user (lowercase)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return new Response(
      JSON.stringify({
        message: "No user found with that email.",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }, // ✅ ADD THIS
      }
    );
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      // ✅ CHANGE 2: Update email format
      from: "UpSmart <onboarding@resend.dev>",
      to: user.email,
      subject: "Password Reset Link",
      html: `
        <p>Hello ${user.firstName || "there"},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });

    return new Response(
      JSON.stringify({
        message: "Password reset link sent to your email.",
      }),
      {
        status: 200, // ✅ ADD THIS
        headers: { "Content-Type": "application/json" }, // ✅ ADD THIS
      }
    );
  } catch (err) {
    console.error("Email send failed:", err);
    return new Response(
      JSON.stringify({
        message:
          "Something went wrong while sending password reset link. Please try again later.",
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }, // ✅ ADD THIS
      }
    );
  }
}
