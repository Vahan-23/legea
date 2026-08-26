import { z } from "zod";
import { digitsOnly } from "@/lib/specHelpers";

export const specContactSchema = z.object({
  organization: z.string().trim().min(2),
  contactPerson: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .refine((value) => digitsOnly(value).length >= 9),
  email: z.string().trim().email(),
  city: z.string().trim().min(2),
  deliveryPreset: z.enum(["urgent", "month", "quarter", "later"]),
  comment: z.string().trim(),
  website: z.string(),
});

export type SpecContactSchema = z.infer<typeof specContactSchema>;

export const quickLeadSchema = z.object({
  organization: z.string().trim().min(2),
  contactPerson: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .refine((value) => digitsOnly(value).length >= 9),
  comment: z.string().trim(),
  website: z.string(),
});

export type QuickLeadSchema = z.infer<typeof quickLeadSchema>;

const logoSchema = z.object({
  fileName: z.string().min(1).max(200),
  dataUrl: z.string().min(10),
});

export const specApiSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("full"),
    specNumber: z.string().regex(/^SPEC-\d{8}-[A-Z0-9]{4}$/),
    locale: z.enum(["ru", "hy", "en"]),
    contact: specContactSchema,
    pdfBase64: z.string().min(100),
    logos: z.array(logoSchema).max(20).default([]),
    website: z.string().optional(),
  }),
  z.object({
    type: z.literal("quick"),
    specNumber: z.string().regex(/^SPEC-\d{8}-[A-Z0-9]{4}$/),
    locale: z.enum(["ru", "hy", "en"]),
    contact: quickLeadSchema,
    source: z.string().trim().max(80).optional(),
    website: z.string().optional(),
  }),
]);

export type SpecApiPayload = z.infer<typeof specApiSchema>;
