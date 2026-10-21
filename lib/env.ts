import "server-only";

// Values are provided by the environment at runtime. Missing values are not
// checked here so production builds can run without application secrets.
export const env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  DATABASE_URL: process.env.DATABASE_URL!,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
  SHIPIT_WEBHOOK_SECRET: process.env.SHIPIT_WEBHOOK_SECRET!,
};
