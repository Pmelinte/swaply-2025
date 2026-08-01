"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { EventWizard } from "@/components/wizard/event/EventWizard";
import { PropertyWizard } from "@/components/wizard/property/PropertyWizard";
import { ServiceWizard } from "@/components/wizard/service/ServiceWizard";
import type { DomainListingType } from "@/lib/listings/domainListingPayload";
import type { EventFormData } from "@/lib/wizard/eventWizardStore";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

type OwnerResponse = {
  isOwner?: boolean;
  revision?: unknown;
  editorForm?: unknown;
};

function endpoint(domain: DomainListingType, itemId: string): string {
  const segment = domain === "property" ? "properties" : `${domain}s`;
  return `/api/items/${segment}/${itemId}`;
}

function domainPath(domain: DomainListingType, itemId: string): string {
  const segment = domain === "property" ? "properties" : `${domain}s`;
  return `/${segment}/${itemId}`;
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

export function DomainListingEditPage({
  domain,
  itemId,
}: {
  domain: DomainListingType;
  itemId: string;
}) {
  const tc = useTranslations("common");
  const [form, setForm] = useState<unknown>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerEditor() {
      setLoading(true);
      setFailed(false);
      try {
        const response = await fetch(endpoint(domain, itemId), {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as OwnerResponse | null;
        if (
          !response.ok ||
          !body?.isOwner ||
          !validRevision(body.revision) ||
          !body.editorForm
        ) {
          throw new Error("OWNER_EDITOR_UNAVAILABLE");
        }
        if (!cancelled) {
          setForm(body.editorForm);
          setRevision(body.revision);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOwnerEditor();
    return () => {
      cancelled = true;
    };
  }, [domain, itemId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-zinc-500">
        {tc("loading")}
      </div>
    );
  }

  if (failed || !form || revision === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h1 className="text-lg font-semibold text-red-900 dark:text-red-100">
            {tc("error")}
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {tc("errorOccurred")}
          </p>
          <Link
            href={domainPath(domain, itemId)}
            className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            {tc("back")}
          </Link>
        </div>
      </main>
    );
  }

  if (domain === "property") {
    return (
      <PropertyWizard
        mode="edit"
        itemId={itemId}
        initialRevision={revision}
        initialForm={form as PropertyFormData}
      />
    );
  }

  if (domain === "service") {
    return (
      <ServiceWizard
        mode="edit"
        itemId={itemId}
        initialRevision={revision}
        initialForm={form as ServiceFormData}
      />
    );
  }

  return (
    <EventWizard
      mode="edit"
      itemId={itemId}
      initialRevision={revision}
      initialForm={form as EventFormData}
    />
  );
}
