import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to your Dashboard
              </h1>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Authentication Successful!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Welcome back, {session.user.name}!</p>
                      <p>Email: {session.user.email}</p>
                      <p>User ID: {session.user.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
