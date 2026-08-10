import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatSizeBreakdown,
  type BuildPdfInput,
} from "@/lib/specHelpers";
import { totalPieces } from "@/types/spec";

const FONT_NAME = "DejaVuSans";

let fontsReady: Promise<void> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Helvetica не умеет кириллицу — грузим DejaVu Sans. */
async function ensurePdfFonts(doc: jsPDF): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      const [regular, bold] = await Promise.all([
        fetch("/fonts/DejaVuSans.ttf").then((r) => {
          if (!r.ok) throw new Error("DejaVuSans.ttf missing");
          return r.arrayBuffer();
        }),
        fetch("/fonts/DejaVuSans-Bold.ttf").then((r) => {
          if (!r.ok) throw new Error("DejaVuSans-Bold.ttf missing");
          return r.arrayBuffer();
        }),
      ]);
      cachedRegular = arrayBufferToBase64(regular);
      cachedBold = arrayBufferToBase64(bold);
    })();
  }

  await fontsReady;

  if (!cachedRegular || !cachedBold) {
    throw new Error("PDF fonts not loaded");
  }

  doc.addFileToVFS("DejaVuSans.ttf", cachedRegular);
  doc.addFileToVFS("DejaVuSans-Bold.ttf", cachedBold);
  doc.addFont("DejaVuSans.ttf", FONT_NAME, "normal");
  doc.addFont("DejaVuSans-Bold.ttf", FONT_NAME, "bold");
  doc.setFont(FONT_NAME, "normal");
}

let cachedRegular: string | null = null;
let cachedBold: string | null = null;

/**
 * Генерация PDF спецификации в браузере (без колонки цены).
 */
export async function buildSpecPdf(
  input: BuildPdfInput,
): Promise<{ blob: Blob; base64: string }> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await ensurePdfFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const { company, labels, contact, items, specNumber, deliveryLabel } =
    input;

  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(18);
  doc.text(company.brandName, margin, y);
  y += 18;
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(company.legalName, margin, y);
  y += 14;
  doc.text(`${company.legalAddress} · ${company.taxId}`, margin, y);
  y += 14;
  doc.text(
    `${company.phones.join(", ")} · ${company.publicEmail}`,
    margin,
    y,
  );
  y += 24;

  doc.setTextColor(0);
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(14);
  doc.text(labels.title, margin, y);
  y += 18;
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.text(`${labels.specNumber}: ${specNumber}`, margin, y);
  y += 14;
  doc.text(
    `${labels.date}: ${new Date().toLocaleDateString(input.locale)}`,
    margin,
    y,
  );
  y += 20;

  doc.setDrawColor(30, 127, 224);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.text(`${labels.organization}: ${contact.organization}`, margin, y);
  y += 14;
  doc.text(`${labels.contact}: ${contact.contactPerson}`, margin, y);
  y += 14;
  doc.text(`${labels.phone}: ${contact.phone}`, margin, y);
  y += 14;
  doc.text(`${labels.email}: ${contact.email}`, margin, y);
  y += 14;
  doc.text(`${labels.city}: ${contact.city}`, margin, y);
  y += 14;
  doc.text(`${labels.delivery}: ${deliveryLabel}`, margin, y);
  y += 14;
  if (contact.comment) {
    const lines = doc.splitTextToSize(
      `${labels.comment}: ${contact.comment}`,
      pageWidth - margin * 2,
    ) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 12 + 8;
  } else {
    y += 8;
  }

  const tableBody = items.map((item) => {
    const brandingBits: string[] = [];
    if (item.branding?.method) {
      brandingBits.push(
        input.methodLabels[item.branding.method] ?? item.branding.method,
      );
    }
    if (item.branding?.zones?.length) {
      brandingBits.push(
        item.branding.zones
          .map((z) => input.zoneLabels[z] ?? z)
          .join(", "),
      );
    }
    const brandingText =
      brandingBits.length > 0
        ? brandingBits.join(" · ")
        : labels.noBranding;

    return [
      item.productId,
      item.name[input.locale] || item.name.ru,
      item.colorway,
      formatSizeBreakdown(item.quantities),
      String(totalPieces(item.quantities)),
      brandingText,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        labels.article,
        labels.name,
        labels.colorway,
        labels.sizes,
        labels.qty,
        labels.branding,
      ],
    ],
    body: tableBody,
    styles: {
      font: FONT_NAME,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      font: FONT_NAME,
      fontStyle: "bold",
      fillColor: [18, 48, 91],
      textColor: 255,
    },
    margin: { left: margin, right: margin },
  });

  type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };
  y = (doc as DocWithTable).lastAutoTable?.finalY ?? y + 40;
  y += 20;

  for (const item of items) {
    if (y > 700) {
      doc.addPage();
      y = margin;
    }

    if (item.previewDataUrl) {
      doc.setFont(FONT_NAME, "bold");
      doc.setFontSize(10);
      doc.text(`${labels.preview}: ${item.productId}`, margin, y);
      y += 10;
      try {
        const jpeg = await dataUrlToJpeg(item.previewDataUrl, 0.8);
        doc.addImage(jpeg, "JPEG", margin, y, 200, 200);
        y += 220;
      } catch {
        // пропускаем битое превью
      }
    }
  }

  if (y > 720) {
    doc.addPage();
    y = margin;
  }

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  const noteLines = doc.splitTextToSize(
    labels.priceNote,
    pageWidth - margin * 2,
  ) as string[];
  doc.text(noteLines, margin, y);
  y += noteLines.length * 12 + 24;

  doc.setFont(FONT_NAME, "normal");
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text(
    `${company.brandName} · ${company.publicEmail} · ${company.phones[0] ?? ""}`,
    margin,
    doc.internal.pageSize.getHeight() - 24,
  );

  const blob = doc.output("blob");
  const base64 = doc.output("datauristring").split(",")[1] ?? "";
  return { blob, base64 };
}

async function dataUrlToJpeg(
  dataUrl: string,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
