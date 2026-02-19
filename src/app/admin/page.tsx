"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { ProductControl } from "@/features/admin/ProductControl";

export default function AdminPage() {
  const { user } = useAppState();

  if (!user) {
    return <LoggedOutGate returnTo="/admin" />;
  }

  return <ProductControl />;
}
