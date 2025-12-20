// src/app/(app)/my/items/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/features/items/types";

function isArchived(item: any): boolean {
  // 1) dacă există un boolean clar
  if (typeof item?.archived === "boolean") return item.archived;
  if (typeof item?.is_archived === "boolean") return item.is_archived;

  // 2) dacă există status string
  const status = (item?.status ?? item?.state ?? "") as string;
  if (typeof status === "string" && status.toLowerCase() === "archived") return true;

  // 3) dacă există is_active boolean (invers)
  if (typeof item?.is_active === "boolean") return !item.is_active;

  // fallback: considerăm activ
  return false;
}

export default async function MyItemsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">My items</h1>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  const list = (items as Item[]) ?? [];

  const active = list.filter((item) => !isArchived(item));
  const archived = list.filter((item) => isArchived(item));

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">My items</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active: {active.length} • Archived: {archived.length}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Active</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active items.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((item: any) => (
              <li key={item.id} className="rounded-md border p-3">
                <div className="font-medium">{item.title ?? "Untitled"}</div>
                {item.description ? (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Archived</h2>
        {archived.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived items.</p>
        ) : (
          <ul className="space-y-2">
            {archived.map((item: any) => (
              <li key={item.id} className="rounded-md border p-3 opacity-80">
                <div className="font-medium">{item.title ?? "Untitled"}</div>
                {item.description ? (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
