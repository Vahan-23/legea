/**
 * Фирменная палитра UI (не путать с расцветками товаров Legea).
 * В компонентах использовать только эти токены — без хардкода hex.
 */
export const colors = {
  navy: "#12305B",
  blue: "#1E7FE0",
  offWhite: "#F7F9FC",
  graphite: "#1A1A1A",
  success: "#1E9B4B",
  muted: "#6B7280",
  white: "#FFFFFF",
} as const;

export type UiColorKey = keyof typeof colors;

/**
 * Карта кодов расцветок Legea (XX / YY в формате XXYY).
 * Формат — meta.colorwayFormat в data/products.json.
 * Префикс 00 = однотонный цвет (см. lib/colorCode.ts).
 */
export const colorMap = {
  "01": { hex: "#F07A1E", name: "orange" },
  "02": { hex: "#1E5FD0", name: "royal blue" },
  "03": { hex: "#FFFFFF", name: "white" },
  "04": { hex: "#14204A", name: "navy" },
  "05": { hex: "#5BB8E8", name: "sky" },
  "06": { hex: "#E8388F", name: "fuchsia" },
  "07": { hex: "#F2CF1B", name: "yellow" },
  "08": { hex: "#8B1A2B", name: "bordeaux" },
  /** Grigio — напр. 0910 = grigio/nero */
  "09": { hex: "#8E949E", name: "grey" },
  "10": { hex: "#111111", name: "black" },
  "11": { hex: "#F5B8C8", name: "pink" },
  "12": { hex: "#D8232A", name: "red" },
  "13": { hex: "#1E9B4B", name: "green" },
  "14": { hex: "#6B3FA0", name: "purple" },
  /** LUXIOM: 2324 = dark grey / turquoise */
  "23": { hex: "#4A4F57", name: "dark grey" },
  "24": { hex: "#3B9BE8", name: "light blue" },
  "27": { hex: "#FF5A1F", name: "fluo orange" },
  "28": { hex: "#7CFF3D", name: "fluo green" },
  "36": { hex: "#FF2D8F", name: "fluo pink" },
  "40": { hex: "#DFFF33", name: "fluo yellow" },
  "44": { hex: "#B8BCC2", name: "melange grey" },
  /** LUXIOM: 1075 = black / tiffany green */
  "75": { hex: "#2F6F5E", name: "tiffany green" },
  /** LUXIOM: 0476 = n.blue / peach neon */
  "76": { hex: "#FF9B7A", name: "peach neon" },
} as const;

export type ColorCodeKey = keyof typeof colorMap;
