# Спецификация 3D-моделей Legea

Файлы: `/public/models/{model}.glb`

## Модели

`jersey_ss`, `jersey_ls`, `shorts`, `socks`, `jacket`, `hoodie`,
`pants`, `gk_kit`, `ball`, `backpack`, `volley_top`, `basket_top`

## Требования к GLB

- Масштаб: высота торса ≈ **0.7** unit
- Origin в **центре** объекта
- Ось **Y-up**
- Меши (или материалы) с именами: **Base**, **Trim**, **Logo**
- Желательно: Draco, meshopt, текстуры KTX2

## Поведение загрузчика

Если файл отсутствует — рендерится `PlaceholderModel` с теми же именами
материалов, чтобы колорайзер и декали работали до подстановки ассетов.
