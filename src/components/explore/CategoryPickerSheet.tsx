"use client";

import { useEffect } from "react";
import { Package, Home, Wrench, Calendar, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type Intent = "want" | "offer";

type Props = {
  open: boolean;
  onClose: () => void;
  intent: Intent;
};

const CATEGORIES = [
  {
    key: "objects",
    label: "Objects",
    description: "Electronics, books, clothing & more",
    Icon: Package,
    color: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      hover: "hover:border-blue-400 dark:hover:border-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    key: "properties",
    label: "Properties",
    description: "Apartments, houses & rooms",
    Icon: Home,
    color: {
      border: "border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      hover: "hover:border-purple-400 dark:hover:border-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    key: "services",
    label: "Services",
    description: "Skills, labor & expertise",
    Icon: Wrench,
    color: {
      border: "border-emerald-200 dark:border-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      hover: "hover:border-emerald-400 dark:hover:border-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    key: "events",
    label: "Events",
    description: "Tickets, experiences & more",
    Icon: Calendar,
    color: {
      border: "border-amber-200 dark:border-amber-800",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      hover: "hover:border-amber-400 dark:hover:border-amber-600",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  },
];

export function CategoryPickerSheet({ open, onClose, intent }: Props) {
  const router = useRouter();

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSelect = (categoryKey: string) => {
    onClose();
    router.push(`/explore/add/${categoryKey}?intent=${intent}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — slides up from bottom */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-zinc-900 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={intent === "want" ? "Choose what you want" : "Choose what you offer"}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {intent === "want" ? "What do you want?" : "What do you offer?"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Choose a category to get started
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 mt-0.5 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category cards — 2-column grid */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-8 pt-1">
          {CATEGORIES.map(({ key, label, description, Icon, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition active:scale-95 ${color.border} ${color.bg} ${color.hover}`}
            >
              <div className={`rounded-xl p-2.5 ${color.iconBg}`}>
                <Icon className={`h-6 w-6 ${color.iconColor}`} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default CategoryPickerSheet;
