// app/api/admin/login/route.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          message: "Invalid credentials. Access denied.",
        }),
        { status: 401 }
      );
    }

    const isAdmin = user.userRoles.some((ur) => ur.role.roleName === "admin");

    if (!isAdmin) {
      console.warn(`Unauthorized admin login attempt by: ${email}`);

      return new Response(
        JSON.stringify({
          message: "Insufficient permissions. This incident will be logged.",
        }),
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({
          message: "Invalid credentials. Access denied.",
        }),
        { status: 401 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.roleName);
    const expiresIn = "4h";
    const maxAge = 60 * 60 * 4;

    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName || null,
      lastName: user.lastName,
      profilePicture: user.profilePicture || null,
      roles,
      isAdmin: true,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn });

    const cookie = serialize("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge,
    });

    console.log(
      `Admin login successful: ${user.email} at ${new Date().toISOString()}`
    );

    return new Response(
      JSON.stringify({
        message: "Admin authentication successful.",
        user: tokenPayload,
      }),
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );
  } catch (err) {
    console.error("Admin login error:", err);
    return new Response(
      JSON.stringify({
        message: "Authentication failed. Please try again.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
