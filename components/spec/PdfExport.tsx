"use client";

/**
 * Экспорт PDF — используется через ContactForm / lib/pdf.ts.
 * Отдельная кнопка на странице не нужна: действия в форме.
 */
export { buildSpecPdf, downloadBlob } from "@/lib/pdf";
