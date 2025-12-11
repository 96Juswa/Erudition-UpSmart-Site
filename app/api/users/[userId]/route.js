import { NextResponse } from "next/server";
import { getCurrentUserIdFromRequest } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const userIdFromParams = parseInt(params.userId, 10);
    if (isNaN(userIdFromParams)) {
      return NextResponse.json(
        { error: "Invalid userId parameter" },
        { status: 400 }
      );
    }

    const userIdFromToken = await getCurrentUserIdFromRequest(req);
    if (!userIdFromToken || userIdFromToken !== userIdFromParams) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, middleName, lastName, bio } = body;

    // ✅ lowercase model name
    const updatedUser = await prisma.user.update({
      where: { userId: userIdFromParams },
      data: { firstName, middleName, lastName },
    });

    const userRoles = await prisma.userRole.findMany({
      where: { userId: userIdFromParams },
      include: { role: true },
    });

    const isClient = userRoles.some((ur) => ur.role.roleName === "client");
    const isResolver = userRoles.some((ur) => ur.role.roleName === "resolver");

    if (isClient) {
      await prisma.clientProfile.upsert({
        where: { userId: userIdFromParams },
        update: { bio },
        create: { userId: userIdFromParams, bio, trustRating: 0 },
      });
    }

    if (isResolver) {
      await prisma.resolverProfile.upsert({
        where: { userId: userIdFromParams },
        update: { bio },
        create: { userId: userIdFromParams, bio, trustRating: 0 },
      });
    }

    return NextResponse.json({
      userId: updatedUser.userId,
      firstName: updatedUser.firstName,
      middleName: updatedUser.middleName,
      lastName: updatedUser.lastName,
      bio,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
