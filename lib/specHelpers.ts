import type { Locale } from "@/i18n/routing";
import type { SpecItem } from "@/types/spec";

export type DeliveryPreset =
  | "urgent"
  | "month"
  | "quarter"
  | "later";

export type SpecContactFormValues = {
  organization: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  deliveryPreset: DeliveryPreset;
  comment: string;
  /** Honeypot — должно быть пустым */
  website: string;
};

export type SpecPdfLabels = {
  title: string;
  specNumber: string;
  date: string;
  article: string;
  name: string;
  colorway: string;
  sizes: string;
  qty: string;
  branding: string;
  noBranding: string;
  priceNote: string;
  organization: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  delivery: string;
  comment: string;
  method: string;
  zones: string;
  preview: string;
};

export type BuildPdfInput = {
  specNumber: string;
  locale: Locale;
  items: SpecItem[];
  contact: SpecContactFormValues;
  labels: SpecPdfLabels;
  company: {
    brandName: string;
    legalName: string;
    legalAddress: string;
    taxId: string;
    phones: readonly string[];
    publicEmail: string;
  };
  deliveryLabel: string;
  methodLabels: Record<string, string>;
  zoneLabels: Record<string, string>;
};

/** SPEC-YYYYMMDD-XXXX */
export function generateSpecNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SPEC-${y}${m}${d}-${suffix}`;
}

export function formatSizeBreakdown(
  quantities: Record<string, number>,
): string {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${size}:${qty}`)
    .join(" ");
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}
