import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      program,
      yearStarted,
    } = body;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Email already exists." }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        middleName,
        lastName,
        program: program.name,
        yearStarted: parseInt(yearStarted.name),
        email,
        password: hashedPassword,
      },
    });

    const clientRole = await prisma.role.findUnique({
      where: { roleName: "client" },
    });

    if (!clientRole) {
      throw new Error("Client role not found.");
    }

    await prisma.userRole.create({
      data: {
        userId: newUser.userId,
        roleId: clientRole.roleId,
      },
    });

    await prisma.clientProfile.create({
      data: {
        userId: newUser.userId,
        bio: "",
      },
    });

    return new Response(
      JSON.stringify({
        message: "Signup successful. You may now login.",
        userId: newUser.userId,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return new Response(
      JSON.stringify({
        message: "Something went wrong during sign up. Please try again later.",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
