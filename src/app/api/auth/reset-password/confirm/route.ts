import { NextRequest, NextResponse } from "next/server";
import { passwordResetConfirmSchema, hashPassword } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = passwordResetConfirmSchema.parse(body);
    const { token, password } = validatedData;

    // Find and validate the reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user password and delete the reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.verificationToken.delete({
        where: { token }
      })
    ]);

    return NextResponse.json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Password reset confirmation error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
