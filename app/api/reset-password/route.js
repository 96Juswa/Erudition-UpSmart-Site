import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({
          message: "Token and password are required.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(
        JSON.stringify({
          message: "Invalid or expired token.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = decoded;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          message: "User not found.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return new Response(
      JSON.stringify({
        message:
          "Password reset successful! You can now login with your new password.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({
        message: "Something went wrong. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
