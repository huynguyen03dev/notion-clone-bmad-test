import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/ProfileForm";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-card shadow-lg rounded-lg p-6 border border-border/50">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Profile Settings
          </h1>

          <div className="flex justify-center">
            <ProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}
