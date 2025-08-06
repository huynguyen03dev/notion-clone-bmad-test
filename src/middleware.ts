import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect authenticated users from root to dashboard
    if (pathname === "/" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Add any additional middleware logic here
    console.log("Protected route accessed:", pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow root path for both authenticated and unauthenticated users
        // (client-side redirect handles authenticated users)
        if (pathname === "/") {
          return true;
        }
        
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/boards/:path*",
    "/profile/:path*"
  ]
};
