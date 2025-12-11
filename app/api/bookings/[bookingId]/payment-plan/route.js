import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch payment plan for a booking
export async function GET(request, { params }) {
  try {
    const bookingId = parseInt(params.bookingId);

    const paymentPlan = await prisma.paymentPlan.findUnique({
      where: { bookingId },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ paymentPlan });
  } catch (error) {
    console.error("Error fetching payment plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment plan" },
      { status: 500 }
    );
  }
}

// POST - Create payment plan for a booking
export async function POST(request, { params }) {
  try {
    const bookingId = parseInt(params.bookingId);
    const body = await request.json();
    const { milestones, totalAmount, createdBy } = body;

    // Validate input
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json(
        { error: "Milestones are required" },
        { status: 400 }
      );
    }

    if (!totalAmount || !createdBy) {
      return NextResponse.json(
        { error: "Total amount and creator are required" },
        { status: 400 }
      );
    }

    // Check if payment plan already exists
    const existingPlan = await prisma.paymentPlan.findUnique({
      where: { bookingId },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Payment plan already exists for this booking" },
        { status: 400 }
      );
    }

    const paymentPlan = await prisma.paymentPlan.create({
      data: {
        bookingId,
        totalAmount: parseFloat(totalAmount),
        createdBy,
        milestones: {
          create: milestones.map((milestone, index) => ({
            name: milestone.name,
            amount: parseFloat(milestone.amount),
            percentage: parseFloat(milestone.percentage),
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
            required: milestone.required ?? true,
            order: index + 1,
          })),
        },
      },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ paymentPlan }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment plan:", error);

    // Return more specific error information
    return NextResponse.json(
      {
        error: "Failed to create payment plan",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
