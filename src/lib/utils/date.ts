/**
 * Date and Timezone utilities for Academic Attendance System
 * Default Institutional Timezone: Asia/Kolkata (IST)
 */

export function getTodayIST(): string {
  // Format current date in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

export function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid date format, expected YYYY-MM-DD');
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Construct UTC midnight date to keep PostgreSQL DATE field exact
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

export function formatDateOnly(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFutureDate(dateStr: string): boolean {
  const todayStr = getTodayIST();
  return dateStr > todayStr;
}

