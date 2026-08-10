/**
 * Пресеты автозаполнения размерной матрицы (состав команды).
 */
export type SizePreset = {
  id: string;
  /** Ключ перевода catalog.presets.* */
  labelKey: string;
  quantities: Record<string, number>;
};

export const sizePresets: SizePreset[] = [
  {
    id: "squad-11-7",
    labelKey: "squad117",
    quantities: { S: 2, M: 6, L: 7, XL: 3 },
  },
  {
    id: "squad-14",
    labelKey: "squad14",
    quantities: { S: 2, M: 5, L: 5, XL: 2 },
  },
  {
    id: "youth-u14",
    labelKey: "youthU14",
    quantities: { "3XS": 3, "2XS": 6, XS: 5 },
  },
  {
    id: "youth-u17",
    labelKey: "youthU17",
    quantities: { "2XS": 2, XS: 6, S: 6, M: 2 },
  },
];
