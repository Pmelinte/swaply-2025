"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate, AdminGate } from "@/components/gated";
import { ProductControl } from "@/features/admin/ProductControl";

export default function AdminPage() {
  const { user } = useAppState();

  if (!user) {
    return <LoggedOutGate returnTo="/admin" />;
  }

  // RBAC: only admin or moderator can access
  if (user.role !== "admin" && user.role !== "moderator") {
    return <AdminGate><></></AdminGate>;
  }

  return <ProductControl />;
}
