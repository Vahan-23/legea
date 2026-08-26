# Legea — B2B-сайт официального дистрибьютора

## Стек
- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS, next-intl (ru / hy / en)
- Resend — отправка заявок и спецификаций на email

## Быстрый старт
```bash
cp .env.example .env.local
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000) — редирект на `/ru`.

## Отправка заявок на email

Формы обратной связи:
- **Главная** — блок «Быстрый запрос»
- **Контакты** — та же форма
- **Спецификация** — «Получить расчёт» (PDF + логотипы менеджеру, подтверждение клиенту)

Все формы отправляют письма через `POST /api/spec` и [Resend](https://resend.com).

### Переменные окружения

| Переменная | Описание |
|------------|----------|
| `RESEND_API_KEY` | API-ключ из Resend Dashboard |
| `RESEND_FROM` | Адрес отправителя с **подтверждённого домена** (например `noreply@legea.am`) |
| `MANAGER_EMAIL` | Куда приходят заявки |
| `MANAGER_EMAIL_CC` | Опционально — копия |

Без `RESEND_API_KEY` формы покажут ошибку; PDF спецификации по-прежнему скачивается локально.

### Деплой на Vercel

1. Подключите репозиторий в [Vercel](https://vercel.com).
2. **Settings → Environment Variables** — добавьте все переменные из `.env.example`.
3. В Resend добавьте домен продакшена и пропишите DNS-записи (SPF, DKIM).
4. `RESEND_FROM` должен быть с этого домена — иначе Resend отклонит отправку.
5. Задеплойте. API-маршрут `/api/spec` работает как serverless function (`runtime: nodejs`).

Лимит: 5 заявок с одного IP за 10 минут.

## Документы
- `prompt.txt` — полное ТЗ
- `decisions.txt` — решения (приоритет над prompt при конфликте)
- `questions.txt` — исходные вопросы к ТЗ

## Плейсхолдеры заказчика
Все в `data/company.ts` (помечены `// TODO: заменить`).
