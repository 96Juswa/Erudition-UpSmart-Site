import { NextResponse } from "next/server";
import { getCurrentUserIdFromRequest } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        clientProfile: {
          select: { bio: true },
        },
        resolverProfile: {
          select: { bio: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bio = user.clientProfile?.bio ?? user.resolverProfile?.bio ?? "";

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      bio,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
