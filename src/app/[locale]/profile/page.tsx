export const dynamic = "force-dynamic";
import { ProfileClient } from "./ProfileClient";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  return (
    <>
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <ProfileClient />
    </>
  );
}
