"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { company } from "@/data/company";
import { generateSpecNumber } from "@/lib/specHelpers";
import {
  quickLeadSchema,
  type QuickLeadSchema,
} from "@/lib/specSchema";
import type { Locale } from "@/i18n/routing";

export function HomeQuickLead() {
  const t = useTranslations("home.lead");
  const locale = useLocale() as Locale;
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickLeadSchema>({
    resolver: zodResolver(quickLeadSchema),
    defaultValues: {
      organization: "",
      contactPerson: "",
      phone: "",
      comment: "",
      website: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (values.website) {
      setDone(generateSpecNumber());
      return;
    }
    setSending(true);
    setError(null);
    try {
      const specNumber = generateSpecNumber();
      const res = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quick",
          specNumber,
          locale,
          contact: values,
          website: values.website,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error === "rate_limit"
            ? t("errors.rateLimit")
            : t("errors.send", { email: company.publicEmail }),
        );
        return;
      }
      setDone(specNumber);
      reset();
    } catch {
      setError(t("errors.send", { email: company.publicEmail }));
    } finally {
      setSending(false);
    }
  });

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-display-sm text-navy">{t("title")}</h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
          <div className="mt-8 space-y-2 text-sm text-graphite">
            <p>{company.officeAddress}</p>
            {company.phones.map((phone) => (
              <p key={phone}>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-blue">
                  {phone}
                </a>
              </p>
            ))}
            <p>
              <a
                href={`mailto:${company.publicEmail}`}
                className="hover:text-blue"
              >
                {company.publicEmail}
              </a>
            </p>
          </div>
          <a
            href={company.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 block aspect-[16/10] bg-off-white"
          >
            {/* TODO: заменить статичной картой */}
            <div className="flex h-full items-center justify-center border border-navy/10 font-mono text-xs uppercase tracking-widest text-muted">
              {t("map")}
            </div>
          </a>
        </div>

        <div className="border border-navy/15 p-6">
          {done ? (
            <div className="py-10 text-center">
              <p className="font-display text-xl uppercase text-navy">
                {t("success")}
              </p>
              <p className="mt-4 font-mono text-blue">{done}</p>
            </div>
          ) : (
            <form className="relative space-y-4" noValidate>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t("name")}</span>
                <input {...register("contactPerson")} className="field-input" />
                {errors.contactPerson ? (
                  <span className="mt-1 block text-xs text-blue">
                    {t("errors.required")}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t("phone")}</span>
                <input {...register("phone")} className="field-input" type="tel" />
                {errors.phone ? (
                  <span className="mt-1 block text-xs text-blue">
                    {t("errors.phone")}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t("organization")}</span>
                <input {...register("organization")} className="field-input" />
                {errors.organization ? (
                  <span className="mt-1 block text-xs text-blue">
                    {t("errors.required")}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t("comment")}</span>
                <textarea
                  {...register("comment")}
                  rows={3}
                  className="field-input"
                />
              </label>
              <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                <input {...register("website")} tabIndex={-1} autoComplete="off" />
              </div>
              {error ? (
                <p className="text-sm text-navy">{error}</p>
              ) : null}
              <Button type="button" disabled={sending} onClick={() => void onSubmit()}>
                {sending ? t("sending") : t("submit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
