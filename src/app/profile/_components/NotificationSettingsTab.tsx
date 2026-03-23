"use client";

import { useTranslations } from "next-intl";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Mail, Smartphone } from "lucide-react";
import type { NotificationPreferences } from "@/lib/types";

const NOTIFICATION_TYPES = [
  "match_new",
  "message",
  "swap_proposed",
  "swap_accepted",
  "logistics_updated",
  "meeting_reminder",
  "dispute_update",
  "favorite_updated",
  "saved_search_result",
  "feedback_requested",
] as const;

const CHANNELS = ["inapp", "email", "push"] as const;

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "inapp") return <Bell className="h-4 w-4" />;
  if (channel === "email") return <Mail className="h-4 w-4" />;
  return <Smartphone className="h-4 w-4" />;
}

export default function NotificationSettingsTab({ userId }: { userId: string }) {
  const t = useTranslations("notificationSettings");
  const { preferences, prefsLoading, updatePreferences } = useNotifications(userId);

  if (prefsLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
      </div>
    );
  }

  const toggle = (key: string) => {
    const current = preferences[key as keyof NotificationPreferences];
    if (typeof current === "boolean") {
      void updatePreferences({ [key]: !current } as Partial<NotificationPreferences>);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("description")}</p>
      </div>

      {/* Channel headers */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-2 pr-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t("notificationType")}
              </th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <ChannelIcon channel={ch} />
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      {t(`channel_${ch}`)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {NOTIFICATION_TYPES.map((type) => (
              <tr key={type} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {t(`type_${type}`)}
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                    {t(`type_${type}_desc`)}
                  </p>
                </td>
                {CHANNELS.map((ch) => {
                  const key = `${type}_${ch}` as keyof NotificationPreferences;
                  const enabled = preferences[key] as boolean;
                  return (
                    <td key={ch} className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enabled
                            ? "bg-blue-600"
                            : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                        role="switch"
                        aria-checked={enabled}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                            enabled ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                          style={{ transform: enabled ? "translateX(18px)" : "translateX(2px)" }}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
