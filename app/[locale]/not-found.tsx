import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-blue">404</p>
      <h1 className="text-display-sm text-navy">{t("notFoundTitle")}</h1>
      <p className="max-w-md text-muted">{t("notFoundBody")}</p>
      <Button href="/">{t("home")}</Button>
    </div>
  );
}
