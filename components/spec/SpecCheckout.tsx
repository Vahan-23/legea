"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/spec/ContactForm";
import { SpecSummary } from "@/components/spec/SpecSummary";
import { Button } from "@/components/ui/Button";

export function SpecCheckout() {
  const t = useTranslations("spec");
  const [successNumber, setSuccessNumber] = useState<string | null>(null);

  if (successNumber) {
    return (
      <div className="border border-blue/20 bg-white px-6 py-16 text-center">
        <p className="font-display text-2xl uppercase tracking-display text-navy">
          {t("success.title")}
        </p>
        <p className="mt-4 text-graphite">{t("success.body")}</p>
        <p className="mt-6 font-mono text-lg text-blue">{successNumber}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/catalog">{t("backToCatalog")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <SpecSummary />
      <ContactForm onSuccess={setSuccessNumber} />
    </div>
  );
}
