# Спецификация 3D-моделей Legea

## Приоритет файлов

1. `/public/3D/{productId}_3D.glb` или `/public/3D/{productId}.glb`  
   (пример: `M1062_3D.glb`, `M1176.glb`)
2. `/public/3D/logo_3d.glb` — бренд-логотип (hero на главной)
3. `/public/models/{model}.glb` — общая модель типа изделия
4. Пока файл грузится — индикатор загрузки; если файла нет — пустая сцена

## Общие модели (`/public/models/`)

`jersey_ss`, `jersey_ls`, `shorts`, `socks`, `jacket`, `hoodie`,
`pants`, `gk_kit`, `ball`, `backpack`, `volley_top`, `basket_top`

## Требования к GLB

- Масштаб: высота торса ≈ **0.7** unit
- Origin в **центре** объекта
- Ось **Y-up**
- Меши (или материалы) с именами: **Base**, **Trim**, **Logo**
  - Для однотекстурных GLB зоны генерирует `npm run glb:zones`
    → `data/glbColorZones.json` (ручные правки:
    `data/glbColorZones.overrides.json`)
  - Пиксели вне зон (лого, принты) не перекрашиваются
- Желательно: Draco, meshopt, текстуры KTX2

## Зоны цветов (авто)

```bash
# после добавления новых GLB в public/3D/
npm run glb:zones
# или один артикул:
npm run glb:zones -- B303
```

Скрипт читает albedo, кластеризует ткань, сопоставляет с `colorways`
товара и пишет роли `base` / `trim` / `top` / `bottom`.

## Поведение загрузчика

Сначала ищется пер-артикульный файл в `/3D/`, затем общий в `/models/`.
Пока идёт загрузка — процент в центре канваса. Если файла нет — сцена пустая.
