// Utilidades de Fechas y Zona Horaria Estricta: America/Bogota

export const TIMEZONE = 'America/Bogota';

/**
 * Convierte un string de hora "HH:mm" a minutos desde medianoche
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm"
 */
export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calcula la duración en minutos entre dos horas "HH:mm"
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);
  return Math.max(0, end - start);
}

/**
 * Evalúa si dos rangos semi-abiertos [A_inicio, A_fin) y [B_inicio, B_fin) se solapan
 */
export function doIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeStringToMinutes(startA);
  const a2 = timeStringToMinutes(endA);
  const b1 = timeStringToMinutes(startB);
  const b2 = timeStringToMinutes(endB);

  // max(a1, b1) < min(a2, b2)
  return Math.max(a1, b1) < Math.min(a2, b2);
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria America/Bogota
 */
export function getBogotaToday(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Obtiene la hora actual en formato HH:mm en zona horaria America/Bogota
 */
export function getBogotaCurrentTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable en español
 * Ejemplo: "Viernes, 2 de Octubre de 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

export const formatBogotaDate = formatFriendlyDate;


/**
 * Formatea fecha corta (ej: "2 Oct, 2026")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea hora a 12 horas con am/pm
 */
export function format12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${period}`;
}
