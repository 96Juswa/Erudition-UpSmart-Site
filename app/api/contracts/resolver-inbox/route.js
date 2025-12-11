// app/api/contracts/resolver-inbox/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("userId"));
    const bookingId = parseInt(searchParams.get("bookingId"));

    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    if (!bookingId)
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

    // Debug: Log the search parameters
    console.log("🔍 Resolver Inbox Search:", {
      userId,
      bookingId,
      searchType: "providerId",
    });

    const contracts = await prisma.contract.findMany({
      where: {
        providerId: userId,
        bookingId: bookingId,
      },
      include: {
        booking: {
          include: {
            serviceListing: {
              include: {
                resolver: true,
              },
            },
            serviceRequest: true,
            latestProposal: {
              include: {
                sender: true,
                receiver: true,
              },
            },
          },
        },
        receiver: true,
        provider: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Debug: Log the results
    console.log("📋 Found contracts:", contracts.length);
    console.log(
      "📊 Contract breakdown:",
      contracts.map((c) => ({
        contractId: c.id,
        providerId: c.providerId,
        receiverId: c.receiverId,
        bookingType: c.booking?.serviceListing
          ? "SERVICE_LISTING"
          : c.booking?.serviceRequest
            ? "SERVICE_REQUEST"
            : "UNKNOWN",
        serviceTitle:
          c.booking?.serviceListing?.title ||
          c.booking?.serviceRequest?.title ||
          "No title",
        hasProvider: !!c.provider,
        hasReceiver: !!c.receiver,
      }))
    );

    return NextResponse.json({ contracts });
  } catch (err) {
    console.error("Error fetching resolver contracts:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
