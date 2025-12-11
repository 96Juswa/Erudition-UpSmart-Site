import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/app/lib/prisma";

export async function GET() {
  const cookieStore = await cookies(); // ✅ FIXED: Await cookies()

  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      // ✅ FIXED: prisma.user
      where: { userId: decoded.userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (err) {
    console.error("JWT Decode Error:", err.message);
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}
