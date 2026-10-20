import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-96" />}>
        <SignUp />
      </Suspense>
    </div>
  );
}
