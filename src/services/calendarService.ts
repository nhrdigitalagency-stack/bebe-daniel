/**
 * Service de génération de fichier calendrier RFC 5545 (.ics)
 * Gère les dates UTC/locales, l'échappement des caractères spéciaux et les retours à la ligne CRLF.
 */

export interface CalendarEventInput {
  title: string;
  description: string;
  location?: string;
  startIso: string;
  endIso?: string | null;
  timeZone?: string | null;
  url?: string;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatDateToIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

export function generateIcsContent(input: CalendarEventInput): string | null {
  const startDate = new Date(input.startIso);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  let endDate: Date;
  if (input.endIso) {
    const parsedEnd = new Date(input.endIso);
    endDate = !Number.isNaN(parsedEnd.getTime()) && parsedEnd > startDate
      ? parsedEnd
      : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  } else {
    // Default duration: 3 hours
    endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  }

  const nowUtc = formatDateToIcsUtc(new Date());
  const dtStart = formatDateToIcsUtc(startDate);
  const dtEnd = formatDateToIcsUtc(endDate);
  const uid = `daniel-voir-bebe-${startDate.getTime()}@famille-daniel.local`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Famille de Daniel//Voir bebe de Daniel//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
  ];

  if (input.location && input.location.trim().length > 0) {
    lines.push(`LOCATION:${escapeIcsText(input.location.trim())}`);
  }

  if (input.url && input.url.trim().length > 0) {
    lines.push(`URL:${escapeIcsText(input.url.trim())}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadIcsFile(input: CalendarEventInput, filename = 'voir-bebe-daniel.ics'): boolean {
  const content = generateIcsContent(input);
  if (!content) return false;

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
