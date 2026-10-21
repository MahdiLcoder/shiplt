import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { AuthFrame, clerkAppearance } from "../../../components/auth/AuthFrame";

export default function SignInPage() {
  return (
    <AuthFrame>
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-96" />}>
        <SignIn appearance={clerkAppearance} />
      </Suspense>
    </AuthFrame>
  );
}
