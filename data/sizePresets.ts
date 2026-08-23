/**
 * Пресеты количества по размерам — только рабочие составы клуба.
 * Youth U-14 / U-17 убраны: на карточке/матрице только мешали.
 */

export type SizePreset = {
  id: string;
  /** Ключ перевода catalog.presets.* */
  labelKey: "squad117" | "squad14";
  quantities: Record<string, number>;
};

export const sizePresets: SizePreset[] = [
  {
    id: "squad-11-7",
    labelKey: "squad117",
    quantities: { S: 3, M: 6, L: 6, XL: 3 },
  },
  {
    id: "squad-14",
    labelKey: "squad14",
    quantities: { S: 2, M: 5, L: 5, XL: 2 },
  },
];
