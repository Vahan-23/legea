export function managerEmailSubject(
  specNumber: string,
  organization: string,
): string {
  return `Новая спецификация ${specNumber} от ${organization}`;
}

export function clientEmailSubject(specNumber: string): string {
  return `Ваша спецификация ${specNumber} принята`;
}

export function managerEmailHtml(input: {
  specNumber: string;
  organization: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
}): string {
  return `
    <p>Новая спецификация <strong>${escapeHtml(input.specNumber)}</strong></p>
    <ul>
      <li>Организация: ${escapeHtml(input.organization)}</li>
      <li>Контакт: ${escapeHtml(input.contactPerson)}</li>
      <li>Email: ${escapeHtml(input.email)}</li>
      <li>Телефон: ${escapeHtml(input.phone)}</li>
      <li>Город: ${escapeHtml(input.city)}</li>
    </ul>
    <p>PDF и логотипы во вложении.</p>
  `;
}

export function clientEmailHtml(input: {
  specNumber: string;
  contactPerson: string;
}): string {
  return `
    <p>Здравствуйте, ${escapeHtml(input.contactPerson)}!</p>
    <p>Ваша спецификация <strong>${escapeHtml(input.specNumber)}</strong> принята.</p>
    <p>Расчёт придёт в течение 24 часов.</p>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
