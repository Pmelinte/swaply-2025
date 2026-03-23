import { redirect } from "next/navigation";

/**
 * /register redirects to /login?tab=register so that the unified
 * auth page opens directly on the registration tab.
 */
export default function RegisterRedirect() {
  redirect("/login?tab=register");
}
