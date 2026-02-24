export function sanitizeText(value: unknown) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function sanitizeEmail(value: unknown) {
  return sanitizeText(value).toLowerCase();
}

export function sanitizePhone(value: unknown) {
  return sanitizeText(value).replace(/[^\d+\-()\s]/g, "");
}
