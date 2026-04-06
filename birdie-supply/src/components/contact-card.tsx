import Image from "next/image";
import { useTranslations } from "next-intl";

type Props = {
  showArrangeTime?: boolean;
};

export function ContactCard({ showArrangeTime }: Props) {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm text-center">
      <h2 className="text-lg font-bold mb-3">{t("contact.title")}</h2>
      <Image
        src="/contact-wechat.jpg"
        alt="WeChat QR Code"
        width={200}
        height={200}
        className="mx-auto rounded-lg"
      />
      <p className="text-sm text-gray-600 mt-3">{t("contact.scanWechat")}</p>
      {showArrangeTime && (
        <p className="text-xs text-gray-500 mt-1">{t("contact.arrangeTime")}</p>
      )}
    </div>
  );
}
