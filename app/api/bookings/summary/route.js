import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/getCurrentUser"; // assuming you have this

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "client" or "resolver"

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let bookings = [];

    if (role === "client") {
      bookings = await prisma.booking.findMany({
        where: { clientId: user.userId },
        include: {
          serviceListing: {
            include: {
              resolver: true,
              service: { include: { category: true } },
            },
          },
          serviceRequest: true,
          payments: true,
        },
        orderBy: { bookingDate: "desc" },
      });
    } else if (role === "resolver") {
      bookings = await prisma.booking.findMany({
        where: {
          serviceListing: { resolverId: user.userId },
        },
        include: {
          client: true,
          serviceListing: {
            include: { service: { include: { category: true } } },
          },
          payments: true,
        },
        orderBy: { bookingDate: "desc" },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
