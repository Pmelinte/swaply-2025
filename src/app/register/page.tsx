"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /register redirects to /login?tab=register so that the unified
 * auth page opens directly on the registration tab.
 */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?tab=register");
  }, [router]);
  return null;
}
