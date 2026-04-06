import { setRequestLocale, getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  const sections = [
    { title: t("collectTitle"), text: t("collectText") },
    { title: t("useTitle"), text: t("useText") },
    { title: t("sharingTitle"), text: t("sharingText") },
    { title: t("storageTitle"), text: t("storageText") },
    { title: t("cookiesTitle"), text: t("cookiesText") },
    { title: t("contactTitle"), text: t("contactText") },
  ];

  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-1">{t("title")}</h1>
      <p className="text-xs text-gray-400 mb-4">{t("lastUpdated")}</p>
      <p className="text-sm text-gray-600 mb-6">{t("intro")}</p>

      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold mb-1">{section.title}</h2>
            <p className="text-sm text-gray-600">{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
