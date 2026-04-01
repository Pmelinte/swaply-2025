"use client";

import { useCallback, type ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

type LinkProps = ComponentProps<typeof Link>;

/**
 * Link wrapper that uses the View Transitions API for smooth
 * page transitions in browsers that support it.
 * Falls back to standard navigation in unsupported browsers.
 */
export function ViewTransitionLink({ onClick, href, ...props }: LinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        e.preventDefault();
        (document as unknown as { startViewTransition: (cb: () => void) => void })
          .startViewTransition(() => {
            router.push(href as string);
          });
      }
    },
    [onClick, href, router],
  );

  return <Link href={href} onClick={handleClick} {...props} />;
}
