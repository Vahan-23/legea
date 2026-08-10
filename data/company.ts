/**
 * Данные дистрибьютора и операционные константы.
 * Единственное место для плейсхолдеров от заказчика — заменить одной правкой.
 */

export const company = {
  // TODO: заменить — юридическое название
  legalName: "Legea Armenia LLC",
  // TODO: заменить — бренд в шапке / PDF
  brandName: "Legea",
  // TODO: заменить — ИНН / налоговый номер
  taxId: "00000000",
  // TODO: заменить — юридический адрес
  legalAddress: "Yerevan, Armenia",
  // TODO: заменить — адрес склада / офиса для карты
  officeAddress: "Yerevan, Armenia",
  // TODO: заменить — координаты или готовый URL Google Maps
  googleMapsUrl: "https://maps.google.com/?q=Yerevan",
  // TODO: заменить — телефоны
  phones: ["+374 00 000000"],
  // TODO: заменить — публичный email
  publicEmail: "info@example.com",
  // TODO: заменить — Telegram (пусто = не рендерить)
  telegram: "",
  // TODO: заменить — WhatsApp (пусто = не рендерить)
  whatsapp: "",
  // TODO: заменить — боевой домен (дублирует NEXT_PUBLIC_SITE_URL)
  siteUrl: "https://example.com",
  region: "Armenia",
  timeZone: "Asia/Yerevan",
  defaultMoq: 10,
  /** Срок поставки и MOQ для полосы цифр на главной */
  stats: {
    // TODO: заменить — ориентир срока поставки (дней)
    deliveryDays: 21,
    // TODO: заменить при необходимости — дефолтный MOQ в цифрах главной
    moq: 10,
  },
  /**
   * Сроки этапов «Как мы работаем» и методов брендирования.
   * TODO: заменить значениями от заказчика.
   */
  leadTimes: {
    workflow: {
      specification: "1 день",
      sampleAndMockup: "3–5 дней",
      production: "15–20 дней",
      delivery: "5–7 дней",
    },
    branding: {
      print: 3,
      sublimation: 5,
      embroidery: 7,
    },
  },
} as const;

export type Company = typeof company;
