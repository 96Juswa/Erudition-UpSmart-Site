import { PrismaClient, ReportStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { reporterId, reportedUserId, reportTitle, reportDescription } = body;

    if (!reporterId || !reportedUserId || !reportTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newReport = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        reportTitle,
        reportDescription,
        reportDate: new Date(),
        status: ReportStatus.PENDING, // ✅ safest way
      },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (err) {
    console.error("❌ Report API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
