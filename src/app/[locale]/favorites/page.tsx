import dynamic from "next/dynamic";

const FavoritesClient = dynamic(() => import("./FavoritesClient"));

export default async function FavoritesPage() {
  return <FavoritesClient />;
}
