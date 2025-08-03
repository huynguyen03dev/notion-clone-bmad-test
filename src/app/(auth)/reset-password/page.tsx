import { PasswordResetConfirmForm } from "@/components/auth/PasswordResetConfirmForm";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ResetPasswordPageProps {
  searchParams: {
    token?: string;
    email?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              return to sign in
            </Link>
          </p>
        </div>
        <PasswordResetConfirmForm token={token} />
      </div>
    </div>
  );
}
