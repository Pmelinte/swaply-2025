"use client";

import { useEffect } from "react";

const ICON_LABELS: Record<string, string> = {
  "layout-grid": "Grid view",
  list: "List view",
  heart: "Toggle favorite",
  "sliders-horizontal": "Sort and filter",
  map: "Map view",
  search: "Search",
  settings: "Settings",
  x: "Close",
};

function hasAccessibleName(element: HTMLElement) {
  return Boolean(
    element.getAttribute("aria-label")?.trim()
      || element.getAttribute("aria-labelledby")?.trim()
      || element.getAttribute("title")?.trim()
      || element.textContent?.trim(),
  );
}

function getLucideIconName(icon: SVGElement | null) {
  if (!icon) return null;

  const dataName = icon.getAttribute("data-lucide")?.trim().toLowerCase();
  if (dataName) return dataName;

  const className = icon.getAttribute("class") ?? "";
  const lucideClass = className
    .split(/\s+/)
    .find((token) => token.startsWith("lucide-") && token !== "lucide-icon");

  return lucideClass ? lucideClass.slice("lucide-".length).toLowerCase() : null;
}

function readableIconName(button: HTMLButtonElement) {
  const icon = button.querySelector<SVGElement>("svg");
  const iconName = getLucideIconName(icon);
  if (!iconName) return null;

  return ICON_LABELS[iconName]
    ?? iconName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
}

function nearbyCardTitle(button: HTMLButtonElement) {
  const card = button.closest<HTMLElement>(
    ".item-card-container, .item-card, article, [data-item-card]",
  );
  return card?.querySelector<HTMLElement>("h2, h3, [data-item-title]")?.textContent?.trim() || null;
}

function labelButton(button: HTMLButtonElement) {
  if (hasAccessibleName(button)) return;

  const iconLabel = readableIconName(button);
  if (!iconLabel) return;

  const cardTitle = nearbyCardTitle(button);
  const label = iconLabel === "Toggle favorite" && cardTitle
    ? `${iconLabel}: ${cardTitle}`
    : iconLabel;

  button.setAttribute("aria-label", label);
  button.dataset.accessibleNameGuard = "button";
}

function hasAssociatedLabel(select: HTMLSelectElement) {
  if (select.labels && select.labels.length > 0) return true;
  return Boolean(
    select.getAttribute("aria-label")?.trim()
      || select.getAttribute("aria-labelledby")?.trim()
      || select.getAttribute("title")?.trim(),
  );
}

function labelSelect(select: HTMLSelectElement) {
  if (hasAssociatedLabel(select)) return;

  const selectedText = select.selectedOptions.item(0)?.textContent?.trim();
  select.setAttribute(
    "aria-label",
    selectedText ? `Options: ${selectedText}` : "Sort and filter options",
  );
  select.dataset.accessibleNameGuard = "select";
}

function labelProgressbar(progressbar: HTMLElement) {
  if (
    progressbar.getAttribute("aria-label")?.trim()
    || progressbar.getAttribute("aria-labelledby")?.trim()
    || progressbar.getAttribute("title")?.trim()
  ) {
    return;
  }

  const previousText = progressbar.previousElementSibling?.textContent?.trim();
  progressbar.setAttribute(
    "aria-label",
    previousText ? `${previousText} progress` : "Progress",
  );
  progressbar.dataset.accessibleNameGuard = "progressbar";
}

export function applyAccessibleNameGuard(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>("button").forEach(labelButton);
  root.querySelectorAll<HTMLSelectElement>("select").forEach(labelSelect);
  root.querySelectorAll<HTMLElement>('[role="progressbar"]').forEach(labelProgressbar);
}

export function AccessibleNameGuard() {
  useEffect(() => {
    applyAccessibleNameGuard();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            applyAccessibleNameGuard(node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}

export default AccessibleNameGuard;
