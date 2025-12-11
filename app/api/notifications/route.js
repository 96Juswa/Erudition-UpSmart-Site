import prisma from "@/app/lib/prisma";

import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const [messages, proposals, contracts, changeRequests, progressUpdates] =
      await Promise.all([
        // Unread messages
        prisma.message.findMany({
          where: { receiverId: Number(userId), readStatus: false },
          include: {
            sender: { select: { firstName: true, lastName: true } },
            conversation: true,
          },
          orderBy: { sentDate: "desc" },
          take: 20,
        }),

        // Pending proposals
        prisma.bookingProposal.findMany({
          where: {
            receiverId: Number(userId),
            status: "PENDING",
          },
          include: {
            sender: { select: { firstName: true, lastName: true } },
            listing: { select: { title: true } },
            request: { select: { title: true } },
            // Get the booking to access its conversation
            booking: {
              include: {
                conversation: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        // Pending contracts
        prisma.contract.findMany({
          where: {
            receiverId: Number(userId),
            status: "PENDING",
          },
          include: {
            provider: { select: { firstName: true, lastName: true } },
            booking: {
              include: {
                conversation: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        // Pending change requests
        prisma.bookingChangeRequest.findMany({
          where: {
            booking: { clientId: Number(userId) },
            status: "PENDING",
          },
          include: {
            requester: { select: { firstName: true, lastName: true } },
            booking: {
              include: {
                conversation: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        // Recent progress updates
        prisma.progressUpdate.findMany({
          where: {
            booking: {
              OR: [
                { clientId: Number(userId) },
                { serviceListing: { resolverId: Number(userId) } },
              ],
            },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          include: {
            updater: { select: { firstName: true, lastName: true } },
            booking: {
              include: {
                conversation: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    const formatTimestamp = (date) => {
      const now = new Date();
      const diff = now - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString();
    };

    const notifications = [
      ...messages.map((m) => ({
        type: "message",
        title: `New message from ${m.sender.firstName} ${m.sender.lastName}`,
        message:
          m.messageContent.substring(0, 100) +
          (m.messageContent.length > 100 ? "..." : ""),
        id: `msg-${m.id}`,
        referenceId: m.id,
        conversationId: m.conversationId,
        timestamp: formatTimestamp(m.sentDate),
      })),

      ...proposals.map((p) => ({
        type: "proposal",
        title: `New proposal from ${p.sender.firstName} ${p.sender.lastName}`,
        message: p.listing
          ? `For: ${p.listing.title}`
          : p.request
            ? `For: ${p.request.title}`
            : "",
        id: `prop-${p.id}`,
        referenceId: p.id,
        conversationId: p.booking?.conversation?.conversationId || null,
        bookingId: p.bookingId,
        timestamp: formatTimestamp(p.createdAt),
      })),

      ...contracts.map((c) => ({
        type: "contract",
        title: `New contract from ${c.provider?.firstName || "Unknown"} ${c.provider?.lastName || ""}`,
        message: "Review and sign the contract",
        id: `contract-${c.id}`,
        referenceId: c.id,
        conversationId: c.booking?.conversation?.conversationId || null,
        bookingId: c.bookingId,
        timestamp: formatTimestamp(c.createdAt),
      })),

      ...changeRequests.map((cr) => ({
        type: "changeRequest",
        title: `${cr.type === "CANCELLATION" ? "Cancellation" : "Change"} request from ${cr.requester.firstName}`,
        message: cr.reason || "Booking modification requested",
        id: `change-${cr.id}`,
        referenceId: cr.id,
        conversationId: cr.booking?.conversation?.conversationId || null,
        bookingId: cr.bookingId,
        timestamp: formatTimestamp(cr.createdAt),
      })),

      ...progressUpdates.map((pu) => ({
        type: "progressUpdate",
        title: `Progress update from ${pu.updater.firstName} ${pu.updater.lastName}`,
        message: pu.message || `Status: ${pu.status}`,
        id: `progress-${pu.id}`,
        referenceId: pu.id,
        conversationId: pu.booking?.conversation?.conversationId || null,
        bookingId: pu.bookingId,
        timestamp: formatTimestamp(pu.createdAt),
      })),
    ].sort((a, b) => {
      const getTime = (notif) => {
        const timeStr = notif.timestamp;
        if (timeStr === "Just now") return Date.now();
        if (timeStr.includes("m ago"))
          return Date.now() - parseInt(timeStr) * 60000;
        if (timeStr.includes("h ago"))
          return Date.now() - parseInt(timeStr) * 3600000;
        if (timeStr.includes("d ago"))
          return Date.now() - parseInt(timeStr) * 86400000;
        return new Date(timeStr).getTime();
      };
      return getTime(b) - getTime(a);
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Notification fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
