import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Public API</h1>
      <p className="text-sm text-muted-foreground">
        Endpoint-uri monetizabile (image → category, metadata, price, matching).
        Toate cer header-ul <code>x-api-key</code>.
      </p>

      <div className="space-y-3">
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">POST /api/public/ai/image-category</div>
          <div className="text-xs text-gray-600">Body: {`{ imageUrl }`}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">POST /api/public/ai/metadata</div>
          <div className="text-xs text-gray-600">Body: {`{ imageUrl, locale }`}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">POST /api/public/ai/price</div>
          <div className="text-xs text-gray-600">Body: {`{ title, category, condition }`}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="font-semibold">POST /api/public/matching</div>
          <div className="text-xs text-gray-600">Body: {`{ wishlist: [], items: [] }`}</div>
        </div>
      </div>

      <Link className="text-blue-600 hover:underline" href="/settings/profile">
        Gestionează profilul
      </Link>
    </div>
  );
}
