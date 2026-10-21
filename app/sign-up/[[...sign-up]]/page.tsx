import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { AuthFrame, clerkAppearance } from "../../../components/auth/AuthFrame";

export default function SignUpPage() {
  return (
    <AuthFrame>
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-96" />}>
        <SignUp appearance={clerkAppearance} />
      </Suspense>
    </AuthFrame>
  );
}
