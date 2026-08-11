# Спецификация 3D-моделей Legea

## Приоритет файлов

1. `/public/3D/{productId}_3D.glb` или `/public/3D/{productId}.glb`  
   (пример: `M1062_3D.glb`, `M1176.glb`)
2. `/public/3D/logo_3d.glb` — бренд-логотип (hero на главной)
3. `/public/models/{model}.glb` — общая модель типа изделия
4. `PlaceholderModel` — если файла нет

## Общие модели (`/public/models/`)

`jersey_ss`, `jersey_ls`, `shorts`, `socks`, `jacket`, `hoodie`,
`pants`, `gk_kit`, `ball`, `backpack`, `volley_top`, `basket_top`

## Требования к GLB

- Масштаб: высота торса ≈ **0.7** unit
- Origin в **центре** объекта
- Ось **Y-up**
- Меши (или материалы) с именами: **Base**, **Trim**, **Logo**
- Желательно: Draco, meshopt, текстуры KTX2

## Поведение загрузчика

Сначала ищется пер-артикульный файл в `/3D/`, затем общий в `/models/`.
Если оба отсутствуют — рендерится `PlaceholderModel` с теми же именами
материалов, чтобы колорайзер и декали работали до подстановки ассетов.
