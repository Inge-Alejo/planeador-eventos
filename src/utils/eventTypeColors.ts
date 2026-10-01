import { EventType } from '../types';

export interface EventTypeConfig {
  label: string;
  color: string;          // Primary Hex Color
  borderColor: string;    // Accent Hex Border
  bgClass: string;        // Solid background class
  lightBgClass: string;   // Light background class (tinted)
  textClass: string;      // Primary text class
  borderClass: string;    // Border class
  chipBg: string;         // Light chip background
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  academico: {
    label: 'Académico',
    color: '#4F46E5', // Indigo
    borderColor: '#4338CA',
    bgClass: 'bg-indigo-600',
    lightBgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-500',
    chipBg: 'bg-indigo-50/90 text-indigo-900 border-indigo-200',
  },
  simposio: {
    label: 'Simposio',
    color: '#0D9488', // Teal
    borderColor: '#0F766E',
    bgClass: 'bg-teal-600',
    lightBgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-500',
    chipBg: 'bg-teal-50/90 text-teal-900 border-teal-200',
  },
  curso: {
    label: 'Curso',
    color: '#2563EB', // Blue
    borderColor: '#1D4ED8',
    bgClass: 'bg-blue-600',
    lightBgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-500',
    chipBg: 'bg-blue-50/90 text-blue-900 border-blue-200',
  },
  transmision: {
    label: 'Transmisión',
    color: '#C026D3', // Fuchsia
    borderColor: '#A21CAF',
    bgClass: 'bg-fuchsia-600',
    lightBgClass: 'bg-fuchsia-50',
    textClass: 'text-fuchsia-700',
    borderClass: 'border-fuchsia-500',
    chipBg: 'bg-fuchsia-50/90 text-fuchsia-900 border-fuchsia-200',
  },
  catedra: {
    label: 'Cátedra',
    color: '#EA580C', // Orange
    borderColor: '#C2410C',
    bgClass: 'bg-orange-600',
    lightBgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-500',
    chipBg: 'bg-orange-50/90 text-orange-900 border-orange-200',
  },
  congreso: {
    label: 'Congreso',
    color: '#9333EA', // Purple
    borderColor: '#7E22CE',
    bgClass: 'bg-purple-600',
    lightBgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-500',
    chipBg: 'bg-purple-50/90 text-purple-900 border-purple-200',
  },
  conferencia: {
    label: 'Conferencia',
    color: '#7C3AED', // Violet
    borderColor: '#6D28D9',
    bgClass: 'bg-violet-600',
    lightBgClass: 'bg-violet-50',
    textClass: 'text-violet-700',
    borderClass: 'border-violet-500',
    chipBg: 'bg-violet-50/90 text-violet-900 border-violet-200',
  },
  taller: {
    label: 'Taller',
    color: '#D97706', // Amber
    borderColor: '#B45309',
    bgClass: 'bg-amber-600',
    lightBgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
    chipBg: 'bg-amber-50/90 text-amber-900 border-amber-200',
  },
  reunion: {
    label: 'Reunión',
    color: '#059669', // Emerald
    borderColor: '#047857',
    bgClass: 'bg-emerald-600',
    lightBgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
    chipBg: 'bg-emerald-50/90 text-emerald-900 border-emerald-200',
  },
  grabacion: {
    label: 'Grabación',
    color: '#0891B2', // Cyan
    borderColor: '#0E7490',
    bgClass: 'bg-cyan-600',
    lightBgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    borderClass: 'border-cyan-500',
    chipBg: 'bg-cyan-50/90 text-cyan-900 border-cyan-200',
  },
  institucional: {
    label: 'Institucional',
    color: '#E11D48', // Rose
    borderColor: '#BE123C',
    bgClass: 'bg-rose-600',
    lightBgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-500',
    chipBg: 'bg-rose-50/90 text-rose-900 border-rose-200',
  },
  otro: {
    label: 'Otro',
    color: '#64748B', // Slate
    borderColor: '#475569',
    bgClass: 'bg-slate-600',
    lightBgClass: 'bg-slate-50',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-500',
    chipBg: 'bg-slate-50/90 text-slate-900 border-slate-200',
  },
};

export function getEventTypeConfig(type: string): EventTypeConfig {
  return EVENT_TYPE_CONFIG[type as EventType] || EVENT_TYPE_CONFIG.otro;
}
