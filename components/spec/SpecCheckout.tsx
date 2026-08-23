"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SpecSummary } from "@/components/spec/SpecSummary";
import { Button } from "@/components/ui/Button";

const ContactForm = dynamic(
  () =>
    import("@/components/spec/ContactForm").then((m) => ({
      default: m.ContactForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 border border-navy/15 bg-white p-6">
        <div className="h-5 w-48 rounded bg-navy/10" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-10 rounded bg-navy/10" />
          <div className="h-10 rounded bg-navy/10" />
          <div className="h-10 rounded bg-navy/10" />
          <div className="h-10 rounded bg-navy/10" />
        </div>
      </div>
    ),
  },
);

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
        <div className="mt-8">
          <Button type="button" onClick={() => setSuccessNumber(null)}>
            {t("closeDrawer")}
          </Button>
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
