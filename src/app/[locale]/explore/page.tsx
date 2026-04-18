import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";

// useSearchParams inside ExploreClient requires a Suspense boundary so the
// /explore page can still be prerendered per locale. The fallback is empty
// because the client renders instantly once the URL is available.
export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreClient />
    </Suspense>
  );
}
