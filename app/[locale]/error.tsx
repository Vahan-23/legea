"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-display-sm text-navy">{t("genericTitle")}</h1>
      <p className="max-w-md text-muted">{t("genericBody")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          {t("retry")}
        </Button>
        <Button href="/" variant="ghost">
          {t("home")}
        </Button>
      </div>
    </div>
  );
}
