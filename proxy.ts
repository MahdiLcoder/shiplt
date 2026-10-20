import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const isWebhook = pathname.startsWith("/api/webhooks/");
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isProjectRoute =
    pathname === "/projects" || pathname.startsWith("/projects/");

  if (!isWebhook && (isDashboard || isProjectRoute)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
