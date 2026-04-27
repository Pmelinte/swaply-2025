import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";
import { getTranslations } from "next-intl/server";

// useSearchParams inside ExploreClient requires a Suspense boundary so the
// /explore page can still be prerendered per locale. The fallback is empty
// because the client renders instantly once the URL is available.
export default async function ExplorePage() {
  const t = await getTranslations("explore");
  return (
    <>
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <Suspense fallback={null}>
        <ExploreClient />
      </Suspense>
    </>
  );
}
