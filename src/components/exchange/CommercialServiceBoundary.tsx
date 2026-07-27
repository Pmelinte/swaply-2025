import type { ReactNode } from 'react';

import {
  commercialFallbackMessage,
  disclosureLabel,
  type CommercialServiceOffer,
} from '@/lib/commerce/commercial-ui-contract';

interface Props {
  offer: CommercialServiceOffer;
  children: ReactNode;
}

function formatMinorUnits(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

export function CommercialServiceBoundary({ offer, children }: Props) {
  const fallback = commercialFallbackMessage(offer);

  return (
    <section
      className="space-y-3"
      data-commercial-service="true"
      data-disclosure={offer.disclosure}
      aria-label={`${offer.title}: ${disclosureLabel(offer.disclosure)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/70">
        <div className="space-y-0.5">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">{offer.title}</p>
          <p className="text-zinc-500 dark:text-zinc-400">
            {disclosureLabel(offer.disclosure)} · Optional · Provided by {offer.providerId}
          </p>
        </div>
        <div className="text-right text-zinc-600 dark:text-zinc-300">
          <p>{formatMinorUnits(offer.subtotalMinor, offer.currency)} service</p>
          <p>{formatMinorUnits(offer.commissionMinor, offer.currency)} Swaply fee</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMinorUnits(offer.totalMinor, offer.currency)} total
          </p>
        </div>
      </div>

      {fallback ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {fallback}
        </div>
      ) : (
        children
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        The swap itself is free. This service is separate and may be removed without cancelling the swap.
      </p>
    </section>
  );
}
