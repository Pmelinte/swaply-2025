import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: users }, { data: items }, { data: apiLogs }] = await Promise.all([
    supabase.from("profiles").select("user_id, username, full_name, created_at").limit(20),
    supabase
      .from("items")
      .select("id, title, is_active, owner_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("api_usage_logs")
      .select("id, api_key, endpoint, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-sm text-gray-600">
          Vizualizare minimă pentru users, items și loguri API.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Utilizatori</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Nume</th>
                <th className="px-3 py-2">Creat</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((row: any) => (
                <tr key={row.user_id} className="border-t">
                  <td className="px-3 py-2">{row.username ?? row.user_id}</td>
                  <td className="px-3 py-2">{row.full_name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {row.created_at}
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={3}>
                    Nu există utilizatori sau lipsesc permisiunile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Items</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Titlu</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.title ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{row.owner_id}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.is_active ? "active" : "inactive"}
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={3}>
                    Nu există items sau lipsesc permisiunile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">API Usage Logs</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">API Key</th>
                <th className="px-3 py-2">Endpoint</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(apiLogs ?? []).map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 text-xs">{row.api_key}</td>
                  <td className="px-3 py-2 text-xs">{row.endpoint}</td>
                  <td className="px-3 py-2 text-xs">{row.status}</td>
                </tr>
              ))}
              {(!apiLogs || apiLogs.length === 0) && (
                <tr>
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={3}>
                    Nu există loguri sau lipsesc permisiunile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
