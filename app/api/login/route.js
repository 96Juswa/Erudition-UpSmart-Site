// app/api/auth/login/route.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { checkUserSuspension } from "@/middleware/suspensionCheck";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, remember } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
        clientProfile: {
          select: { clientProfileId: true },
        },
        resolverProfile: {
          select: { resolverProfileId: true },
        },
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          message:
            "No account found for this email address. Please sign up first.",
        }),
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({
          message: "Incorrect password. Please try again.",
        }),
        { status: 401 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.roleName);
    const isAdmin = roles.includes("admin");

    // ⚠️ CHECK FOR SUSPENSION (skip for admins)
    if (!isAdmin) {
      try {
        const suspension = await checkUserSuspension(user.userId);

        if (suspension) {
          const isPermanent = suspension.action === "PERMANENT_SUSPENSION";
          const endDateMsg = suspension.endDate
            ? `until ${new Date(suspension.endDate).toLocaleDateString()}`
            : "permanently";

          return new Response(
            JSON.stringify({
              suspended: true,
              message: `Your account has been suspended ${endDateMsg}.`,
              reason: suspension.reason,
              action: suspension.action,
              startDate: suspension.startDate,
              endDate: suspension.endDate,
              notes: suspension.notes,
              isPermanent,
            }),
            { status: 403 }
          );
        }
      } catch (suspensionError) {
        console.error("Error checking user suspension:", suspensionError);
        // Continue with login if suspension check fails
        // (fail open - better than blocking legitimate users)
      }
    }

    // Generate token
    const expiresIn = remember ? "7d" : "1h";
    const maxAge = remember ? 60 * 60 * 24 * 7 : 60 * 60;

    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName || null,
      lastName: user.lastName,
      profilePicture: user.profilePicture || null,
      trustScore: user.trustScore || null,
      roles,
      isAdmin: isAdmin,
      clientProfileId: user.clientProfile?.clientProfileId || null,
      resolverProfileId: user.resolverProfile?.resolverProfileId || null,
      yearStarted: user.yearStarted || null,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn });

    const cookie = serialize("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
    });

    return new Response(
      JSON.stringify({
        message: "Login successful.",
        user: tokenPayload,
      }),
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({
        message: "Something went wrong during login. Please try again later.",
        error: err.message,
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
