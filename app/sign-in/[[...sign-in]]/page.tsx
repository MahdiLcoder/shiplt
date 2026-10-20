import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-96" />}>
        <SignIn />
      </Suspense>
    </div>
  );
}
