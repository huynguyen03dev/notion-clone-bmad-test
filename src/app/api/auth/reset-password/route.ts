import { NextRequest, NextResponse } from "next/server";
import { passwordResetSchema } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = passwordResetSchema.parse(body);
    const { email } = validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry
      }
    });

    // In a real application, you would send an email here
    // For now, we'll just log the reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && {
        resetToken,
        resetUrl: `http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      })
    });

  } catch (error) {
    console.error("Password reset request error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
