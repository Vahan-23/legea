"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { company } from "@/data/company";
import { buildSpecPdf, downloadBlob } from "@/lib/pdf";
import { generateSpecNumber, type SpecPdfLabels } from "@/lib/specHelpers";
import {
  specContactSchema,
  type SpecContactSchema,
} from "@/lib/specSchema";
import { useSpecStore } from "@/store/useSpecStore";
import type { Locale } from "@/i18n/routing";

type ContactFormProps = {
  onSuccess: (specNumber: string) => void;
};

export function ContactForm({ onSuccess }: ContactFormProps) {
  const t = useTranslations("spec");
  const tBrand = useTranslations("branding");
  const locale = useLocale() as Locale;
  const items = useSpecStore((s) => s.items);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpecContactSchema>({
    resolver: zodResolver(specContactSchema),
    defaultValues: {
      organization: "",
      contactPerson: "",
      phone: "",
      email: "",
      city: "",
      deliveryPreset: "month",
      comment: "",
      website: "",
    },
  });

  const labels: SpecPdfLabels = {
    title: t("pdf.title"),
    specNumber: t("pdf.specNumber"),
    date: t("pdf.date"),
    article: t("pdf.article"),
    name: t("pdf.name"),
    colorway: t("pdf.colorway"),
    sizes: t("pdf.sizes"),
    qty: t("pdf.qty"),
    branding: t("pdf.branding"),
    noBranding: t("pdf.noBranding"),
    priceNote: t("pdf.priceNote"),
    organization: t("form.organization"),
    contact: t("form.contactPerson"),
    phone: t("form.phone"),
    email: t("form.email"),
    city: t("form.city"),
    delivery: t("form.delivery"),
    comment: t("form.comment"),
    method: tBrand("method"),
    zones: tBrand("zones"),
    preview: t("pdf.preview"),
  };

  const methodLabels = {
    print: tBrand("methods.print"),
    sublimation: tBrand("methods.sublimation"),
    embroidery: tBrand("methods.embroidery"),
  };

  const zoneKeys = [
    "chest-center",
    "chest-left",
    "chest-right",
    "back-top",
    "back-number",
    "sleeve-left",
    "sleeve-right",
    "shorts-left",
    "shorts-right",
    "sock-side",
  ] as const;

  const zoneLabels: Record<string, string> = {};
  for (const key of zoneKeys) {
    zoneLabels[key] = tBrand(`zone.${key}`);
  }

  const buildPdf = async (values: SpecContactSchema) => {
    const specNumber = generateSpecNumber();
    const { blob, base64 } = await buildSpecPdf({
      specNumber,
      locale,
      items,
      contact: {
        ...values,
        comment: values.comment ?? "",
        website: values.website ?? "",
      },
      labels,
      company: {
        brandName: company.brandName,
        legalName: company.legalName,
        legalAddress: company.legalAddress,
        taxId: company.taxId,
        phones: company.phones,
        publicEmail: company.publicEmail,
      },
      deliveryLabel: t(`delivery.${values.deliveryPreset}`),
      methodLabels,
      zoneLabels,
    });
    return { specNumber, blob, base64 };
  };

  const onDownload = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const { specNumber, blob } = await buildPdf(values);
      downloadBlob(blob, `${specNumber}.pdf`);
    } catch {
      setFormError(t("errors.pdf"));
    } finally {
      setSubmitting(false);
    }
  });

  const onSubmitQuote = handleSubmit(async (values) => {
    if (values.website) {
      onSuccess(generateSpecNumber());
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const { specNumber, base64, blob } = await buildPdf(values);

      const logos = items.flatMap((item) => {
        const dataUrl = item.branding?.logoDataUrl;
        if (!dataUrl) return [];
        return [
          {
            fileName:
              item.branding?.logoFileName ?? `logo-${item.productId}.png`,
            dataUrl,
          },
        ];
      });

      const uniqueLogos = Array.from(
        new Map(logos.map((logo) => [logo.fileName, logo])).values(),
      );

      const response = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "full",
          specNumber,
          locale,
          contact: values,
          pdfBase64: base64,
          logos: uniqueLogos,
          website: values.website ?? "",
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        specNumber?: string;
      };

      if (!response.ok || !data.ok) {
        if (data.error === "rate_limit") {
          setFormError(t("errors.rateLimit"));
        } else {
          setFormError(
            t("errors.sendFailed", { email: company.publicEmail }),
          );
        }
        downloadBlob(blob, `${specNumber}.pdf`);
        return;
      }

      onSuccess(data.specNumber ?? specNumber);
    } catch {
      setFormError(t("errors.sendFailed", { email: company.publicEmail }));
    } finally {
      setSubmitting(false);
    }
  });

  if (items.length === 0) return null;

  return (
    <form
      className="relative space-y-6 border border-navy/15 bg-white p-6"
      noValidate
    >
      <h2 className="font-display text-lg uppercase tracking-display text-navy">
        {t("form.title")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("form.organization")}
          error={errors.organization ? t("form.errors.required") : undefined}
        >
          <input {...register("organization")} className="field-input" />
        </Field>
        <Field
          label={t("form.contactPerson")}
          error={errors.contactPerson ? t("form.errors.required") : undefined}
        >
          <input {...register("contactPerson")} className="field-input" />
        </Field>
        <Field
          label={t("form.phone")}
          error={errors.phone ? t("form.errors.phone") : undefined}
        >
          <input {...register("phone")} className="field-input" type="tel" />
        </Field>
        <Field
          label={t("form.email")}
          error={errors.email ? t("form.errors.email") : undefined}
        >
          <input {...register("email")} className="field-input" type="email" />
        </Field>
        <Field
          label={t("form.city")}
          error={errors.city ? t("form.errors.required") : undefined}
        >
          <input {...register("city")} className="field-input" />
        </Field>
        <Field label={t("form.delivery")}>
          <select {...register("deliveryPreset")} className="field-input">
            <option value="urgent">{t("delivery.urgent")}</option>
            <option value="month">{t("delivery.month")}</option>
            <option value="quarter">{t("delivery.quarter")}</option>
            <option value="later">{t("delivery.later")}</option>
          </select>
        </Field>
      </div>

      <Field label={t("form.comment")}>
        <textarea {...register("comment")} rows={3} className="field-input" />
      </Field>

      <div className="absolute -left-[9999px] opacity-0" aria-hidden>
        <label>
          website
          <input {...register("website")} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {formError ? (
        <p className="border border-blue/30 bg-off-white px-3 py-2 text-sm text-navy">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={() => void onDownload()}
        >
          {t("actions.downloadPdf")}
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => void onSubmitQuote()}
        >
          {submitting ? t("actions.sending") : t("actions.getQuote")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-blue">{error}</span>
      ) : null}
    </label>
  );
}
