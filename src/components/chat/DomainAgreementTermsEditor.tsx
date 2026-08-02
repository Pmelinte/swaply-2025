"use client";

import {
  linesToList,
  listToLines,
  type EventAgreementTerms,
  type MatchAgreementContext,
  type MatchAgreementDomainTerm,
  type PropertyAgreementTerms,
  type ServiceAgreementTerms,
} from "@/lib/chat/domainAgreement";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
const labelClass =
  "space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200";

function toLocalDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function CheckField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span>{label}</span>
    </label>
  );
}

export function DomainAgreementTermsEditor({
  context,
  terms,
  disabled,
  onChange,
}: {
  context: MatchAgreementContext;
  terms: MatchAgreementDomainTerm[];
  disabled: boolean;
  onChange: (terms: MatchAgreementDomainTerm[]) => void;
}) {
  function updateEntry(
    itemId: string,
    update: (entry: MatchAgreementDomainTerm) => MatchAgreementDomainTerm,
  ) {
    onChange(
      terms.map((entry) =>
        entry.item_id === itemId ? update(entry) : entry,
      ),
    );
  }

  return (
    <div className="mt-4 space-y-4" data-testid="domain-agreement-terms">
      {context.items.map((item) => {
        if (item.domain === "object") return null;
        const entry = terms.find(
          (candidate) =>
            candidate.item_id === item.item_id &&
            candidate.domain === item.domain,
        );
        if (!entry) return null;

        return (
          <section
            key={item.item_id}
            data-testid={`domain-agreement-${item.domain}-${item.item_id}`}
            className="rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-zinc-900"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h5>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                {item.domain}
              </span>
            </div>

            {entry.domain === "property" ? (
              <PropertyTermsEditor
                value={entry.terms}
                disabled={disabled}
                onChange={(next) =>
                  updateEntry(item.item_id, () => ({
                    item_id: item.item_id,
                    domain: "property",
                    terms: next,
                  }))
                }
              />
            ) : entry.domain === "service" ? (
              <ServiceTermsEditor
                value={entry.terms}
                disabled={disabled}
                onChange={(next) =>
                  updateEntry(item.item_id, () => ({
                    item_id: item.item_id,
                    domain: "service",
                    terms: next,
                  }))
                }
              />
            ) : (
              <EventTermsEditor
                value={entry.terms}
                disabled={disabled}
                onChange={(next) =>
                  updateEntry(item.item_id, () => ({
                    item_id: item.item_id,
                    domain: "event",
                    terms: next,
                  }))
                }
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

function PropertyTermsEditor({
  value,
  disabled,
  onChange,
}: {
  value: PropertyAgreementTerms;
  disabled: boolean;
  onChange: (value: PropertyAgreementTerms) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className={labelClass}>
        <span>Period start</span>
        <input
          type="date"
          value={value.period_start}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, period_start: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Period end</span>
        <input
          type="date"
          value={value.period_end}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, period_end: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Timezone</span>
        <input
          value={value.timezone}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, timezone: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Exchange mode</span>
        <select
          value={value.exchange_mode}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              exchange_mode: event.target.value as PropertyAgreementTerms["exchange_mode"],
            })
          }
          className={inputClass}
        >
          <option value="simultaneous">Simultaneous</option>
          <option value="non_simultaneous">Non-simultaneous</option>
          <option value="vacation_handoff">Vacation handoff</option>
        </select>
      </label>
      <label className={labelClass}>
        <span>Guests</span>
        <input
          type="number"
          min={1}
          value={value.guests}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, guests: Number(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Security deposit EUR</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value.security_deposit_eur}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              security_deposit_eur: Number(event.target.value),
            })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Check-in</span>
        <input
          type="time"
          value={value.check_in_time}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, check_in_time: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Check-out</span>
        <input
          type="time"
          value={value.check_out_time}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, check_out_time: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <div className="md:col-span-2">
        <CheckField
          label="Insurance confirmed"
          checked={value.insurance_confirmed}
          disabled={disabled}
          onChange={(checked) =>
            onChange({ ...value, insurance_confirmed: checked })
          }
        />
      </div>
      <label className={`${labelClass} md:col-span-2`}>
        <span>House rules</span>
        <textarea
          rows={3}
          value={value.rules}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, rules: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Check-in, key and handover instructions</span>
        <textarea
          rows={3}
          value={value.handover_notes}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, handover_notes: event.target.value })
          }
          className={inputClass}
        />
      </label>
    </div>
  );
}

function ServiceTermsEditor({
  value,
  disabled,
  onChange,
}: {
  value: ServiceAgreementTerms;
  disabled: boolean;
  onChange: (value: ServiceAgreementTerms) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className={labelClass}>
        <span>Delivery mode</span>
        <select
          value={value.delivery_mode}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              delivery_mode: event.target.value as ServiceAgreementTerms["delivery_mode"],
            })
          }
          className={inputClass}
        >
          <option value="remote">Remote</option>
          <option value="physical">Physical</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label className={labelClass}>
        <span>Timezone</span>
        <input
          value={value.timezone}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, timezone: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Duration hours</span>
        <input
          type="number"
          min={0}
          value={value.duration_hours}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, duration_hours: Number(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Duration days</span>
        <input
          type="number"
          min={0}
          value={value.duration_days}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, duration_days: Number(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Deadline</span>
        <input
          type="datetime-local"
          value={toLocalDateTime(value.deadline_at)}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              deadline_at: fromLocalDateTime(event.target.value),
            })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Deliverables — one per line</span>
        <textarea
          rows={4}
          value={listToLines(value.deliverables)}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, deliverables: linesToList(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Milestones — one per line</span>
        <textarea
          rows={4}
          value={listToLines(value.milestones)}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, milestones: linesToList(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Acceptance criteria</span>
        <textarea
          rows={3}
          value={value.acceptance_criteria}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, acceptance_criteria: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>No-show terms</span>
        <textarea
          rows={3}
          value={value.no_show_terms}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, no_show_terms: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Cancellation terms</span>
        <textarea
          rows={3}
          value={value.cancellation_terms}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, cancellation_terms: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Dispute terms</span>
        <textarea
          rows={3}
          value={value.dispute_terms}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, dispute_terms: event.target.value })
          }
          className={inputClass}
        />
      </label>
    </div>
  );
}

function EventTermsEditor({
  value,
  disabled,
  onChange,
}: {
  value: EventAgreementTerms;
  disabled: boolean;
  onChange: (value: EventAgreementTerms) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className={labelClass}>
        <span>Tickets or reservations</span>
        <input
          type="number"
          min={1}
          value={value.quantity}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, quantity: Number(event.target.value) })
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Issuer rule source</span>
        <input
          value={value.issuer_rule_source}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, issuer_rule_source: event.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} md:col-span-2`}>
        <span>Transfer deadline</span>
        <input
          type="datetime-local"
          value={toLocalDateTime(value.transfer_deadline_at)}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              transfer_deadline_at: fromLocalDateTime(event.target.value),
            })
          }
          className={inputClass}
        />
      </label>
      <CheckField
        label="Transferable"
        checked={value.transferable}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, transferable: checked })}
      />
      <CheckField
        label="Issuer rule confirmed"
        checked={value.issuer_rule_confirmed}
        disabled={disabled}
        onChange={(checked) =>
          onChange({ ...value, issuer_rule_confirmed: checked })
        }
      />
      <CheckField
        label="Ticket or event access included"
        checked={value.bundle.ticket}
        disabled={disabled}
        onChange={(checked) =>
          onChange({
            ...value,
            bundle: { ...value.bundle, ticket: checked },
          })
        }
      />
      <CheckField
        label="Accommodation included"
        checked={value.bundle.accommodation}
        disabled={disabled}
        onChange={(checked) =>
          onChange({
            ...value,
            bundle: { ...value.bundle, accommodation: checked },
          })
        }
      />
      <CheckField
        label="Transport included"
        checked={value.bundle.transport}
        disabled={disabled}
        onChange={(checked) =>
          onChange({
            ...value,
            bundle: { ...value.bundle, transport: checked },
          })
        }
      />
      <CheckField
        label="Participant-only transfer proof required"
        checked={value.proof_required}
        disabled={disabled}
        onChange={(checked) =>
          onChange({ ...value, proof_required: checked })
        }
      />
      <label className={`${labelClass} md:col-span-2`}>
        <span>Transfer method and proof expectations</span>
        <textarea
          rows={4}
          value={value.transfer_notes}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, transfer_notes: event.target.value })
          }
          className={inputClass}
        />
      </label>
    </div>
  );
}
