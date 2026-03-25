import { redirect } from "next/navigation";

/**
 * /signup redirects to /onboarding instantly (server-side).
 * Signup only happens as part of the onboarding flow (step 3)
 * after the user picks their industry, persona, and business context.
 */
export default function SignupPage() {
  redirect("/onboarding");
}
