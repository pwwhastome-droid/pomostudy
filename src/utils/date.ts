/** Local-time "YYYY-MM-DD" (toISOString() is UTC and shifts the day for evening sessions). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar day of a stored ISO timestamp. */
export function localDateOfTimestamp(iso: string): string {
  return localDateStr(new Date(iso));
}
