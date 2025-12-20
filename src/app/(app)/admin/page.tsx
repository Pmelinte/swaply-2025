import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

function isAdmin(email: string | null | undefined) {
  const list = process.env.ADMIN_EMAILS?.split(",") ?? [];
  if (!email) return false;
  return list.map((v) => v.trim().toLowerCase()).includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-gray-600">Nu ai acces admin.</p>
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,username,full_name,account_type,trust_score")
    .limit(20);

  const { data: items } = await supabase
    .from("items")
    .select("id,title,is_active")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: logs } = await supabase
    .from("api_usage_logs")
    .select("id,api_key,endpoint,status,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Users</h2>
        <div className="grid gap-2">
          {(profiles ?? []).map((p) => (
            <div key={p.user_id} className="border rounded p-3 text-sm">
              {p.full_name ?? p.username ?? p.user_id} · {p.account_type} · trust {p.trust_score}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Items raportate (placeholder)</h2>
        <div className="grid gap-2">
          {(items ?? []).map((item) => (
            <div key={item.id} className="border rounded p-3 text-sm">
              {item.title} · {item.is_active ? "active" : "inactive"}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">API usage logs</h2>
        <div className="grid gap-2">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="border rounded p-3 text-xs">
              {log.endpoint} · {log.status} · {log.api_key}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
